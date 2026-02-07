import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col bg-background text-foreground font-sans">
      <div className="fixed inset-0 z-0 bg-grid-pattern opacity-40 pointer-events-none"></div>
      <SiteHeader />
      <main className="relative z-10 flex-1 pt-32 pb-20">
        <div className="container mx-auto px-6 lg:px-12 max-w-4xl">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
