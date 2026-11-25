import { describe, it, expect, vi } from "vitest";
import { WaqiAirQualityProvider } from "./WaqiAirQualityProvider";

describe("WaqiAirQualityProvider", () => {
  it("throws error when apiToken is not configured", async () => {
    const provider = new WaqiAirQualityProvider();
    await expect(provider.getAirQuality(28.61, 77.2)).rejects.toThrow("WAQI API token is not configured.");
  });

  it("reports an unknown provider error when an ok response has no data", async () => {
    const provider = new WaqiAirQualityProvider("token", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: "ok" }) }) as unknown as typeof fetch);
    await expect(provider.getAirQuality(0, 0)).rejects.toThrow("WAQI API error: Unknown error");
  });

  it("throws error when fetch response is not ok or json.status !== 'ok'", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    });
    const provider = new WaqiAirQualityProvider("test-token", mockFetch as unknown as typeof fetch);
    await expect(provider.getAirQuality(28.61, 77.2)).rejects.toThrow("WAQI API request failed with status: 401");

    const mockFetchError = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "error", data: "Invalid key" }),
    });
    const provider2 = new WaqiAirQualityProvider("test-token", mockFetchError as unknown as typeof fetch);
    await expect(provider2.getAirQuality(28.61, 77.2)).rejects.toThrow("WAQI API error: Invalid key");
  });

  it("fetches and maps ground station observation data accurately", async () => {
    const mockData = {
      status: "ok",
      data: {
        aqi: 312,
        idx: 8452,
        attributions: [
          { name: "CPCB - Central Pollution Control Board", url: "https://cpcb.nic.in" },
        ],
        city: {
          name: "Mandir Marg, Delhi",
          geo: [28.636, 77.224],
        },
        dominentpol: "pm25",
        iaqi: {
          pm25: { v: 165 },
          pm10: { v: 240 },
          no2: { v: 45 },
          so2: { v: 12 },
          co: { v: 1.5 },
          o3: { v: 24 },
        },
        time: {
          iso: "2026-11-18T14:00:00+05:30",
        },
      },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const provider = new WaqiAirQualityProvider("test-token", mockFetch as unknown as typeof fetch);
    const result = await provider.getAirQuality(28.61, 77.2, "US_AQI");

    expect(result.sourceType).toBe("STATION_OBSERVATION");
    expect(result.station?.name).toBe("Mandir Marg, Delhi");
    expect(result.aqi).toBe(312);
    expect(result.pollutants.pm25.value).toBe(165);
    expect(result.attribution).toContain("CPCB");

    const indianResult = await provider.getAirQuality(28.61, 77.2, "INDIAN_NAQI");
    expect(indianResult.aqi).not.toBe(312);

    const forecast = await provider.getForecast(28.61, 77.2, "US_AQI");
    expect(forecast.sourceType).toBe("STATION_OBSERVATION");
    expect(forecast.current.aqi).toBe(312);
  });

  it("handles a valid response with missing optional station and pollutant fields", async () => {
    const provider = new WaqiAirQualityProvider("token", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: "ok", data: { aqi: 135, iaqi: { pm25: { v: 50 } }, city: {} } }) }) as unknown as typeof fetch);
    const result = await provider.getAirQuality(0, 0, "US_AQI");
    expect(result.aqi).toBe(135);
    expect(result.station).toMatchObject({ id: "station", name: "Official Monitoring Station", city: "Local Station", latitude: 0, longitude: 0 });
    expect(result.attribution).toContain("WAQI");
    await expect(new WaqiAirQualityProvider("token", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: "ok", data: {} }) }) as unknown as typeof fetch).getAirQuality(0, 0)).rejects.toThrow("no pollutant measurements");
  });

  it("aborts requests after the station timeout", async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn((_url: string, init?: RequestInit) => new Promise((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")))));
    const request = new WaqiAirQualityProvider("token", fetcher as unknown as typeof fetch).getAirQuality(0, 0);
    const rejected = expect(request).rejects.toThrow("aborted");
    await vi.advanceTimersByTimeAsync(8000);
    await rejected;
    vi.useRealTimers();
  });
});
