"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Server,
  Settings,
  Users,
  Shield,
  LogOut,
  Menu,
  X,
  Globe,
  Upload,
  CreditCard,
  TrendingUp,
  Gift,
} from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";

interface SidebarProps {
  role: "USER" | "ADMIN";
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const userLinks = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/sites", label: "My Sites", icon: Server },
    { href: "/dashboard/plans", label: "Buy Plan", icon: CreditCard },
    { href: "/dashboard/affiliate", label: "Affiliate Program", icon: Gift },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  const adminLinks = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/subscriptions", label: "Subscriptions", icon: Server },
    { href: "/admin/websites", label: "Websites", icon: Globe },
    { href: "/admin/plans", label: "Plans", icon: Shield },
    { href: "/admin/payments", label: "Payments", icon: CreditCard },
    { href: "/admin/revenue", label: "Revenue", icon: TrendingUp },
    { href: "/admin/affiliates", label: "Affiliates", icon: Gift },
    { href: "/admin/upload", label: "Upload Test", icon: Upload },
    { href: "/admin/deploy", label: "Deployments", icon: Server },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  const links = role === "ADMIN" ? adminLinks : userLinks;

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-[#061138]/80 text-white backdrop-blur-md border border-white/20 shadow-lg md:hidden hover:bg-white/20 transition-colors"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 transform border-r border-white/10 bg-[#061138]/80 backdrop-blur-2xl transition-transform duration-300 ease-in-out md:translate-x-0 md:static",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
            <Link href="/" className="flex items-center gap-3 group">
              <img
                src="/icon.png"
                alt="HostMyService Logo"
                className="h-9 w-9 rounded-xl object-contain bg-white p-1 shadow-md border border-white/20 group-hover:scale-105 transition-transform"
              />
              <span className="text-xl font-display font-extrabold tracking-tight text-white group-hover:text-sky-200 transition-colors">
                HostMyService
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 group relative overflow-hidden",
                    isActive
                      ? "text-white bg-white/10 border border-white/20 shadow-[0_0_20px_rgba(0,210,255,0.25)]"
                      : "text-blue-100/70 hover:text-white hover:bg-white/5 hover:translate-x-1"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00D2FF] shadow-[0_0_12px_#00D2FF]" />
                  )}
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-colors",
                      isActive ? "text-[#00D2FF]" : "text-blue-300/60 group-hover:text-white"
                    )}
                  />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer Actions */}
          <div className="border-t border-white/10 p-5">
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/20"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
