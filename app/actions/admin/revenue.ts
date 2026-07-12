"use server";

import prisma from "@/lib/prisma";

export interface MonthlyRevenue {
  month: string;      // "Jan 2026"
  year: number;
  monthIndex: number; // 0–11
  revenue: number;    // sum of successful payment amounts
  subscriptions: number; // count of ACTIVE subscriptions that overlap this month
}

export interface RevenueStats {
  totalRevenue: number;
  activeSubscriptions: number;
  totalSubscriptions: number;
  monthlyData: MonthlyRevenue[];
  topPlans: { name: string; count: number; revenue: number }[];
  recentPayments: {
    id: string;
    userName: string;
    planName: string;
    amount: number;
    status: string;
    createdAt: Date;
  }[];
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export async function getRevenueStats(): Promise<RevenueStats> {
  const now = new Date();

  // Build last 12 months range
  const months: { year: number; month: number; label: string }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: d.getFullYear(),
      month: d.getMonth(), // 0-indexed
      label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
    });
  }

  const rangeStart = new Date(months[0].year, months[0].month, 1);
  const rangeEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59); // last ms of current month

  // --- Successful payments in range ---
  const payments = await prisma.payment.findMany({
    where: {
      deletedAt: null,
      status: "SUCCESS",
      createdAt: { gte: rangeStart, lte: rangeEnd },
    },
    include: {
      user: { select: { name: true } },
      plan: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // --- All subscriptions (to count active ones per month) ---
  const allSubscriptions = await prisma.subscription.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      status: true,
      startDate: true,
      endDate: true,
      planId: true,
      plan: { select: { name: true, price: true } },
    },
  });

  // --- Build monthly data ---
  const monthlyData: MonthlyRevenue[] = months.map(({ year, month, label }) => {
    const monthStart = new Date(year, month, 1);
    const monthEnd   = new Date(year, month + 1, 0, 23, 59, 59);

    // Revenue = sum of successful payments created in this month
    const revenue = payments
      .filter((p) => {
        const d = new Date(p.createdAt);
        return d >= monthStart && d <= monthEnd;
      })
      .reduce((sum, p) => sum + p.amount, 0);

    // Active subscriptions = those whose status is ACTIVE AND their date range overlaps this month
    const subscriptions = allSubscriptions.filter((s) => {
      if (s.status !== "ACTIVE") return false;
      const start = new Date(s.startDate);
      const end   = new Date(s.endDate);
      return start <= monthEnd && end >= monthStart;
    }).length;

    return { month: label, year, monthIndex: month, revenue, subscriptions };
  });

  // --- Totals ---
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

  const activeSubscriptions = allSubscriptions.filter(
    (s) => s.status === "ACTIVE"
  ).length;

  const totalSubscriptions = allSubscriptions.length;

  // --- Top plans by revenue ---
  const planMap = new Map<string, { name: string; count: number; revenue: number }>();
  for (const p of payments) {
    if (!p.plan) continue;
    const key = p.plan.name;
    const existing = planMap.get(key) ?? { name: key, count: 0, revenue: 0 };
    existing.count  += 1;
    existing.revenue += p.amount;
    planMap.set(key, existing);
  }
  const topPlans = Array.from(planMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // --- Recent payments (last 10) ---
  const recentPayments = payments.slice(0, 10).map((p) => ({
    id: p.id,
    userName: p.user?.name ?? "Unknown",
    planName: p.plan?.name ?? "Unknown",
    amount: p.amount,
    status: p.status,
    createdAt: p.createdAt,
  }));

  return {
    totalRevenue,
    activeSubscriptions,
    totalSubscriptions,
    monthlyData,
    topPlans,
    recentPayments,
  };
}
