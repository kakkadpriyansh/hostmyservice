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
      color: "bg-blue-500",
    },
    {
      name: "Active Plans",
      value: stats.planCount,
      icon: CreditCard,
      color: "bg-green-500",
    },
    {
      name: "Subscriptions",
      value: stats.subscriptionCount,
      icon: Server,
      color: "bg-purple-500",
    },
    {
      name: "Deployed Sites",
      value: stats.siteCount,
      icon: Globe,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Overview</h1>
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.name}
            className="overflow-hidden rounded-lg bg-white shadow"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <card.icon
                    className={`h-6 w-6 text-white p-1 rounded-md ${card.color}`}
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">
                      {card.name}
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {card.value}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
