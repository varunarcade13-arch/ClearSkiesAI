export type TransportMode =
  | "solo_petrol_car"
  | "solo_diesel_car"
  | "carpool_3p"
  | "electric_car"
  | "electric_two_wheeler"
  | "metro_train"
  | "public_bus"
  | "cycling_walking";

export interface TransportComparison {
  mode: TransportMode;
  modeLabel: string;
  co2GramsPerKm: number;
  pmGramsPerKm: number;
  isSafeAtCurrentAqi: boolean;
  healthSafetyNote: string;
  weeklyCo2Kg: number;
  weeklyPmGrams: number;
}

const EMISSION_FACTORS: Record<
  TransportMode,
  { label: string; co2PerKm: number; pmPerKm: number; maxSafeAqi: number }
> = {
  solo_petrol_car: { label: "Solo Petrol Car", co2PerKm: 170, pmPerKm: 0.085, maxSafeAqi: 500 },
  solo_diesel_car: { label: "Solo Diesel Car", co2PerKm: 195, pmPerKm: 0.14, maxSafeAqi: 500 },
  carpool_3p: { label: "Carpool (3 Passengers)", co2PerKm: 58, pmPerKm: 0.03, maxSafeAqi: 500 },
  electric_car: { label: "Electric Car (EV)", co2PerKm: 42, pmPerKm: 0.005, maxSafeAqi: 500 },
  electric_two_wheeler: { label: "Electric 2-Wheeler (E-Scooter)", co2PerKm: 22, pmPerKm: 0.002, maxSafeAqi: 150 },
  metro_train: { label: "Electric Rapid Metro", co2PerKm: 16, pmPerKm: 0.001, maxSafeAqi: 500 },
  public_bus: { label: "City Transit Bus", co2PerKm: 38, pmPerKm: 0.02, maxSafeAqi: 300 },
  cycling_walking: { label: "Walking / Cycling", co2PerKm: 0, pmPerKm: 0, maxSafeAqi: 120 },
};

export function compareTransportOptions(
  oneWayDistanceKm: number,
  tripsPerWeek: number,
  currentAqi: number
): {
  options: TransportComparison[];
  bestEcoOption: TransportComparison;
  bestHealthSafeOption: TransportComparison;
  assumptions: string;
} {
  const safeDistance = Math.max(1, oneWayDistanceKm);
  const safeTrips = Math.max(1, tripsPerWeek);
  const totalWeeklyKm = safeDistance * 2 * safeTrips;

  const options: TransportComparison[] = (
    Object.keys(EMISSION_FACTORS) as TransportMode[]
  ).map((mode) => {
    const factor = EMISSION_FACTORS[mode];
    const isSafeAtCurrentAqi = currentAqi <= factor.maxSafeAqi;

    let healthSafetyNote = "Safe for daily commute.";
    if (!isSafeAtCurrentAqi) {
      if (mode === "cycling_walking" || mode === "electric_two_wheeler") {
        healthSafetyNote = `High health risk! Ambient AQI (${currentAqi}) exceeds safe limit (${factor.maxSafeAqi}) for open-air exertion. Wear certified N95 or switch to enclosed transport.`;
      } else {
        healthSafetyNote = `Elevated particulate exposure during transit; keep windows shut and wear mask.`;
      }
    }

    const weeklyCo2Kg = Math.round((factor.co2PerKm * totalWeeklyKm) / 1000 * 10) / 10;
    const weeklyPmGrams = Math.round(factor.pmPerKm * totalWeeklyKm * 10) / 10;

    return {
      mode,
      modeLabel: factor.label,
      co2GramsPerKm: factor.co2PerKm,
      pmGramsPerKm: factor.pmPerKm,
      isSafeAtCurrentAqi,
      healthSafetyNote,
      weeklyCo2Kg,
      weeklyPmGrams,
    };
  });

  // Best eco option is lowest CO2 among health-safe options
  const safeOptions = options.filter((o) => o.isSafeAtCurrentAqi);
  const pool = safeOptions.length > 0 ? safeOptions : options;
  const bestEcoOption = [...pool].sort((a, b) => a.weeklyCo2Kg - b.weeklyCo2Kg)[0];

  // Best health safe option is enclosed mass transit (Metro)
  const metroOption = options.find((o) => o.mode === "metro_train") || options[0];

  return {
    options,
    bestEcoOption,
    bestHealthSafeOption: metroOption,
    assumptions: `Estimates assume round trip of ${safeDistance * 2} km, ${safeTrips} days/week. Emission factors derived from ARAI & Central Road Research Institute lifecycle data.`,
  };
}
