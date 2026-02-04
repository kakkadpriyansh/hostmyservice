"use client";

import { User } from "lucide-react";

export function Header() {
  return (
    <header className="flex h-16 items-center justify-end border-b bg-white px-8 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="text-sm text-right hidden sm:block">
          <p className="font-medium">User Name</p>
          <p className="text-xs text-gray-500">user@example.com</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
          <User className="h-5 w-5 text-slate-600" />
        </div>
      </div>
    </header>
  );
}
