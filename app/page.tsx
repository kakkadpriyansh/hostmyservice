import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  MessageCircle,
  Plus,
  Lock,
  Zap,
} from "lucide-react";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { PricingSection } from "@/components/pricing-section";
import type { Plan } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);
  let plans: Plan[] = [];
  try {
    plans = await prisma.plan.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      orderBy: { price: "asc" },
    });
  } catch (error) {
    logger.error("Failed to fetch plans from database", { error });
    plans = [];
  }

  const minPrice =
    plans.length > 0
      ? Math.round(Math.min(...plans.map((p) => p.price)) / 12)
      : 118;
  const yearlyMinPrice =
    plans.length > 0
      ? Math.min(...plans.map((p) => p.price))
      : 1420;

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden font-sans bg-[#07133B] text-white selection:bg-[#00D2FF] selection:text-[#07133B]">

      {/* Hero Background Grid and Concentric Circles (from ui.html in logo blue/white) */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      >
        {/* Deep Royal & Electric Blue mesh gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, #061138 0%, #082068 40%, #0047FF 75%, #051445 100%)",
          }}
        />

        {/* Ambient cyan cloud glow mimicking the logo */}
        <div
          className="absolute top-20 right-[5%] w-[650px] h-[650px] rounded-full blur-[140px] opacity-30 pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(0, 210, 255, 0.45) 0%, rgba(0, 102, 255, 0.25) 50%, transparent 75%)",
          }}
        />
        <div
          className="absolute top-40 -left-20 w-[550px] h-[550px] rounded-full blur-[130px] opacity-25 pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(0, 110, 255, 0.5) 0%, transparent 70%)",
          }}
        />

        {/* Dot grid matrix from ui.html */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.3) 1.5px, transparent 1.6px)",
            backgroundSize: "28px 28px",
            WebkitMaskImage: "linear-gradient(180deg, #000 0%, #000 50%, transparent 85%)",
            maskImage: "linear-gradient(180deg, #000 0%, #000 50%, transparent 85%)",
          }}
        />

        {/* Decorative concentric circles top-right from ui.html */}
        <svg
          aria-hidden="true"
          viewBox="0 0 900 900"
          className="pointer-events-none absolute right-[-280px] top-[-260px] w-[900px] h-[900px]"
          fill="none"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="1.5"
        >
          <circle cx="450" cy="450" r="440" />
          <circle cx="450" cy="450" r="340" />
          <circle cx="450" cy="450" r="240" />
          <circle cx="450" cy="450" r="140" />
        </svg>
      </div>

      {/* Navigation Header */}
      <SiteHeader />

      {/* Main Content */}
      <main className="relative z-10 flex-1">
        
        {/* HERO SECTION */}
        <section aria-label="Hero" className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-12 sm:pb-16 lg:pt-14 lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            
            {/* Left Column: ui.html inspired bold sticker typography & actions */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              
              {/* Live Pill Badge */}
              <div className="inline-flex items-center gap-2.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-white border-2 border-white/30 bg-white/10 backdrop-blur-md mb-6">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00D2FF] animate-pulse" />
                <span>v2.0 is live</span>
                <span className="text-white/40">•</span>
                <span className="text-sky-200">Global Edge Cloud</span>
              </div>

              {/* Main Headline (Creative Bold Sticker Style in Blue & White) */}
              <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-[76px] leading-[0.98] sm:leading-[0.96] tracking-tight text-white break-words">
                <span className="block">Go live.</span>
                <span className="inline-block mt-2 sm:mt-3 px-3.5 sm:px-5 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl bg-white text-[#0047FF] border-[3px] border-[#061138] shadow-[5px_5px_0_#061138] sm:shadow-[8px_8px_0_#061138] -rotate-2">
                  Stay live.
                </span>
              </h1>

              {/* Sub-headline */}
              <p className="mt-5 sm:mt-7 text-base sm:text-xl text-blue-100/90 leading-relaxed max-w-xl font-medium">
                Hosting for static sites, Node apps and databases, with real people on WhatsApp when you get stuck.
              </p>

              {/* Primary & WhatsApp Action Buttons (ui.html button energy) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 mt-8 w-full sm:w-auto">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2.5 min-h-[52px] sm:min-h-[56px] px-6 sm:px-8 rounded-2xl font-extrabold text-base sm:text-lg text-[#061138] bg-white hover:bg-sky-50 border-2 border-[#061138] shadow-[4px_4px_0_#061138] sm:shadow-[5px_5px_0_#061138] hover:shadow-[7px_7px_0_#061138] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_#061138] transition-all text-center"
                >
                  Start hosting
                  <ArrowRight className="w-5 h-5 text-[#0047FF]" />
                </Link>

                <a
                  href="https://wa.me/918401661887"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 min-h-[52px] sm:min-h-[56px] px-6 sm:px-7 rounded-2xl font-bold text-base sm:text-lg text-white border-2 border-white hover:bg-white/15 transition-all text-center"
                >
                  <MessageCircle className="w-5 h-5 text-[#00D2FF]" />
                  Chat on WhatsApp
                </a>
              </div>

              {/* Trust Features Row (From ui.html in logo blue/white) */}
              <div className="flex flex-wrap gap-x-5 sm:gap-x-6 gap-y-2.5 sm:gap-y-3 mt-7 text-xs sm:text-base font-semibold text-white">
                <span className="inline-flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00D2FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                  From ₹118/month
                </span>
                <span className="inline-flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00D2FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                  Free SSL certificate
                </span>
                <span className="inline-flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00D2FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                  DDoS protection
                </span>
              </div>

            </div>

            {/* Right Column: Creative Interactive Card (ui.html rotated card + rotating circular badge) */}
            <div className="lg:col-span-5 relative mt-6 lg:mt-0 flex justify-center w-full max-w-full px-2 sm:px-0">

              {/* Spinning Circular Badge (REAL HUMANS • ON WHATSAPP • 24/7) */}
              <div className="absolute -top-6 sm:-top-10 -right-2 sm:-right-6 z-30 w-24 h-24 sm:w-32 sm:h-32 pointer-events-none">
                <svg
                  viewBox="0 0 150 150"
                  className="w-full h-full drop-shadow-lg"
                >
                  <circle cx="75" cy="75" r="70" fill="#FFFFFF" stroke="#061138" strokeWidth="3" />
                  <defs>
                    <path id="ringText" d="M75,75 m-51,0 a51,51 0 1,1 102,0 a51,51 0 1,1 -102,0" />
                  </defs>
                  <g className="animate-spin-slow" style={{ transformOrigin: "75px 75px" }}>
                    <text fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="12" fontWeight="800" letterSpacing="1.6" fill="#061138">
                      <textPath href="#ringText">REAL HUMANS • ON WHATSAPP • 24/7 •</textPath>
                    </text>
                  </g>
                  <g transform="translate(75 75)" fill="none" stroke="#0047FF" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 -1a12 12 0 0 1 -17.8 10.4L-13 13l2.4 -7.1A12 12 0 1 1 12 -1z" />
                  </g>
                </svg>
              </div>

              {/* Floating "Live" Sticker Badge */}
              <div className="absolute top-2 sm:top-4 -left-1 sm:-left-6 z-30 scale-90 sm:scale-100">
                <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl border-2 border-[#061138] bg-white text-[#061138] font-mono text-[11px] sm:text-xs font-bold tracking-wider uppercase shadow-[3px_3px_0_#061138] sm:shadow-[4px_4px_0_#061138] -rotate-6">
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </div>
              </div>

              {/* Floating "Deployed in 1.8s" Toast (Bottom Left) */}
              <div className="absolute -bottom-4 sm:-bottom-6 -left-1 sm:-left-6 z-30 scale-90 sm:scale-100 origin-bottom-left animate-float-badge-2">
                <div className="inline-flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl border-2 border-[#061138] bg-[#061138] text-white shadow-[4px_4px_0_#00D2FF] sm:shadow-[6px_6px_0_#00D2FF]">
                  <div className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#0047FF] text-white">
                    <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-extrabold leading-tight">Deployed</div>
                    <div className="text-[10px] sm:text-xs font-mono text-sky-200">1.8s · global edge</div>
                  </div>
                </div>
              </div>

              {/* Floating "SSL Active" Badge (Bottom Right) */}
              <div className="absolute -bottom-4 sm:-bottom-5 -right-1 sm:-right-4 z-30 scale-90 sm:scale-100 origin-bottom-right animate-float-badge-1">
                <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border-2 border-[#061138] bg-white text-[#061138] shadow-[3px_3px_0_#061138] sm:shadow-[4px_4px_0_#061138]">
                  <div className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-100 text-emerald-700">
                    <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5]" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold">SSL active</span>
                </div>
              </div>

              {/* Main Browser Mockup Card (Inspired by ui.html + cloud console in Blue & White) */}
              <div className="relative w-full max-w-[500px] rounded-2xl sm:rounded-3xl border-[3px] border-[#061138] bg-white text-[#061138] shadow-[8px_8px_0_#061138] sm:shadow-[14px_14px_0_#061138] overflow-hidden rotate-[0.5deg] sm:rotate-[1.5deg] hover:rotate-0 transition-transform duration-300">
                
                {/* Browser Chrome Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b-[3px] border-[#061138] bg-[#E8EEFF]">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full border-2 border-[#061138] bg-white" />
                    <span className="w-3 h-3 rounded-full border-2 border-[#061138] bg-white" />
                    <span className="w-3 h-3 rounded-full border-2 border-[#061138] bg-[#00D2FF]" />
                  </div>
                  <div className="flex-1 flex items-center gap-2 px-3.5 py-1.5 rounded-full border-2 border-[#061138] bg-white font-mono text-xs font-bold text-[#061138]">
                    <Lock className="w-3 h-3 text-[#0047FF]" />
                    yourbrand.in
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 sm:p-6 space-y-4">
                  
                  {/* Console Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-base text-[#061138]">Websites</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#0047FF]">3 sites</span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold text-white bg-[#0047FF] shadow-sm">
                      <Plus className="w-3 h-3" />
                      Deploy site
                    </span>
                  </div>

                  {/* Active Site 1 */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-[#0047FF] font-black text-sm">
                        Y
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[#061138]">yourbrand.in</div>
                        <div className="text-xs text-slate-500">Static site · edge-cdn</div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Online
                    </span>
                  </div>

                  {/* Active Site 2 */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-100 text-sky-700 font-black text-sm">
                        S
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[#061138]">shop.yourbrand.in</div>
                        <div className="text-xs text-slate-500">Node app + database</div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Online
                    </span>
                  </div>

                  {/* Active Site 3: Deploying with progress bar */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 text-[#0047FF] font-black text-sm">
                          B
                        </div>
                        <div className="font-bold text-sm text-[#061138]">blog.yourbrand.in</div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0047FF] animate-ping" />
                        Deploying
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#0047FF] to-[#00D2FF] h-2 rounded-full relative overflow-hidden"
                        style={{ width: "72%" }}
                      >
                        <div className="absolute inset-0 bg-white/40 animate-shimmer" />
                      </div>
                    </div>
                  </div>

                  {/* Realtime Wave Chart: Visitors, last 7 days */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2 text-xs font-bold text-slate-600">
                      <span>Visitors, last 7 days</span>
                      <span className="text-slate-400 font-normal">Live</span>
                    </div>
                    <div className="w-full h-16">
                      <svg viewBox="0 0 400 70" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id="blueWave" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#0047FF" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#0047FF" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path d="M 0 55 Q 60 50 120 40 T 240 30 T 340 18 T 400 12 L 400 70 L 0 70 Z" fill="url(#blueWave)" />
                        <path d="M 0 55 Q 60 50 120 40 T 240 30 T 340 18 T 400 12" fill="none" stroke="#0047FF" strokeWidth="2.8" strokeLinecap="round" />
                        <circle cx="400" cy="12" r="4" fill="#0047FF" />
                        <circle cx="400" cy="12" r="7" fill="#00D2FF" opacity="0.4" className="animate-ping" />
                      </svg>
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </div>

          {/* 4-Column Stats Row (From ui.html in Blue & White) */}
          <div className="mt-10 sm:mt-14 pt-6 sm:pt-8 border-t-[3px] border-white/20">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              <div className="pt-3 sm:pt-4 border-t-[3px] border-white">
                <div className="font-display text-3xl sm:text-5xl font-black tracking-tight text-white leading-none">
                  99.9%
                </div>
                <div className="mt-1.5 sm:mt-2 text-xs sm:text-base font-semibold text-blue-100">Uptime</div>
              </div>

              <div className="pt-3 sm:pt-4 border-t-[3px] border-white">
                <div className="font-display text-3xl sm:text-5xl font-black tracking-tight text-white leading-none">
                  &lt; 2s
                </div>
                <div className="mt-1.5 sm:mt-2 text-xs sm:text-base font-semibold text-blue-100">Deploy time</div>
              </div>

              <div className="pt-3 sm:pt-4 border-t-[3px] border-white">
                <div className="font-display text-3xl sm:text-5xl font-black tracking-tight text-white leading-none">
                  200+
                </div>
                <div className="mt-1.5 sm:mt-2 text-xs sm:text-base font-semibold text-blue-100">Global edge locations</div>
              </div>

              <div className="pt-3 sm:pt-4 border-t-[3px] border-white">
                <div className="font-display text-3xl sm:text-5xl font-black tracking-tight text-white leading-none">
                  24/7
                </div>
                <div className="mt-1.5 sm:mt-2 text-xs sm:text-base font-semibold text-blue-100">Support on WhatsApp</div>
              </div>
            </div>
          </div>
        </section>

        {/* Angled Dual Marquee Rotating Belts (Inspired by ui.html in Brand Blue & White) */}
        <div className="relative z-20 h-44 -my-4 overflow-hidden pointer-events-none select-none">
          <style
            dangerouslySetInnerHTML={{
              __html: `
                @keyframes beltScroll {
                  0% { transform: translate3d(0, 0, 0); }
                  100% { transform: translate3d(-50%, 0, 0); }
                }
                @keyframes beltScrollRev {
                  0% { transform: translate3d(-50%, 0, 0); }
                  100% { transform: translate3d(0, 0, 0); }
                }
                .rotating-belt-main {
                  display: flex;
                  width: max-content;
                  will-change: transform;
                  animation: beltScroll 80s linear infinite;
                }
                .rotating-belt-sub {
                  display: flex;
                  width: max-content;
                  will-change: transform;
                  animation: beltScrollRev 95s linear infinite;
                }
              `,
            }}
          />

          {/* Belt 1: Deep Navy with Cyan/White text (Rotated +1.3deg) */}
          <div className="absolute -left-[5%] -right-[5%] top-16 overflow-hidden border-y-[3px] border-[#061138] bg-[#061138] rotate-[1.3deg] py-3.5 shadow-lg">
            <div className="rotating-belt-sub font-display text-lg sm:text-xl font-bold tracking-wider text-white whitespace-nowrap">
              {[1, 2, 3, 4].map((set) => (
                <div key={set} className="flex items-center gap-8 pr-8">
                  <span>FREE SSL CERTIFICATE</span>
                  <span className="text-[#00D2FF]">✦</span>
                  <span>ENTERPRISE DDOS PROTECTION</span>
                  <span className="text-[#00D2FF]">✦</span>
                  <span>ONE-CLICK INSTANT ROLLBACKS</span>
                  <span className="text-[#00D2FF]">✦</span>
                  <span>CUSTOM DOMAINS &amp; AUTO DNS</span>
                  <span className="text-[#00D2FF]">✦</span>
                  <span>BROTLI SMART COMPRESSION</span>
                  <span className="text-[#00D2FF]">✦</span>
                  <span>24/7 HUMAN WHATSAPP SUPPORT</span>
                  <span className="text-[#00D2FF]">✦</span>
                </div>
              ))}
            </div>
          </div>

          {/* Belt 2: Crisp White with Deep Navy/Electric Blue text (Rotated -1.4deg) */}
          <div className="absolute -left-[5%] -right-[5%] top-4 overflow-hidden border-y-[3px] border-[#061138] bg-white -rotate-[1.4deg] py-3.5 shadow-xl">
            <div className="rotating-belt-main font-display text-xl sm:text-2xl font-black tracking-tight text-[#061138] uppercase whitespace-nowrap">
              {[1, 2, 3, 4].map((set) => (
                <div key={set} className="flex items-center gap-8 pr-8">
                  <span>STATIC SITES</span>
                  <span className="text-[#0047FF]">✦</span>
                  <span>NODE.JS</span>
                  <span className="text-[#0047FF]">✦</span>
                  <span>ASP.NET</span>
                  <span className="text-[#0047FF]">✦</span>
                  <span>SPRING BOOT</span>
                  <span className="text-[#0047FF]">✦</span>
                  <span>MONGODB</span>
                  <span className="text-[#0047FF]">✦</span>
                  <span>POSTGRESQL</span>
                  <span className="text-[#0047FF]">✦</span>
                  <span>MYSQL</span>
                  <span className="text-[#0047FF]">✦</span>
                  <span>MS SQL</span>
                  <span className="text-[#0047FF]">✦</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features Section — Engineered for Performance */}
        <section id="features" className="py-16 sm:py-24 lg:py-32 relative overflow-hidden">
          {/* dot grid + concentric circles matching HTML design */}
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,0.16) 1.3px, transparent 1.5px)",
              backgroundSize: "28px 28px",
              WebkitMaskImage: "linear-gradient(180deg, #000 0%, #000 40%, transparent 85%)",
              maskImage: "linear-gradient(180deg, #000 0%, #000 40%, transparent 85%)",
            }} />
          <svg aria-hidden="true" viewBox="0 0 900 900" className="pointer-events-none absolute right-[-330px] top-[-300px] w-[900px] h-[900px]"
            fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5">
            <circle cx="450" cy="450" r="440" />
            <circle cx="450" cy="450" r="340" />
            <circle cx="450" cy="450" r="240" />
            <circle cx="450" cy="450" r="140" />
          </svg>

          <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 relative z-10">

            {/* Section header — exact match */}
            <div className="flex justify-center mb-0">
              <span className="inline-flex items-center gap-2.5 px-[18px] py-2 rounded-full border border-white/40 bg-white/10 text-sm font-semibold text-white">
                <span className="w-[9px] h-[9px] rounded-full bg-[#22D3EE] animate-pulse shrink-0" aria-hidden="true" />
                Why HostMyService
              </span>
            </div>

            <h2 className="mt-[26px] text-center font-display font-black text-white leading-[1.12] tracking-[-0.04em]"
              style={{ fontSize: "clamp(36px, 6vw, 76px)" }}>
              Engineered for{" "}
              <span className="inline-block px-[0.16em] pb-[0.06em] rounded-[14px] bg-white text-[#1F3BFF] shadow-[6px_6px_0_#0B0D2B] -rotate-2">
                Performance
              </span>
            </h2>

            <p className="mt-[22px] mx-auto max-w-[560px] text-center text-base sm:text-[19px] leading-[1.6] text-[#D6DCFF]">
              We&apos;ve stripped away the bloat. What remains is pure speed and security.
            </p>

            {/* Cards layout — exact row structure from HTML */}
            <div className="flex flex-col gap-6 mt-12 sm:mt-16">

              {/* Row 1: Lightning Fast (wide) + Secure by Default */}
              <div className="flex flex-wrap gap-6">

                {/* Lightning Fast — white card, flex:2, with edge network SVG */}
                <article
                  className="flex-[2_1_600px] min-w-0 flex flex-wrap gap-6 p-6 sm:p-9 rounded-2xl sm:rounded-[28px] bg-white text-[#0B0D2B] transition-transform duration-200 hover:-translate-y-1"
                  style={{ boxShadow: "0 24px 60px rgba(3,8,50,0.45)" }}
                >
                  <div className="flex-[1_1_240px] min-w-0 flex flex-col">
                    <div aria-hidden="true" className="w-[52px] h-[52px] rounded-[14px] bg-[#0B0D2B] flex items-center justify-center shrink-0">
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M13 3L5 13.5h6L10 21l8-10.5h-6L13 3z" />
                      </svg>
                    </div>
                    <h3 className="mt-[22px] font-display font-bold text-2xl sm:text-[30px] tracking-[-0.025em] leading-[1.1] text-[#0B0D2B]">Lightning Fast</h3>
                    <p className="mt-3 text-[15px] sm:text-[16px] leading-[1.65] text-[#44497A]">
                      Deploy globally distributed static sites with low latency and high performance. Powered by our custom edge network.
                    </p>
                    <div className="flex flex-wrap gap-2.5 mt-auto pt-7">
                      <span className="inline-flex items-center px-3.5 py-[7px] rounded-full bg-[#E3E9FF] text-[#1B2BB0] text-xs sm:text-sm font-bold">Deploys in under 2s</span>
                      <span className="inline-flex items-center px-3.5 py-[7px] rounded-full bg-[#E3E9FF] text-[#1B2BB0] text-xs sm:text-sm font-bold">200+ edge locations</span>
                    </div>
                  </div>
                  {/* Edge network SVG diagram */}
                  <div aria-hidden="true" className="flex-[1_1_280px] min-w-0 flex items-center p-3 rounded-[20px] bg-[#EEF2FF]">
                    <svg viewBox="0 0 400 260" className="block w-full h-auto" fill="none">
                      <circle cx="200" cy="130" r="58" stroke="#C3CFFF" strokeWidth="1.5" strokeDasharray="3 6" />
                      <circle cx="200" cy="130" r="108" stroke="#C3CFFF" strokeWidth="1.5" strokeDasharray="3 6" />
                      <g stroke="#8EA3FF" strokeWidth="2" strokeLinecap="round">
                        <path d="M200 130 L54 62" /><path d="M200 130 L146 26" />
                        <path d="M200 130 L262 30" /><path d="M200 130 L352 74" />
                        <path d="M200 130 L46 176" /><path d="M200 130 L128 232" />
                        <path d="M200 130 L276 230" /><path d="M200 130 L356 190" />
                      </g>
                      <circle cx="54" cy="62" r="8" fill="#0B0D2B" />
                      <circle cx="146" cy="26" r="9" fill="#22D3EE" stroke="#0B0D2B" strokeWidth="2.5" className="animate-pulse" />
                      <circle cx="262" cy="30" r="8" fill="#0B0D2B" />
                      <circle cx="352" cy="74" r="8" fill="#0B0D2B" />
                      <circle cx="46" cy="176" r="8" fill="#0B0D2B" />
                      <circle cx="128" cy="232" r="8" fill="#0B0D2B" />
                      <circle cx="276" cy="230" r="9" fill="#22D3EE" stroke="#0B0D2B" strokeWidth="2.5" className="animate-pulse" />
                      <circle cx="356" cy="190" r="8" fill="#0B0D2B" />
                      <circle cx="200" cy="130" r="30" fill="#1F3BFF" fillOpacity="0.16" />
                      <circle cx="200" cy="130" r="19" fill="#1F3BFF" />
                      <path d="M203 120 L193 132 H200 L197 141 L207 128 H200 Z" fill="#FFFFFF" />
                    </svg>
                  </div>
                </article>

                {/* Secure by Default — dark card */}
                <article
                  className="flex-[1_1_340px] min-w-0 flex flex-col p-6 sm:p-9 rounded-2xl sm:rounded-[28px] border border-white/[0.16] bg-[#0B0D2B] text-white transition-transform duration-200 hover:-translate-y-1"
                  style={{ boxShadow: "0 24px 60px rgba(3,8,50,0.45)" }}
                >
                  <div aria-hidden="true" className="w-[52px] h-[52px] rounded-[14px] bg-[#22D3EE] flex items-center justify-center shrink-0">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0B0D2B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
                      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
                    </svg>
                  </div>
                  <h3 className="mt-[22px] font-display font-bold text-2xl sm:text-[30px] tracking-[-0.025em] leading-[1.1]">Secure by Default</h3>
                  <p className="mt-3 text-[15px] sm:text-[16px] leading-[1.65] text-[#C3CAF5]">
                    Automatic SSL certificates, DDoS protection, and isolated build environments for every deployment.
                  </p>
                  <div aria-hidden="true" className="flex flex-col gap-2.5 mt-auto pt-7">
                    {[
                      { label: "SSL certificate", value: "Active" },
                      { label: "DDoS protection", value: "On" },
                      { label: "Isolated builds", value: "Ready" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-white/[0.14] bg-white/[0.07] text-xs sm:text-sm font-semibold">
                        <span>{item.label}</span>
                        <span className="inline-flex items-center gap-[7px] text-[#22D3EE]">
                          <span className="w-[7px] h-[7px] rounded-full bg-[#22D3EE] shrink-0" />
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>

              </div>

              {/* Row 2: Custom Domains + Instant Rollbacks + Smart Compression */}
              <div className="flex flex-wrap gap-6">

                {/* Custom Domains — white card */}
                <article
                  className="flex-[1_1_300px] min-w-0 flex flex-col p-6 sm:p-8 rounded-2xl sm:rounded-[28px] bg-white text-[#0B0D2B] transition-transform duration-200 hover:-translate-y-1"
                  style={{ boxShadow: "0 24px 60px rgba(3,8,50,0.45)" }}
                >
                  <div aria-hidden="true" className="w-[52px] h-[52px] rounded-[14px] bg-[#0B0D2B] flex items-center justify-center shrink-0">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9.5" />
                      <path d="M2.5 12h19M12 2.5a14 14 0 0 1 0 19M12 2.5a14 14 0 0 0 0 19" />
                    </svg>
                  </div>
                  <h3 className="mt-[22px] font-display font-bold text-xl sm:text-[26px] tracking-[-0.025em] leading-[1.1] text-[#0B0D2B]">Custom Domains</h3>
                  <p className="mt-3 text-[15px] sm:text-[16px] leading-[1.65] text-[#44497A]">
                    Connect your own domain names easily with our automated DNS configuration and verification.
                  </p>
                  <div aria-hidden="true" className="mt-auto pt-7">
                    <div className="p-3.5 sm:p-4 rounded-[18px] bg-[#EEF2FF]">
                      <div className="flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl border-2 border-[#0B0D2B] bg-white">
                        <span className="font-mono text-xs sm:text-[13px] font-semibold text-[#0B0D2B] truncate">www.yourbrand.in</span>
                        <span className="inline-flex items-center gap-[5px] px-[9px] py-[3px] rounded-full bg-[#E3F7EA] text-[#0E7A3E] text-xs font-bold shrink-0">Verified</span>
                      </div>
                      <div className="flex flex-col gap-2 mt-3.5 text-xs sm:text-[13px] font-semibold text-[#2C3170]">
                        <span className="flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1F3BFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                          DNS configured automatically
                        </span>
                        <span className="flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1F3BFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                          Ownership verified
                        </span>
                      </div>
                    </div>
                  </div>
                </article>

                {/* Instant Rollbacks — white card */}
                <article
                  className="flex-[1_1_300px] min-w-0 flex flex-col p-6 sm:p-8 rounded-2xl sm:rounded-[28px] bg-white text-[#0B0D2B] transition-transform duration-200 hover:-translate-y-1"
                  style={{ boxShadow: "0 24px 60px rgba(3,8,50,0.45)" }}
                >
                  <div aria-hidden="true" className="w-[52px] h-[52px] rounded-[14px] bg-[#0B0D2B] flex items-center justify-center shrink-0">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 14L4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
                    </svg>
                  </div>
                  <h3 className="mt-[22px] font-display font-bold text-xl sm:text-[26px] tracking-[-0.025em] leading-[1.1] text-[#0B0D2B]">Instant Rollbacks</h3>
                  <p className="mt-3 text-[15px] sm:text-[16px] leading-[1.65] text-[#44497A]">
                    Every deploy is immutable. Roll back to any previous version in a single click.
                  </p>
                  <div aria-hidden="true" className="mt-auto pt-7">
                    <div className="flex flex-col gap-2 p-3.5 sm:p-4 rounded-[18px] bg-[#EEF2FF]">
                      <div className="flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl border-2 border-[#0B0D2B] bg-white text-xs sm:text-[13px] font-bold">
                        <span className="inline-flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#17A34A] shrink-0" />
                          Deploy #3
                        </span>
                        <span className="px-[9px] py-[3px] rounded-full bg-[#E3F7EA] text-[#0E7A3E] text-xs">Live</span>
                      </div>
                      <div className="flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl border border-[#C3CFFF] bg-white text-xs sm:text-[13px] font-semibold text-[#2C3170]">
                        <span className="inline-flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full border-2 border-[#8EA3FF] shrink-0" />
                          Deploy #2
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-[#1F3BFF] text-white text-xs font-bold">Roll back</span>
                      </div>
                      <div className="flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl border border-[#C3CFFF] bg-white text-xs sm:text-[13px] font-semibold text-[#2C3170]">
                        <span className="inline-flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full border-2 border-[#8EA3FF] shrink-0" />
                          Deploy #1
                        </span>
                        <span className="text-xs text-[#5B6190]">Immutable</span>
                      </div>
                    </div>
                  </div>
                </article>

                {/* Smart Compression — white card */}
                <article
                  className="flex-[1_1_300px] min-w-0 flex flex-col p-6 sm:p-8 rounded-2xl sm:rounded-[28px] bg-white text-[#0B0D2B] transition-transform duration-200 hover:-translate-y-1"
                  style={{ boxShadow: "0 24px 60px rgba(3,8,50,0.45)" }}
                >
                  <div aria-hidden="true" className="w-[52px] h-[52px] rounded-[14px] bg-[#0B0D2B] flex items-center justify-center shrink-0">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4l6 6" /><path d="M10 5v5H5" />
                      <path d="M20 20l-6-6" /><path d="M14 19v-5h5" />
                    </svg>
                  </div>
                  <h3 className="mt-[22px] font-display font-bold text-xl sm:text-[26px] tracking-[-0.025em] leading-[1.1] text-[#0B0D2B]">Smart Compression</h3>
                  <p className="mt-3 text-[15px] sm:text-[16px] leading-[1.65] text-[#44497A]">
                    Assets are automatically optimized and compressed with Brotli/Gzip for maximum speed.
                  </p>
                  <div aria-hidden="true" className="mt-auto pt-7">
                    <div className="p-3.5 sm:p-4 rounded-[18px] bg-[#EEF2FF]">
                      <div className="text-[12px] font-bold tracking-[0.04em] uppercase text-[#5B6190]">Original</div>
                      <div className="h-4 mt-2 rounded-lg bg-[#B7C3F5]" />
                      <div className="mt-4 text-[12px] font-bold tracking-[0.04em] uppercase text-[#1B2BB0]">Brotli / Gzip</div>
                      <div className="h-4 mt-2 rounded-lg bg-[#1F3BFF]" style={{ width: "38%" }} />
                      <div className="mt-4 text-xs sm:text-[13px] font-semibold text-[#2C3170]">Smaller files, faster pages</div>
                    </div>
                  </div>
                </article>

              </div>

              {/* Row 3: Enterprise Grade — full-width cyan card */}
              <article
                className="flex flex-wrap items-center gap-6 sm:gap-7 px-6 py-7 sm:px-10 sm:py-9 rounded-2xl sm:rounded-[28px] bg-[#22D3EE] text-[#0B0D2B] transition-transform duration-200 hover:-translate-y-1"
                style={{ boxShadow: "0 24px 60px rgba(3,8,50,0.45)" }}
              >
                <div className="flex-[1_1_340px] min-w-0 flex items-start gap-4 sm:gap-5">
                  <div aria-hidden="true" className="w-[52px] h-[52px] shrink-0 rounded-[14px] bg-[#0B0D2B] flex items-center justify-center">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6L12 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-2xl sm:text-[30px] tracking-[-0.025em] leading-[1.1] text-[#0B0D2B]">Enterprise Grade</h3>
                    <p className="mt-2 text-[15px] sm:text-[16px] leading-[1.65] text-[#0B0D2B]">
                      99.9% uptime SLA, 24/7 support, and dedicated infrastructure options available.
                    </p>
                  </div>
                </div>
                <div className="flex-[1_1_480px] min-w-0 grid grid-cols-3 gap-3 sm:flex sm:flex-wrap">
                  <div className="sm:flex-[1_1_140px] pl-3 sm:pl-6 border-l-2 border-[#0B0D2B]/30">
                    <div className="font-display font-black text-2xl sm:text-[42px] tracking-[-0.03em] leading-none text-[#0B0D2B]">99.9%</div>
                    <div className="mt-1 text-xs sm:text-sm font-bold text-[#0B0D2B]">Uptime SLA</div>
                  </div>
                  <div className="sm:flex-[1_1_140px] pl-3 sm:pl-6 border-l-2 border-[#0B0D2B]/30">
                    <div className="font-display font-black text-2xl sm:text-[42px] tracking-[-0.03em] leading-none text-[#0B0D2B]">24/7</div>
                    <div className="mt-1 text-xs sm:text-sm font-bold text-[#0B0D2B]">Support</div>
                  </div>
                  <div className="sm:flex-[1_1_170px] pl-3 sm:pl-6 border-l-2 border-[#0B0D2B]/30">
                    <div className="font-display font-black text-2xl sm:text-[42px] tracking-[-0.03em] leading-none text-[#0B0D2B]">Dedicated</div>
                    <div className="mt-1 text-xs sm:text-sm font-bold text-[#0B0D2B]">Infrastructure</div>
                  </div>
                </div>
              </article>

            </div>

            {/* Bottom CTA — exact match */}
            <div className="flex justify-center mt-10 sm:mt-[52px]">
              <Link
                href="#pricing"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 min-h-[52px] sm:min-h-[56px] px-6 sm:px-[30px] rounded-[14px] border-2 border-[#0B0D2B] bg-white text-[#0B0D2B] text-base sm:text-[17px] font-bold transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5"
                style={{ boxShadow: "5px 5px 0 #0B0D2B" }}
              >
                Compare plans
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

          </div>
        </section>

        {/* Pricing Section */}
        <PricingSection plans={plans.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description ?? null,
          price: p.price,
          features: p.features ?? [],
        }))} />

      </main>

      <SiteFooter />
    </div>
  );
}


