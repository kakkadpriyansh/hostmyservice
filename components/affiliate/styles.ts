// Shared class names for the affiliate screens (matches the existing glass UI)
export const card = "glass rounded-2xl border border-white/10 p-6";
export const label = "block text-xs font-medium uppercase tracking-wider text-gray-400";
export const input =
  "mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all";
export const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-bold text-black transition-all hover:bg-white hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] disabled:cursor-not-allowed disabled:opacity-50";
export const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50";
export const dangerButton =
  "inline-flex items-center justify-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50";
export const th = "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400";
export const td = "px-4 py-3 text-sm text-gray-200 whitespace-nowrap";

export const statusBadge: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  APPROVED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  REJECTED: "bg-red-500/15 text-red-300 border-red-500/30",
  SUSPENDED: "bg-gray-500/15 text-gray-300 border-gray-500/30",
  REQUESTED: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  PAID: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  REVERSED: "bg-red-500/15 text-red-300 border-red-500/30",
  ON_HOLD: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  AVAILABLE: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  IN_PAYOUT: "bg-amber-500/15 text-amber-300 border-amber-500/30",
};
export const badge = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold";
