import {
  AirQualityData,
  AQIForecastData,
  AQIStandard,
  MonitoringStation,
  PollutantMeasurement,
} from "@/domain/aqi/types";
import {
  calculateOverallAQI,
  calculateSubIndex,
  getAQICategory,
  getHealthAdvisory,
} from "@/domain/aqi/calculator";
import { IAQIService } from "./IAQIService";

export class WaqiAirQualityProvider implements IAQIService {
  readonly providerName = "WAQI Ground Station";

  private baseUrl = "https://api.waqi.info/feed";

  constructor(
    private apiToken?: string,
    private fetchFn: typeof fetch = fetch
  ) {}

  async getAirQuality(
    latitude: number,
    longitude: number,
    standard: AQIStandard = "INDIAN_NAQI"
  ): Promise<AirQualityData> {
    if (!this.apiToken) {
      throw new Error("WAQI API token is not configured.");
    }

    const url = `${this.baseUrl}/geo:${latitude};${longitude}/?token=${encodeURIComponent(this.apiToken)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await this.fetchFn(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        throw new Error(`WAQI API request failed with status: ${res.status}`);
      }

      const json = await res.json();
      if (json.status !== "ok" || !json.data) {
        throw new Error(`WAQI API error: ${json.data || "Unknown error"}`);
      }

      return this.mapStationData(json.data, standard);
    } finally {
      clearTimeout(timeout);
    }
  }

  async getForecast(
    latitude: number,
    longitude: number,
    standard: AQIStandard = "INDIAN_NAQI"
  ): Promise<AQIForecastData> {
    // WAQI feed API primarily provides current station observation; forecast is basic daily min/max.
    const current = await this.getAirQuality(latitude, longitude, standard);
    return {
      current,
      historical24h: [],
      forecast72h: [],
      standard,
      source: `Ground Station: ${current.station?.name || "Official Station"}`,
      sourceType: "STATION_OBSERVATION",
      generatedAt: new Date().toISOString(),
    };
  }

  private mapStationData(data: any, standard: AQIStandard): AirQualityData {
    const iaqi = data.iaqi || {};
    const rawValues: Record<string, number | undefined> = {
      pm25: this.readValue(iaqi.pm25?.v),
      pm10: this.readValue(iaqi.pm10?.v),
      no2: this.readValue(iaqi.no2?.v),
      so2: this.readValue(iaqi.so2?.v),
      co: this.readValue(iaqi.co?.v),
      o3: this.readValue(iaqi.o3?.v),
    };
    const availableValues = Object.fromEntries(Object.entries(rawValues).filter((entry): entry is [string, number] => entry[1] !== undefined));
    const calculated = calculateOverallAQI(availableValues, standard);
    // WAQI's index uses US AQI breakpoints. For India, derive NAQI from reported concentrations.
    const aqi = standard === "US_AQI" && typeof data.aqi === "number" && Number.isFinite(data.aqi)
      ? Math.round(data.aqi)
      : calculated.aqi;
    if (!Object.keys(availableValues).length) throw new Error("WAQI response has no pollutant measurements");
    const category = getAQICategory(aqi, standard);
    const advisory = getHealthAdvisory(category);

    const station: MonitoringStation = {
      id: String(data.idx || "station"),
      name: data.city?.name || "Official Monitoring Station",
      city: data.city?.name?.split(",")[0]?.trim() || "Local Station",
      country: "Station Network",
      latitude: data.city?.geo?.[0] ?? 0,
      longitude: data.city?.geo?.[1] ?? 0,
    };

    // Extract pollutants
    const pm25Val = rawValues.pm25;
    const pm10Val = rawValues.pm10;
    const no2Val = rawValues.no2;
    const so2Val = rawValues.so2;
    const coVal = rawValues.co;
    const o3Val = rawValues.o3;

    const allPollutants: Record<string, PollutantMeasurement> = {
      ...(pm25Val !== undefined && { pm25: {
        code: "pm25",
        name: "Fine Particulate Matter (PM2.5)",
        value: pm25Val,
        unit: "µg/m³",
        subIndex: calculateSubIndex("pm25", pm25Val, standard) ?? undefined,
      } }),
      ...(pm10Val !== undefined && { pm10: {
        code: "pm10",
        name: "Coarse Particulate Matter (PM10)",
        value: pm10Val,
        unit: "µg/m³",
        subIndex: calculateSubIndex("pm10", pm10Val, standard) ?? undefined,
      } }),
      ...(no2Val !== undefined && { no2: {
        code: "no2",
        name: "Nitrogen Dioxide (NO2)",
        value: no2Val,
        unit: "µg/m³",
        subIndex: calculateSubIndex("no2", no2Val, standard) ?? undefined,
      } }),
      ...(so2Val !== undefined && { so2: {
        code: "so2",
        name: "Sulphur Dioxide (SO2)",
        value: so2Val,
        unit: "µg/m³",
        subIndex: calculateSubIndex("so2", so2Val, standard) ?? undefined,
      } }),
      ...(coVal !== undefined && { co: {
        code: "co",
        name: "Carbon Monoxide (CO)",
        value: coVal,
        unit: "mg/m³",
        subIndex: calculateSubIndex("co", coVal, standard) ?? undefined,
      } }),
      ...(o3Val !== undefined && { o3: {
        code: "o3",
        name: "Ozone (O3)",
        value: o3Val,
        unit: "µg/m³",
        subIndex: calculateSubIndex("o3", o3Val, standard) ?? undefined,
      } }),
    };
    const pollutants = allPollutants;

    // Attribution string
    const attributions = (data.attributions || []).map((a: any) => a.name).join(", ") ||
      "CPCB / State Pollution Control Board / WAQI";

    return {
      aqi,
      category,
      standard,
      dominantPollutant: (data.dominentpol || "pm25").toUpperCase(),
      pollutants,
      station,
      source: `Ground Station Observation: ${station.name}`,
      sourceType: "STATION_OBSERVATION",
      attribution: attributions,
      timestamp: data.time?.iso || new Date().toISOString(),
      isStale: false,
      healthAdvisory: advisory,
    };
  }

  private readValue(value: unknown): number | undefined {
    return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
  }
}
