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
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ role, isOpen: controlledIsOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;
  const handleClose = () => {
    if (onClose) onClose();
    if (!isControlled) setInternalIsOpen(false);
  };
  const handleToggle = () => {
    if (isControlled) {
      if (isOpen && onClose) onClose();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

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
      {/* Fallback Mobile Toggle only if sidebar is rendered standalone (uncontrolled) */}
      {!isControlled && (
        <button
          onClick={handleToggle}
          className="fixed top-3.5 left-4 z-50 p-2 rounded-xl bg-[#061138]/90 text-white backdrop-blur-md border border-white/20 shadow-lg md:hidden hover:bg-white/20 transition-colors"
          aria-label="Toggle navigation"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      )}

      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={handleClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-fade-in"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform border-r border-white/10 bg-[#061138]/98 backdrop-blur-2xl transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:z-40",
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo & Close Button */}
          <div className="flex h-16 sm:h-20 items-center justify-between border-b border-white/10 px-5 sm:px-6">
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
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-xl text-blue-200 hover:text-white bg-white/5 border border-white/10 md:hidden hover:bg-white/15 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
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
                  onClick={handleClose}
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
