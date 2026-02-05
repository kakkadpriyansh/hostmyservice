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
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  const adminLinks = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/subscriptions", label: "Subscriptions", icon: Server },
    { href: "/admin/websites", label: "Websites", icon: Globe },
    { href: "/admin/plans", label: "Plans", icon: Shield },
    { href: "/admin/upload", label: "Upload Test", icon: Upload },
    { href: "/admin/deploy", label: "Deployments", icon: Settings },
  ];

  const links = role === "ADMIN" ? adminLinks : userLinks;

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-xl bg-white/10 text-white backdrop-blur-md border border-white/10 shadow-lg md:hidden hover:bg-white/20 transition-colors"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 transform border-r border-white/5 bg-black/40 backdrop-blur-xl transition-transform duration-300 ease-in-out md:translate-x-0 md:static",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center justify-center border-b border-white/5 px-6">
            <Link href="/" className="flex items-center gap-2 group">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 border border-white/10 group-hover:border-primary/50 transition-colors duration-300">
                    <Server className="h-4 w-4 text-primary group-hover:text-white transition-colors" />
                </div>
                <span className="text-lg font-display font-bold tracking-tight text-white group-hover:text-primary transition-colors">
                    HostMyService
                </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 px-4 py-6">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                    isActive
                      ? "text-white bg-white/5 border border-white/5 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                      : "text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-1"
                  )}
                >
                  {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_#00f0ff]"></div>
                  )}
                  <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-primary" : "text-gray-500 group-hover:text-white")} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer Actions */}
          <div className="border-t border-white/5 p-6">
            <button 
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/20"
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