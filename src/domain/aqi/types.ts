export type AQICategory =
  | "Good"
  | "Satisfactory"
  | "Moderate"
  | "Poor"
  | "Very Poor"
  | "Severe";

export type AQIStandard = "INDIAN_NAQI" | "US_AQI";

export type DataSourceType = "STATION_OBSERVATION" | "MODEL_ESTIMATE" | "DEMO_SAMPLE";

export interface PollutantMeasurement {
  code: "pm25" | "pm10" | "no2" | "so2" | "co" | "o3" | "nh3";
  name: string;
  value: number; // in µg/m³, except CO in mg/m³
  unit: string;
  subIndex?: number;
  standardLimit?: number;
}

export interface MonitoringStation {
  id: string;
  name: string;
  city: string;
  state?: string;
  country: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
}

export interface AirQualityData {
  aqi: number;
  category: AQICategory;
  standard: AQIStandard;
  dominantPollutant: string;
  pollutants: Record<string, PollutantMeasurement>;
  station?: MonitoringStation;
  source: string;
  sourceType: DataSourceType;
  attribution: string;
  timestamp: string; // ISO string
  isStale: boolean;
  healthAdvisory: {
    general: string;
    sensitiveGroups: string;
    actionableAdvice: string[];
  };
}

export interface HourlyAQIPoint {
  timestamp: string; // ISO string
  aqi: number;
  pm25?: number;
  pm10?: number;
  category: AQICategory;
}

export interface AQIForecastData {
  current: AirQualityData;
  historical24h: HourlyAQIPoint[];
  forecast72h: HourlyAQIPoint[];
  standard: AQIStandard;
  source: string;
  sourceType: DataSourceType;
  generatedAt: string;
}
