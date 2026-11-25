export type InversionRiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export interface WeatherData {
  temperature: number; // Celsius
  apparentTemperature: number; // Feels like Celsius
  relativeHumidity: number; // %
  windSpeed: number; // km/h
  windDirection: number; // degrees
  surfacePressure: number; // hPa
  weatherCode: number;
  condition: string;
  source: string;
  timestamp: string;
  inversionRisk: {
    level: InversionRiskLevel;
    score: number; // 0 to 100
    description: string;
    isStagnant: boolean;
  };
}

/**
 * Maps WMO weather interpretation code to readable condition string
 */
export function mapWMOCodeToCondition(code: number): string {
  if (code === 0) return "Clear Sky";
  if (code === 1 || code === 2) return "Mainly Clear / Partly Cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Fog / Smog Haze";
  if (code >= 51 && code <= 55) return "Drizzle";
  if (code >= 61 && code <= 65) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Rain Showers";
  if (code >= 95 && code <= 99) return "Thunderstorm";
  return "Hazy";
}

/**
 * Calculates Atmospheric Inversion & Smog Trapping Risk
 * Winter smog is exacerbated by:
 * - Low wind speed (< 7 km/h prevents horizontal dispersion)
 * - High humidity (> 75% hygroscopic growth of sulfate/nitrate aerosols)
 * - Low ground temperature (< 15°C fosters surface inversion)
 */
export function evaluateInversionRisk(
  temperature: number,
  humidity: number,
  windSpeed: number
): {
  level: InversionRiskLevel;
  score: number;
  description: string;
  isStagnant: boolean;
} {
  let score = 0;

  // Wind speed factor (calm winds trap pollutants)
  if (windSpeed < 4) score += 40;
  else if (windSpeed < 8) score += 25;
  else if (windSpeed < 14) score += 10;

  // Humidity factor (fog droplets condense with PM2.5 creating heavy smog)
  if (humidity > 80) score += 35;
  else if (humidity > 65) score += 20;
  else if (humidity > 50) score += 10;

  // Cold temperature factor (ground cooling causes temperature inversion)
  if (temperature < 12) score += 25;
  else if (temperature < 18) score += 15;
  else if (temperature < 24) score += 5;

  const isStagnant = windSpeed < 6;

  let level: InversionRiskLevel = "LOW";
  let description = "Atmospheric conditions favor pollutant dispersion. Normal ventilation.";

  if (score >= 75) {
    level = "CRITICAL";
    description = "Critical winter inversion layer present. Stagnant cold air and high humidity are trapping ground-level toxic particulates.";
  } else if (score >= 50) {
    level = "HIGH";
    description = "Strong atmospheric stagnation. Low wind and cool boundary layer impede pollutant dispersion, worsening localized smog.";
  } else if (score >= 30) {
    level = "MODERATE";
    description = "Moderate smog trapping conditions. Morning and evening hours will see peak aerosol accumulation.";
  }

  return { level, score, description, isStagnant };
}
