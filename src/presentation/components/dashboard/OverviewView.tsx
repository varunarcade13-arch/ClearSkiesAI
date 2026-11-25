"use client";

import React from "react";
import { useAQI } from "@/presentation/context/AQIContext";
import { useLocation } from "@/presentation/context/LocationContext";
import { useFamilyProfile } from "@/presentation/context/FamilyProfileContext";
import { NavigationTab } from "@/presentation/components/common/Header";
import { AQIBadge, getAQIColorClasses } from "@/presentation/components/common/AQIBadge";
import { TrendChart } from "./TrendChart";
import {
  Wind,
  Sparkles,
  Shield,
  Home,
  CheckCircle2,
  ArrowRight,
  Gauge,
  Thermometer,
  Droplets,
  AlertTriangle,
  Users,
} from "lucide-react";

interface OverviewViewProps {
  onNavigate: (tab: NavigationTab) => void;
}

export function OverviewView({ onNavigate }: OverviewViewProps) {
  const { location } = useLocation();
  const { data, weather, forecast, isLoading, error } = useAQI();
  const { profile } = useFamilyProfile();

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          <span role="status" aria-live="polite">Loading live air intelligence for {location.name}...</span>
        </p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div role="alert" className="p-8 rounded-3xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto" />
        <h3 className="font-bold text-rose-900 dark:text-rose-200">
          Unable to Load Real-Time AQI
        </h3>
        <p className="text-xs sm:text-sm text-rose-700 dark:text-rose-300 max-w-md mx-auto">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const aqiColors = getAQIColorClasses(data.category);

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border shadow-sm ${aqiColors.bg} ${aqiColors.border} transition-colors`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Live Winter Smog Intelligence
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {location.name}, {location.state || location.country}
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-4">
              <span className={`text-6xl sm:text-7xl font-black font-mono tracking-tight ${aqiColors.text}`}>
                {data.aqi}
              </span>
              <div className="space-y-1">
                <AQIBadge category={data.category} size="lg" />
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium">
                  Dominant Pollutant: <span className="font-bold">{data.dominantPollutant}</span> (
                  {data.pollutants.pm25 ? `${data.pollutants.pm25.value} µg/m³` : "Active"}
                  )
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 max-w-2xl font-medium pt-1">
              {data.healthAdvisory.general}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap sm:flex-col gap-2.5 shrink-0">
            <button
              onClick={() => onNavigate("ai-assistant")}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ask Gemini Assistant</span>
            </button>

            <button
              onClick={() => onNavigate("family-plan")}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs border border-slate-300 dark:border-slate-700 shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Personalized Family Plan</span>
            </button>

            <button
              onClick={() => onNavigate("live-aqi")}
              className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:underline"
            >
              <span>View Full Pollutant Breakdown</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Weather */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-300 font-semibold mb-1">
            <Thermometer className="w-3.5 h-3.5 text-rose-500" />
            <span>Weather</span>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
            {weather ? `${weather.temperature}°C` : "N/A"}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-300 truncate">
            {weather?.condition || "Calm Smog Haze"}
          </div>
        </div>

        {/* Humidity */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-300 font-semibold mb-1">
            <Droplets className="w-3.5 h-3.5 text-cyan-500" />
            <span>Humidity</span>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
            {weather ? `${weather.relativeHumidity}%` : "N/A"}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-300 truncate">
            Wind: {weather ? `${weather.windSpeed} km/h` : "Calm"}
          </div>
        </div>

        {/* Atmospheric Inversion */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-300 font-semibold mb-1">
            <Gauge className="w-3.5 h-3.5 text-amber-500" />
            <span>Smog Inversion</span>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {weather?.inversionRisk.level || "HIGH"}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-300 truncate">
            Score: {weather?.inversionRisk.score || 75}/100
          </div>
        </div>

        {/* Family Sensitivity */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-300 font-semibold mb-1">
            <Users className="w-3.5 h-3.5 text-brand-500" />
            <span>Family Status</span>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {profile.familySize} Members
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-300 truncate">
            {profile.hasYoungChildren ? "Kids " : ""}
            {profile.hasElderly ? "Seniors " : ""}
            {profile.hasRespiratorySensitivities ? "Asthma" : "Protected"}
          </div>
        </div>
      </div>

      {/* 24-Hour Trend Chart Preview */}
      {forecast && (
        <TrendChart
          points={forecast.historical24h}
          title="Past 24-Hour Air Quality Evolution"
          description={`Hourly observed and interpolated particulate fluctuations in ${location.name}.`}
        />
      )}

      {/* Featured Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Outdoor Workouts
            </span>
            <h4 className="font-bold text-slate-900 dark:text-white text-base">
              Shift Aerobic Exercise Indoors
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              At AQI {data.aqi}, minute ventilation during running surges to 50 L/min, driving particulate matter directly into pulmonary capillaries.
            </p>
          </div>
          <button
            onClick={() => onNavigate("recommendations")}
            className="flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline pt-2"
          >
            <span>Explore Workout Alternatives</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
              Indoor Ventilation
            </span>
            <h4 className="font-bold text-slate-900 dark:text-white text-base">
              Solar Afternoon Window Only
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Keep windows tightly sealed during early mornings and evenings. Only brief cross-ventilation (10-15 mins) allowed between 1:00 PM - 2:30 PM.
            </p>
          </div>
          <button
            onClick={() => onNavigate("indoor-aq")}
            className="flex items-center gap-1.5 text-xs font-bold text-cyan-700 dark:text-cyan-300 hover:underline pt-2"
          >
            <span>Air Purifier CADR Calculator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Mobility & Commute
            </span>
            <h4 className="font-bold text-slate-900 dark:text-white text-base">
              Vehicle AC Recirculation Mode
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Setting vehicle cabin air to internal recirculation cuts toxic diesel soot exposure by over 80% compared to drawing outside traffic air.
            </p>
          </div>
          <button
            onClick={() => onNavigate("sustainability")}
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline pt-2"
          >
            <span>Commute Carbon Comparator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
