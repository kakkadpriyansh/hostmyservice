"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getUserSession } from "@/lib/authz";
import { generateAffiliateCode, getAffiliateSettings, requestPayoutForUser } from "@/lib/affiliate";
import { affiliateApplicationSchema, payoutDetailsSchema } from "@/lib/validations";

type Result = { success: true; message?: string } | { success: false; error: string };

const firstIssue = (e: { issues: { message: string }[] }) => e.issues[0]?.message || "Invalid input";

/** Apply to the affiliate program (or re-apply after a rejection). */
export async function applyForAffiliate(input: unknown): Promise<Result> {
  const session = await getUserSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = affiliateApplicationSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) };

  const settings = await getAffiliateSettings();
  if (!settings.programEnabled || !settings.applicationsOpen) {
    return { success: false, error: "Applications are closed at the moment." };
  }

  const existing = await prisma.affiliate.findUnique({ where: { userId: session.user.id } });
  if (existing && existing.status !== "REJECTED") {
    return { success: false, error: "You have already applied." };
  }

  const data = {
    website: parsed.data.website,
    promotionPlan: parsed.data.promotionPlan,
    status: "PENDING" as const,
    adminNote: null,
    reviewedAt: null,
  };

  if (existing) {
    await prisma.affiliate.update({ where: { id: existing.id }, data });
  } else {
    // Retry on the (unlikely) code collision
    for (let attempt = 0; ; attempt++) {
      try {
        await prisma.affiliate.create({
          data: { ...data, userId: session.user.id, code: generateAffiliateCode(session.user.name) },
        });
        break;
      } catch (e) {
        if (attempt < 3 && e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
        throw e;
      }
    }
  }

  revalidatePath("/dashboard/affiliate");
  return { success: true, message: "Application submitted. We'll review it shortly." };
}

/** Save where payouts should be sent (UPI or bank account). */
export async function savePayoutDetails(input: unknown): Promise<Result> {
  const session = await getUserSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = payoutDetailsSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) };

  const affiliate = await prisma.affiliate.findUnique({ where: { userId: session.user.id } });
  if (!affiliate || affiliate.status !== "APPROVED") {
    return { success: false, error: "Only approved affiliates can add payout details." };
  }

  const d = parsed.data;
  await prisma.affiliate.update({
    where: { id: affiliate.id },
    data:
      d.payoutMethod === "UPI"
        ? { payoutMethod: "UPI", upiId: d.upiId, bankAccountName: null, bankAccountNumber: null, bankIfsc: null }
        : {
            payoutMethod: "BANK",
            upiId: null,
            bankAccountName: d.bankAccountName,
            bankAccountNumber: d.bankAccountNumber,
            bankIfsc: d.bankIfsc,
          },
  });

  revalidatePath("/dashboard/affiliate");
  return { success: true, message: "Payout details saved." };
}

/** Requests a payout of every commission that is past the hold period. */
export async function requestPayout(): Promise<Result> {
  const session = await getUserSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const result = await requestPayoutForUser(session.user.id);
  if (result.success) revalidatePath("/dashboard/affiliate");
  return result;
}
