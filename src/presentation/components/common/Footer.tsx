import React from "react";
import { ShieldCheck, Wind, HeartHandshake, Eye } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-300 text-xs sm:text-sm py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center">
                <Wind className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white text-base">
                ClearSkies AI
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-300">
              GenAI-Powered Urban Air Pollution & Winter Smog Assistant. Protecting families and empowering municipal clean-air action.
            </p>
          </div>

          {/* Scientific Sources & Attribution */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Data & Science</span>
            </div>
            <ul className="space-y-1 text-xs">
              <li>Central Pollution Control Board (CPCB)</li>
              <li>Open-Meteo / Copernicus CAMS Models</li>
              <li>World Air Quality Index (WAQI)</li>
              <li>WHO Air Quality Guidelines (2021)</li>
            </ul>
          </div>

          {/* Accessibility & Compliance */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-200">
              <Eye className="w-4 h-4 text-brand-500" />
              <span>Accessibility</span>
            </div>
            <ul className="space-y-1 text-xs">
              <li>WCAG 2.2 Level AA Standard</li>
              <li>Screen Reader & NVDA / VoiceOver Ready</li>
              <li>Full Keyboard Navigation (Tab / Esc)</li>
              <li>High-Contrast Dark & Light Themes</li>
            </ul>
          </div>

          {/* Public Health Disclaimer */}
          <div className="space-y-2 md:col-span-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-200">
              <HeartHandshake className="w-4 h-4 text-rose-500" />
              <span>Medical Disclaimer</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-300">
              ClearSkies AI provides environmental risk intelligence only. It does not provide medical diagnoses or alter prescribed pulmonary medications. Consult certified physicians for personal health conditions.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-300">
          <p>© {new Date().getFullYear()} ClearSkies AI. Built for public health & urban clean air.</p>
          <div className="flex items-center gap-4">
            <span>Serverless Vercel Architecture</span>
            <span>•</span>
            <span>Google GenAI Official SDK</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
