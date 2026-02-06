import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  // Default to USER if role is missing or unknown
  const role = (session?.user?.role as "USER" | "ADMIN") || "USER";

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 bg-grid-pattern opacity-20 pointer-events-none"></div>
      
      <Sidebar role={role} />
      <div className="relative z-10 flex flex-1 flex-col overflow-y-auto h-screen">
        <Header />
        <main className="flex-1 p-6 md:p-8 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}