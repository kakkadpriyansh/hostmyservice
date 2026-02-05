import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getClientSubscriptions } from "@/app/actions/client/dashboard";
import { Server, Globe, CreditCard, Activity, ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { SiteCard } from "@/components/dashboard/site-card";

export default async function DashboardOverview() {
  const session = await getServerSession(authOptions);
  const subscriptions = await getClientSubscriptions();

  const totalSites = subscriptions.length;
  const activeSites = subscriptions.filter(s => s.status === 'ACTIVE').length;
  // Calculate expiring soon (e.g. within 7 days)
  const expiringSoon = subscriptions.filter(s => {
    const daysLeft = Math.ceil((new Date(s.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 && daysLeft <= 7;
  }).length;

  const stats = [
    {
      name: "Total Sites",
      value: totalSites,
      icon: Server,
      color: "text-[#00f0ff]",
      bg: "bg-[#00f0ff]/10",
      border: "border-[#00f0ff]/20"
    },
    {
      name: "Active Deployments",
      value: activeSites,
      icon: Globe,
      color: "text-[#7000ff]",
      bg: "bg-[#7000ff]/10",
      border: "border-[#7000ff]/20"
    },
    {
      name: "Expiring Soon",
      value: expiringSoon,
      icon: Activity,
      color: "text-[#ff003c]",
      bg: "bg-[#ff003c]/10",
      border: "border-[#ff003c]/20"
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">
            Welcome back, {session?.user?.name || "User"}
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Here's what's happening with your projects today.
          </p>
        </div>
        <Link
          href="/dashboard/plans"
          className="group flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-black shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(0,240,255,0.5)]"
        >
          <Plus className="h-4 w-4" />
          Deploy New Site
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => (
          <div
            key={stat.name}
            className="glass overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:bg-white/10"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center gap-4">
              <div className={`rounded-xl p-3 ${stat.bg} ${stat.color} ring-1 ring-inset ${stat.border}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">{stat.name}</p>
                <p className="mt-1 text-2xl font-display font-bold text-white">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Sites Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold text-white">Recent Sites</h2>
          <Link 
            href="/dashboard/sites" 
            className="group flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            View All
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {subscriptions.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 text-center backdrop-blur-sm">
            <div className="rounded-full bg-white/10 p-3 mb-3">
              <Server className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-400">No sites deployed yet.</p>
            <Link
              href="/dashboard/plans"
              className="mt-4 text-sm font-bold text-primary hover:underline"
            >
              Get started now
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {subscriptions.slice(0, 2).map((sub) => (
              <SiteCard key={sub.id} sub={sub} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
