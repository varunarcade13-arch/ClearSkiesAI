import { describe, it, expect, vi } from "vitest";
import { AggregatingAQIProvider } from "./AggregatingAQIProvider";

describe("AggregatingAQIProvider", () => {
  it("prioritizes WAQI ground station when token configured and call succeeds", async () => {
    const mockWaqiResponse = {
      status: "ok",
      data: {
        aqi: 320,
        idx: 1234,
        city: { name: "Anand Vihar, Delhi", geo: [28.65, 77.3] },
        dominentpol: "pm25",
        iaqi: { pm25: { v: 170 } },
        attributions: [{ name: "DPCC" }],
      },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockWaqiResponse,
    });

    const aggregator = new AggregatingAQIProvider("valid-waqi-token", mockFetch as unknown as typeof fetch);
    const result = await aggregator.getAirQuality(28.61, 77.2);

    expect(result.sourceType).toBe("STATION_OBSERVATION");
    expect(result.aqi).toBeGreaterThan(320); // WAQI concentration is converted to Indian NAQI.

    // Verify cache hit
    const cached = await aggregator.getAirQuality(28.61, 77.2);
    expect(cached.aqi).toBe(result.aqi);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("falls back to Open-Meteo model when WAQI fails or token is not provided", async () => {
    const mockOpenMeteo = {
      current: {
        time: "2026-11-18T10:00:00Z",
        pm2_5: 95.0,
        pm10: 160.0,
        us_aqi: 172,
      },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockOpenMeteo,
    });

    const aggregator = new AggregatingAQIProvider(undefined, mockFetch as unknown as typeof fetch);
    const result = await aggregator.getAirQuality(28.61, 77.2);

    expect(result.sourceType).toBe("MODEL_ESTIMATE");
    // Should enrich with preset station name
    expect(result.station?.name).toContain("Mandir Marg");
  });

  it("does not add a preset station outside preset cities", async () => {
    const response = { current: { time: new Date().toISOString(), pm2_5: 10, pm10: 20 } };
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => response });
    const provider = new AggregatingAQIProvider(undefined, fetcher as unknown as typeof fetch);
    const outside = await provider.getAirQuality(40, -70);
    expect(outside.station).toBeUndefined();
  });

  it("does not substitute another location's sample data if providers fail", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("Network offline"));

    const aggregator = new AggregatingAQIProvider("token", mockFetch as unknown as typeof fetch);
    await expect(aggregator.getAirQuality(28.61, 77.2)).rejects.toThrow("unavailable for this location");
  });

  it("handles getForecast with caching and fallback", async () => {
    const mockForecast = {
      current: { time: new Date().toISOString(), pm2_5: 100 },
      hourly: {
        time: [new Date().toISOString()],
        pm2_5: [100],
        pm10: [150],
      },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockForecast,
    });

    const aggregator = new AggregatingAQIProvider(undefined, mockFetch as unknown as typeof fetch);
    const forecast = await aggregator.getForecast(28.61, 77.2);
    expect(forecast.sourceType).toBe("MODEL_ESTIMATE");

    // Cache hit
    const cached = await aggregator.getForecast(28.61, 77.2);
    expect(cached.sourceType).toBe("MODEL_ESTIMATE");
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Error fallback
    const failingFetch = vi.fn().mockRejectedValue(new Error("Network failed"));
    const failingAggregator = new AggregatingAQIProvider(undefined, failingFetch as unknown as typeof fetch);
    await expect(failingAggregator.getForecast(12.97, 77.59)).rejects.toThrow("unavailable for this location");
  });
});
