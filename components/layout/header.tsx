"use client";

import { useSession } from "next-auth/react";
import { User } from "lucide-react";
import Image from "next/image";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-30 flex h-16 sm:h-20 items-center justify-between md:justify-end border-b border-white/10 bg-[#061138]/95 backdrop-blur-xl px-4 sm:px-8 shadow-sm">
      <div className="w-10 md:hidden" />
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="text-sm text-right hidden sm:block">
          <p className="font-semibold text-white">{session?.user?.name || "User"}</p>
          <p className="text-xs text-blue-200/60">{session?.user?.email || "No email"}</p>
        </div>
        <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-white/10 border border-white/20 text-[#00D2FF] overflow-hidden relative shadow-inner">
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
