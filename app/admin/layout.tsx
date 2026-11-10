import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { AppBackground } from "@/components/layout/app-background";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen bg-[#07133B] font-sans text-foreground overflow-hidden selection:bg-[#00D2FF] selection:text-[#07133B]">
      {/* Background Mesh, Circles and Dot Grid */}
      <AppBackground />
      
      <Sidebar role="ADMIN" />
      <div className="relative z-10 flex flex-1 flex-col overflow-y-auto h-screen">
        <Header />
        <main className="flex-1 p-6 md:p-8 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
