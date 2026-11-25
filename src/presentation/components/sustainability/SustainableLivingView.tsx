"use client";

import React, { useState } from "react";
import { useAQI } from "@/presentation/context/AQIContext";
import { compareTransportOptions } from "@/domain/sustainability/calculator";
import {
  Leaf,
  Car,
  ShieldAlert,
  ShieldCheck,
  Zap,
  TrendingDown,
  Info,
  Scale,
} from "lucide-react";

export function SustainableLivingView() {
  const { data: aqiData } = useAQI();
  const currentAqi = aqiData?.aqi || 340;

  const [oneWayDistance, setOneWayDistance] = useState<number>(14);
  const [tripsPerWeek, setTripsPerWeek] = useState<number>(5);

  const comparison = compareTransportOptions(oneWayDistance, tripsPerWeek, currentAqi);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Lifecycle Emission Mitigation
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-1">Sustainable Alternatives</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Evaluate how modal shifts in commuting, home energy conservation, and sustainable habits lower urban emissions while keeping your family safe from toxic inhalation.
          </p>
        </div>
        <div className="flex items-center gap-2 p-3 bg-slate-800 rounded-2xl border border-slate-700 text-xs">
          <Leaf className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Transparent Lifecycle Models</span>
        </div>
      </div>

      {/* Interactive Commute Comparator */}
      <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Commute Carbon & Health Exposure Calculator
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-300 font-mono">
            Round-Trip: {oneWayDistance * 2} km/day
          </span>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
          <div>
            <label htmlFor="travel-distance" className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              One-Way Travel Distance: {oneWayDistance} km
            </label>
            <input
              type="range"
              id="travel-distance"
              min="2"
              max="50"
              step="1"
              value={oneWayDistance}
              onChange={(e) => setOneWayDistance(parseInt(e.target.value, 10))}
              className="w-full accent-brand-600"
            />
          </div>

          <div>
            <label htmlFor="commute-days" className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Work Commute Days per Week: {tripsPerWeek} days
            </label>
            <input
              type="range"
              id="commute-days"
              min="1"
              max="7"
              step="1"
              value={tripsPerWeek}
              onChange={(e) => setTripsPerWeek(parseInt(e.target.value, 10))}
              className="w-full accent-brand-600"
            />
          </div>
        </div>

        {/* Best Options Highlight */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="w-4 h-4" />
              <span>Recommended Health-Safe Transit</span>
            </div>
            <div className="text-base font-extrabold text-emerald-950 dark:text-emerald-100">
              {comparison.bestHealthSafeOption.modeLabel}
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              Only {comparison.bestHealthSafeOption.weeklyCo2Kg} kg CO2e/week while shielding respiratory tract from road-level exhaust.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-900/50 border border-brand-200 dark:border-brand-800 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-brand-800 dark:text-brand-300">
              <TrendingDown className="w-4 h-4" />
              <span>Lowest Carbon Footprint</span>
            </div>
            <div className="text-base font-extrabold text-brand-900 dark:text-brand-100">
              {comparison.bestEcoOption.modeLabel}
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              {comparison.bestEcoOption.weeklyCo2Kg} kg CO2e weekly emission.
            </p>
          </div>
        </div>

        {/* Full Modal Comparison Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
          <table className="w-full text-left text-xs" aria-label="Transport Mode Comparison">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
              <tr>
                <th scope="col" className="px-4 py-3">Transport Mode</th>
                <th scope="col" className="px-4 py-3">Weekly CO2e</th>
                <th scope="col" className="px-4 py-3">Weekly Tailpipe PM</th>
                <th scope="col" className="px-4 py-3">Health Status at AQI {currentAqi}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {comparison.options.map((opt) => (
                <tr key={opt.mode} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-sans font-semibold text-slate-800 dark:text-slate-200">
                    {opt.modeLabel}
                  </td>
                  <td className="px-4 py-3 text-slate-900 dark:text-white font-bold">
                    {opt.weeklyCo2Kg} kg
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {opt.weeklyPmGrams} g
                  </td>
                  <td className="px-4 py-3 font-sans">
                    {opt.isSafeAtCurrentAqi ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <ShieldCheck className="w-3 h-3" />
                        Safe
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                        <ShieldAlert className="w-3 h-3" />
                        High Exposure Risk
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>{comparison.assumptions}</span>
        </div>
      </div>

      {/* Sustainable Household Interventions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <Zap className="w-6 h-6 text-amber-500" />
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
            Energy-Efficient Heating
          </h4>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Use thermal blackout curtains to trap indoor daytime heat. Switch to 5-star inverter heat pumps rather than resistive coils, cutting electricity grid emissions by 45%.
          </p>
        </div>

        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <Scale className="w-6 h-6 text-brand-500" />
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
            Zero Municipal Waste Burning
          </h4>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Report open biomass and dry leaf burning immediately on citizen grievance apps (e.g. Sameer / Green Delhi app). Divert garden clippings into local community composting pits.
          </p>
        </div>

        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <Leaf className="w-6 h-6 text-emerald-500" />
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
            Urban Canopy & Green Buffers
          </h4>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Dense vertical foliage like Peepal, Neem, and Jamun act as bio-filters, capturing coarse road dust (PM10) before it infiltrates ground-floor residential boundaries.
          </p>
        </div>
      </div>
    </div>
  );
}
