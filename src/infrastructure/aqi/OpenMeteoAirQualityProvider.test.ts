import { describe, it, expect, vi } from "vitest";
import { OpenMeteoAirQualityProvider } from "./OpenMeteoAirQualityProvider";

describe("OpenMeteoAirQualityProvider", () => {
  it("fetches and maps live air quality data correctly", async () => {
    const mockResponse = {
      current: {
        time: "2026-11-18T12:00:00Z",
        pm2_5: 145.2,
        pm10: 230.1,
        nitrogen_dioxide: 55.4,
        sulphur_dioxide: 18.2,
        carbon_monoxide: 1850, // 1850 µg/m³ = 1.85 mg/m³
        ozone: 32.0,
        us_aqi: 198,
      },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const provider = new OpenMeteoAirQualityProvider(mockFetch as unknown as typeof fetch);
    const data = await provider.getAirQuality(28.61, 77.2, "INDIAN_NAQI");

    expect(data.sourceType).toBe("MODEL_ESTIMATE");
    expect(data.pollutants.pm25.value).toBe(145.2);
    expect(data.pollutants.co.value).toBe(1.85);
    expect(data.category).toBe("Very Poor");
    expect(data.healthAdvisory.general).toBeTruthy();
  });

  it("handles US_AQI standard mapping", async () => {
    const mockResponse = {
      current: {
        time: "2026-11-18T12:00:00Z",
        pm2_5: 35.0,
        pm10: 50.0,
        nitrogen_dioxide: 20.0,
        sulphur_dioxide: 10.0,
        carbon_monoxide: 500,
        ozone: 20.0,
        us_aqi: 99,
      },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const provider = new OpenMeteoAirQualityProvider(mockFetch as unknown as typeof fetch);
    const data = await provider.getAirQuality(28.61, 77.2, "US_AQI");

    expect(data.standard).toBe("US_AQI");
    expect(data.aqi).toBe(99);
  });

  it("throws error when API returns non-ok status", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
    });

    const provider = new OpenMeteoAirQualityProvider(mockFetch as unknown as typeof fetch);
    await expect(provider.getAirQuality(28.61, 77.2)).rejects.toThrow("Open-Meteo Air Quality API error: 503");
  });

  it("fetches and maps 24h historical and 72h forecast data", async () => {
    const now = new Date();
    const pastTime = new Date(now.getTime() - 2 * 3600 * 1000).toISOString();
    const futureTime = new Date(now.getTime() + 2 * 3600 * 1000).toISOString();

    const mockResponse = {
      current: {
        time: now.toISOString(),
        pm2_5: 120,
        pm10: 200,
      },
      hourly: {
        time: [pastTime, futureTime],
        pm2_5: [110, 130],
        pm10: [180, 210],
        us_aqi: [180, 190],
      },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const provider = new OpenMeteoAirQualityProvider(mockFetch as unknown as typeof fetch);
    const forecast = await provider.getForecast(28.61, 77.2, "INDIAN_NAQI");

    expect(forecast.sourceType).toBe("MODEL_ESTIMATE");
    expect(forecast.historical24h.length).toBe(1);
    expect(forecast.forecast72h.length).toBe(1);
  });

  it("throws error when forecast API fails", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Error",
    });

    const provider = new OpenMeteoAirQualityProvider(mockFetch as unknown as typeof fetch);
    await expect(provider.getForecast(28.61, 77.2)).rejects.toThrow("Open-Meteo Forecast API error: 500");
  });

  it("omits absent current pollutants and rejects responses without particulate data", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ current: { pm10: 20 } }) });
    const provider = new OpenMeteoAirQualityProvider(fetcher as unknown as typeof fetch);
    const data = await provider.getAirQuality(0, 0, "US_AQI");
    expect(data.pollutants.pm10.value).toBe(20);
    expect(data.pollutants.pm25).toBeUndefined();
    expect(data.timestamp).toBeTruthy();

    const noParticles = new OpenMeteoAirQualityProvider(vi.fn().mockResolvedValue({ ok: true, json: async () => ({ current: { nitrogen_dioxide: 10 } }) }) as unknown as typeof fetch);
    await expect(noParticles.getAirQuality(0, 0)).rejects.toThrow("did not include particulate measurements");
    await expect(new OpenMeteoAirQualityProvider(vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }) as unknown as typeof fetch).getAirQuality(0, 0)).rejects.toThrow("did not include particulate measurements");
  });

  it("handles empty hourly arrays and skips hours with missing pollutants", async () => {
    const current = { pm2_5: 12, pm10: 20 };
    const empty = new OpenMeteoAirQualityProvider(vi.fn().mockResolvedValue({ ok: true, json: async () => ({ current, hourly: { time: [] } }) }) as unknown as typeof fetch);
    await expect(empty.getForecast(0, 0)).resolves.toMatchObject({ historical24h: [], forecast72h: [] });

    const incomplete = new OpenMeteoAirQualityProvider(vi.fn().mockResolvedValue({ ok: true, json: async () => ({ current, hourly: { time: [new Date(Date.now() + 3_600_000).toISOString()], pm2_5: [], pm10: [] } }) }) as unknown as typeof fetch);
    await expect(incomplete.getForecast(0, 0)).resolves.toMatchObject({ historical24h: [], forecast72h: [] });
  });

  it("aborts timed out current and forecast requests and handles missing hourly payloads", async () => {
    vi.useFakeTimers();
    const abortedFetch = vi.fn((_url: string, init?: RequestInit) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
    }));
    const provider = new OpenMeteoAirQualityProvider(abortedFetch as unknown as typeof fetch);
    const current = provider.getAirQuality(0, 0);
    const currentRejected = expect(current).rejects.toThrow("aborted");
    await vi.advanceTimersByTimeAsync(8000);
    await currentRejected;
    const forecast = provider.getForecast(0, 0);
    const forecastRejected = expect(forecast).rejects.toThrow("aborted");
    await vi.advanceTimersByTimeAsync(9000);
    await forecastRejected;
    vi.useRealTimers();

    const noHourly = new OpenMeteoAirQualityProvider(vi.fn().mockResolvedValue({ ok: true, json: async () => ({ current: { pm2_5: 20 } }) }) as unknown as typeof fetch);
    await expect(noHourly.getForecast(0, 0)).resolves.toMatchObject({ historical24h: [], forecast72h: [] });
    const pm10Only = new OpenMeteoAirQualityProvider(vi.fn().mockResolvedValue({ ok: true, json: async () => ({ current: { pm10: 20 }, hourly: { time: [new Date(Date.now() + 3600000).toISOString()], pm10: [10] } }) }) as unknown as typeof fetch);
    const mapped = await pm10Only.getForecast(0, 0, "US_AQI");
    expect(mapped.forecast72h[0].pm10).toBe(10);

    const indiaPm25 = new OpenMeteoAirQualityProvider(vi.fn().mockResolvedValue({ ok: true, json: async () => ({ current: { pm2_5: 15 }, hourly: { time: [new Date(Date.now() + 3600000).toISOString()], pm2_5: [15] } }) }) as unknown as typeof fetch);
    expect((await indiaPm25.getForecast(0, 0)).forecast72h[0].aqi).toBeGreaterThan(0);
    const indiaPm10 = new OpenMeteoAirQualityProvider(vi.fn().mockResolvedValue({ ok: true, json: async () => ({ current: { pm10: 15 }, hourly: { time: [new Date(Date.now() + 3600000).toISOString()], pm10: [15] } }) }) as unknown as typeof fetch);
    expect((await indiaPm10.getForecast(0, 0)).forecast72h[0].aqi).toBeGreaterThan(0);

    const usPm25Only = new OpenMeteoAirQualityProvider(vi.fn().mockResolvedValue({ ok: true, json: async () => ({ current: { pm2_5: 15 }, hourly: { time: [new Date(Date.now() + 3600000).toISOString()], pm2_5: [15] } }) }) as unknown as typeof fetch);
    expect((await usPm25Only.getForecast(0, 0, "US_AQI")).forecast72h[0].aqi).toBeGreaterThan(0);
  });
});
