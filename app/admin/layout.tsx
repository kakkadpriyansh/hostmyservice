import { DashboardLayoutClient } from "@/components/layout/dashboard-layout-client";
import { AppBackground } from "@/components/layout/app-background";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Every /admin page requires the ADMIN role, not just a login
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="relative flex min-h-screen bg-[#07133B] font-sans text-foreground overflow-hidden selection:bg-[#00D2FF] selection:text-[#07133B]">
      {/* Background Mesh, Circles and Dot Grid */}
      <AppBackground />
      <DashboardLayoutClient role="ADMIN">
        {children}
      </DashboardLayoutClient>
    </div>
  );
}
