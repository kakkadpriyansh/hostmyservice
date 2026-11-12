"use client";

import Link from "next/link";
import { useState } from "react";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number; // yearly price in rupees
  features: string[];
}

interface PricingSectionProps {
  plans: Plan[];
}

export function PricingSection({ plans }: PricingSectionProps) {
  // Default to middle plan if 3 plans, otherwise first
  const defaultIdx = plans.length > 1 ? Math.floor(plans.length / 2) : 0;
  const [activeIdx, setActiveIdx] = useState(defaultIdx);

  if (plans.length === 0) return null;

  const active = plans[activeIdx];
  const planNum = activeIdx + 1;
  const totalPlans = plans.length;
  const monthlyPrice = Math.round(active.price / 12);
  const dailyPrice = (active.price / 365).toFixed(2);

  const isPro = plans.length > 1 && activeIdx === Math.floor(plans.length / 2);

  const features = active.features ?? [];

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-title"
      className="relative overflow-hidden"
    >
      {/* dot grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.16) 1.3px, transparent 1.5px)",
          backgroundSize: "28px 28px",
          WebkitMaskImage:
            "linear-gradient(180deg, #000 0%, #000 40%, transparent 85%)",
          maskImage:
            "linear-gradient(180deg, #000 0%, #000 40%, transparent 85%)",
        }}
      />
      {/* concentric rings */}
      <svg
        aria-hidden="true"
        viewBox="0 0 900 900"
        className="pointer-events-none absolute right-[-330px] top-[-300px] w-[900px] h-[900px]"
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1.5"
      >
        <circle cx="450" cy="450" r="440" />
        <circle cx="450" cy="450" r="340" />
        <circle cx="450" cy="450" r="240" />
        <circle cx="450" cy="450" r="140" />
      </svg>
      {/* cyan glow */}
      <div
        aria-hidden="true"
        className="absolute right-[4%] pointer-events-none rounded-full"
        style={{
          top: "300px",
          width: "560px",
          height: "560px",
          background: "#22D3EE",
          opacity: 0.18,
          filter: "blur(130px)",
        }}
      />

      <div
        className="relative z-10 mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28"
      >
        {/* Two-column layout */}
        <div className="flex flex-wrap items-center gap-x-[72px] gap-y-12 sm:gap-y-16">

          {/* ── LEFT: heading + plan picker ── */}
          <div className="flex-[1_1_440px] min-w-0 w-full">
            <span className="inline-flex items-center gap-2.5 px-[18px] py-2 rounded-full border-[1.5px] border-white/40 bg-white/10 text-sm font-semibold text-white">
              <span className="w-[9px] h-[9px] rounded-full bg-[#22D3EE] animate-pulse shrink-0" aria-hidden="true" />
              Pricing
            </span>

            <h2
              id="pricing-title"
              className="mt-6 font-display font-black text-white leading-[1.08] tracking-[-0.04em]"
              style={{ fontSize: "clamp(36px, 5.6vw, 72px)" }}
            >
              <span className="block">Transparent</span>
              <span
                className="inline-block mt-2 px-[0.16em] pb-[0.06em] rounded-[14px] bg-[#22D3EE] text-[#0B0D2B]"
                style={{ boxShadow: "6px 6px 0 #0B0D2B", transform: "rotate(-2deg)" }}
              >
                Pricing
              </span>
            </h2>

            <p className="mt-4 sm:mt-6 max-w-[460px] text-base sm:text-[19px] leading-[1.6] text-[#D6DCFF]">
              Start small, scale infinitely. No hidden costs.
            </p>

            {/* Plan picker buttons */}
            <div
              className="flex flex-col gap-3 sm:gap-3.5 mt-7 sm:mt-9"
              role="group"
              aria-label="Choose a plan"
            >
              {plans.map((plan, idx) => {
                const selected = idx === activeIdx;
                const mPrice = Math.round(plan.price / 12);
                return (
                  <button
                    key={plan.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setActiveIdx(idx)}
                    className="flex items-center gap-3 sm:gap-[18px] w-full min-h-[76px] sm:min-h-[92px] px-3.5 sm:px-6 py-3.5 sm:py-5 rounded-2xl sm:rounded-[20px] text-left transition-transform duration-150 hover:translate-x-1 sm:hover:translate-x-[5px]"
                    style={
                      selected
                        ? {
                            border: "2px solid #FFFFFF",
                            background: "#FFFFFF",
                            color: "#0B0D2B",
                            boxShadow: "5px 5px 0 #22D3EE",
                          }
                        : {
                            border: "2px solid rgba(255,255,255,0.24)",
                            background: "rgba(255,255,255,0.08)",
                            color: "#FFFFFF",
                          }
                    }
                  >
                    {/* Radio ring */}
                    <span
                      aria-hidden="true"
                      className="w-5 h-5 sm:w-[26px] sm:h-[26px] shrink-0 rounded-full flex items-center justify-center"
                      style={{
                        border: selected
                          ? "2px solid #0B0D2B"
                          : "2px solid rgba(255,255,255,0.6)",
                      }}
                    >
                      <span
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full"
                        style={{ background: selected ? "#0B0D2B" : "transparent" }}
                      />
                    </span>

                    {/* Name + desc */}
                    <span className="flex-1 min-w-0">
                      <span
                        className="block font-display font-bold text-lg sm:text-[24px] leading-[1.15] tracking-[-0.02em]"
                      >
                        {plan.name}
                      </span>
                      <span
                        className="block mt-0.5 sm:mt-1 text-xs sm:text-sm leading-[1.45] line-clamp-1 sm:line-clamp-none"
                        style={{ color: selected ? "#44497A" : "#D2D8FF" }}
                      >
                        {plan.description || ""}
                      </span>
                    </span>

                    {/* Price */}
                    <span className="flex items-baseline gap-1 shrink-0">
                      <b
                        className="font-display font-black text-xl sm:text-[34px] leading-none tracking-[-0.03em]"
                      >
                        ₹{mPrice}
                      </b>
                      <em
                        className="not-italic text-xs sm:text-sm font-semibold"
                        style={{ color: selected ? "#44497A" : "#D2D8FF" }}
                      >
                        /mo
                      </em>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Trust checkmarks */}
            <div className="flex flex-wrap gap-x-5 sm:gap-x-7 gap-y-2 sm:gap-y-3 mt-7 sm:mt-8 text-xs sm:text-[15px] font-semibold text-white">
              {["Free SSL on every plan", "DDoS protection on every plan"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                  {item}
                </span>
              ))}
            </div>

            <p className="mt-4 sm:mt-[18px] text-sm sm:text-[16px] text-[#E3E7FF]">
              Not sure which plan fits?{" "}
              <a
                href="https://wa.me/918401661887"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white font-bold underline underline-offset-4 decoration-white/50 hover:decoration-white transition-all"
              >
                Chat with us on WhatsApp
              </a>
            </p>
          </div>

          {/* ── RIGHT: ticket card ── */}
          <div className="flex-[1_1_420px] sm:flex-[1_1_500px] min-w-0 relative py-4 sm:py-7 w-full max-w-full">
            {/* Ghost cards behind */}
            <div
              aria-hidden="true"
              className="hidden sm:block absolute rounded-[30px] pointer-events-none"
              style={{
                left: "7%", right: "-2%", top: "14px", bottom: "6px",
                border: "1px solid rgba(255,255,255,0.16)",
                background: "rgba(255,255,255,0.07)",
                transform: "rotate(3deg)",
              }}
            />
            <div
              aria-hidden="true"
              className="hidden sm:block absolute rounded-[30px] pointer-events-none"
              style={{
                left: "-2%", right: "7%", top: "40px", bottom: "30px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.05)",
                transform: "rotate(-3deg)",
              }}
            />

            {/* Big watermark number */}
            <div
              aria-hidden="true"
              className="absolute font-display font-black leading-none tracking-[-0.06em] pointer-events-none select-none right-2 sm:right-4 -top-8 sm:-top-[92px] text-[130px] sm:text-[260px] opacity-70"
              style={{
                color: "transparent",
                WebkitTextStroke: "2px rgba(255,255,255,0.16)",
              }}
            >
              0{planNum}
            </div>

            {/* Ticket card */}
            <article
              className="relative overflow-hidden rounded-2xl sm:rounded-[28px] p-5 sm:p-10"
              style={{
                border: "1.5px solid rgba(255,255,255,0.22)",
                background: "#0B0D2B",
                boxShadow: "0 40px 100px rgba(3,8,50,0.7)",
              }}
              aria-live="polite"
            >
              {/* Cyan glow inside card */}
              <div
                aria-hidden="true"
                className="absolute rounded-full pointer-events-none"
                style={{
                  right: "-100px", top: "-100px",
                  width: "300px", height: "300px",
                  background: "#22D3EE",
                  opacity: 0.26,
                  filter: "blur(80px)",
                }}
              />

              {/* Card content — all relative so it sits above the glow */}
              <div className="relative">
                {/* Top row: plan tag + Most Popular badge */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span
                    className="font-mono text-xs sm:text-[13px] font-semibold tracking-[0.12em] uppercase text-[#22D3EE]"
                    style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
                  >
                    Plan 0{planNum} / 0{totalPlans}
                  </span>
                  {isPro && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-[7px] rounded-full bg-[#22D3EE] text-[#0B0D2B] text-xs sm:text-[13px] font-black tracking-[0.02em]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#0B0D2B" aria-hidden="true">
                        <path d="M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.5l-6 3.4 1.3-6.7-5-4.7 6.8-.8L12 2.5z" />
                      </svg>
                      Most Popular
                    </span>
                  )}
                </div>

                {/* Plan name */}
                <h3
                  className="mt-4 sm:mt-[22px] font-display font-black text-white leading-[1.05] tracking-[-0.035em] text-3xl sm:text-[46px]"
                >
                  {active.name}
                </h3>
                <p className="mt-2 text-sm sm:text-[17px] leading-[1.55] text-[#C3CAF5]">
                  {active.description}
                </p>

                {/* Price */}
                <div className="flex items-start gap-1 sm:gap-2 mt-5 sm:mt-7 leading-none">
                  <span
                    className="mt-2 sm:mt-[14px] font-display font-bold text-2xl sm:text-[38px] text-white"
                  >
                    ₹
                  </span>
                  <span
                    className="font-display font-black text-white tracking-[-0.05em] text-6xl sm:text-7xl lg:text-[104px]"
                    style={{ lineHeight: 1 }}
                  >
                    {monthlyPrice}
                  </span>
                  <span className="self-end mb-2 sm:mb-[14px] text-base sm:text-[19px] font-semibold text-[#AEB6EC]">
                    /month
                  </span>
                </div>

                {/* Chips */}
                <div className="flex flex-wrap gap-2 sm:gap-2.5 mt-4 sm:mt-[18px]">
                  <span className="inline-flex items-center px-3 sm:px-[15px] py-1 sm:py-[7px] rounded-full bg-white/[0.12] text-xs sm:text-sm font-bold text-white">
                    Billed ₹{active.price} yearly
                  </span>
                  <span
                    className="inline-flex items-center px-3 sm:px-[15px] py-1 sm:py-[7px] rounded-full text-xs sm:text-sm font-bold text-[#22D3EE]"
                    style={{ border: "1.5px dashed #22D3EE" }}
                  >
                    ≈ ₹{dailyPrice} a day
                  </span>
                </div>

                {/* Dashed divider */}
                <div
                  className="my-6 sm:my-8"
                  style={{ borderTop: "2px dashed rgba(255,255,255,0.24)" }}
                  aria-hidden="true"
                />

                {/* Features */}
                <div className="text-xs font-bold tracking-[0.08em] uppercase text-[#AEB6EC]">
                  What&apos;s included
                </div>
                <ul className="flex flex-col gap-3 sm:gap-3.5 mt-3.5 sm:mt-4 text-sm sm:text-[17px] font-medium text-white list-none p-0">
                  {features.map((feature) => {
                    const isExtra = feature === "Priority Support";
                    return (
                      <li
                        key={feature}
                        className={`flex items-center gap-2.5 sm:gap-3 ${isExtra ? "font-bold text-[#22D3EE]" : ""}`}
                      >
                        <span
                          aria-hidden="true"
                          className="w-5 h-5 sm:w-[26px] sm:h-[26px] shrink-0 rounded-full bg-[#22D3EE] flex items-center justify-center"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0B0D2B" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12.5l4.5 4.5L19 7.5" />
                          </svg>
                        </span>
                        {feature}
                      </li>
                    );
                  })}
                </ul>

                {/* CTA */}
                <Link
                  href="/register"
                  className="flex items-center justify-center gap-2.5 min-h-[50px] sm:min-h-[58px] mt-7 sm:mt-9 rounded-xl sm:rounded-[14px] bg-[#22D3EE] text-[#0B0D2B] text-base sm:text-[18px] font-bold transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5"
                  style={{ boxShadow: "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "6px 6px 0 #FFFFFF")}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                >
                  Get started
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              </div>
            </article>
          </div>

        </div>
      </div>
    </section>
  );
}
