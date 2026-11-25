import { AirQualityData, AQIForecastData, AQIStandard } from "@/domain/aqi/types";
import { IAQIService } from "./IAQIService";
import { OpenMeteoAirQualityProvider } from "./OpenMeteoAirQualityProvider";
import { WaqiAirQualityProvider } from "./WaqiAirQualityProvider";
import { CPCBReferenceProvider } from "./CPCBReferenceProvider";
import { MemoryCache } from "../cache/MemoryCache";

export class AggregatingAQIProvider implements IAQIService {
  readonly providerName = "Aggregating Air Quality Provider";

  private openMeteo: OpenMeteoAirQualityProvider;
  private waqi: WaqiAirQualityProvider;
  private cache: MemoryCache<AirQualityData>;
  private forecastCache: MemoryCache<AQIForecastData>;

  constructor(
    waqiToken?: string,
    fetchFn: typeof fetch = fetch,
    cacheTtlMs: number = 10 * 60 * 1000 // 10 minutes cache
  ) {
    this.openMeteo = new OpenMeteoAirQualityProvider(fetchFn);
    this.waqi = new WaqiAirQualityProvider(waqiToken, fetchFn);
    this.cache = new MemoryCache<AirQualityData>(cacheTtlMs);
    this.forecastCache = new MemoryCache<AQIForecastData>(cacheTtlMs);
  }

  async getAirQuality(
    latitude: number,
    longitude: number,
    standard: AQIStandard = "INDIAN_NAQI"
  ): Promise<AirQualityData> {
    const cacheKey = `aqi:${latitude.toFixed(3)}:${longitude.toFixed(3)}:${standard}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    // 1. Try Ground Station (WAQI) if token available
    try {
      const stationData = await this.waqi.getAirQuality(latitude, longitude, standard);
      this.cache.set(cacheKey, stationData);
      return stationData;
    } catch {
      // WAQI failed or token was missing, proceed to Open-Meteo
    }

    // 2. Try Open-Meteo Air Quality model
    try {
      const modelData = await this.openMeteo.getAirQuality(latitude, longitude, standard);
      // Enrich with nearby CPCB preset station name if in India
      const preset = CPCBReferenceProvider.findPresetByCoords(latitude, longitude);
      if (preset && !modelData.station) {
        modelData.station = {
          id: `cpcb-${preset.name.toLowerCase()}`,
          name: preset.stationName,
          city: preset.name,
          state: preset.state,
          country: preset.country,
          latitude: preset.latitude,
          longitude: preset.longitude,
        };
      }
      this.cache.set(cacheKey, modelData);
      return modelData;
    } catch {
      // Avoid presenting an unrelated city's sample values as this location's AQI.
      throw new Error("Live air quality is currently unavailable for this location");
    }
  }

  async getForecast(
    latitude: number,
    longitude: number,
    standard: AQIStandard = "INDIAN_NAQI"
  ): Promise<AQIForecastData> {
    const cacheKey = `forecast:${latitude.toFixed(3)}:${longitude.toFixed(3)}:${standard}`;
    const cached = this.forecastCache.get(cacheKey);
    if (cached) return cached;

    try {
      const forecast = await this.openMeteo.getForecast(latitude, longitude, standard);
      this.forecastCache.set(cacheKey, forecast);
      return forecast;
    } catch {
      throw new Error("Air quality forecast is currently unavailable for this location");
    }
  }
}
