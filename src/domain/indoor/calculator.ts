export interface CADRCalculationResult {
  roomVolumeM3: number;
  roomAreaSqFt: number;
  targetACH: number; // Air Changes per Hour
  requiredCADRm3h: number; // m3/h
  requiredCADRcfm: number; // CFM
  recommendedFilterType: string;
  fanSpeedGuidance: string;
}

export function calculateRequiredCADR(
  lengthMeters: number,
  widthMeters: number,
  heightMeters: number = 2.8,
  targetACH: number = 4.5
): CADRCalculationResult {
  const safeLength = Math.max(1, lengthMeters);
  const safeWidth = Math.max(1, widthMeters);
  const safeHeight = Math.max(1.8, heightMeters);

  const roomVolumeM3 = Math.round(safeLength * safeWidth * safeHeight * 10) / 10;
  const roomAreaSqFt = Math.round(safeLength * safeWidth * 10.7639);

  const requiredCADRm3h = Math.round(roomVolumeM3 * targetACH);
  const requiredCADRcfm = Math.round(requiredCADRm3h / 1.699);

  let fanSpeedGuidance = "Normal / Medium mode is sufficient for maintaining air quality.";
  if (targetACH >= 5) {
    fanSpeedGuidance = "High / Turbo mode recommended during severe winter smog episodes.";
  }

  return {
    roomVolumeM3,
    roomAreaSqFt,
    targetACH,
    requiredCADRm3h,
    requiredCADRcfm,
    recommendedFilterType: "True HEPA H13 (99.97% retention at 0.3 µm) + Honeycomb Activated Carbon layer (for VOCs & gases)",
    fanSpeedGuidance,
  };
}

export interface VentilationWindowResult {
  isSafeToOpenWindows: boolean;
  optimalTimeSlot: string;
  durationMinutes: number;
  guidelines: string[];
  scientificReason: string;
}

export function getVentilationGuidance(aqi: number): VentilationWindowResult {
  if (aqi >= 300) {
    return {
      isSafeToOpenWindows: false,
      optimalTimeSlot: "None – Keep Windows Completely Sealed",
      durationMinutes: 0,
      guidelines: [
        "Keep all external doors and windows sealed with weatherstripping or rolled towels.",
        "Rely 100% on mechanical HEPA air filtration.",
        "Ensure kitchen exhaust is run only during cooking and bathroom vents are capped when not in use.",
        "Do not burn incense sticks, candles, or mosquito coils indoors.",
      ],
      scientificReason: "Severe winter smog inversion traps ultra-fine toxic particles near the ground. Opening windows even for 5 minutes can surge indoor PM2.5 to hazardous levels.",
    };
  }

  if (aqi >= 200) {
    return {
      isSafeToOpenWindows: false,
      optimalTimeSlot: "13:00 - 14:00 (Max 10 minutes quick air exchange if stuffy)",
      durationMinutes: 10,
      guidelines: [
        "Only open windows if indoor CO2 exceeds 1200 ppm, strictly between 1:00 PM and 2:00 PM.",
        "Turn off air purifiers while windows are open; seal immediately after 10 minutes.",
        "Run air purifiers on MAXIMUM / TURBO speed for 45 minutes immediately after closing windows.",
      ],
      scientificReason: "Solar radiation creates the deepest atmospheric mixing height around midday, dispersing morning inversion smog before nighttime boundary layer collapse.",
    };
  }

  if (aqi >= 100) {
    return {
      isSafeToOpenWindows: true,
      optimalTimeSlot: "11:30 - 15:30",
      durationMinutes: 45,
      guidelines: [
        "Open windows for cross-ventilation during peak afternoon sunlight.",
        "Close all windows before 5:00 PM as evening rush-hour traffic emissions begin to accumulate.",
        "Wipe window sills with a damp cloth after closing to catch deposited particulate matter.",
      ],
      scientificReason: "Moderate AQI allows afternoon ventilation when temperature is highest and road traffic lull allows cleaner ambient air exchange.",
    };
  }

  return {
    isSafeToOpenWindows: true,
    optimalTimeSlot: "All Day (Morning to Evening)",
    durationMinutes: 180,
    guidelines: [
      "Keep windows open for natural fresh air circulation.",
      "Airing out the home flushes out indoor volatile organic compounds (VOCs) and indoor radon.",
    ],
    scientificReason: "Ambient air is clean; natural ventilation keeps indoor CO2 low and prevents indoor mold or stagnant air.",
  };
}
