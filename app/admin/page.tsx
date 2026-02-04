import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard - HostMyService",
  description: "System administration",
};

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Admin Overview</h1>
      <p>System metrics and management.</p>
    </div>
  );
}
