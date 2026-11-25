"use client";

import React from "react";
import { useAQI } from "@/presentation/context/AQIContext";
import { useLocation } from "@/presentation/context/LocationContext";
import { AQIBadge, getAQIColorClasses } from "@/presentation/components/common/AQIBadge";
import { TrendChart } from "./TrendChart";
import {
  Wind,
  Thermometer,
  Droplets,
  Gauge,
  Compass,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  Info,
} from "lucide-react";

export function LiveAQIView() {
  const { location, standard } = useLocation();
  const { data, weather, forecast, isLoading, error, refreshAQI } = useAQI();

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          <span role="status" aria-live="polite">Fetching live air quality observations for {location.name}...</span>
        </p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div role="alert" className="p-8 rounded-2xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto" />
        <h2 className="text-lg font-bold text-rose-900 dark:text-rose-200">
          Air Quality Service Interruption
        </h2>
        <p className="text-sm text-rose-700 dark:text-rose-300 max-w-md mx-auto">{error}</p>
        <button
          onClick={refreshAQI}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const aqiColors = getAQIColorClasses(data.category);

  return (
    <div className="space-y-6">
      {/* Station Metadata & Source Verification Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-brand-500 shrink-0" />
          <span>
            <strong>Monitoring Station:</strong>{" "}
            {data.station?.name || "Copernicus Atmospheric Transport Grid"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-semibold text-[11px] bg-brand-100 dark:bg-brand-900/60 text-brand-800 dark:text-brand-300">
            <Layers className="w-3 h-3" />
            {data.sourceType === "STATION_OBSERVATION"
              ? "Official Station Observation"
              : data.sourceType === "MODEL_ESTIMATE"
              ? "Atmospheric Model Estimate"
              : "DEMO SAMPLE"}
          </span>

          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(data.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Primary AQI Headline Hero Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          className={`lg:col-span-2 p-6 sm:p-8 rounded-3xl border shadow-sm ${aqiColors.bg} ${aqiColors.border} transition-colors`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  {standard === "INDIAN_NAQI" ? "Indian National AQI (NAQI)" : "US EPA Standard AQI"}
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-300">•</span>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Dominant: {data.dominantPollutant}
                </span>
              </div>
              <div className="flex items-baseline gap-4">
                <span className={`text-6xl sm:text-7xl font-black font-mono tracking-tight ${aqiColors.text}`}>
                  {data.aqi}
                </span>
                <div>
                  <AQIBadge category={data.category} size="lg" />
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mt-1">
                    {location.name}, {location.state || location.country}
                  </p>
                </div>
              </div>
            </div>

            {/* Weather Snapshot in Card */}
            {weather && (
              <div className="flex flex-wrap sm:flex-col gap-3 sm:text-right border-t sm:border-t-0 sm:border-l border-slate-300/50 dark:border-slate-700/50 pt-3 sm:pt-0 sm:pl-6 text-xs text-slate-700 dark:text-slate-300 font-medium">
                <div className="flex items-center sm:justify-end gap-1.5">
                  <Thermometer className="w-4 h-4 text-rose-500" />
                  <span>
                    {weather.temperature}°C (Feels {weather.apparentTemperature}°C)
                  </span>
                </div>
                <div className="flex items-center sm:justify-end gap-1.5">
                  <Droplets className="w-4 h-4 text-cyan-500" />
                  <span>Humidity: {weather.relativeHumidity}%</span>
                </div>
                <div className="flex items-center sm:justify-end gap-1.5">
                  <Wind className="w-4 h-4 text-emerald-500" />
                  <span>Wind: {weather.windSpeed} km/h</span>
                </div>
              </div>
            )}
          </div>

          {/* Health Advisory Highlight */}
          <div className="mt-6 pt-6 border-t border-slate-300/40 dark:border-slate-700/40 space-y-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Public Health Advisory
              </h4>
              <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                {data.healthAdvisory.general}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 mb-1">
                Vulnerable Populations (Kids, Elderly, Asthmatics)
              </h4>
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                {data.healthAdvisory.sensitiveGroups}
              </p>
            </div>
          </div>
        </div>

        {/* Smog Trapping & Meteorological Inversion Risk Card */}
        {weather && (
          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Atmospheric Inversion
                  </h3>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                    weather.inversionRisk.level === "CRITICAL"
                      ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                      : weather.inversionRisk.level === "HIGH"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  }`}
                >
                  {weather.inversionRisk.level} RISK
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {weather.inversionRisk.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-300 block">Stagnation Score</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {weather.inversionRisk.score} / 100
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-300 block">Atmospheric State</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {weather.inversionRisk.isStagnant ? "Calm & Trapped" : "Active Mixing"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-300 block">Surface Pressure</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {weather.surfacePressure} hPa
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-300 block">Wind Direction</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-slate-400 dark:text-slate-300" />
                  {weather.windDirection}°
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Pollutants Breakdown Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Measured Pollutant Concentrations
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-300 flex items-center gap-1">
            <Info className="w-3.5 h-3.5" />
            Limits based on Indian NAAQS 24-hr Standards
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {Object.values(data.pollutants).map((p) => {
            const isExceeded = p.standardLimit ? p.value > p.standardLimit : false;
            return (
              <div
                key={p.code}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                      {p.code}
                    </span>
                    {p.subIndex !== undefined && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        Sub: {p.subIndex}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-300 truncate" title={p.name}>
                    {p.name}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
                    {p.value}
                    <span className="text-xs font-normal text-slate-500 dark:text-slate-300 ml-1">
                      {p.unit}
                    </span>
                  </div>

                  {p.standardLimit && (
                    <div
                      className={`text-[11px] mt-1 font-medium ${
                        isExceeded ? "text-rose-600 dark:text-rose-400 font-semibold" : "text-slate-500 dark:text-slate-300"
                      }`}
                    >
                      Limit: {p.standardLimit} {p.unit}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 24-Hour Trend & 72-Hour Forecast Charts */}
      {forecast && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrendChart
            points={forecast.historical24h}
            title="Past 24-Hour Air Quality Trend"
            description="Hourly observed and model-interpolated AQI variations."
          />
          <TrendChart
            points={forecast.forecast72h}
            title="Next 72-Hour Smog & Pollution Forecast"
            description="Predictive atmospheric chemical transport simulation."
          />
        </div>
      )}
    </div>
  );
}
