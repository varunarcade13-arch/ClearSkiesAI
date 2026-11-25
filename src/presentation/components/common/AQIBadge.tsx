import React from "react";
import { AQICategory } from "@/domain/aqi/types";

interface AQIBadgeProps {
  category: AQICategory;
  aqi?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function getAQIColorClasses(category: AQICategory): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (category) {
    case "Good":
      return {
        bg: "bg-emerald-100 dark:bg-emerald-950/60",
        text: "text-emerald-800 dark:text-emerald-300",
        border: "border-emerald-300 dark:border-emerald-800",
        dot: "bg-emerald-500",
      };
    case "Satisfactory":
      return {
        bg: "bg-cyan-100 dark:bg-cyan-950/60",
        text: "text-cyan-800 dark:text-cyan-300",
        border: "border-cyan-300 dark:border-cyan-800",
        dot: "bg-cyan-500",
      };
    case "Moderate":
      return {
        bg: "bg-amber-100 dark:bg-amber-950/60",
        text: "text-amber-800 dark:text-amber-300",
        border: "border-amber-300 dark:border-amber-800",
        dot: "bg-amber-500",
      };
    case "Poor":
      return {
        bg: "bg-orange-100 dark:bg-orange-950/60",
        text: "text-orange-900 dark:text-orange-300",
        border: "border-orange-300 dark:border-orange-800",
        dot: "bg-orange-500",
      };
    case "Very Poor":
      return {
        bg: "bg-rose-100 dark:bg-rose-950/60",
        text: "text-rose-900 dark:text-rose-300",
        border: "border-rose-300 dark:border-rose-800",
        dot: "bg-rose-500",
      };
    case "Severe":
    default:
      return {
        bg: "bg-purple-100 dark:bg-purple-950/60",
        text: "text-purple-950 dark:text-purple-200",
        border: "border-purple-300 dark:border-purple-800",
        dot: "bg-purple-600",
      };
  }
}

export function AQIBadge({ category, aqi, size = "md", className = "" }: AQIBadgeProps) {
  const colors = getAQIColorClasses(category);

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-medium",
    md: "px-2.5 py-1 text-sm font-semibold",
    lg: "px-3.5 py-1.5 text-base font-bold",
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses} ${className}`}
      role="status"
      aria-label={`Air Quality Index category: ${category}${aqi !== undefined ? `, index value: ${aqi}` : ""}`}
    >
      <span className={`h-2 w-2 rounded-full ${colors.dot}`} aria-hidden="true" />
      <span>{category}</span>
      {aqi !== undefined && <span className="opacity-90 font-mono">({aqi})</span>}
    </span>
  );
}
