import { afterEach, describe, expect, it, vi } from "vitest";
import { NominatimReverseGeocodingProvider } from "./NominatimReverseGeocodingProvider";

const ok = (body: unknown) => ({ ok: true, json: async () => body });

describe("Nominatim reverse geocoding", () => {
  afterEach(() => vi.useRealTimers());

  it.each([[NaN, 0], [-91, 0], [91, 0], [0, -181], [0, 181]])("rejects invalid coordinates %s %s", async (lat, lng) => {
    const fetcher = vi.fn();
    await expect(new NominatimReverseGeocodingProvider(fetcher as unknown as typeof fetch).reverseGeocode(lat, lng)).rejects.toThrow("Invalid coordinates");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("builds a fixed-host request and maps locality priorities and fallbacks", async () => {
    const fetcher = vi.fn().mockResolvedValue(ok({ address: { city: "Delhi", neighbourhood: "Old Town", state: "Delhi", country: "India" } }));
    const result = await new NominatimReverseGeocodingProvider(fetcher as unknown as typeof fetch).reverseGeocode(28.6, 77.2);
    expect(result).toMatchObject({ name: "Delhi", locality: "Old Town", country: "India", latitude: 28.6, longitude: 77.2 });
    expect(String(fetcher.mock.calls[0][0])).toContain("https://nominatim.openstreetmap.org/reverse");
    expect(fetcher.mock.calls[0][1]).toMatchObject({ cache: "force-cache", headers: { "Accept-Language": "en" } });

    const sameName = await new NominatimReverseGeocodingProvider(vi.fn().mockResolvedValue(ok({ address: { city: "Town", neighbourhood: "Town" } })) as unknown as typeof fetch).reverseGeocode(0, 0);
    expect(sameName.locality).toBeUndefined();
    const fallbackCountry = await new NominatimReverseGeocodingProvider(vi.fn().mockResolvedValue(ok({ name: "Place" })) as unknown as typeof fetch).reverseGeocode(0, 0);
    expect(fallbackCountry).toMatchObject({ name: "Place", country: "Unknown region" });
  });

  it.each([
    [{ neighbourhood_name: "N" }, "N"], [{ quarter: "Q" }, "Q"], [{ suburb: "S" }, "S"], [{ city_district: "D" }, "D"],
  ])("chooses locality from address fields", async (address, locality) => {
    const fetcher = vi.fn().mockResolvedValue(ok({ address: { city: "City", ...address } }));
    await expect(new NominatimReverseGeocodingProvider(fetcher as unknown as typeof fetch).reverseGeocode(0, 0)).resolves.toMatchObject({ locality });
  });

  it.each([
    [{ town: "Town" }, "Town"], [{ village: "Village" }, "Village"], [{ municipality: "Municipality" }, "Municipality"],
    [{ suburb: "Suburb" }, "Suburb"], [{ county: "County" }, "County"], [{}, "Result Name"],
  ])("selects the first available place name", async (address, name) => {
    const fetcher = vi.fn().mockResolvedValue(ok({ address, name: "Result Name" }));
    await expect(new NominatimReverseGeocodingProvider(fetcher as unknown as typeof fetch).reverseGeocode(0, 0)).resolves.toMatchObject({ name });
  });

  it("rejects non-success and empty responses and clears timeout on failures", async () => {
    const provider = new NominatimReverseGeocodingProvider(vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch);
    await expect(provider.reverseGeocode(0, 0)).rejects.toThrow("unavailable");
    const empty = new NominatimReverseGeocodingProvider(vi.fn().mockResolvedValue(ok({ address: {} })) as unknown as typeof fetch);
    await expect(empty.reverseGeocode(0, 0)).rejects.toThrow("name was not found");
  });

  it("aborts slow network requests", async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener("abort", () => reject(new Error("aborted")));
    }));
    const result = new NominatimReverseGeocodingProvider(fetcher as unknown as typeof fetch).reverseGeocode(1, 2);
    const rejection = expect(result).rejects.toThrow("aborted");
    await vi.advanceTimersByTimeAsync(5000);
    await rejection;
  });
});
