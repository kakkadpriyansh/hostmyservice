import Link from "next/link";
import { redirect } from "next/navigation";
import { Gift } from "lucide-react";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/authz";
import { effectiveRate, formatPaise, getAffiliateSettings } from "@/lib/affiliate";
import { AffiliateSettingsForm } from "@/components/admin/affiliates/settings-form";
import { PayoutActions, ReviewActions } from "@/components/admin/affiliates/affiliate-actions";
import { badge, card, panel, statusBadge, td, th } from "@/components/affiliate/styles";

export const dynamic = "force-dynamic";

export default async function AdminAffiliatesPage() {
  if (!(await getAdminSession())) redirect("/login");

  const settings = await getAffiliateSettings();
  const [openPayouts, applications, affiliates, earned] = await Promise.all([
    prisma.payout.findMany({
      where: { status: "REQUESTED" },
      include: { affiliate: { include: { user: { select: { name: true, email: true } } } } },
      orderBy: { requestedAt: "asc" },
    }),
    prisma.affiliate.findMany({
      where: { status: "PENDING" },
      include: { user: { select: { name: true, email: true, createdAt: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.affiliate.findMany({
      where: { status: { not: "PENDING" } },
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { referrals: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.commission.groupBy({
      by: ["affiliateId", "status"],
      _sum: { amountPaise: true },
    }),
  ]);

  const totals = (affiliateId: string, status: "PENDING" | "PAID") =>
    earned.find((e) => e.affiliateId === affiliateId && e.status === status)?._sum.amountPaise ?? 0;
  const totalOwed = earned.filter((e) => e.status === "PENDING").reduce((s, e) => s + (e._sum.amountPaise ?? 0), 0);
  const totalPaid = earned.filter((e) => e.status === "PAID").reduce((s, e) => s + (e._sum.amountPaise ?? 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#00f0ff]/20 bg-[#00f0ff]/10">
          <Gift className="h-5 w-5 text-[#00f0ff]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Affiliate Program</h1>
          <p className="text-sm text-gray-400">
            Unpaid commissions: {formatPaise(totalOwed)} · Paid out: {formatPaise(totalPaid)}
          </p>
        </div>
      </div>

      {/* Payout requests */}
      <section className={`${panel} overflow-hidden`}>
        <h2 className="px-6 pt-6 text-lg font-bold text-white">Payout requests ({openPayouts.length})</h2>
        <p className="px-6 text-sm text-gray-400">Send the money, then mark it paid with the UTR so the affiliate can see it.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5">
            <thead className="bg-white/5">
              <tr>
                <th className={th}>Requested</th>
                <th className={th}>Affiliate</th>
                <th className={th}>Amount</th>
                <th className={th}>Send to</th>
                <th className={th}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {openPayouts.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-400">No pending payout requests.</td></tr>
              )}
              {openPayouts.map((p) => (
                <tr key={p.id}>
                  <td className={td}>{p.requestedAt.toLocaleDateString("en-IN")}</td>
                  <td className={td}>
                    <Link href={`/admin/affiliates/${p.affiliateId}`} className="text-[#00D2FF] hover:underline">
                      {p.affiliate.user.name || p.affiliate.user.email}
                    </Link>
                  </td>
                  <td className={`${td} font-semibold text-white`}>{formatPaise(p.amountPaise)}</td>
                  <td className={`${td} font-mono text-xs`}>{p.method}: {p.destination}</td>
                  <td className={td}><PayoutActions payoutId={p.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Applications */}
      <section className={`${card} space-y-4`}>
        <h2 className="text-lg font-bold text-white">Applications ({applications.length})</h2>
        {applications.length === 0 && <p className="text-sm text-gray-400">No applications waiting for review.</p>}
        <div className="grid gap-4 lg:grid-cols-2">
          {applications.map((a) => (
            <div key={a.id} className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="font-semibold text-white">{a.user.name || "—"}</p>
                  <p className="text-sm text-gray-400">{a.user.email}</p>
                </div>
                <p className="text-xs text-gray-500">
                  Applied {a.createdAt.toLocaleDateString("en-IN")} · member since {a.user.createdAt.toLocaleDateString("en-IN")}
                </p>
              </div>
              {a.website && (
                <a href={a.website} target="_blank" rel="noopener noreferrer nofollow" className="block truncate text-sm text-[#00D2FF] hover:underline">
                  {a.website}
                </a>
              )}
              <p className="whitespace-pre-wrap text-sm text-gray-300">{a.promotionPlan}</p>
              <ReviewActions affiliateId={a.id} status={a.status} />
            </div>
          ))}
        </div>
      </section>

      {/* Affiliates */}
      <section className={`${panel} overflow-hidden`}>
        <h2 className="px-6 pt-6 text-lg font-bold text-white">Affiliates ({affiliates.length})</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5">
            <thead className="bg-white/5">
              <tr>
                <th className={th}>Affiliate</th>
                <th className={th}>Code</th>
                <th className={th}>Status</th>
                <th className={th}>Rate</th>
                <th className={th}>Clicks</th>
                <th className={th}>Sign-ups</th>
                <th className={th}>Unpaid</th>
                <th className={th}>Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {affiliates.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-400">No affiliates yet.</td></tr>
              )}
              {affiliates.map((a) => (
                <tr key={a.id} className="hover:bg-white/5">
                  <td className={td}>
                    <Link href={`/admin/affiliates/${a.id}`} className="text-[#00D2FF] hover:underline">
                      {a.user.name || a.user.email}
                    </Link>
                    <p className="text-xs text-gray-500">{a.user.email}</p>
                  </td>
                  <td className={`${td} font-mono text-xs`}>{a.code}</td>
                  <td className={td}><span className={`${badge} ${statusBadge[a.status]}`}>{a.status.toLowerCase()}</span></td>
                  <td className={td}>
                    {effectiveRate(a, settings)}%{a.commissionRate !== null && <span className="ml-1 text-xs text-gray-500">(custom)</span>}
                  </td>
                  <td className={td}>{a.clickCount}</td>
                  <td className={td}>{a._count.referrals}</td>
                  <td className={td}>{formatPaise(totals(a.id, "PENDING"))}</td>
                  <td className={td}>{formatPaise(totals(a.id, "PAID"))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Settings */}
      <section className={`${card} space-y-4`}>
        <h2 className="text-lg font-bold text-white">Program settings</h2>
        <AffiliateSettingsForm settings={settings} />
      </section>
    </div>
  );
}
