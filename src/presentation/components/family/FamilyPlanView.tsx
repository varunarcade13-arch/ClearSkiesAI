"use client";

import React, { useState } from "react";
import { useFamilyProfile } from "@/presentation/context/FamilyProfileContext";
import { useAQI } from "@/presentation/context/AQIContext";
import { useLocation } from "@/presentation/context/LocationContext";
import { calculateVulnerabilityScore } from "@/domain/family/types";
import { PersonalizedPlan } from "@/domain/plan/types";
import {
  Users,
  Shield,
  Clock,
  Sparkles,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sun,
  Moon,
  Wind,
  Car,
  Home,
  Heart,
  Baby,
} from "lucide-react";

export function FamilyPlanView() {
  const { location } = useLocation();
  const { profile, updateProfile, resetProfile } = useFamilyProfile();
  const { data: aqiData } = useAQI();

  const [plan, setPlan] = useState<PersonalizedPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const vulnerability = calculateVulnerabilityScore(profile);

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    setGenError(null);

    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: {
            ...profile,
            location,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to generate plan: ${res.statusText}`);
      }

      const generatedPlan = await res.json();
      setPlan(generatedPlan);
      setIsEditingProfile(false);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Error generating daily protection plan.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getPhaseIcon = (phaseKey: string) => {
    switch (phaseKey) {
      case "morning":
        return Sun;
      case "outdoorActivity":
        return Users;
      case "commuting":
        return Car;
      case "indoorAirQuality":
        return Home;
      case "afternoon":
        return Wind;
      case "evening":
        return Clock;
      case "nightTime":
      default:
        return Moon;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-brand-600 via-cyan-600 to-emerald-600 text-white shadow-md">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm mb-2">
            <Shield className="w-3.5 h-3.5" />
            Personalized Winter Smog Shield
          </span>
          <h2 className="text-xl sm:text-2xl font-black">Family Protection Architecture</h2>
          <p className="text-xs sm:text-sm opacity-90 mt-1 max-w-xl">
            Customized 24-hour routine calibrated to your household&apos;s unique sensitivities, commute patterns, and live pollution in {location.name}.
          </p>
        </div>

        <button
          onClick={() => setIsEditingProfile(!isEditingProfile)}
          className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-900 dark:text-slate-white hover:bg-slate-100 shadow transition-colors focus:outline-none focus:ring-2 focus:ring-white"
        >
          {isEditingProfile ? "Hide Profile Settings" : "Configure Family Profile"}
        </button>
      </div>

      {/* Vulnerability Index Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
              vulnerability.score > 60
                ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                : vulnerability.score > 35
                ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
            }`}
          >
            {vulnerability.score}
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-300 font-semibold uppercase">
              Vulnerability Score
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {vulnerability.score > 60
                ? "High Vulnerability"
                : vulnerability.score > 35
                ? "Moderate Vulnerability"
                : "Standard Profile"}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-center text-xs space-y-1.5">
          <span className="font-bold text-slate-800 dark:text-slate-200">
            Household Risk Factors Detected:
          </span>
          {vulnerability.factors.length > 0 ? (
            <ul className="space-y-1 text-slate-600 dark:text-slate-300">
              {vulnerability.factors.map((f, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 dark:text-slate-300">
              Standard risk baseline. No high-vulnerability factors recorded.
            </p>
          )}
        </div>
      </div>

      {/* Editable Profile Drawer / Section */}
      {isEditingProfile && (
        <div className="p-6 rounded-3xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 shadow-sm space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-500" />
              Household Composition & Lifestyle Settings
            </h3>
            <button
              onClick={resetProfile}
              className="text-xs text-rose-700 dark:text-rose-300 hover:underline font-semibold"
            >
              Reset to Defaults
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
            {/* Young Children Toggle */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Baby className="w-4 h-4 text-brand-500" />
                  Young Children (Under 10)
                </span>
                <input
                  type="checkbox"
                  aria-label="Young children under 10 in household"
                  checked={profile.hasYoungChildren}
                  onChange={(e) => updateProfile({ hasYoungChildren: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                />
              </div>
              <p className="text-slate-500 dark:text-slate-300 text-[11px]">
                Enforces strict playground restrictions during high smog hours.
              </p>
            </div>

            {/* Elderly Members Toggle */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-brand-500" />
                  Elderly Members (60+)
                </span>
                <input
                  type="checkbox"
                  aria-label="Elderly members aged 60 or older in household"
                  checked={profile.hasElderly}
                  onChange={(e) => updateProfile({ hasElderly: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                />
              </div>
              <p className="text-slate-500 dark:text-slate-300 text-[11px]">
                Prioritizes cardiovascular and respiratory safety protocols.
              </p>
            </div>

            {/* Respiratory Sensitivities Toggle */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-500" />
                  Asthma / Lung Allergies
                </span>
                <input
                  type="checkbox"
                  aria-label="Asthma or respiratory sensitivities in household"
                  checked={profile.hasRespiratorySensitivities}
                  onChange={(e) => updateProfile({ hasRespiratorySensitivities: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                />
              </div>
              <p className="text-slate-500 dark:text-slate-300 text-[11px]">
                Elevates warning thresholds for particulate trigger levels.
              </p>
            </div>

            {/* Commute Method Selector */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5">
              <label htmlFor="commute-method" className="font-bold text-slate-800 dark:text-slate-200 block">
                Primary Commute Method
              </label>
              <select
                id="commute-method"
                value={profile.commuteMethod}
                onChange={(e) =>
                  updateProfile({
                    commuteMethod: e.target.value as typeof profile.commuteMethod,
                  })
                }
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="metro_train">Rapid Metro / Electric Train</option>
                <option value="electric_bus">Electric Transit Bus</option>
                <option value="standard_bus">Standard Public Bus</option>
                <option value="carpool">Shared Carpool</option>
                <option value="solo_car">Personal Car</option>
                <option value="two_wheeler">Two-Wheeler (Motorcycle/Scooter)</option>
                <option value="bicycle_walk">Walking / Cycling</option>
              </select>
            </div>

            {/* Exercise Timing Selector */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5">
              <label htmlFor="exercise-timing" className="font-bold text-slate-800 dark:text-slate-200 block">
                Preferred Exercise Timing
              </label>
              <select
                id="exercise-timing"
                value={profile.exerciseTiming}
                onChange={(e) =>
                  updateProfile({
                    exerciseTiming: e.target.value as typeof profile.exerciseTiming,
                  })
                }
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="early_morning">Early Morning (6 AM - 8 AM - Inversion Peak)</option>
                <option value="late_morning">Late Morning (9 AM - 11 AM)</option>
                <option value="afternoon">Afternoon (12 PM - 3 PM - Best Dispersion)</option>
                <option value="evening">Evening (5 PM - 8 PM - Rush Hour Peak)</option>
                <option value="night">Night (9 PM - 11 PM)</option>
                <option value="none">No Regular Outdoor Workouts</option>
              </select>
            </div>

            {/* Air Purifier Equipment */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5">
              <label htmlFor="air-purifier-status" className="font-bold text-slate-800 dark:text-slate-200 block">
                Home Air Purifier Status
              </label>
              <select
                id="air-purifier-status"
                value={profile.airPurifierStatus}
                onChange={(e) =>
                  updateProfile({
                    airPurifierStatus: e.target.value as typeof profile.airPurifierStatus,
                  })
                }
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="none">No Air Purifier</option>
                <option value="single_room">Single Room HEPA Purifier</option>
                <option value="whole_home">Multi-Room / Whole Home Purifiers</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Generation Trigger Button */}
      <div className="flex flex-col items-center justify-center p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-center space-y-3">
        <Sparkles className="w-8 h-8 text-brand-600 dark:text-brand-400" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Generate Today&apos;s Tailored Action Plan
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 max-w-lg">
          ClearSkies AI will synthesize your family&apos;s profile with live atmospheric metrics in {location.name} (AQI {aqiData?.aqi || "Live"}) using Google Gemini.
        </p>

        {genError && (
          <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold" role="alert" aria-live="assertive">
            {genError}
          </p>
        )}

        <button
          onClick={handleGeneratePlan}
          disabled={isGenerating}
          aria-busy={isGenerating}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-700 hover:to-cyan-700 text-white font-bold text-sm shadow-md shadow-brand-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating Plan with GenAI...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{plan ? "Regenerate Plan with Live Conditions" : "Generate Personalized Plan"}</span>
            </>
          )}
        </button>
      </div>

      {/* Render 7-Phase Plan */}
      {plan && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Active Plan for {plan.locationName} (Generated at{" "}
              {new Date(plan.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
            </span>
            <span className="px-2.5 py-0.5 rounded-full font-bold bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-300">
              AQI Snapshot: {plan.aqiSnapshot} ({plan.aqiCategory})
            </span>
          </div>

          {/* Key Takeaway */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <strong className="block mb-0.5">Key Daily Strategy:</strong>
              {plan.keyTakeaway}
            </div>
          </div>

          {/* 7 Phase Cards */}
          <div className="space-y-3">
            {Object.entries(plan.phases).map(([phaseKey, phase]) => {
              const Icon = getPhaseIcon(phaseKey);
              const isCritical = phase.priority === "CRITICAL";

              return (
                <div
                  key={phaseKey}
                  className={`p-5 rounded-2xl border transition-all ${
                    isCritical
                      ? "border-rose-300 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  } shadow-xs space-y-3`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {phase.phaseName}
                          </h4>
                          <span className="text-xs font-mono text-slate-500 dark:text-slate-300">
                            ({phase.timeSlot})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-semibold">
                      {phase.maskRequired && (
                        <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                          N95 Mask Needed
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded ${
                          isCritical
                            ? "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {phase.priority}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {phase.action}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {phase.recommendation}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                    <span className="text-slate-500 dark:text-slate-300 italic">
                      <strong>Why:</strong> {phase.rationale}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-300">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {phase.exposureBenefit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
