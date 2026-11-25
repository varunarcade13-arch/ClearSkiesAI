"use client";

import React, { useState } from "react";
import { useAQI } from "@/presentation/context/AQIContext";
import {
  calculateRequiredCADR,
  getVentilationGuidance,
} from "@/domain/indoor/calculator";
import {
  Home,
  Wind,
  Calculator,
  ShieldCheck,
  Flame,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Info,
} from "lucide-react";

export function IndoorAQView() {
  const { data: aqiData } = useAQI();
  const aqi = aqiData?.aqi || 340;

  // CADR Calculator state
  const [roomLength, setRoomLength] = useState<number>(4.5);
  const [roomWidth, setRoomWidth] = useState<number>(3.5);
  const [ceilingHeight, setCeilingHeight] = useState<number>(2.8);
  const [targetACH, setTargetACH] = useState<number>(4.5);

  const cadrResult = calculateRequiredCADR(roomLength, roomWidth, ceilingHeight, targetACH);
  const ventGuidance = getVentilationGuidance(aqi);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            Indoor Environmental Control
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-1">Indoor Air Quality Assistant</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Outdoor smog rapidly infiltrates homes through window cracks and gaps. Use science-backed air filtration sizing, diurnal ventilation windows, and low-cost indoor interventions.
          </p>
        </div>
        <div className="text-xs font-mono bg-slate-800 px-3 py-2 rounded-xl border border-slate-700 shrink-0">
          Current Outdoor AQI: <span className="font-bold text-brand-400">{aqi}</span>
        </div>
      </div>

      {/* 1. Live Ventilation Window Advisory */}
      <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 flex items-center justify-center shrink-0">
              <Wind className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Natural Ventilation Schedule
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-300">
                Calibrated to diurnal thermal boundary layer patterns
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              ventGuidance.isSafeToOpenWindows
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
            }`}
          >
            {ventGuidance.isSafeToOpenWindows
              ? "Ventilation Permitted (Midday Only)"
              : "Keep Windows Completely Sealed"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-300 block font-semibold">
              Optimal Time Window
            </span>
            <span className="text-base font-bold text-slate-900 dark:text-white mt-1 block">
              {ventGuidance.optimalTimeSlot}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-300 block font-semibold">
              Maximum Air Exchange Duration
            </span>
            <span className="text-base font-bold text-slate-900 dark:text-white mt-1 block">
              {ventGuidance.durationMinutes > 0
                ? `${ventGuidance.durationMinutes} Minutes`
                : "0 Minutes (Sealed)"}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-300 block font-semibold">
              Atmospheric Mixing Logic
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-300 mt-1 block leading-relaxed">
              {ventGuidance.scientificReason}
            </span>
          </div>
        </div>

        <div className="space-y-1.5 pt-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Ventilation Rules for Today:
          </span>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {ventGuidance.guidelines.map((g, i) => (
              <li key={i} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <CheckCircle className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 2. Interactive CADR (Clean Air Delivery Rate) Calculator */}
      <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Calculator className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Air Purifier CADR Sizing Calculator
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-300">
              Calculate exact filtration capacity needed for room dimensions (m³/h and CFM)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label htmlFor="room-length" className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Room Length (Meters): {roomLength}m
            </label>
            <input
              type="range"
              id="room-length"
              min="2"
              max="12"
              step="0.5"
              value={roomLength}
              onChange={(e) => setRoomLength(parseFloat(e.target.value))}
              className="w-full accent-brand-600"
            />
          </div>

          <div>
            <label htmlFor="room-width" className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Room Width (Meters): {roomWidth}m
            </label>
            <input
              type="range"
              id="room-width"
              min="2"
              max="10"
              step="0.5"
              value={roomWidth}
              onChange={(e) => setRoomWidth(parseFloat(e.target.value))}
              className="w-full accent-brand-600"
            />
          </div>

          <div>
            <label htmlFor="ceiling-height" className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Ceiling Height (Meters): {ceilingHeight}m
            </label>
            <input
              type="range"
              id="ceiling-height"
              min="2.4"
              max="4.0"
              step="0.1"
              value={ceilingHeight}
              onChange={(e) => setCeilingHeight(parseFloat(e.target.value))}
              className="w-full accent-brand-600"
            />
          </div>

          <div>
            <label htmlFor="target-ach" className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Target Air Changes (ACH): {targetACH}x/hr
            </label>
            <input
              type="range"
              id="target-ach"
              min="3"
              max="6"
              step="0.5"
              value={targetACH}
              onChange={(e) => setTargetACH(parseFloat(e.target.value))}
              className="w-full accent-brand-600"
            />
          </div>
        </div>

        {/* CADR Output Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl bg-brand-50/60 dark:bg-brand-900/40 border border-brand-200 dark:border-brand-900 text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-300 block font-semibold">
              Room Volume / Area
            </span>
            <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
              {cadrResult.roomVolumeM3} m³
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-300 block">
              (~{cadrResult.roomAreaSqFt} sq. ft.)
            </span>
          </div>

          <div>
            <span className="text-slate-500 dark:text-slate-300 block font-semibold">
              Minimum Required CADR
            </span>
            <span className="text-xl font-black font-mono text-brand-600 dark:text-brand-400">
              {cadrResult.requiredCADRm3h} m³/h
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-300 block">
              (~{cadrResult.requiredCADRcfm} CFM)
            </span>
          </div>

          <div className="sm:col-span-2 space-y-1">
            <span className="text-slate-500 dark:text-slate-300 block font-semibold">
              Recommended Filter Specification
            </span>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {cadrResult.recommendedFilterType}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-300">{cadrResult.fanSpeedGuidance}</p>
          </div>
        </div>
      </div>

      {/* 3. Low-Cost Indoor Hacks & Hazard Prevention */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
            <ShieldCheck className="w-5 h-5" />
            <span>High-Impact Low-Cost Hacks</span>
          </div>
          <ul className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span>
                <strong>Weatherstrip Entry Doors:</strong> Installing foam tape or a rolled towel at the base of entry doors cuts external particulate leakage by 30-40%.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span>
                <strong>Damp Microfiber Mopping:</strong> Replace dry broom sweeping entirely with damp microfiber mopping to avoid resuspending settled dust.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span>
                <strong>DIY Air Purifier (Corsi-Rosenthal Box):</strong> Attaching a MERV 13 / HEPA furnace filter to a standard box fan provides high CADR air cleaning at a fraction of appliance cost.
              </span>
            </li>
          </ul>
        </div>

        <div className="p-6 rounded-3xl border border-rose-200 dark:border-rose-950/60 bg-rose-50/30 dark:bg-rose-950/10 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
            <Flame className="w-5 h-5" />
            <span>Avoid Critical Indoor Combustion Hazards</span>
          </div>
          <ul className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <span>
                <strong>Zero Incense, Dhoop & Mosquito Coils:</strong> Burning a single mosquito coil produces particulate mass equivalent to smoking 75-100 cigarettes in an enclosed room.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <span>
                <strong>Kitchen Range Hood Exhaust:</strong> High-heat deep frying generates acute PM2.5 spikes exceeding 600 µg/m³. Always use kitchen exhaust and cover pans.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <span>
                <strong>Safe Space Heating:</strong> Avoid unvented kerosene heaters or open charcoal braziers (angithi) which produce lethal carbon monoxide (CO) gas.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
