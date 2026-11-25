"use client";

import React, { useState } from "react";
import { useLocation } from "@/presentation/context/LocationContext";
import { useAQI } from "@/presentation/context/AQIContext";
import {
  Users,
  TreePine,
  Flame,
  Bus,
  Share2,
  CheckCircle,
  Copy,
  Check,
  AlertTriangle,
  Award,
} from "lucide-react";

interface CommunityChallenge {
  id: string;
  title: string;
  category: string;
  participants: number;
  description: string;
  impactNote: string;
  isPledged: boolean;
}

export function CommunityHubView() {
  const { location } = useLocation();
  const { data: aqiData } = useAQI();

  const [challenges, setChallenges] = useState<CommunityChallenge[]>([
    {
      id: "no-solo-car",
      title: "7-Day Metro & Carpool Shift",
      category: "Transport",
      participants: 412,
      description: "Pledge to use metro transit or shared carpool for all office commutes this week.",
      impactNote: "Avoids an estimated 14 kg CO2e and 28g road-dust per participant weekly.",
      isPledged: false,
    },
    {
      id: "zero-leaf-burning",
      title: "Neighborhood Zero-Waste-Burning Watch",
      category: "Stewardship",
      participants: 689,
      description: "Ensure sweepers compost dry leaves instead of open burning; report fires on citizen municipal apps.",
      impactNote: "Halts acute local PM2.5 plumes in residential colony sectors.",
      isPledged: true,
    },
    {
      id: "damp-mopping-pledge",
      title: "Residential Damp-Mopping Drive",
      category: "Indoor Health",
      participants: 530,
      description: "Pledge to replace all dry brooms with damp microfiber mop in your apartment block.",
      impactNote: "Cuts indoor resuspended particulate concentration spikes by over 50%.",
      isPledged: false,
    },
    {
      id: "ev-two-wheeler",
      title: "Clean Last-Mile Mobility",
      category: "Clean Tech",
      participants: 295,
      description: "Transition short neighborhood grocery trips to walking, e-rickshaws, or electric cycles when AQI allows.",
      impactNote: "Zero localized tailpipe hydrocarbons in high-density markets.",
      isPledged: false,
    },
  ]);

  const [copied, setCopied] = useState(false);

  const togglePledge = (id: string) => {
    setChallenges((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              isPledged: !c.isPledged,
              participants: c.isPledged ? c.participants - 1 : c.participants + 1,
            }
          : c
      )
    );
  };

  const pledgedCount = challenges.filter((c) => c.isPledged).length;

  const handleShare = () => {
    const text = `I'm using ClearSkies AI in ${location.name} to monitor winter smog (Current AQI: ${
      aqiData?.aqi || "Live"
    }) and have pledged to ${pledgedCount} community clean-air actions! Join us in lowering urban emissions.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Collective Clean Air Action
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-1">Community Action Hub</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Individual changes matter, but community coordination drives systemic air quality improvement. Join local smog mitigation challenges in {location.name}.
          </p>
        </div>
        <div className="flex items-center gap-2 p-3 bg-slate-800 rounded-2xl border border-slate-700 text-xs">
          <Users className="w-5 h-5 text-brand-400 shrink-0" />
          <span>Active Neighborhood Coalition</span>
        </div>
      </div>

      {/* Community Progress Snapshot (Explicitly Tagged as DEMO / Sample) */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-850 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Simulated Community Prototype:</strong> Statistics displayed reflect active sample campaigns in {location.name}.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 text-xs font-bold uppercase">
            <Users className="w-4 h-4" />
            Active Citizens
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            1,926
          </div>
          <p className="text-slate-500 dark:text-slate-300 text-[11px]">Participating across {location.name} sectors</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase">
            <TreePine className="w-4 h-4" />
            Urban Tree Bio-Filters
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            4,850+
          </div>
          <p className="text-slate-500 dark:text-slate-300 text-[11px]">Dust-trapping canopy trees planted</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-300 text-xs font-bold uppercase">
            <Award className="w-4 h-4" />
            Your Household Pledges
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {pledgedCount}
          </div>
          <p className="text-slate-500 dark:text-slate-300 text-[11px]">Active commitments in your routine</p>
        </div>
      </div>

      {/* Community Challenges List */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Active Clean Air Neighborhood Challenges
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {challenges.map((challenge) => (
            <div
              key={challenge.id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                    {challenge.category}
                  </span>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-300">
                    {challenge.participants} Joined
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {challenge.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {challenge.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                  {challenge.impactNote}
                </span>

                <button
                  onClick={() => togglePledge(challenge.id)}
                  aria-pressed={challenge.isPledged}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                    challenge.isPledged
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-brand-600 text-white hover:bg-brand-700"
                  }`}
                >
                  {challenge.isPledged ? "Pledged ✓" : "Take Pledge"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shareable Action Card */}
      <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-tr from-slate-50 to-brand-50/40 dark:from-slate-900 dark:to-slate-850 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h4 className="font-bold text-slate-900 dark:text-white text-base">
              Share Your Household Clean-Air Action Card
            </h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-300 max-w-lg">
            Inspire family and neighbors across WhatsApp and social channels to track live AQI, seal drafty rooms, and avoid vehicle idling.
          </p>
        </div>

        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span>Copied Action Summary!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy Clean-Air Card</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
