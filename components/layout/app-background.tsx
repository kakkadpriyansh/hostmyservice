import React from "react";

export function AppBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
    >
      {/* Deep Royal & Electric Blue mesh gradient matching landing page */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #061138 0%, #082068 40%, #0047FF 75%, #051445 100%)",
        }}
      />

      {/* Ambient cyan cloud glow */}
      <div
        className="absolute top-20 right-[5%] w-[650px] h-[650px] rounded-full blur-[140px] opacity-25 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(0, 210, 255, 0.45) 0%, rgba(0, 102, 255, 0.25) 50%, transparent 75%)",
        }}
      />
      <div
        className="absolute top-40 -left-20 w-[550px] h-[550px] rounded-full blur-[130px] opacity-20 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(0, 110, 255, 0.45) 0%, transparent 70%)",
        }}
      />

      {/* Dot grid matrix */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255, 255, 255, 0.25) 1.5px, transparent 1.6px)",
          backgroundSize: "28px 28px",
          WebkitMaskImage:
            "linear-gradient(180deg, #000 0%, #000 60%, transparent 95%)",
          maskImage:
            "linear-gradient(180deg, #000 0%, #000 60%, transparent 95%)",
        }}
      />

      {/* Decorative concentric rings top-right */}
      <svg
        aria-hidden="true"
        viewBox="0 0 900 900"
        className="pointer-events-none absolute right-[-280px] top-[-260px] w-[900px] h-[900px]"
        fill="none"
        stroke="rgba(255, 255, 255, 0.10)"
        strokeWidth="1.5"
      >
        <circle cx="450" cy="450" r="440" />
        <circle cx="450" cy="450" r="340" />
        <circle cx="450" cy="450" r="240" />
        <circle cx="450" cy="450" r="140" />
      </svg>
    </div>
  );
}
