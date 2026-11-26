import { describe, it, expect, vi } from "vitest";
import { OpenMeteoGeocodingProvider } from "./OpenMeteoGeocodingProvider";

describe("OpenMeteoGeocodingProvider", () => {
  it("returns empty array for blank query", async () => {
    const provider = new OpenMeteoGeocodingProvider();
    const res = await provider.searchLocations("   ");
    expect(res).toEqual([]);
  });

  it("returns preset matching cities immediately", async () => {
    const offline = vi.fn().mockRejectedValue(new Error("offline"));
    const provider = new OpenMeteoGeocodingProvider(offline as unknown as typeof fetch);
    const res = await provider.searchLocations("Delhi");
    expect(res.length).toBeGreaterThan(0);
    expect(res[0].name).toBe("Delhi");
  });

  it("queries geocoding API and merges results", async () => {
    const mockApiResponse = {
      results: [
        {
          name: "London",
          latitude: 51.5074,
          longitude: -0.1278,
          country: "United Kingdom",
          admin1: "England",
        },
      ],
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });

    const provider = new OpenMeteoGeocodingProvider(mockFetch as unknown as typeof fetch);
    const res = await provider.searchLocations("London");
    expect(res.some((r) => r.name === "London")).toBe(true);
  });

  it("does not invent coordinates when a location search fails", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("offline"));
    const provider = new OpenMeteoGeocodingProvider(mockFetch as unknown as typeof fetch);
    await expect(provider.searchLocations("Atlantis")).resolves.toEqual([]);
  });

  it("handles invalid HTTP and malformed geocoding responses with preset-only results", async () => {
    const nonOk = new OpenMeteoGeocodingProvider(vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch);
    await expect(nonOk.searchLocations("Nowhere")).resolves.toEqual([]);
    const malformed = new OpenMeteoGeocodingProvider(vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [{ name: "Bad", latitude: 900, longitude: 0 }] }) }) as unknown as typeof fetch);
    await expect(malformed.searchLocations("Nowhere")).resolves.toEqual([]);
    const emptyResults = new OpenMeteoGeocodingProvider(vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [] }) }) as unknown as typeof fetch);
    await expect(emptyResults.searchLocations("Nowhere")).resolves.toEqual([]);
  });

  it("deduplicates API matches against known city presets", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [
      { name: "Delhi", latitude: 28.6139, longitude: 77.209, country: "India" },
      { name: "Delhi extra", latitude: 28.7, longitude: 77.3, country: "India" },
    ] }) });
    const results = await new OpenMeteoGeocodingProvider(fetcher as unknown as typeof fetch).searchLocations("Delhi");
    expect(results.filter((item) => item.latitude === 28.6139)).toHaveLength(1);
    expect(results.some((item) => item.name === "Delhi extra")).toBe(true);
  });

  it("maps optional global result fields through their fallbacks", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [
      { name: "Global City", latitude: 50, longitude: 10, admin3: "District", admin1: "Region" },
      { name: "Another City", latitude: 49, longitude: 11 },
    ] }) });
    const results = await new OpenMeteoGeocodingProvider(fetcher as unknown as typeof fetch).searchLocations("Global City");
    expect(results).toContainEqual(expect.objectContaining({ name: "Global City", locality: "District", state: "Region", country: "Global" }));
    expect(results).toContainEqual(expect.objectContaining({ name: "Another City", locality: undefined, state: undefined, country: "Global" }));
  });

  it("reverse geocodes coordinates to matching preset city or GPS string", async () => {
    const provider = new OpenMeteoGeocodingProvider();

    // Matching Delhi
    const delhi = await provider.reverseGeocode(28.614, 77.209);
    expect(delhi.name).toBe("Delhi");

    // Generic GPS location
    const generic = await provider.reverseGeocode(40.71, -74.0);
    expect(generic.name).toBe("Detected Location");
  });

  it("aborts a slow search and returns only matched presets", async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn((_url: string, init?: RequestInit) => new Promise((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")))));
    const search = new OpenMeteoGeocodingProvider(fetcher as unknown as typeof fetch).searchLocations("Atlantis");
    await vi.advanceTimersByTimeAsync(6000);
    await expect(search).resolves.toEqual([]);
    vi.useRealTimers();
  });

  it("handles city aliases, Indian PIN codes, and multi-word fallback searches", async () => {
    const fetcher = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("Sector%2017%20Chandigarh")) {
        return { ok: true, json: async () => ({ results: [] }) };
      }
      if (url.includes("Chandigarh")) {
        return {
          ok: true,
          json: async () => ({
            results: [{ name: "Chandigarh", latitude: 30.73, longitude: 76.78, country: "India", admin1: "Chandigarh" }],
          }),
        };
      }
      if (url.includes("Chennai")) {
        return {
          ok: true,
          json: async () => ({
            results: [{ name: "Chennai", latitude: 13.08, longitude: 80.27, country: "India", admin1: "Tamil Nadu" }],
          }),
        };
      }
      return { ok: true, json: async () => ({ results: [] }) };
    });

    const provider = new OpenMeteoGeocodingProvider(fetcher as unknown as typeof fetch);

    // Aliases
    const gurugram = await provider.searchLocations("Gurugram");
    expect(gurugram.some((c) => c.name === "Gurgaon")).toBe(true);

    const bangalore = await provider.searchLocations("Bangalore");
    expect(bangalore.some((c) => c.name === "Bengaluru")).toBe(true);

    const calcutta = await provider.searchLocations("Calcutta");
    expect(calcutta.some((c) => c.name === "Kolkata")).toBe(true);

    const bombay = await provider.searchLocations("Bombay");
    expect(bombay.some((c) => c.name === "Mumbai")).toBe(true);

    const madras = await provider.searchLocations("Madras");
    expect(madras.some((c) => c.name === "Chennai")).toBe(true);

    // PIN codes
    const pin1 = await provider.searchLocations("160017");
    expect(pin1.some((c) => c.name === "Chandigarh")).toBe(true);

    const pin2 = await provider.searchLocations("110001");
    expect(pin2.some((c) => c.name === "Delhi")).toBe(true);

    // Multi-word fallback
    const sector17 = await provider.searchLocations("Sector 17 Chandigarh");
    expect(sector17.some((c) => c.name === "Chandigarh")).toBe(true);
  });
});
