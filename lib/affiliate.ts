import crypto from "crypto";
import { Prisma, type AffiliateSettings } from "@prisma/client";
import prisma from "@/lib/prisma";

/**
 * Affiliate program core logic. See docs/affiliate-program.md.
 * All money values are in paise (₹1 = 100 paise).
 */

export const REFERRAL_COOKIE = "hms_ref";

type Db = Prisma.TransactionClient | typeof prisma;

/** The single settings row, created with defaults on first use. */
export async function getAffiliateSettings(db: Db = prisma): Promise<AffiliateSettings> {
  return db.affiliateSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
}

/** Commission rate (percent) that applies to an affiliate. */
export function effectiveRate(
  affiliate: { commissionRate: number | null },
  settings: Pick<AffiliateSettings, "defaultCommissionRate">
): number {
  return affiliate.commissionRate ?? settings.defaultCommissionRate;
}

/** Short, readable, unique-enough referral code, e.g. PRIYANSH-7K2Q. */
export function generateAffiliateCode(name: string | null | undefined): string {
  const base = (name || "ref")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 10) || "REF";
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
  const suffix = Array.from(crypto.randomBytes(4), (b) => alphabet[b % alphabet.length]).join("");
  return `${base}-${suffix}`;
}

export const AFFILIATE_CODE_REGEX = /^[A-Z0-9]{1,10}-[A-Z0-9]{4}$/;

/**
 * Creates the commission for a successful payment, if the paying user was
 * referred by an approved affiliate. Safe to call more than once per payment.
 * Call it inside the transaction that marks the payment SUCCESS.
 */
export async function recordCommissionForPayment(db: Db, paymentId: string): Promise<void> {
  const existing = await db.commission.findUnique({ where: { paymentId }, select: { id: true } });
  if (existing) return;

  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { user: { select: { id: true, referredByAffiliateId: true } } },
  });
  if (!payment || payment.status !== "SUCCESS" || !payment.user.referredByAffiliateId) return;

  const settings = await getAffiliateSettings(db);
  if (!settings.programEnabled) return;

  const affiliate = await db.affiliate.findUnique({ where: { id: payment.user.referredByAffiliateId } });
  if (!affiliate || affiliate.status !== "APPROVED" || affiliate.userId === payment.userId) return;

  if (settings.commissionScope === "FIRST_PAYMENT") {
    const earlier = await db.commission.count({ where: { referredUserId: payment.userId } });
    if (earlier > 0) return;
  }

  // Commission is a share of what we actually keep: the payment minus GST
  const baseAmountPaise = Math.max(0, Math.round((payment.amount - (payment.gstAmount ?? 0)) * 100));
  const ratePercent = effectiveRate(affiliate, settings);
  const amountPaise = Math.floor((baseAmountPaise * ratePercent) / 100);
  if (amountPaise <= 0) return;

  await db.commission.create({
    data: {
      affiliateId: affiliate.id,
      paymentId: payment.id,
      referredUserId: payment.userId,
      baseAmountPaise,
      ratePercent,
      amountPaise,
    },
  });
}

/** Commissions older than this date are past the refund window. */
export function holdCutoff(settings: Pick<AffiliateSettings, "holdDays">, now = new Date()): Date {
  return new Date(now.getTime() - settings.holdDays * 24 * 60 * 60 * 1000);
}

export interface AffiliateBalance {
  onHoldPaise: number; // earned, still inside the refund window
  availablePaise: number; // can be requested now
  requestedPaise: number; // in an open payout request
  paidPaise: number; // already paid out
}

export async function getAffiliateBalance(
  affiliateId: string,
  settings: Pick<AffiliateSettings, "holdDays">,
  db: Db = prisma
): Promise<AffiliateBalance> {
  const cutoff = holdCutoff(settings);
  const sum = async (where: Prisma.CommissionWhereInput) =>
    (await db.commission.aggregate({ where: { affiliateId, ...where }, _sum: { amountPaise: true } }))._sum
      .amountPaise ?? 0;

  const [onHoldPaise, availablePaise, requestedPaise, paidPaise] = await Promise.all([
    sum({ status: "PENDING", payoutId: null, createdAt: { gt: cutoff } }),
    sum({ status: "PENDING", payoutId: null, createdAt: { lte: cutoff } }),
    sum({ status: "PENDING", payoutId: { not: null } }),
    sum({ status: "PAID" }),
  ]);
  return { onHoldPaise, availablePaise, requestedPaise, paidPaise };
}

/** ₹1,234.50 */
export function formatPaise(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/** pr*****@gmail.com: enough for an affiliate to recognise a referral, not to contact them */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  return `${local.slice(0, 2)}${"*".repeat(Math.max(1, Math.min(local.length - 2, 6)))}@${domain}`;
}

/** Payout destination as shown to admins, e.g. "UPI name@okhdfcbank" or "BANK ****1234 (HDFC0001234)". */
export function describePayoutDestination(a: {
  payoutMethod: string | null;
  upiId: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankIfsc: string | null;
}): string | null {
  if (a.payoutMethod === "UPI" && a.upiId) return a.upiId;
  if (a.payoutMethod === "BANK" && a.bankAccountNumber && a.bankIfsc) {
    return `${a.bankAccountName ?? ""} · A/C ${a.bankAccountNumber} · IFSC ${a.bankIfsc}`;
  }
  return null;
}

export type PayoutRequestResult = { success: true; message: string } | { success: false; error: string };

/**
 * Creates a payout request for every commission past the hold period.
 * Serializable transaction: two simultaneous requests can't both claim the
 * same commissions or create two open payouts.
 */
export async function requestPayoutForUser(userId: string): Promise<PayoutRequestResult> {
  try {
    return await prisma.$transaction(
      async (tx): Promise<PayoutRequestResult> => {
        const settings = await getAffiliateSettings(tx);
        const affiliate = await tx.affiliate.findUnique({ where: { userId } });
        if (!settings.programEnabled || !affiliate || affiliate.status !== "APPROVED") {
          return { success: false, error: "Payouts are not available for this account." };
        }

        const destination = describePayoutDestination(affiliate);
        if (!destination || !affiliate.payoutMethod) {
          return { success: false, error: "Add your payout details first." };
        }

        const open = await tx.payout.count({ where: { affiliateId: affiliate.id, status: "REQUESTED" } });
        if (open > 0) {
          return { success: false, error: "You already have a payout request being processed." };
        }

        const available = await tx.commission.findMany({
          where: {
            affiliateId: affiliate.id,
            status: "PENDING",
            payoutId: null,
            createdAt: { lte: holdCutoff(settings) },
          },
          select: { id: true, amountPaise: true },
        });
        const amountPaise = available.reduce((sum, c) => sum + c.amountPaise, 0);
        if (amountPaise < settings.minPayoutPaise) {
          return {
            success: false,
            error: `You can request a payout once your available balance reaches ${formatPaise(settings.minPayoutPaise)}.`,
          };
        }

        const payout = await tx.payout.create({
          data: { affiliateId: affiliate.id, amountPaise, method: affiliate.payoutMethod, destination },
        });
        await tx.commission.updateMany({
          where: { id: { in: available.map((c) => c.id) } },
          data: { payoutId: payout.id },
        });

        return { success: true, message: `Payout of ${formatPaise(amountPaise)} requested.` };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2034") {
      return { success: false, error: "Please try again." };
    }
    console.error("Payout request failed:", e);
    return { success: false, error: "Could not request the payout." };
  }
}
