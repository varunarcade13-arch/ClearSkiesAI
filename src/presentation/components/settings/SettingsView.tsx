"use client";

import React, { useState } from "react";
import { useTheme, Theme } from "@/presentation/theme/ThemeProvider";
import { useLocation } from "@/presentation/context/LocationContext";
import { useAQI } from "@/presentation/context/AQIContext";
import { useFamilyProfile } from "@/presentation/context/FamilyProfileContext";
import {
  Sun,
  Moon,
  Laptop,
  Bell,
  Trash2,
  Key,
  ShieldCheck,
  Check,
  Settings,
} from "lucide-react";

export function SettingsView() {
  const { theme, setTheme } = useTheme();
  const { standard, setStandard } = useLocation();
  const { notificationsEnabled, requestNotificationPermission } = useAQI();
  const { resetProfile } = useFamilyProfile();

  const [cleared, setCleared] = useState(false);

  const handleClearData = () => {
    resetProfile();
    try {
      localStorage.removeItem("clearskies-location");
      localStorage.removeItem("clearskies-family-profile");
      localStorage.removeItem("clearskies-theme");
    } catch {
      // Ignore
    }
    setCleared(true);
    setTimeout(() => setCleared(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
        <Settings className="w-6 h-6 text-brand-600 dark:text-brand-400" />
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Application Preferences & Settings
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-300">
            Configure display theming, AQI standard calculation, alerts, and local data privacy.
          </p>
        </div>
      </div>

      {/* 1. Theme Configuration */}
      <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Display Appearance & Theme
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">
            Choose light, dark, or follow your operating system preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(
            [
              { id: "light", label: "Light Theme", icon: Sun, desc: "High contrast clean daytime view" },
              { id: "dark", label: "Dark Theme", icon: Moon, desc: "Gentle on eyes, dark slate surfaces" },
              { id: "system", label: "System Sync", icon: Laptop, desc: "Matches device OS preference" },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const isSelected = theme === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTheme(item.id as Theme)}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? "border-brand-500 bg-brand-50/50 dark:bg-brand-900/50 ring-2 ring-brand-500"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                }`}
                aria-pressed={isSelected}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-5 h-5 ${isSelected ? "text-brand-600 dark:text-brand-400" : "text-slate-500 dark:text-slate-300"}`} />
                  {isSelected && <Check className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {item.label}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-300 mt-0.5">
                    {item.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. AQI Calculation Standard */}
      <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Air Quality Calculation Standard
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">
            Different standards evaluate concentration cut-offs and category brackets differently.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setStandard("INDIAN_NAQI")}
            className={`p-4 rounded-2xl border text-left transition-all ${
              standard === "INDIAN_NAQI"
                ? "border-brand-500 bg-brand-50/50 dark:bg-brand-900/50 ring-2 ring-brand-500"
                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
            aria-pressed={standard === "INDIAN_NAQI"}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Indian National AQI (NAQI - CPCB)
              </span>
              {standard === "INDIAN_NAQI" && (
                <Check className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              )}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Official Central Pollution Control Board 6-category scale (Good, Satisfactory, Moderate, Poor, Very Poor, Severe). Calibrated for Indian winter particulate baselines (PM2.5 0-30 µg/m³ is Good).
            </p>
          </button>

          <button
            onClick={() => setStandard("US_AQI")}
            className={`p-4 rounded-2xl border text-left transition-all ${
              standard === "US_AQI"
                ? "border-brand-500 bg-brand-50/50 dark:bg-brand-900/50 ring-2 ring-brand-500"
                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
            aria-pressed={standard === "US_AQI"}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                United States EPA Standard AQI
              </span>
              {standard === "US_AQI" && (
                <Check className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              )}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              US Environmental Protection Agency scale. Uses tighter threshold brackets (PM2.5 &gt;35.4 µg/m³ enters Unhealthy for Sensitive Groups).
            </p>
          </button>
        </div>
      </div>

      {/* 3. Smog Alerts & Notifications */}
      <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Severe Smog Browser Notifications
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-300">
                Receive browser alerts when AQI surges into Severe levels or deteriorates rapidly.
              </p>
            </div>
          </div>

          <button
            onClick={requestNotificationPermission}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              notificationsEnabled
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-brand-600 hover:bg-brand-700 text-white"
            }`}
            aria-pressed={notificationsEnabled}
          >
            {notificationsEnabled ? "Alerts Enabled ✓" : "Enable Alerts"}
          </button>
        </div>
      </div>

      {/* 4. Privacy & Local Data Storage */}
      <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Privacy & Client-Side Data Control
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">
            ClearSkies AI never uploads sensitive family names or medical records to remote servers. All profile settings are saved only in your device&apos;s browser localStorage.
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-600 dark:text-slate-300">
            Clear all cached locations, saved family profile, and theme cookies.
          </span>

          <button
            onClick={handleClearData}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-colors"
          >
            {cleared ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Cleared Successfully!</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Clear Stored Data</span>
              </>
            )}
          </button>
          {cleared && <span className="sr-only" role="status" aria-live="polite">Stored data cleared.</span>}
        </div>
      </div>

      {/* 5. API Keys & System Status */}
      <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            API Integrations & Environment Architecture
          </h3>
        </div>

        <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          <li className="py-2.5 flex items-center justify-between">
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              Open-Meteo Air Quality & Weather API
            </span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">
              Active (Zero-config free tier)
            </span>
          </li>
          <li className="py-2.5 flex items-center justify-between">
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              WAQI Ground Station API
            </span>
            <span className="text-slate-500 dark:text-slate-300">
              Configured via WAQI_API_TOKEN (.env.local)
            </span>
          </li>
          <li className="py-2.5 flex items-center justify-between">
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              Google Gemini GenAI
            </span>
            <span className="text-slate-500 dark:text-slate-300">
              Configured via GEMINI_API_KEY (.env.local)
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
