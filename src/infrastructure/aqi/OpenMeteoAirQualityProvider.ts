import {
  AirQualityData,
  AQIForecastData,
  AQIStandard,
  HourlyAQIPoint,
  PollutantMeasurement,
} from "@/domain/aqi/types";
import {
  calculateOverallAQI,
  calculateSubIndex,
  getAQICategory,
  getHealthAdvisory,
} from "@/domain/aqi/calculator";
import { IAQIService } from "./IAQIService";

export class OpenMeteoAirQualityProvider implements IAQIService {
  readonly providerName = "Open-Meteo Air Quality";

  private baseUrl = "https://air-quality-api.open-meteo.com/v1/air-quality";

  constructor(private fetchFn: typeof fetch = fetch) {}

  async getAirQuality(
    latitude: number,
    longitude: number,
    standard: AQIStandard = "INDIAN_NAQI"
  ): Promise<AirQualityData> {
    const url = `${this.baseUrl}?latitude=${latitude}&longitude=${longitude}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await this.fetchFn(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        throw new Error(`Open-Meteo Air Quality API error: ${res.status} ${res.statusText}`);
      }

      const json = await res.json();
      return this.mapCurrentData(json, standard);
    } finally {
      clearTimeout(timeout);
    }
  }

  async getForecast(
    latitude: number,
    longitude: number,
    standard: AQIStandard = "INDIAN_NAQI"
  ): Promise<AQIForecastData> {
    const url = `${this.baseUrl}?latitude=${latitude}&longitude=${longitude}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi&hourly=pm10,pm2_5,us_aqi&forecast_days=3&past_days=1`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    try {
      const res = await this.fetchFn(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        throw new Error(`Open-Meteo Forecast API error: ${res.status} ${res.statusText}`);
      }

      const json = await res.json();
      const current = this.mapCurrentData(json, standard);
      const { historical24h, forecast72h } = this.mapHourlyData(json, standard);

      return {
        current,
        historical24h,
        forecast72h,
        standard,
        source: "Open-Meteo / Copernicus Atmospheric Monitoring Service",
        sourceType: "MODEL_ESTIMATE",
        generatedAt: new Date().toISOString(),
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private mapCurrentData(data: any, standard: AQIStandard): AirQualityData {
    const cur = data?.current || {};

    const measurement = (value: unknown, divisor = 1, decimals = 1): number | undefined =>
      typeof value === "number" && Number.isFinite(value) && value >= 0
        ? Math.round((value / divisor) * (10 ** decimals)) / (10 ** decimals)
        : undefined;
    const pm25Val = measurement(cur.pm2_5);
    const pm10Val = measurement(cur.pm10);
    const no2Val = measurement(cur.nitrogen_dioxide);
    const so2Val = measurement(cur.sulphur_dioxide);
    // Open-Meteo returns CO in µg/m³. Indian NAQI measures CO in mg/m³
    const coVal = measurement(cur.carbon_monoxide, 1000, 2);
    const o3Val = measurement(cur.ozone);
    if (pm25Val === undefined && pm10Val === undefined) throw new Error("Air quality response did not include particulate measurements");

    const rawMeasurements: Record<string, number> = {
      ...(pm25Val !== undefined && { pm25: pm25Val }),
      ...(pm10Val !== undefined && { pm10: pm10Val }),
      ...(no2Val !== undefined && { no2: no2Val }),
      ...(so2Val !== undefined && { so2: so2Val }),
      ...(coVal !== undefined && { co: coVal }),
      ...(o3Val !== undefined && { o3: o3Val }),
    };

    const overall = calculateOverallAQI(rawMeasurements, standard);

    // If standard is US_AQI and Open-Meteo provided a native us_aqi, use it if calculated is 0
    let aqi = overall.aqi;
    if (standard === "US_AQI" && typeof cur.us_aqi === "number" && cur.us_aqi > 0) {
      aqi = Math.round(cur.us_aqi);
    }

    const category = getAQICategory(aqi, standard);
    const advisory = getHealthAdvisory(category);

    const allPollutants: Record<string, PollutantMeasurement> = {
      pm25: {
        code: "pm25",
        name: "Fine Particulate Matter (PM2.5)",
        value: pm25Val ?? 0,
        unit: "µg/m³",
        subIndex: pm25Val === undefined ? undefined : calculateSubIndex("pm25", pm25Val, standard) ?? undefined,
        standardLimit: standard === "INDIAN_NAQI" ? 60 : 35,
      },
      pm10: {
        code: "pm10",
        name: "Coarse Particulate Matter (PM10)",
        value: pm10Val ?? 0,
        unit: "µg/m³",
        subIndex: pm10Val === undefined ? undefined : calculateSubIndex("pm10", pm10Val, standard) ?? undefined,
        standardLimit: standard === "INDIAN_NAQI" ? 100 : 150,
      },
      no2: {
        code: "no2",
        name: "Nitrogen Dioxide (NO2)",
        value: no2Val ?? 0,
        unit: "µg/m³",
        subIndex: no2Val === undefined ? undefined : calculateSubIndex("no2", no2Val, standard) ?? undefined,
        standardLimit: 80,
      },
      so2: {
        code: "so2",
        name: "Sulphur Dioxide (SO2)",
        value: so2Val ?? 0,
        unit: "µg/m³",
        subIndex: so2Val === undefined ? undefined : calculateSubIndex("so2", so2Val, standard) ?? undefined,
        standardLimit: 80,
      },
      co: {
        code: "co",
        name: "Carbon Monoxide (CO)",
        value: coVal ?? 0,
        unit: "mg/m³",
        subIndex: coVal === undefined ? undefined : calculateSubIndex("co", coVal, standard) ?? undefined,
        standardLimit: 2.0,
      },
      o3: {
        code: "o3",
        name: "Ozone (O3)",
        value: o3Val ?? 0,
        unit: "µg/m³",
        subIndex: o3Val === undefined ? undefined : calculateSubIndex("o3", o3Val, standard) ?? undefined,
        standardLimit: 100,
      },
    };
    const pollutants = Object.fromEntries(Object.entries(allPollutants).filter(([key]) => rawMeasurements[key] !== undefined));

    return {
      aqi,
      category,
      standard,
      dominantPollutant: overall.dominantPollutant.toUpperCase(),
      pollutants,
      source: "Open-Meteo / Copernicus Atmospheric Service",
      sourceType: "MODEL_ESTIMATE",
      attribution: "Copernicus Atmosphere Monitoring Service (CAMS) Global Atmospheric Model",
      timestamp: cur.time ? new Date(cur.time).toISOString() : new Date().toISOString(),
      isStale: false,
      healthAdvisory: advisory,
    };
  }

  private mapHourlyData(
    data: any,
    standard: AQIStandard
  ): { historical24h: HourlyAQIPoint[]; forecast72h: HourlyAQIPoint[] } {
    const hourly = data?.hourly;
    if (!hourly || !Array.isArray(hourly.time)) {
      return { historical24h: [], forecast72h: [] };
    }

    const times: string[] = hourly.time;
    const pm25List: number[] = hourly.pm2_5 || [];
    const pm10List: number[] = hourly.pm10 || [];
    const usAqiList: number[] = hourly.us_aqi || [];

    const nowIso = new Date().toISOString();
    const allPoints: HourlyAQIPoint[] = [];

    for (let i = 0; i < times.length; i++) {
      const t = times[i];
      const p25 = pm25List[i];
      const p10 = pm10List[i];
      const safePm25 = typeof p25 === "number" && Number.isFinite(p25) && p25 >= 0 ? p25 : undefined;
      const safePm10 = typeof p10 === "number" && Number.isFinite(p10) && p10 >= 0 ? p10 : undefined;
      const hasPm25 = safePm25 !== undefined;
      const hasPm10 = safePm10 !== undefined;
      if (!hasPm25 && !hasPm10) continue;

      let aqiVal: number;
      if (standard === "INDIAN_NAQI") {
        const sub25 = safePm25 === undefined ? 0 : calculateSubIndex("pm25", safePm25, "INDIAN_NAQI") ?? 0;
        const sub10 = safePm10 === undefined ? 0 : calculateSubIndex("pm10", safePm10, "INDIAN_NAQI") ?? 0;
        aqiVal = Math.max(sub25, sub10);
      } else {
        aqiVal = usAqiList[i] ?? (safePm25 === undefined ? calculateSubIndex("pm10", safePm10 ?? 0, "US_AQI") ?? 0 : calculateSubIndex("pm25", safePm25, "US_AQI") ?? 0);
      }

      allPoints.push({
        timestamp: new Date(t).toISOString(),
        aqi: Math.round(aqiVal),
        ...(safePm25 !== undefined && { pm25: Math.round(safePm25 * 10) / 10 }),
        ...(safePm10 !== undefined && { pm10: Math.round(safePm10 * 10) / 10 }),
        category: getAQICategory(Math.round(aqiVal), standard),
      });
    }

    // Split points into past 24 hours and future 72 hours relative to current time
    const historical24h = allPoints.filter((p) => p.timestamp <= nowIso).slice(-24);
    const forecast72h = allPoints.filter((p) => p.timestamp > nowIso).slice(0, 72);

    return { historical24h, forecast72h };
  }
}
