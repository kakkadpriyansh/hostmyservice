"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Menu, X, MessageCircle, ArrowRight } from "lucide-react";

export function SiteHeader() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#061138]/90 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 sm:h-20 items-center justify-between px-4 sm:px-6 lg:px-12">
        <Link href="/" className="inline-flex items-center gap-2.5 sm:gap-3.5 group">
          <img
            src="/icon.png"
            alt="HostMyService Logo"
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl object-contain bg-white p-1 shadow-md border border-white/20 group-hover:scale-105 transition-transform"
          />
          <span className="font-display font-extrabold text-xl sm:text-2xl tracking-tight text-white group-hover:text-sky-200 transition-colors">
            HostMyService
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-10">
          <Link href="/#features" className="text-sm font-semibold text-blue-100/80 hover:text-white transition-colors">
            Features
          </Link>
          <Link href="/#pricing" className="text-sm font-semibold text-blue-100/80 hover:text-white transition-colors">
            Pricing
          </Link>
          <Link href="/contact" className="text-sm font-semibold text-blue-100/80 hover:text-white transition-colors">
            Contact
          </Link>
          <a
            href="https://wa.me/918401661887"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-100/80 hover:text-white transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-[#00D2FF]" />
            WhatsApp
          </a>
          {session ? (
            <Link
              href="/dashboard"
              className="relative px-6 py-2.5 text-sm font-bold text-[#07133B] bg-[#00D2FF] rounded-full hover:bg-white hover:shadow-[0_0_24px_rgba(0,210,255,0.6)] transition-all duration-300"
            >
              Dashboard
            </Link>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-semibold text-blue-100/80 hover:text-white transition-colors">
                Log in
              </Link>
              <Link
                href="/register"
                className="relative px-6 py-2.5 text-sm font-bold text-[#07133B] bg-[#00D2FF] rounded-full hover:bg-white hover:shadow-[0_0_24px_rgba(0,210,255,0.6)] transition-all duration-300"
              >
                Get Started
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-blue-100 hover:text-white bg-white/10 border border-white/15 focus:outline-none focus:ring-2 focus:ring-[#00D2FF]"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-[#061138]/95 backdrop-blur-2xl px-6 py-6 space-y-4 animate-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col space-y-3.5">
            <Link
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-blue-100/90 hover:text-white py-1.5 transition-colors"
            >
              Features
            </Link>
            <Link
              href="/#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-blue-100/90 hover:text-white py-1.5 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-blue-100/90 hover:text-white py-1.5 transition-colors"
            >
              Contact
            </Link>
            <a
              href="https://wa.me/918401661887"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center gap-2 text-base font-semibold text-emerald-400 hover:text-emerald-300 py-1.5 transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-emerald-400" />
              WhatsApp Support
            </a>
          </div>

          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
            {session ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 text-center text-sm font-bold text-[#07133B] bg-[#00D2FF] rounded-xl hover:bg-white transition-all shadow-[0_0_20px_rgba(0,210,255,0.4)]"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl transition-all"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-3 text-center text-sm font-bold text-[#07133B] bg-[#00D2FF] rounded-xl hover:bg-white transition-all shadow-[0_0_20px_rgba(0,210,255,0.4)]"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
