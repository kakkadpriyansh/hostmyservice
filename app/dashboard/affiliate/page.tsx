import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Clock, Gift, MousePointerClick, UserPlus, Wallet, XCircle, Ban, CheckCircle2 } from "lucide-react";
import prisma from "@/lib/prisma";
import { getUserSession } from "@/lib/authz";
import {
  describePayoutDestination,
  effectiveRate,
  formatPaise,
  getAffiliateBalance,
  getAffiliateSettings,
  holdCutoff,
  maskEmail,
} from "@/lib/affiliate";
import { AffiliateApplicationForm } from "@/components/affiliate/application-form";
import { ReferralLink } from "@/components/affiliate/referral-link";
import { PayoutDetailsForm } from "@/components/affiliate/payout-details-form";
import { RequestPayoutButton } from "@/components/affiliate/request-payout-button";
import { badge, card, statusBadge, td, th } from "@/components/affiliate/styles";

export const dynamic = "force-dynamic";

async function siteUrl(): Promise<string> {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function Header() {
  return (
    <div>
      <h1 className="text-3xl font-display font-bold text-white">Developer Affiliate Program</h1>
      <p className="mt-2 text-sm text-gray-400">
        Refer customers to HostMyService and earn a share of what they pay.
      </p>
    </div>
  );
}

function Notice({ icon: Icon, title, children, tone }: { icon: typeof Clock; title: string; children?: React.ReactNode; tone: string }) {
  return (
    <div className={`${card} flex items-start gap-4`}>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <div className="mt-1 text-sm text-gray-400">{children}</div>
      </div>
    </div>
  );
}

export default async function AffiliatePage() {
  const session = await getUserSession();
  if (!session) redirect("/login");

  const settings = await getAffiliateSettings();
  const affiliate = await prisma.affiliate.findUnique({ where: { userId: session.user.id } });
  const minPayout = formatPaise(settings.minPayoutPaise);

  if (!settings.programEnabled) {
    return (
      <div className="space-y-8">
        <Header />
        <Notice icon={Gift} title="The affiliate program is paused" tone="bg-white/10 text-gray-300">
          Check back later.
        </Notice>
      </div>
    );
  }

  if (!affiliate || affiliate.status === "REJECTED") {
    return (
      <div className="space-y-8">
        <Header />
        {affiliate?.status === "REJECTED" && (
          <Notice icon={XCircle} title="Your previous application wasn't approved" tone="bg-red-500/15 text-red-300">
            {affiliate.adminNote || "You're welcome to apply again with more detail."}
          </Notice>
        )}
        {settings.applicationsOpen ? (
          <AffiliateApplicationForm
            defaultRate={settings.defaultCommissionRate}
            holdDays={settings.holdDays}
            minPayout={minPayout}
            previous={affiliate}
          />
        ) : (
          <Notice icon={Clock} title="Applications are closed" tone="bg-white/10 text-gray-300">
            We aren&apos;t accepting new affiliates right now.
          </Notice>
        )}
      </div>
    );
  }

  if (affiliate.status === "PENDING") {
    return (
      <div className="space-y-8">
        <Header />
        <Notice icon={Clock} title="Application under review" tone="bg-amber-500/15 text-amber-300">
          We&apos;ll review your application and enable your referral link once it&apos;s approved.
        </Notice>
      </div>
    );
  }

  if (affiliate.status === "SUSPENDED") {
    return (
      <div className="space-y-8">
        <Header />
        <Notice icon={Ban} title="Your affiliate account is suspended" tone="bg-gray-500/15 text-gray-300">
          {affiliate.adminNote || "Contact support for details."} New referrals don&apos;t earn commission while suspended.
        </Notice>
      </div>
    );
  }

  // ── APPROVED ──────────────────────────────────────────────────────────────
  const [balance, referrals, commissions, payouts, base] = await Promise.all([
    getAffiliateBalance(affiliate.id, settings),
    prisma.user.findMany({
      where: { referredByAffiliateId: affiliate.id },
      select: { id: true, email: true, createdAt: true, _count: { select: { commissionsGenerated: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.commission.findMany({
      where: { affiliateId: affiliate.id },
      include: { referredUser: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.payout.findMany({ where: { affiliateId: affiliate.id }, orderBy: { requestedAt: "desc" }, take: 20 }),
    siteUrl(),
  ]);
  const referralCount = await prisma.user.count({ where: { referredByAffiliateId: affiliate.id } });

  const rate = effectiveRate(affiliate, settings);
  const cutoff = holdCutoff(settings);
  const hasDestination = !!describePayoutDestination(affiliate);
  const hasOpenPayout = payouts.some((p) => p.status === "REQUESTED");
  const payoutBlocker = !hasDestination
    ? "Add your payout details below first."
    : hasOpenPayout
      ? "You have a payout request being processed."
      : balance.availablePaise < settings.minPayoutPaise
        ? `Payouts open at ${minPayout} available. You have ${formatPaise(balance.availablePaise)}.`
        : undefined;

  const commissionState = (c: (typeof commissions)[number]) =>
    c.status !== "PENDING" ? c.status : c.payoutId ? "IN_PAYOUT" : c.createdAt > cutoff ? "ON_HOLD" : "AVAILABLE";

  const stats = [
    { label: "Link clicks", value: affiliate.clickCount.toLocaleString("en-IN"), icon: MousePointerClick },
    { label: "Sign-ups", value: referralCount.toLocaleString("en-IN"), icon: UserPlus },
    { label: "On hold", value: formatPaise(balance.onHoldPaise), icon: Clock, hint: `${settings.holdDays}-day refund window` },
    { label: "Available", value: formatPaise(balance.availablePaise), icon: Wallet },
    { label: "Paid out", value: formatPaise(balance.paidPaise), icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-8">
      <Header />

      <div className={`${card} space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-white">Your referral link</h2>
          <span className="text-sm text-gray-300">
            You earn <strong className="text-[#00D2FF]">{rate}%</strong> of{" "}
            {settings.commissionScope === "FIRST_PAYMENT" ? "each referred customer's first payment" : "every payment from referred customers"}{" "}
            (excluding GST)
          </span>
        </div>
        <ReferralLink url={`${base}/r/${affiliate.code}`} />
        <p className="text-xs text-gray-400">
          Visitors who sign up within {settings.cookieDays} days of clicking your link are credited to you.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className={card}>
            <div className="flex items-center gap-2 text-gray-400">
              <s.icon className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">{s.label}</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-white">{s.value}</p>
            {s.hint && <p className="mt-1 text-xs text-gray-500">{s.hint}</p>}
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`${card} space-y-4`}>
          <h2 className="text-lg font-bold text-white">Payout</h2>
          <p className="text-sm text-gray-400">
            Request a payout once at least {minPayout} is available. We send it to your saved account and add the
            transaction reference below.
          </p>
          {balance.requestedPaise > 0 && (
            <p className="text-sm text-amber-300">{formatPaise(balance.requestedPaise)} is in a payout request being processed.</p>
          )}
          <RequestPayoutButton disabled={!!payoutBlocker} reason={payoutBlocker} />
        </div>

        <div className={`${card} space-y-4`}>
          <h2 className="text-lg font-bold text-white">Payout details</h2>
          <PayoutDetailsForm initial={affiliate} />
        </div>
      </div>

      <div className={`${card} p-0 overflow-hidden`}>
        <h2 className="px-6 pt-6 text-lg font-bold text-white">Commissions</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5">
            <thead className="bg-white/5">
              <tr>
                <th className={th}>Date</th>
                <th className={th}>Customer</th>
                <th className={th}>Payment (excl. GST)</th>
                <th className={th}>Rate</th>
                <th className={th}>Commission</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {commissions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                    No commissions yet. Share your link to start earning.
                  </td>
                </tr>
              )}
              {commissions.map((c) => {
                const state = commissionState(c);
                return (
                  <tr key={c.id}>
                    <td className={td}>{c.createdAt.toLocaleDateString("en-IN")}</td>
                    <td className={td}>{maskEmail(c.referredUser.email)}</td>
                    <td className={td}>{formatPaise(c.baseAmountPaise)}</td>
                    <td className={td}>{c.ratePercent}%</td>
                    <td className={`${td} font-semibold text-white`}>{formatPaise(c.amountPaise)}</td>
                    <td className={td}>
                      <span className={`${badge} ${statusBadge[state]}`}>{state.replace("_", " ").toLowerCase()}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`${card} p-0 overflow-hidden`}>
          <h2 className="px-6 pt-6 text-lg font-bold text-white">Payout history</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-white/5">
              <thead className="bg-white/5">
                <tr>
                  <th className={th}>Requested</th>
                  <th className={th}>Amount</th>
                  <th className={th}>Status</th>
                  <th className={th}>Reference / note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payouts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">No payouts yet.</td>
                  </tr>
                )}
                {payouts.map((p) => (
                  <tr key={p.id}>
                    <td className={td}>{p.requestedAt.toLocaleDateString("en-IN")}</td>
                    <td className={`${td} font-semibold text-white`}>{formatPaise(p.amountPaise)}</td>
                    <td className={td}>
                      <span className={`${badge} ${statusBadge[p.status]}`}>{p.status.toLowerCase()}</span>
                    </td>
                    <td className={`${td} whitespace-normal text-gray-400`}>{p.reference || p.adminNote || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`${card} p-0 overflow-hidden`}>
          <h2 className="px-6 pt-6 text-lg font-bold text-white">Recent sign-ups</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-white/5">
              <thead className="bg-white/5">
                <tr>
                  <th className={th}>Joined</th>
                  <th className={th}>Customer</th>
                  <th className={th}>Paying</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {referrals.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-400">No sign-ups yet.</td>
                  </tr>
                )}
                {referrals.map((r) => (
                  <tr key={r.id}>
                    <td className={td}>{r.createdAt.toLocaleDateString("en-IN")}</td>
                    <td className={td}>{maskEmail(r.email)}</td>
                    <td className={td}>{r._count.commissionsGenerated > 0 ? "Yes" : "Not yet"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
