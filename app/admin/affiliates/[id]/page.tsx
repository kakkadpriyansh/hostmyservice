import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/authz";
import {
  describePayoutDestination,
  effectiveRate,
  formatPaise,
  getAffiliateBalance,
  getAffiliateSettings,
  holdCutoff,
} from "@/lib/affiliate";
import { PayoutActions, RateForm, ReverseCommissionButton, ReviewActions } from "@/components/admin/affiliates/affiliate-actions";
import { badge, card, panel, statusBadge, td, th } from "@/components/affiliate/styles";

export const dynamic = "force-dynamic";

export default async function AdminAffiliateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) redirect("/login");
  const { id } = await params;

  const affiliate = await prisma.affiliate.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true, createdAt: true } } },
  });
  if (!affiliate) notFound();

  const settings = await getAffiliateSettings();
  const [balance, commissions, payouts, referrals] = await Promise.all([
    getAffiliateBalance(affiliate.id, settings),
    prisma.commission.findMany({
      where: { affiliateId: id },
      include: { referredUser: { select: { email: true } }, payment: { select: { id: true, razorpayPaymentId: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.payout.findMany({ where: { affiliateId: id }, orderBy: { requestedAt: "desc" } }),
    prisma.user.findMany({
      where: { referredByAffiliateId: id },
      select: { id: true, name: true, email: true, createdAt: true, _count: { select: { payments: { where: { status: "SUCCESS" } } } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  const cutoff = holdCutoff(settings);
  const state = (c: (typeof commissions)[number]) =>
    c.status !== "PENDING" ? c.status : c.payoutId ? "IN_PAYOUT" : c.createdAt > cutoff ? "ON_HOLD" : "AVAILABLE";

  return (
    <div className="space-y-8">
      <Link href="/admin/affiliates" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> All affiliates
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold font-display text-white">{affiliate.user.name || affiliate.user.email}</h1>
        <span className={`${badge} ${statusBadge[affiliate.status]}`}>{affiliate.status.toLowerCase()}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className={`${card} space-y-3 lg:col-span-2`}>
          <h2 className="text-lg font-bold text-white">Profile</h2>
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <dt className="text-gray-400">Email</dt><dd className="text-white">{affiliate.user.email}</dd>
            <dt className="text-gray-400">Referral code</dt><dd className="font-mono text-white">{affiliate.code}</dd>
            <dt className="text-gray-400">Applied</dt><dd className="text-white">{affiliate.createdAt.toLocaleDateString("en-IN")}</dd>
            <dt className="text-gray-400">Website</dt>
            <dd className="truncate">
              {affiliate.website ? (
                <a href={affiliate.website} target="_blank" rel="noopener noreferrer nofollow" className="text-[#00D2FF] hover:underline">{affiliate.website}</a>
              ) : "—"}
            </dd>
            <dt className="text-gray-400">Payout to</dt>
            <dd className="font-mono text-xs text-white">{describePayoutDestination(affiliate) ?? "Not set"}</dd>
            <dt className="text-gray-400">Link clicks</dt><dd className="text-white">{affiliate.clickCount}</dd>
          </dl>
          {affiliate.promotionPlan && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Promotion plan</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-300">{affiliate.promotionPlan}</p>
            </div>
          )}
          {affiliate.adminNote && (
            <p className="text-sm text-amber-300">Note to affiliate: {affiliate.adminNote}</p>
          )}
        </div>

        <div className="space-y-6">
          <div className={`${card} space-y-3`}>
            <h2 className="text-lg font-bold text-white">Status</h2>
            <ReviewActions affiliateId={affiliate.id} status={affiliate.status} />
          </div>
          <div className={`${card} space-y-3`}>
            <h2 className="text-lg font-bold text-white">Commission rate</h2>
            <p className="text-sm text-gray-400">Currently {effectiveRate(affiliate, settings)}%</p>
            <RateForm affiliateId={affiliate.id} rate={affiliate.commissionRate} defaultRate={settings.defaultCommissionRate} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ["On hold", balance.onHoldPaise],
          ["Available", balance.availablePaise],
          ["In payout request", balance.requestedPaise],
          ["Paid out", balance.paidPaise],
        ].map(([title, value]) => (
          <div key={title as string} className={card}>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{title}</p>
            <p className="mt-2 text-2xl font-bold text-white">{formatPaise(value as number)}</p>
          </div>
        ))}
      </div>

      <section className={`${panel} overflow-hidden`}>
        <h2 className="px-6 pt-6 text-lg font-bold text-white">Payouts</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5">
            <thead className="bg-white/5">
              <tr>
                <th className={th}>Requested</th><th className={th}>Amount</th><th className={th}>Sent to</th>
                <th className={th}>Status</th><th className={th}>Reference / note</th><th className={th}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payouts.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-400">No payouts.</td></tr>}
              {payouts.map((p) => (
                <tr key={p.id}>
                  <td className={td}>{p.requestedAt.toLocaleDateString("en-IN")}</td>
                  <td className={`${td} font-semibold text-white`}>{formatPaise(p.amountPaise)}</td>
                  <td className={`${td} font-mono text-xs`}>{p.method}: {p.destination}</td>
                  <td className={td}><span className={`${badge} ${statusBadge[p.status]}`}>{p.status.toLowerCase()}</span></td>
                  <td className={`${td} whitespace-normal text-gray-400`}>{p.reference || p.adminNote || "—"}</td>
                  <td className={td}>{p.status === "REQUESTED" && <PayoutActions payoutId={p.id} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={`${panel} overflow-hidden`}>
        <h2 className="px-6 pt-6 text-lg font-bold text-white">Commissions</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5">
            <thead className="bg-white/5">
              <tr>
                <th className={th}>Date</th><th className={th}>Customer</th><th className={th}>Razorpay payment</th>
                <th className={th}>Base</th><th className={th}>Rate</th><th className={th}>Commission</th>
                <th className={th}>Status</th><th className={th}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {commissions.length === 0 && <tr><td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-400">No commissions.</td></tr>}
              {commissions.map((c) => {
                const s = state(c);
                return (
                  <tr key={c.id}>
                    <td className={td}>{c.createdAt.toLocaleDateString("en-IN")}</td>
                    <td className={td}>{c.referredUser.email}</td>
                    <td className={`${td} font-mono text-xs`}>{c.payment.razorpayPaymentId || "manual"}</td>
                    <td className={td}>{formatPaise(c.baseAmountPaise)}</td>
                    <td className={td}>{c.ratePercent}%</td>
                    <td className={`${td} font-semibold text-white`}>{formatPaise(c.amountPaise)}</td>
                    <td className={td}>
                      <span className={`${badge} ${statusBadge[s]}`} title={c.reversedReason ?? undefined}>{s.replace("_", " ").toLowerCase()}</span>
                    </td>
                    <td className={td}>{(s === "ON_HOLD" || s === "AVAILABLE") && <ReverseCommissionButton commissionId={c.id} />}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className={`${panel} overflow-hidden`}>
        <h2 className="px-6 pt-6 text-lg font-bold text-white">Referred users ({referrals.length})</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5">
            <thead className="bg-white/5">
              <tr><th className={th}>Joined</th><th className={th}>Name</th><th className={th}>Email</th><th className={th}>Successful payments</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {referrals.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-400">No referred users.</td></tr>}
              {referrals.map((u) => (
                <tr key={u.id}>
                  <td className={td}>{u.createdAt.toLocaleDateString("en-IN")}</td>
                  <td className={td}>{u.name || "—"}</td>
                  <td className={td}>{u.email}</td>
                  <td className={td}>{u._count.payments}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
