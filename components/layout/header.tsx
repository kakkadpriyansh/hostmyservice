"use client";

import { useSession } from "next-auth/react";
import { User, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface HeaderProps {
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

export function Header({ onMenuToggle, isMenuOpen }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-30 flex h-16 sm:h-20 items-center justify-between border-b border-white/10 bg-[#061138]/95 backdrop-blur-xl px-4 sm:px-8 shadow-sm">
      {/* Left: Mobile Menu Toggle & Brand */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/20 text-white md:hidden hover:bg-white/20 active:scale-95 transition-all"
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        )}
        <Link href="/" className="flex items-center gap-2.5 md:hidden group">
          <img
            src="/icon.png"
            alt="HostMyService Logo"
            className="h-8 w-8 rounded-lg object-contain bg-white p-0.5 border border-white/20"
          />
          <span className="font-display font-extrabold text-base tracking-tight text-white group-hover:text-sky-200 transition-colors">
            HostMyService
          </span>
        </Link>
      </div>

      {/* Right: User Profile & Avatar */}
      <div className="flex items-center gap-3 sm:gap-4 ml-auto">
        <div className="text-sm text-right hidden sm:block">
          <p className="font-semibold text-white leading-tight">{session?.user?.name || "User"}</p>
          <p className="text-xs text-blue-200/60">{session?.user?.email || "No email"}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/20 text-[#00D2FF] overflow-hidden relative shadow-inner shrink-0">
          {session?.user?.image ? (
            <Image 
              src={session.user.image} 
              alt={session.user.name || "User"} 
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <User className="h-5 w-5" />
          )}
        </div>
      </div>
    </header>
  );
}
