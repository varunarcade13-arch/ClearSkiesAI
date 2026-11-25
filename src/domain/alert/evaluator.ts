import { AQICategory } from "../aqi/types";

export type AlertSeverity = "CRITICAL" | "WARNING" | "INFO" | "SUCCESS";

export interface AirQualityAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  action: string;
  timestamp: string;
  category: AQICategory;
  aqiValue: number;
}

export function evaluateAirQualityAlerts(
  currentAqi: number,
  previousAqi?: number,
  category: AQICategory = "Moderate"
): AirQualityAlert[] {
  const alerts: AirQualityAlert[] = [];
  const now = new Date().toISOString();

  // 1. Severe AQI Alert (Emergency Level)
  if (currentAqi >= 400) {
    alerts.push({
      id: `alert-severe-${currentAqi}`,
      severity: "CRITICAL",
      title: "EMERGENCY: Severe Air Quality Level",
      message: `AQI has reached ${currentAqi} (Severe). Breathing outdoor air poses severe risk to respiratory and cardiovascular health for all age groups.`,
      action: "Strictly avoid all outdoor exposure. Seal living quarters and run HEPA air filtration continuously.",
      timestamp: now,
      category,
      aqiValue: currentAqi,
    });
  } else if (currentAqi >= 300) {
    alerts.push({
      id: `alert-very-poor-${currentAqi}`,
      severity: "WARNING",
      title: "High Pollution Alert: Very Poor Air",
      message: `AQI is ${currentAqi} (Very Poor). Prolonged exposure may trigger respiratory distress, asthma attacks, and eye irritation.`,
      action: "Mandatory N95 respirator mask outdoors. Reschedule non-essential commutes and avoid outdoor exercise.",
      timestamp: now,
      category,
      aqiValue: currentAqi,
    });
  }

  // 2. Rapid Change Analysis
  if (previousAqi !== undefined && previousAqi > 0) {
    const delta = currentAqi - previousAqi;

    if (delta >= 40) {
      alerts.push({
        id: `alert-deterioration-${delta}`,
        severity: "WARNING",
        title: "Rapid Air Quality Deterioration",
        message: `Pollution spiked by +${delta} points rapidly. Inversion trapping or fresh smoke plumes detected.`,
        action: "Close windows immediately and switch vehicle AC to recirculation mode.",
        timestamp: now,
        category,
        aqiValue: currentAqi,
      });
    } else if (delta <= -50) {
      alerts.push({
        id: `alert-improvement-${Math.abs(delta)}`,
        severity: "SUCCESS",
        title: "Significant Air Quality Improvement",
        message: `AQI improved by ${Math.abs(delta)} points due to enhanced wind dispersion or daylight temperature mixing.`,
        action: "Good opportunity for brief home airing or low-intensity outdoor errands before evening peak.",
        timestamp: now,
        category,
        aqiValue: currentAqi,
      });
    }
  }

  return alerts;
}
