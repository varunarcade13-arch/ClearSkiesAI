"use client";

import React, { useState, useEffect } from "react";
import { useAQI } from "@/presentation/context/AQIContext";
import { useLocation } from "@/presentation/context/LocationContext";
import { useFamilyProfile } from "@/presentation/context/FamilyProfileContext";
import { RoutineRecommendation } from "@/domain/recommendation/types";
import {
  CheckCircle2,
  Leaf,
  Shield,
  Layers,
  Info,
  Car,
  Activity,
  Home,
  Zap,
  Users,
} from "lucide-react";

export function RecommendationsView() {
  const { location } = useLocation();
  const { data: aqiData } = useAQI();
  const { profile } = useFamilyProfile();

  const [recommendations, setRecommendations] = useState<RoutineRecommendation[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/recommendations?lat=${location.latitude}&lng=${location.longitude}`);
        if (res.ok) {
          const list = await res.json();
          setRecommendations(list);
        }
      } catch {
        // Fallback
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [location.latitude, location.longitude]);

  const categories = [
    { id: "ALL", label: "All Guidance", icon: Layers },
    { id: "COMMUTE", label: "Transit & Travel", icon: Car },
    { id: "FITNESS", label: "Exercise & Fitness", icon: Activity },
    { id: "HOME_INDOOR", label: "Home Practices", icon: Home },
    { id: "ENERGY", label: "Energy & Warming", icon: Zap },
    { id: "COMMUNITY", label: "Community Action", icon: Users },
  ];

  const filtered = activeCategory === "ALL"
    ? recommendations
    : recommendations.filter((r) => r.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* Hero Intro */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
            Actionable Routine Modifications
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-1">Smart Daily Routines</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Evidence-based daily routine adjustments calibrated for current AQI ({aqiData?.aqi || "Live"}) in {location.name}. Every recommendation includes verifiable environmental deltas and personal lung protection metrics.
          </p>
        </div>

        <div className="text-right shrink-0">
          <span className="text-xs text-slate-400 dark:text-slate-300 block">Personal Profile</span>
          <span className="text-sm font-bold text-white capitalize">
            {profile.workRoutine} Work • {profile.commuteMethod.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((c) => {
          const Icon = c.icon;
          const isActive = activeCategory === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                isActive
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
              aria-pressed={isActive}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>

      {/* Recommendations Cards */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-300" role="status" aria-live="polite">
          Loading recommendations for current conditions...
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((rec) => (
            <div
              key={rec.id}
              className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                    {rec.category.replace("_", " ")}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {rec.title}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold shrink-0">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    Difficulty: {rec.practicalDifficulty}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    Cost: {rec.financialCost}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                    {rec.verificationTag.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              {/* 1. What to Do & 2. Why Recommended */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">
                    What You Should Do:
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {rec.whatToDo}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">
                    Why It Is Recommended:
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {rec.whyRecommended}
                  </p>
                </div>
              </div>

              {/* 3. Environmental Impact & 4. Personal Exposure Benefit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-start gap-2.5">
                  <Leaf className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-emerald-700 dark:text-emerald-400 block">
                      Estimated Environmental Impact:
                    </strong>
                    <span className="text-slate-600 dark:text-slate-300">
                      {rec.environmentalImpact.description}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-brand-700 dark:text-brand-400 block">
                      Personal Inhalation Exposure Benefit:
                    </strong>
                    <span className="text-slate-600 dark:text-slate-300">
                      {rec.personalExposureBenefit.description}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assumptions transparency */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>
                  <strong>Calculation Assumptions:</strong> {rec.assumptions}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
