"use server";

import { requireAdmin } from "@/lib/authz";

import prisma from "@/lib/prisma";

export async function getAdminStats() {
  await requireAdmin();
  const [userCount, planCount, subscriptionCount, siteCount] = await Promise.all([
    prisma.user.count(),
    prisma.plan.count(),
    prisma.subscription.count(),
    prisma.site.count(),
  ]);

  return {
    userCount,
    planCount,
    subscriptionCount,
    siteCount,
  };
}
