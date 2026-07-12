import { getRevenueStats } from "@/app/actions/admin/revenue";
import { TrendingUp, IndianRupee, Users, BarChart3, CheckCircle } from "lucide-react";
import { RevenueCharts } from "@/components/admin/revenue-charts";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function RevenuePage() {
  const stats = await getRevenueStats();

  const summaryCards = [
    {
      label: "Total Revenue (12 mo)",
      value: `₹${stats.totalRevenue.toLocaleString("en-IN")}`,
      icon: IndianRupee,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
    },
    {
      label: "Active Subscriptions",
      value: stats.activeSubscriptions,
      icon: CheckCircle,
      color: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/20",
    },
    {
      label: "Total Subscriptions",
      value: stats.totalSubscriptions,
      icon: Users,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
    {
      label: "Avg Monthly Revenue",
      value: `₹${Math.round(stats.totalRevenue / 12).toLocaleString("en-IN")}`,
      icon: TrendingUp,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Revenue Analytics</h1>
          <p className="text-sm text-gray-400">Monthly breakdown of sales and active subscriptions</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="glass ring-1 ring-white/10 rounded-2xl p-5 flex items-center gap-4 hover:scale-[1.02] transition-transform"
          >
            <div className={`flex-shrink-0 p-3 rounded-xl ${card.bg} border ${card.border}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-xs text-gray-400">{card.label}</p>
              <p className="text-xl font-bold font-display text-white mt-0.5">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts — client component */}
      <RevenueCharts monthlyData={stats.monthlyData} />

      {/* Bottom row: Top Plans + Recent Payments */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Plans */}
        <div className="glass ring-1 ring-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-white">Top Plans by Revenue</h2>
          {stats.topPlans.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.topPlans.map((plan, i) => {
                const max = stats.topPlans[0].revenue;
                const pct = max > 0 ? Math.round((plan.revenue / max) * 100) : 0;
                return (
                  <div key={plan.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-300 flex items-center gap-2">
                        <span className="text-xs text-gray-500">#{i + 1}</span>
                        {plan.name}
                      </span>
                      <span className="text-white font-medium">
                        ₹{plan.revenue.toLocaleString("en-IN")}
                        <span className="text-xs text-gray-500 ml-1">({plan.count} sales)</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="glass ring-1 ring-white/10 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-base font-semibold text-white">Recent Payments</h2>
          </div>
          <div className="overflow-y-auto max-h-72">
            {stats.recentPayments.length === 0 ? (
              <p className="text-sm text-gray-500 italic p-6">No payments yet.</p>
            ) : (
              <table className="min-w-full divide-y divide-white/5">
                <thead className="bg-white/5 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">User</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Plan</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {stats.recentPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">{p.userName}</td>
                      <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">{p.planName}</td>
                      <td className="px-4 py-3 text-sm text-white font-medium whitespace-nowrap">
                        ₹{p.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {format(new Date(p.createdAt), "dd MMM yyyy")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
