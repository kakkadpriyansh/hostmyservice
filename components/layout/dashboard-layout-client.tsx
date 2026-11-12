"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

interface DashboardLayoutClientProps {
  role: "USER" | "ADMIN";
  children: React.ReactNode;
}

export function DashboardLayoutClient({ role, children }: DashboardLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Sidebar
        role={role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="relative z-10 flex flex-1 flex-col overflow-y-auto h-screen">
        <Header
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          isMenuOpen={sidebarOpen}
        />
        <main className="flex-1 p-4 sm:p-6 md:p-8 animate-fade-in">{children}</main>
      </div>
    </>
  );
}
