import { Metadata } from "next";
import { getAdminStats } from "@/app/actions/admin/stats";
import { Users, CreditCard, Server, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "Admin Dashboard - HostMyService",
  description: "System administration",
};

export default async function AdminPage() {
  const stats = await getAdminStats();

  const cards = [
    {
      name: "Total Users",
      value: stats.userCount,
      icon: Users,
      color: "text-[#00f0ff]",
      bg: "bg-[#00f0ff]/10",
      border: "border-[#00f0ff]/20"
    },
    {
      name: "Active Plans",
      value: stats.planCount,
      icon: CreditCard,
      color: "text-[#7000ff]",
      bg: "bg-[#7000ff]/10",
      border: "border-[#7000ff]/20"
    },
    {
      name: "Subscriptions",
      value: stats.subscriptionCount,
      icon: Server,
      color: "text-[#00f0ff]",
      bg: "bg-[#00f0ff]/10",
      border: "border-[#00f0ff]/20"
    },
    {
      name: "Deployed Sites",
      value: stats.siteCount,
      icon: Globe,
      color: "text-white",
      bg: "bg-white/10",
      border: "border-white/20"
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-white">Admin Overview</h1>
        <p className="mt-2 text-sm text-gray-400">
          System performance metrics and resource usage.
        </p>
      </div>
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <div
            key={card.name}
            className={`glass overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:bg-white/10`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-xl ${card.bg} ${card.border} border`}>
                <card.icon
                  className={`h-6 w-6 ${card.color}`}
                  aria-hidden="true"
                />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-400">
                    {card.name}
                  </dt>
                  <dd>
                    <div className="text-2xl font-bold text-white font-display mt-1">
                      {card.value}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}