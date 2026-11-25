"use client";

import React from "react";
import { useAQI } from "@/presentation/context/AQIContext";
import { AlertTriangle, AlertCircle, Info, CheckCircle2, X } from "lucide-react";

export function AlertBanner() {
  const { alerts, dismissAlert } = useAQI();

  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="space-y-2 mb-6" aria-live="assertive" aria-atomic="true">
      {alerts.map((alert) => {
        const isCritical = alert.severity === "CRITICAL";
        const isWarning = alert.severity === "WARNING";
        const isSuccess = alert.severity === "SUCCESS";

        const bgClass = isCritical
          ? "bg-rose-50 dark:bg-rose-950/70 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100"
          : isWarning
          ? "bg-amber-50 dark:bg-amber-950/70 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100"
          : isSuccess
          ? "bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100"
          : "bg-blue-50 dark:bg-blue-950/70 border-blue-300 dark:border-blue-800 text-blue-950 dark:text-blue-100";

        const Icon = isCritical
          ? AlertTriangle
          : isWarning
          ? AlertCircle
          : isSuccess
          ? CheckCircle2
          : Info;

        const iconColor = isCritical
          ? "text-rose-600 dark:text-rose-400"
          : isWarning
          ? "text-amber-600 dark:text-amber-400"
          : isSuccess
          ? "text-emerald-700 dark:text-emerald-300"
          : "text-blue-600 dark:text-blue-400";

        return (
          <div
            key={alert.id}
            role="alert"
            className={`flex items-start justify-between p-4 rounded-xl border shadow-sm ${bgClass} transition-all`}
          >
            <div className="flex items-start gap-3">
              <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconColor}`} aria-hidden="true" />
              <div className="space-y-1">
                <div className="text-sm font-bold tracking-tight">{alert.title}</div>
                <p className="text-xs sm:text-sm leading-relaxed opacity-90">{alert.message}</p>
                {alert.action && (
                  <div className="text-xs font-semibold mt-1 bg-black/5 dark:bg-white/10 px-2.5 py-1 rounded inline-block">
                    Action: {alert.action}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => dismissAlert(alert.id)}
              className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label={`Dismiss alert: ${alert.title}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
