import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { AppBackground } from "@/components/layout/app-background";
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
    <div className="relative flex min-h-screen bg-[#07133B] font-sans text-foreground overflow-hidden selection:bg-[#00D2FF] selection:text-[#07133B]">
      {/* Background Mesh, Circles and Dot Grid */}
      <AppBackground />
      
      <Sidebar role={role} />
      <div className="relative z-10 flex flex-1 flex-col overflow-y-auto h-screen">
        <Header />
        <main className="flex-1 p-4 sm:p-6 md:p-8 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
