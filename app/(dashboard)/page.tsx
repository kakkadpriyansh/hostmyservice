import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - HostMyService",
  description: "Manage your sites and deployments",
};

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p>Welcome to your dashboard.</p>
    </div>
  );
}
