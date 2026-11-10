"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export function SiteHeader() {
  const { data: session } = useSession();

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#061138]/70 backdrop-blur-xl">
      <div className="container mx-auto flex h-20 items-center justify-between px-6 lg:px-12">
        <Link href="/" className="inline-flex items-center gap-3.5 group">
          <img
            src="/icon.png"
            alt="HostMyService Logo"
            className="h-10 w-10 rounded-xl object-contain bg-white p-1 shadow-md border border-white/20 group-hover:scale-105 transition-transform"
          />
          <span className="font-display font-extrabold text-2xl tracking-tight text-white group-hover:text-sky-200 transition-colors">
            HostMyService
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-10">
          <Link href="/#features" className="text-sm font-semibold text-blue-100/80 hover:text-white transition-colors">
            Features
          </Link>
          <Link href="/#pricing" className="text-sm font-semibold text-blue-100/80 hover:text-white transition-colors">
            Pricing
          </Link>
          <Link href="/contact" className="text-sm font-semibold text-blue-100/80 hover:text-white transition-colors">
            Contact
          </Link>
          {session ? (
            <Link
              href="/dashboard"
              className="relative px-6 py-2.5 text-sm font-bold text-[#07133B] bg-[#00D2FF] rounded-full hover:bg-white hover:shadow-[0_0_24px_rgba(0,210,255,0.6)] transition-all duration-300"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold text-blue-100/80 hover:text-white transition-colors">
                Log in
              </Link>
              <Link
                href="/register"
                className="relative px-6 py-2.5 text-sm font-bold text-[#07133B] bg-[#00D2FF] rounded-full hover:bg-white hover:shadow-[0_0_24px_rgba(0,210,255,0.6)] transition-all duration-300"
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
