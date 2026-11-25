import { describe, it, expect, vi } from "vitest";
import { OpenMeteoWeatherProvider } from "./OpenMeteoWeatherProvider";

describe("OpenMeteoWeatherProvider", () => {
  it("fetches and maps weather data and evaluates atmospheric inversion", async () => {
    const mockWeather = {
      current: {
        time: "2026-11-18T10:00:00Z",
        temperature_2m: 14.2,
        apparent_temperature: 13.5,
        relative_humidity_2m: 82,
        surface_pressure: 1018,
        wind_speed_10m: 3.5,
        wind_direction_10m: 285,
        weather_code: 45,
      },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockWeather,
    });

    const provider = new OpenMeteoWeatherProvider(mockFetch as unknown as typeof fetch);
    const data = await provider.getWeather(28.61, 77.2);

    expect(data.temperature).toBe(14.2);
    expect(data.relativeHumidity).toBe(82);
    expect(data.windSpeed).toBe(3.5);
    expect(data.condition).toBe("Fog / Smog Haze");
    expect(data.inversionRisk.level).toBe("CRITICAL");

    // Cache hit verification
    const cached = await provider.getWeather(28.61, 77.2);
    expect(cached.temperature).toBe(14.2);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("falls back to realistic winter smog weather model when fetch fails", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("Network failed"));

    const provider = new OpenMeteoWeatherProvider(mockFetch as unknown as typeof fetch);
    const fallback = await provider.getWeather(28.61, 77.2);

    expect(fallback.source).toContain("DEMO SAMPLE");
    expect(fallback.temperature).toBeGreaterThan(0);
    expect(fallback.inversionRisk.level).toBeDefined();
  });

  it("uses conservative defaults for an incomplete successful response", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ current: {} }) });
    const data = await new OpenMeteoWeatherProvider(fetcher as unknown as typeof fetch).getWeather(0, 0);
    expect(data).toMatchObject({ temperature: 18, apparentTemperature: 18, relativeHumidity: 65, windSpeed: 5, windDirection: 0, surfacePressure: 1013, weatherCode: 45, condition: "Fog / Smog Haze" });
    const missingCurrent = new OpenMeteoWeatherProvider(vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }) as unknown as typeof fetch);
    await expect(missingCurrent.getWeather(2, 2)).resolves.toMatchObject({ temperature: 18, condition: "Fog / Smog Haze" });
  });

  it("uses the explicit fallback for unsuccessful HTTP responses", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: false, status: 503 });
    await expect(new OpenMeteoWeatherProvider(fetcher as unknown as typeof fetch).getWeather(1, 1)).resolves.toMatchObject({ source: expect.stringContaining("DEMO SAMPLE") });
  });

  it("aborts a timed out weather request and uses the fallback model", async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn((_url: string, init?: RequestInit) => new Promise((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")))));
    const result = new OpenMeteoWeatherProvider(fetcher as unknown as typeof fetch).getWeather(0, 0);
    await vi.advanceTimersByTimeAsync(8000);
    await expect(result).resolves.toMatchObject({ source: expect.stringContaining("DEMO SAMPLE") });
    vi.useRealTimers();
  });
});
