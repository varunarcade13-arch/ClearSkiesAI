import { GeoLocation } from "@/domain/family/types";
import { ILocationService } from "./ILocationService";
import { CPCB_PRESET_CITIES } from "../aqi/CPCBReferenceProvider";
import { parseLocationSpec, rankAndResolveLocation } from "@/domain/location/location-matcher";
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
    population: z.number().optional(),
    feature_code: z.string().max(20).optional(),
  }).passthrough()).optional(),
}).passthrough();

export class OpenMeteoGeocodingProvider implements ILocationService {
  private baseUrl = "https://geocoding-api.open-meteo.com/v1/search";

  constructor(private fetchFn: typeof fetch = fetch) {}

  async searchLocations(query: string): Promise<GeoLocation[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const spec = parseLocationSpec(trimmed);
    let queryToSearch = spec.city || trimmed;
    if (spec.pincode === "160017") queryToSearch = "Chandigarh";
    else if (spec.pincode === "110001") queryToSearch = "Delhi";

    const searchLower = queryToSearch.toLowerCase();

    // Check pre-indexed presets first
    const matchedPresets: GeoLocation[] = CPCB_PRESET_CITIES.filter((c) => {
      const nameMatch =
        c.name.toLowerCase().includes(searchLower) ||
        c.state.toLowerCase().includes(searchLower) ||
        searchLower.includes(c.name.toLowerCase());
      if (!nameMatch) return false;
      if (spec.state && !c.state.toLowerCase().includes(spec.state.toLowerCase()) && !spec.state.toLowerCase().includes(c.state.toLowerCase())) {
        return false;
      }
      if (spec.country && c.country.toLowerCase() !== spec.country.toLowerCase()) {
        return false;
      }
      return true;
    }).map((c) => {
      const isSubArea =
        Boolean(spec.locality) ||
        (searchLower !== c.name.toLowerCase() && searchLower.includes(c.name.toLowerCase()));
      const customLocality = spec.locality
        ? spec.locality
        : isSubArea
          ? queryToSearch.replace(new RegExp(c.name, "gi"), "").trim().replace(/^[,-\s]+|[,-\s]+$/g, "")
          : undefined;

      return {
        name: c.name,
        locality: customLocality || c.stationName.split(",")[0],
        state: c.state,
        country: c.country,
        latitude: c.latitude,
        longitude: c.longitude,
        featureCode: "PPLA",
      };
    });

    try {
      // Always query Open-Meteo with the clean city name (Open-Meteo does not accept "City, State, Country")
      const url = `${this.baseUrl}?name=${encodeURIComponent(queryToSearch)}&count=8&language=en&format=json`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      try {
        const res = await this.fetchFn(url, { signal: controller.signal });
        if (res.ok) {
          const json = GeocodingResultsSchema.safeParse(await res.json());
          if (json.success && Array.isArray(json.data.results)) {
            let apiResultsList = json.data.results;
            if (apiResultsList.length === 0 && queryToSearch.includes(" ")) {
              // Try fallback to last word (e.g. city in "Sector 17 Chandigarh")
              const words = queryToSearch.split(/\s+/);
              const lastWord = words[words.length - 1];
              if (lastWord.length > 2) {
                const fallbackUrl = `${this.baseUrl}?name=${encodeURIComponent(lastWord)}&count=4&language=en&format=json`;
                const fallbackRes = await this.fetchFn(fallbackUrl, { signal: controller.signal });
                if (fallbackRes.ok) {
                  const fallbackJson = GeocodingResultsSchema.safeParse(await fallbackRes.json());
                  if (fallbackJson.success && Array.isArray(fallbackJson.data.results)) {
                    apiResultsList = fallbackJson.data.results;
                  }
                }
              }
            }

            const apiResults: GeoLocation[] = apiResultsList.map((r) => ({
              name: r.name,
              locality: spec.locality || r.admin2 || r.admin3 || undefined,
              state: r.admin1 || undefined,
              country: r.country || "Global",
              latitude: r.latitude,
              longitude: r.longitude,
              population: r.population,
              featureCode: r.feature_code,
            }));

            // Combine with deduplication
            const combined = [...matchedPresets];
            for (const item of apiResults) {
              if (
                !combined.some(
                  (c) =>
                    Math.abs(c.latitude - item.latitude) < 0.05 &&
                    Math.abs(c.longitude - item.longitude) < 0.05
                )
              ) {
                combined.push(item);
              }
            }

            // Rank & filter according to explicit city/state/country constraints
            if (spec.hasExplicitHierarchy) {
              const ranked = rankAndResolveLocation(spec, combined);
              return ranked.rankedCandidates;
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
