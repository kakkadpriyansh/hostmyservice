"use client";

import Link from "next/link";
import { Server } from "lucide-react";
import { useSession } from "next-auth/react";

export function SiteHeader() {
  const { data: session } = useSession();

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-background/60 backdrop-blur-xl">
      <div className="container mx-auto flex h-20 items-center justify-between px-6 lg:px-12">
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-white/10 group-hover:border-primary/50 transition-colors duration-300">
            <Server className="h-5 w-5 text-primary group-hover:text-white transition-colors" />
          </div>
          <span className="text-xl font-display font-bold tracking-tight text-white group-hover:text-primary transition-colors">
            HostMyService
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-10">
          <Link href="/#features" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
            Features
          </Link>
          <Link href="/#pricing" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
            Pricing
          </Link>
          <Link href="/contact" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
            Contact
          </Link>
          {session ? (
            <Link
              href="/dashboard"
              className="relative px-6 py-2.5 text-sm font-semibold text-black bg-primary rounded-full hover:bg-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,240,255,0.5)]"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                Log in
              </Link>
              <Link
                href="/register"
                className="relative px-6 py-2.5 text-sm font-semibold text-black bg-primary rounded-full hover:bg-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,240,255,0.5)]"
              >
                Get Started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
