"use client";

import { User } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-end border-b border-white/5 bg-background/60 backdrop-blur-xl px-8 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="text-sm text-right hidden sm:block">
          <p className="font-medium text-white">User Name</p>
          <p className="text-xs text-gray-400">user@example.com</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-primary">
          <User className="h-5 w-5" />
        </div>
      </div>
    </header>
  );
}