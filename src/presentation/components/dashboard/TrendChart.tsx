"use client";

import React, { useId, useState } from "react";
import { HourlyAQIPoint } from "@/domain/aqi/types";
import { Table, LineChart as ChartIcon } from "lucide-react";

interface TrendChartProps {
  points: HourlyAQIPoint[];
  title: string;
  description: string;
}

export function TrendChart({ points, title, description }: TrendChartProps) {
  const [showTable, setShowTable] = useState(false);
  const [activePoint, setActivePoint] = useState<HourlyAQIPoint | null>(null);
  const chartId = useId();

  if (!points || points.length === 0) {
    return (
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-slate-500 dark:text-slate-300 text-sm">
        No trend data currently available for this location.
      </div>
    );
  }

  // Calculate SVG bounds
  const maxAQI = Math.max(100, Math.min(500, Math.max(...points.map((p) => p.aqi)) * 1.15));
  const svgWidth = 800;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 30;

  const innerWidth = svgWidth - paddingX * 2;
  const innerHeight = svgHeight - paddingY * 2;

  const pointsCount = points.length;
  const stepX = innerWidth / (pointsCount - 1 || 1);

  const getCoordinates = (p: HourlyAQIPoint, i: number) => {
    const x = paddingX + i * stepX;
    const y = paddingY + innerHeight - (Math.min(p.aqi, maxAQI) / maxAQI) * innerHeight;
    return { x, y };
  };

  const linePath = points.reduce((acc, point, index) => {
    const { x, y } = getCoordinates(point, index);
    return index === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, "");

  const areaPath = `${linePath} L ${paddingX + (pointsCount - 1) * stepX} ${paddingY + innerHeight} L ${paddingX} ${paddingY + innerHeight} Z`;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">{description}</p>
        </div>

        {/* View Toggle */}
        <button
          onClick={() => setShowTable(!showTable)}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {showTable ? (
            <>
              <ChartIcon className="w-3.5 h-3.5 text-brand-500" />
              <span>Chart View</span>
            </>
          ) : (
            <>
              <Table className="w-3.5 h-3.5 text-brand-500" />
              <span>Data Table View</span>
            </>
          )}
        </button>
      </div>

      {showTable ? (
        /* Accessible HTML Table View */
        <div role="region" aria-label={`${title} data table`} tabIndex={0} className="overflow-x-auto max-h-72 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500">
          <table className="w-full text-left text-xs" aria-label={title}>
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold sticky top-0">
              <tr>
                <th scope="col" className="px-4 py-2.5">Time</th>
                <th scope="col" className="px-4 py-2.5">AQI</th>
                <th scope="col" className="px-4 py-2.5">Category</th>
                <th scope="col" className="px-4 py-2.5">PM2.5 (µg/m³)</th>
                {points[0]?.pm10 !== undefined && (
                  <th scope="col" className="px-4 py-2.5">PM10 (µg/m³)</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {points.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-2 font-sans text-slate-600 dark:text-slate-300">
                    {new Date(p.timestamp).toLocaleTimeString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-2 font-bold text-slate-900 dark:text-white">{p.aqi}</td>
                  <td className="px-4 py-2 font-sans font-medium">{p.category}</td>
                  <td className="px-4 py-2">{p.pm25}</td>
                  {p.pm10 !== undefined && <td className="px-4 py-2">{p.pm10}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Visual Interactive SVG Chart */
        <div className="relative">
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-48 sm:h-56 overflow-visible select-none"
              role="img"
              aria-labelledby={`${chartId}-title`}
              aria-describedby={`${chartId}-description`}
            >
              <title id={`${chartId}-title`}>{title}</title>
              <desc id={`${chartId}-description`}>{description} The plotted AQI values range from {Math.min(...points.map((p) => p.aqi))} to {Math.max(...points.map((p) => p.aqi))}. Use the data table view for every timestamp, AQI category, and pollutant value.</desc>
              <defs>
                <linearGradient id={`${chartId}-gradient`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 100, 200, 300, 400].map((level) => {
                const y = paddingY + innerHeight - (level / maxAQI) * innerHeight;
                if (y < paddingY || y > paddingY + innerHeight) return null;
                return (
                  <g key={level}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={svgWidth - paddingX}
                      y2={y}
                      className="stroke-slate-200 dark:stroke-slate-800"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      className="fill-slate-400 dark:fill-slate-300 text-[10px] text-right font-mono"
                      textAnchor="end"
                    >
                      {level}
                    </text>
                  </g>
                );
              })}

              {/* Area & Line */}
              <path d={areaPath} fill={`url(#${chartId}-gradient)`} />
              <path
                d={linePath}
                fill="none"
                className="stroke-brand-600 dark:stroke-brand-400"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive Data Dots */}
              {points.map((p, idx) => {
                const { x, y } = getCoordinates(p, idx);
                const isHovered = activePoint?.timestamp === p.timestamp;
                return (
                  <g key={idx}>
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 5 : 3}
                      className="fill-brand-600 dark:fill-brand-400 stroke-white dark:stroke-slate-900 transition-all cursor-pointer"
                      strokeWidth={isHovered ? 2 : 1}
                      onMouseEnter={() => setActivePoint(p)}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Active Hover / Focus Tooltip */}
          {activePoint && (
            <div className="mt-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-100">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {new Date(activePoint.timestamp).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-900 dark:text-white">
                  AQI: {activePoint.aqi} ({activePoint.category})
                </span>
                <span className="text-slate-600 dark:text-slate-300">
                  PM2.5: {activePoint.pm25} µg/m³
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
