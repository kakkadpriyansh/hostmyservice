import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AppBackground } from "@/components/layout/app-background";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col bg-[#07133B] text-foreground font-sans selection:bg-[#00D2FF] selection:text-[#07133B]">
      <AppBackground />
      <SiteHeader />
      <main className="relative z-10 flex-1 pt-8 sm:pt-12 pb-16 sm:pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-4xl">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
