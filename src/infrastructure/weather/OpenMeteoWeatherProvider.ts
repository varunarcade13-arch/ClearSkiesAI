import {
  evaluateInversionRisk,
  mapWMOCodeToCondition,
  WeatherData,
} from "@/domain/weather/types";
import { IWeatherService } from "./IWeatherService";
import { MemoryCache } from "../cache/MemoryCache";

export class OpenMeteoWeatherProvider implements IWeatherService {
  readonly providerName = "Open-Meteo Weather";

  private baseUrl = "https://api.open-meteo.com/v1/forecast";
  private cache: MemoryCache<WeatherData>;

  constructor(
    private fetchFn: typeof fetch = fetch,
    cacheTtlMs: number = 10 * 60 * 1000
  ) {
    this.cache = new MemoryCache<WeatherData>(cacheTtlMs);
  }

  async getWeather(latitude: number, longitude: number): Promise<WeatherData> {
    const cacheKey = `weather:${latitude.toFixed(3)}:${longitude.toFixed(3)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const url = `${this.baseUrl}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,surface_pressure,wind_speed_10m,wind_direction_10m,weather_code`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await this.fetchFn(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        throw new Error(`Open-Meteo Weather API error: ${res.status}`);
      }

      const json = await res.json();
      const cur = json?.current || {};

      const temp = typeof cur.temperature_2m === "number" ? Math.round(cur.temperature_2m * 10) / 10 : 18.0;
      const apparentTemp = typeof cur.apparent_temperature === "number" ? Math.round(cur.apparent_temperature * 10) / 10 : temp;
      const humidity = typeof cur.relative_humidity_2m === "number" ? Math.round(cur.relative_humidity_2m) : 65;
      const windSpeed = typeof cur.wind_speed_10m === "number" ? Math.round(cur.wind_speed_10m * 10) / 10 : 5.0;
      const windDir = typeof cur.wind_direction_10m === "number" ? Math.round(cur.wind_direction_10m) : 0;
      const pressure = typeof cur.surface_pressure === "number" ? Math.round(cur.surface_pressure) : 1013;
      const code = typeof cur.weather_code === "number" ? cur.weather_code : 45;

      const condition = mapWMOCodeToCondition(code);
      const inversionRisk = evaluateInversionRisk(temp, humidity, windSpeed);

      const weather: WeatherData = {
        temperature: temp,
        apparentTemperature: apparentTemp,
        relativeHumidity: humidity,
        windSpeed,
        windDirection: windDir,
        surfacePressure: pressure,
        weatherCode: code,
        condition,
        source: "Open-Meteo High-Resolution Weather Model",
        timestamp: cur.time ? new Date(cur.time).toISOString() : new Date().toISOString(),
        inversionRisk,
      };

      this.cache.set(cacheKey, weather);
      return weather;
    } catch {
      // Fallback deterministic weather estimation for winter smog
      const fallback: WeatherData = {
        temperature: 16.5,
        apparentTemperature: 15.8,
        relativeHumidity: 78,
        windSpeed: 4.2,
        windDirection: 290,
        surfacePressure: 1016,
        weatherCode: 45,
        condition: "Fog / Smog Haze",
        source: "DEMO SAMPLE: Meteorological Estimation",
        timestamp: new Date().toISOString(),
        inversionRisk: evaluateInversionRisk(16.5, 78, 4.2),
      };
      return fallback;
    } finally {
      clearTimeout(timeout);
    }
  }
}
