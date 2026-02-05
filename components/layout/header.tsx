"use client";

import { useSession } from "next-auth/react";
import { User } from "lucide-react";
import Image from "next/image";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-end border-b border-white/5 bg-background/60 backdrop-blur-xl px-8 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="text-sm text-right hidden sm:block">
          <p className="font-medium text-white">{session?.user?.name || "User"}</p>
          <p className="text-xs text-gray-400">{session?.user?.email || "No email"}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-primary overflow-hidden relative">
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
