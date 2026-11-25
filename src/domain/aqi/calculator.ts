import { AQICategory, AQIStandard, PollutantMeasurement } from "./types";

interface Breakpoint {
  cLow: number;
  cHigh: number;
  iLow: number;
  iHigh: number;
}

// Official CPCB (Central Pollution Control Board) Breakpoints for Indian NAQI
const NAQI_BREAKPOINTS: Record<string, Breakpoint[]> = {
  pm25: [
    { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50 },
    { cLow: 31, cHigh: 60, iLow: 51, iHigh: 100 },
    { cLow: 61, cHigh: 90, iLow: 101, iHigh: 200 },
    { cLow: 91, cHigh: 120, iLow: 201, iHigh: 300 },
    { cLow: 121, cHigh: 250, iLow: 301, iHigh: 400 },
    { cLow: 251, cHigh: 500, iLow: 401, iHigh: 500 },
  ],
  pm10: [
    { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
    { cLow: 51, cHigh: 100, iLow: 51, iHigh: 100 },
    { cLow: 101, cHigh: 250, iLow: 101, iHigh: 200 },
    { cLow: 251, cHigh: 350, iLow: 201, iHigh: 300 },
    { cLow: 351, cHigh: 430, iLow: 301, iHigh: 400 },
    { cLow: 431, cHigh: 600, iLow: 401, iHigh: 500 },
  ],
  no2: [
    { cLow: 0, cHigh: 40, iLow: 0, iHigh: 50 },
    { cLow: 41, cHigh: 80, iLow: 51, iHigh: 100 },
    { cLow: 81, cHigh: 180, iLow: 101, iHigh: 200 },
    { cLow: 181, cHigh: 280, iLow: 201, iHigh: 300 },
    { cLow: 281, cHigh: 400, iLow: 301, iHigh: 400 },
    { cLow: 401, cHigh: 800, iLow: 401, iHigh: 500 },
  ],
  so2: [
    { cLow: 0, cHigh: 40, iLow: 0, iHigh: 50 },
    { cLow: 41, cHigh: 80, iLow: 51, iHigh: 100 },
    { cLow: 81, cHigh: 380, iLow: 101, iHigh: 200 },
    { cLow: 381, cHigh: 800, iLow: 201, iHigh: 300 },
    { cLow: 801, cHigh: 1600, iLow: 301, iHigh: 400 },
    { cLow: 1601, cHigh: 2400, iLow: 401, iHigh: 500 },
  ],
  co: [
    { cLow: 0, cHigh: 1, iLow: 0, iHigh: 50 },
    { cLow: 1.1, cHigh: 2, iLow: 51, iHigh: 100 },
    { cLow: 2.1, cHigh: 10, iLow: 101, iHigh: 200 },
    { cLow: 10.1, cHigh: 17, iLow: 201, iHigh: 300 },
    { cLow: 17.1, cHigh: 34, iLow: 301, iHigh: 400 },
    { cLow: 34.1, cHigh: 50, iLow: 401, iHigh: 500 },
  ],
  o3: [
    { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
    { cLow: 51, cHigh: 100, iLow: 51, iHigh: 100 },
    { cLow: 101, cHigh: 168, iLow: 101, iHigh: 200 },
    { cLow: 169, cHigh: 208, iLow: 201, iHigh: 300 },
    { cLow: 209, cHigh: 748, iLow: 301, iHigh: 400 },
    { cLow: 749, cHigh: 1000, iLow: 401, iHigh: 500 },
  ],
};

// US EPA Breakpoints for PM2.5 and PM10
const US_AQI_BREAKPOINTS: Record<string, Breakpoint[]> = {
  pm25: [
    { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50 },
    { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
    { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
    { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
    { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
    { cLow: 250.5, cHigh: 500.4, iLow: 301, iHigh: 500 },
  ],
  pm10: [
    { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 },
    { cLow: 55, cHigh: 154, iLow: 51, iHigh: 100 },
    { cLow: 155, cHigh: 254, iLow: 101, iHigh: 150 },
    { cLow: 255, cHigh: 354, iLow: 151, iHigh: 200 },
    { cLow: 355, cHigh: 424, iLow: 201, iHigh: 300 },
    { cLow: 425, cHigh: 604, iLow: 301, iHigh: 500 },
  ],
};

/**
 * Calculates the sub-index for a given pollutant concentration using linear interpolation.
 * I = ((I_high - I_low) / (C_high - C_low)) * (C - C_low) + I_low
 */
export function calculateSubIndex(
  pollutant: string,
  concentration: number,
  standard: AQIStandard = "INDIAN_NAQI"
): number | null {
  if (concentration < 0 || isNaN(concentration)) {
    return null;
  }

  const table = standard === "INDIAN_NAQI" ? NAQI_BREAKPOINTS : US_AQI_BREAKPOINTS;
  const breakpoints = table[pollutant.toLowerCase()];

  if (!breakpoints || breakpoints.length === 0) {
    return null;
  }

  // If concentration is higher than top range, cap at max scale
  const last = breakpoints[breakpoints.length - 1];
  if (concentration >= last.cHigh) {
    return 500;
  }

  for (const bp of breakpoints) {
    if (concentration >= bp.cLow && concentration <= bp.cHigh) {
      const slope = (bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow);
      const subIndex = slope * (concentration - bp.cLow) + bp.iLow;
      return Math.round(subIndex);
    }
  }

  // Handle minor gaps between float breakpoints (e.g. 30 to 31)
  for (let i = 0; i < breakpoints.length - 1; i++) {
    const cur = breakpoints[i];
    const next = breakpoints[i + 1];
    if (concentration > cur.cHigh && concentration < next.cLow) {
      return cur.iHigh;
    }
  }

  return null;
}

/**
 * Maps an AQI value to its standardized Indian NAQI category
 */
export function getIndianNAQICategory(aqi: number): AQICategory {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Satisfactory";
  if (aqi <= 200) return "Moderate";
  if (aqi <= 300) return "Poor";
  if (aqi <= 400) return "Very Poor";
  return "Severe";
}

/**
 * Maps an AQI value to its US EPA Category string mapped to unified domain categories
 */
export function getUSAQICategory(aqi: number): AQICategory {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Satisfactory"; // Moderate in US
  if (aqi <= 150) return "Moderate";     // USG in US
  if (aqi <= 200) return "Poor";         // Unhealthy in US
  if (aqi <= 300) return "Very Poor";    // Very Unhealthy in US
  return "Severe";                       // Hazardous in US
}

export function getAQICategory(aqi: number, standard: AQIStandard = "INDIAN_NAQI"): AQICategory {
  return standard === "INDIAN_NAQI" ? getIndianNAQICategory(aqi) : getUSAQICategory(aqi);
}

/**
 * Derives overall Indian NAQI from available pollutant measurements
 */
export function calculateOverallAQI(
  measurements: Record<string, number>,
  standard: AQIStandard = "INDIAN_NAQI"
): {
  aqi: number;
  category: AQICategory;
  dominantPollutant: string;
  subIndices: Record<string, number>;
} {
  const subIndices: Record<string, number> = {};
  let maxAQI = 0;
  let dominant = "pm25";

  for (const [key, val] of Object.entries(measurements)) {
    const subIdx = calculateSubIndex(key, val, standard);
    if (subIdx !== null) {
      subIndices[key] = subIdx;
      if (subIdx > maxAQI) {
        maxAQI = subIdx;
        dominant = key;
      }
    }
  }

  // Default fallback if no valid pollutant subindices computed
  if (maxAQI === 0 && Object.keys(measurements).length === 0) {
    return {
      aqi: 0,
      category: "Good",
      dominantPollutant: "none",
      subIndices: {},
    };
  }

  return {
    aqi: maxAQI,
    category: getAQICategory(maxAQI, standard),
    dominantPollutant: dominant,
    subIndices,
  };
}

/**
 * Generates health advisories based on AQI category
 */
export function getHealthAdvisory(category: AQICategory): {
  general: string;
  sensitiveGroups: string;
  actionableAdvice: string[];
} {
  switch (category) {
    case "Good":
      return {
        general: "Air quality is considered satisfactory, and air pollution poses little or no risk.",
        sensitiveGroups: "No restrictions. Excellent conditions for all outdoor activities.",
        actionableAdvice: [
          "Ideal day for outdoor sports, walks, and opening windows.",
          "Enjoy outdoor natural ventilation.",
        ],
      };
    case "Satisfactory":
      return {
        general: "Air quality is acceptable; however, a minor breathing discomfort may occur for extremely sensitive people.",
        sensitiveGroups: "Unusually sensitive individuals should monitor for throat irritation or coughing.",
        actionableAdvice: [
          "Normal outdoor activities are safe for the general public.",
          "Good window for home airing during midday.",
        ],
      };
    case "Moderate":
      return {
        general: "Air quality may cause breathing discomfort to people with lung disease, asthma, and heart conditions.",
        sensitiveGroups: "Children, seniors, and individuals with respiratory issues should limit prolonged heavy outdoor exertion.",
        actionableAdvice: [
          "Consider reducing prolonged outdoor strenuous exercise.",
          "Keep windows closed during early morning and late evening rush hours.",
          "Use indoor exercise alternatives if sensitive.",
        ],
      };
    case "Poor":
      return {
        general: "Breathing discomfort to most people on prolonged exposure. Triggers irritation in eyes, nose, and throat.",
        sensitiveGroups: "High risk for children, elderly, and those with heart/lung disease. Avoid outdoor exercise.",
        actionableAdvice: [
          "Wear a certified N95/FFP2 respirator mask when stepping outside.",
          "Keep windows shut; run indoor HEPA air purifiers.",
          "Reschedule outdoor sports, runs, and cycling to indoor settings.",
        ],
      };
    case "Very Poor":
      return {
        general: "Respiratory illness on prolonged exposure. Significant health impact on entire population.",
        sensitiveGroups: "Strictly avoid outdoor exertion. High risk of asthma attacks, bronchitis flare-ups.",
        actionableAdvice: [
          "Mandatory N95/N99 mask outdoors; minimize all outdoor exposure.",
          "Operate air purifiers continuously on auto/medium mode.",
          "Seal drafts around doors and windows.",
          "Avoid any open burning, frying, or incense burning indoors.",
        ],
      };
    case "Severe":
    default:
      return {
        general: "Severe health hazard. Affects healthy people and seriously impacts those with existing diseases. Emergency levels.",
        sensitiveGroups: "Everyone must remain indoors. Children, pregnant women, and elderly must avoid all outdoor presence.",
        actionableAdvice: [
          "EMERGENCY WARNING: Remain inside sealed rooms with air filtration.",
          "Do not open windows even for a few minutes; winter inversion traps extreme particulates.",
          "Avoid any strenuous physical activity indoors to lower inhalation rate.",
          "Keep emergency inhalers and medications readily accessible.",
        ],
      };
  }
}
