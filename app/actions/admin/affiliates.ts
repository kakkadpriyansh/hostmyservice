"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/authz";
import { affiliateSettingsSchema } from "@/lib/validations";

type Result = { success: true } | { success: false; error: string };

const UNAUTHORIZED: Result = { success: false, error: "Unauthorized" };
const firstIssue = (e: { issues: { message: string }[] }) => e.issues[0]?.message || "Invalid input";

function refresh(affiliateId?: string) {
  revalidatePath("/admin/affiliates");
  if (affiliateId) revalidatePath(`/admin/affiliates/${affiliateId}`);
}

export async function updateAffiliateSettings(input: unknown): Promise<Result> {
  if (!(await getAdminSession())) return UNAUTHORIZED;
  const parsed = affiliateSettingsSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) };

  const { minPayoutRupees, ...rest } = parsed.data;
  const data = { ...rest, minPayoutPaise: minPayoutRupees * 100 };
  await prisma.affiliateSettings.upsert({
    where: { id: "default" },
    update: data,
    create: { id: "default", ...data },
  });
  refresh();
  return { success: true };
}

const reviewSchema = z.object({
  affiliateId: z.string().cuid(),
  action: z.enum(["APPROVE", "REJECT", "SUSPEND", "REACTIVATE"]),
  note: z.string().trim().max(1000).optional(),
});

/** Approve / reject an application, or suspend / reactivate an affiliate. */
export async function reviewAffiliate(input: unknown): Promise<Result> {
  if (!(await getAdminSession())) return UNAUTHORIZED;
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) };
  const { affiliateId, action, note } = parsed.data;

  const affiliate = await prisma.affiliate.findUnique({ where: { id: affiliateId } });
  if (!affiliate) return { success: false, error: "Affiliate not found" };

  const allowed: Record<typeof action, string[]> = {
    APPROVE: ["PENDING", "REJECTED"],
    REJECT: ["PENDING"],
    SUSPEND: ["APPROVED"],
    REACTIVATE: ["SUSPENDED"],
  };
  if (!allowed[action].includes(affiliate.status)) {
    return { success: false, error: `Can't ${action.toLowerCase()} an affiliate that is ${affiliate.status.toLowerCase()}` };
  }

  const status = { APPROVE: "APPROVED", REJECT: "REJECTED", SUSPEND: "SUSPENDED", REACTIVATE: "APPROVED" } as const;
  await prisma.affiliate.update({
    where: { id: affiliateId },
    data: {
      status: status[action],
      reviewedAt: new Date(),
      adminNote: note || (action === "APPROVE" || action === "REACTIVATE" ? null : affiliate.adminNote),
    },
  });
  refresh(affiliateId);
  return { success: true };
}

const rateSchema = z.object({
  affiliateId: z.string().cuid(),
  // null = use the program default
  commissionRate: z.number().min(0).max(100).nullable(),
});

export async function setAffiliateRate(input: unknown): Promise<Result> {
  if (!(await getAdminSession())) return UNAUTHORIZED;
  const parsed = rateSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) };

  await prisma.affiliate.update({
    where: { id: parsed.data.affiliateId },
    data: { commissionRate: parsed.data.commissionRate },
  });
  refresh(parsed.data.affiliateId);
  return { success: true };
}

const payoutPaidSchema = z.object({
  payoutId: z.string().cuid(),
  reference: z.string().trim().min(3, "Enter the UTR / transaction reference").max(100),
});

/** Record that the money was sent. Commissions in the payout become PAID. */
export async function markPayoutPaid(input: unknown): Promise<Result> {
  if (!(await getAdminSession())) return UNAUTHORIZED;
  const parsed = payoutPaidSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) };
  const { payoutId, reference } = parsed.data;

  const payout = await prisma.$transaction(async (tx) => {
    const claimed = await tx.payout.updateMany({
      where: { id: payoutId, status: "REQUESTED" },
      data: { status: "PAID", reference, processedAt: new Date() },
    });
    if (claimed.count === 0) return null;
    await tx.commission.updateMany({ where: { payoutId }, data: { status: "PAID" } });
    return tx.payout.findUnique({ where: { id: payoutId }, select: { affiliateId: true } });
  });

  if (!payout) return { success: false, error: "This payout was already processed." };
  refresh(payout.affiliateId);
  return { success: true };
}

const payoutRejectSchema = z.object({
  payoutId: z.string().cuid(),
  note: z.string().trim().min(3, "Tell the affiliate why").max(1000),
});

/** Reject a payout request. Its commissions return to the available balance. */
export async function rejectPayout(input: unknown): Promise<Result> {
  if (!(await getAdminSession())) return UNAUTHORIZED;
  const parsed = payoutRejectSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) };
  const { payoutId, note } = parsed.data;

  const payout = await prisma.$transaction(async (tx) => {
    const claimed = await tx.payout.updateMany({
      where: { id: payoutId, status: "REQUESTED" },
      data: { status: "REJECTED", adminNote: note, processedAt: new Date() },
    });
    if (claimed.count === 0) return null;
    await tx.commission.updateMany({ where: { payoutId }, data: { payoutId: null } });
    return tx.payout.findUnique({ where: { id: payoutId }, select: { affiliateId: true } });
  });

  if (!payout) return { success: false, error: "This payout was already processed." };
  refresh(payout.affiliateId);
  return { success: true };
}

const reverseSchema = z.object({
  commissionId: z.string().cuid(),
  reason: z.string().trim().min(3, "Enter a reason").max(500),
});

/** Cancel a commission (e.g. the payment was refunded). Not possible once it's in a payout. */
export async function reverseCommission(input: unknown): Promise<Result> {
  if (!(await getAdminSession())) return UNAUTHORIZED;
  const parsed = reverseSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) };

  const commission = await prisma.commission.findUnique({ where: { id: parsed.data.commissionId } });
  if (!commission) return { success: false, error: "Commission not found" };

  const updated = await prisma.commission.updateMany({
    where: { id: commission.id, status: "PENDING", payoutId: null },
    data: { status: "REVERSED", reversedReason: parsed.data.reason },
  });
  if (updated.count === 0) {
    return { success: false, error: "Only unpaid commissions that aren't in a payout request can be reversed." };
  }
  refresh(commission.affiliateId);
  return { success: true };
}
