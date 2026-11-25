import { AirQualityData, AQIForecastData, AQIStandard } from "@/domain/aqi/types";

export interface IAQIService {
  providerName: string;
  getAirQuality(
    latitude: number,
    longitude: number,
    standard?: AQIStandard
  ): Promise<AirQualityData>;
  getForecast(
    latitude: number,
    longitude: number,
    standard?: AQIStandard
  ): Promise<AQIForecastData>;
}
