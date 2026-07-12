"use client";

import { useState } from "react";
import type { MonthlyRevenue } from "@/app/actions/admin/revenue";

interface Props {
  monthlyData: MonthlyRevenue[];
}

const CHART_H = 200;
const PADDING = { top: 16, right: 12, bottom: 40, left: 56 };

function RevenueBarChart({ data }: { data: MonthlyRevenue[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const innerW = 100; // SVG viewBox width units per slot (percentage-like)
  const totalW = data.length * innerW;
  const svgW = totalW + PADDING.left + PADDING.right;
  const svgH = CHART_H + PADDING.top + PADDING.bottom;
  const chartH = CHART_H;

  // Y gridlines (4 lines)
  const gridLines = [0.25, 0.5, 0.75, 1].map((f) => ({
    y: PADDING.top + chartH - f * chartH,
    value: Math.round(maxRevenue * f),
  }));

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="w-full min-w-[600px]"
        style={{ height: svgH }}
      >
        {/* Grid lines */}
        {gridLines.map((g) => (
          <g key={g.y}>
            <line
              x1={PADDING.left}
              x2={svgW - PADDING.right}
              y1={g.y}
              y2={g.y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
            <text
              x={PADDING.left - 8}
              y={g.y + 4}
              textAnchor="end"
              className="fill-gray-500"
              style={{ fontSize: 10 }}
            >
              ₹{g.value >= 1000 ? `${(g.value / 1000).toFixed(0)}k` : g.value}
            </text>
          </g>
        ))}

        {/* Zero line */}
        <line
          x1={PADDING.left}
          x2={svgW - PADDING.right}
          y1={PADDING.top + chartH}
          y2={PADDING.top + chartH}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />

        {data.map((d, i) => {
          const barW = 48;
          const slotCx = PADDING.left + i * innerW + innerW / 2;
          const barH = Math.max(2, (d.revenue / maxRevenue) * chartH);
          const barX = slotCx - barW / 2;
          const barY = PADDING.top + chartH - barH;
          const isHov = hovered === i;

          return (
            <g
              key={d.month}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Hover highlight */}
              {isHov && (
                <rect
                  x={PADDING.left + i * innerW}
                  y={PADDING.top}
                  width={innerW}
                  height={chartH}
                  fill="rgba(255,255,255,0.03)"
                  rx={4}
                />
              )}

              {/* Bar with gradient */}
              <defs>
                <linearGradient id={`bar-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isHov ? "#ffffff" : "#00f0ff"} stopOpacity="0.9" />
                  <stop offset="100%" stopColor={isHov ? "#00f0ff" : "#7000ff"} stopOpacity="0.6" />
                </linearGradient>
              </defs>
              <rect
                x={barX}
                y={barY}
                width={barW}
                height={barH}
                fill={`url(#bar-grad-${i})`}
                rx={6}
              />

              {/* X label */}
              <text
                x={slotCx}
                y={PADDING.top + chartH + 20}
                textAnchor="middle"
                className="fill-gray-400"
                style={{ fontSize: 10 }}
              >
                {d.month.split(" ")[0]}
              </text>
              <text
                x={slotCx}
                y={PADDING.top + chartH + 32}
                textAnchor="middle"
                className="fill-gray-600"
                style={{ fontSize: 9 }}
              >
                {d.month.split(" ")[1]}
              </text>

              {/* Tooltip */}
              {isHov && (
                <g>
                  <rect
                    x={slotCx - 44}
                    y={barY - 44}
                    width={88}
                    height={38}
                    rx={6}
                    fill="#0d0d0d"
                    stroke="rgba(0,240,255,0.3)"
                    strokeWidth="1"
                  />
                  <text
                    x={slotCx}
                    y={barY - 26}
                    textAnchor="middle"
                    fill="#00f0ff"
                    style={{ fontSize: 11, fontWeight: "bold" }}
                  >
                    ₹{d.revenue.toLocaleString("en-IN")}
                  </text>
                  <text
                    x={slotCx}
                    y={barY - 12}
                    textAnchor="middle"
                    fill="#9ca3af"
                    style={{ fontSize: 9 }}
                  >
                    {d.month}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function SubscriptionLineChart({ data }: { data: MonthlyRevenue[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const maxSubs = Math.max(...data.map((d) => d.subscriptions), 1);
  const innerW = 100;
  const totalW = data.length * innerW;
  const svgW = totalW + PADDING.left + PADDING.right;
  const svgH = CHART_H + PADDING.top + PADDING.bottom;
  const chartH = CHART_H;

  const getX = (i: number) => PADDING.left + i * innerW + innerW / 2;
  const getY = (val: number) =>
    PADDING.top + chartH - Math.max(0, (val / maxSubs) * chartH);

  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(d.subscriptions)}`)
    .join(" ");

  const areaPath =
    linePath +
    ` L ${getX(data.length - 1)} ${PADDING.top + chartH}` +
    ` L ${getX(0)} ${PADDING.top + chartH} Z`;

  const gridLines = [0.25, 0.5, 0.75, 1].map((f) => ({
    y: PADDING.top + chartH - f * chartH,
    value: Math.round(maxSubs * f),
  }));

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="w-full min-w-[600px]"
        style={{ height: svgH }}
      >
        <defs>
          <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridLines.map((g) => (
          <g key={g.y}>
            <line
              x1={PADDING.left}
              x2={svgW - PADDING.right}
              y1={g.y}
              y2={g.y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
            <text
              x={PADDING.left - 8}
              y={g.y + 4}
              textAnchor="end"
              className="fill-gray-500"
              style={{ fontSize: 10 }}
            >
              {g.value}
            </text>
          </g>
        ))}

        {/* Zero line */}
        <line
          x1={PADDING.left}
          x2={svgW - PADDING.right}
          y1={PADDING.top + chartH}
          y2={PADDING.top + chartH}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />

        {/* Area fill */}
        <path d={areaPath} fill="url(#area-grad)" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#00f0ff"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Points + labels */}
        {data.map((d, i) => {
          const cx = getX(i);
          const cy = getY(d.subscriptions);
          const isHov = hovered === i;

          return (
            <g
              key={d.month}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            >
              {isHov && (
                <circle cx={cx} cy={cy} r={8} fill="rgba(0,240,255,0.15)" />
              )}
              <circle
                cx={cx}
                cy={cy}
                r={isHov ? 5 : 3.5}
                fill={isHov ? "#ffffff" : "#00f0ff"}
                stroke="#0d0d0d"
                strokeWidth="2"
              />

              {/* X labels */}
              <text
                x={cx}
                y={PADDING.top + chartH + 20}
                textAnchor="middle"
                className="fill-gray-400"
                style={{ fontSize: 10 }}
              >
                {d.month.split(" ")[0]}
              </text>
              <text
                x={cx}
                y={PADDING.top + chartH + 32}
                textAnchor="middle"
                className="fill-gray-600"
                style={{ fontSize: 9 }}
              >
                {d.month.split(" ")[1]}
              </text>

              {/* Tooltip */}
              {isHov && (
                <g>
                  <rect
                    x={cx - 44}
                    y={cy - 48}
                    width={88}
                    height={38}
                    rx={6}
                    fill="#0d0d0d"
                    stroke="rgba(0,240,255,0.3)"
                    strokeWidth="1"
                  />
                  <text
                    x={cx}
                    y={cy - 30}
                    textAnchor="middle"
                    fill="#00f0ff"
                    style={{ fontSize: 11, fontWeight: "bold" }}
                  >
                    {d.subscriptions} active
                  </text>
                  <text
                    x={cx}
                    y={cy - 16}
                    textAnchor="middle"
                    fill="#9ca3af"
                    style={{ fontSize: 9 }}
                  >
                    {d.month}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function RevenueCharts({ monthlyData }: Props) {
  const [activeTab, setActiveTab] = useState<"revenue" | "subscriptions">("revenue");

  return (
    <div className="glass ring-1 ring-white/10 rounded-2xl overflow-hidden">
      {/* Tab header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <h2 className="text-base font-semibold text-white">Monthly Breakdown</h2>
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("revenue")}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === "revenue"
                ? "bg-primary text-black shadow"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Revenue
          </button>
          <button
            onClick={() => setActiveTab("subscriptions")}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === "subscriptions"
                ? "bg-primary text-black shadow"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Subscriptions
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === "revenue" ? (
          <RevenueBarChart data={monthlyData} />
        ) : (
          <SubscriptionLineChart data={monthlyData} />
        )}

        {/* Legend */}
        <div className="mt-4 flex items-center gap-6 text-xs text-gray-400">
          {activeTab === "revenue" ? (
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-gradient-to-b from-primary to-purple-500 inline-block" />
              Monthly Revenue (₹)
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-4 rounded-full bg-primary inline-block" />
              Active Subscriptions — updates when you change status in Subscriptions page
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
