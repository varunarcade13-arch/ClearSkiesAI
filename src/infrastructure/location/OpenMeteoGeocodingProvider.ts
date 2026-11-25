import { GeoLocation } from "@/domain/family/types";
import { ILocationService } from "./ILocationService";
import { CPCB_PRESET_CITIES } from "../aqi/CPCBReferenceProvider";
import { z } from "zod";

const GeocodingResultsSchema = z.object({
  results: z.array(z.object({
    name: z.string().min(1).max(120),
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180),
    country: z.string().max(120).optional(),
    admin1: z.string().max(120).optional(),
    admin2: z.string().max(120).optional(),
    admin3: z.string().max(120).optional(),
  }).passthrough()).optional(),
}).passthrough();

export class OpenMeteoGeocodingProvider implements ILocationService {
  private baseUrl = "https://geocoding-api.open-meteo.com/v1/search";

  constructor(private fetchFn: typeof fetch = fetch) {}

  async searchLocations(query: string): Promise<GeoLocation[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    // Check pre-indexed presets first
    const matchedPresets: GeoLocation[] = CPCB_PRESET_CITIES.filter((c) =>
      c.name.toLowerCase().includes(trimmed.toLowerCase()) ||
      c.state.toLowerCase().includes(trimmed.toLowerCase())
    ).map((c) => ({
      name: c.name,
      locality: c.stationName.split(",")[0],
      state: c.state,
      country: c.country,
      latitude: c.latitude,
      longitude: c.longitude,
    }));

    try {
      const url = `${this.baseUrl}?name=${encodeURIComponent(trimmed)}&count=8&language=en&format=json`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      try {
        const res = await this.fetchFn(url, { signal: controller.signal });
        if (res.ok) {
          const json = GeocodingResultsSchema.safeParse(await res.json());
          if (json.success && Array.isArray(json.data.results)) {
          const apiResults: GeoLocation[] = json.data.results.map((r) => ({
            name: r.name,
            locality: r.admin2 || r.admin3 || undefined,
            state: r.admin1 || undefined,
            country: r.country || "Global",
            latitude: r.latitude,
            longitude: r.longitude,
          }));

          // Combine with deduplication
          const combined = [...matchedPresets];
          for (const item of apiResults) {
            if (!combined.some((c) => Math.abs(c.latitude - item.latitude) < 0.05 && Math.abs(c.longitude - item.longitude) < 0.05)) {
              combined.push(item);
            }
          }
          return combined;
          }
        }
      } finally {
        clearTimeout(timeout);
      }
    } catch {
      // Fall through to presets
    }

    // Never turn an unresolved search string into invented Delhi coordinates.
    return matchedPresets;
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<GeoLocation> {
    const preset = CPCB_PRESET_CITIES.find(
      (c) => Math.abs(c.latitude - latitude) < 0.25 && Math.abs(c.longitude - longitude) < 0.25
    );

    if (preset) {
      return {
        name: preset.name,
        locality: preset.stationName.split(",")[0],
        state: preset.state,
        country: preset.country,
        latitude,
        longitude,
      };
    }

    return {
      name: "Detected Location",
      locality: `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`,
      country: "Current GPS Position",
      latitude,
      longitude,
    };
  }
}
