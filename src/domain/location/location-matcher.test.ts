import { describe, it, expect } from "vitest";
import {
  normalizeLocationToken,
  normalizeCityName,
  normalizeStateName,
  normalizeCountryName,
  parseLocationSpec,
  rankAndResolveLocation,
  deduplicateLocations,
} from "./location-matcher";
import { GeoLocation } from "@/domain/family/types";

describe("location-matcher", () => {
  describe("normalization helpers", () => {
    it("normalizes unicode, punctuation, and whitespace", () => {
      expect(normalizeLocationToken("  Shīmla, Himachal Pradesh, India! ")).toBe(
        "Shimla, Himachal Pradesh, India"
      );
      expect(normalizeLocationToken("Mohālī")).toBe("Mohali");
    });

    it("normalizes city, state, and country variations", () => {
      expect(normalizeCityName("gurugram")).toBe("Gurgaon");
      expect(normalizeCityName("simla")).toBe("Shimla");
      expect(normalizeStateName("hp")).toBe("Himachal Pradesh");
      expect(normalizeStateName("pb")).toBe("Punjab");
      expect(normalizeStateName("nct")).toBe("Delhi");
      expect(normalizeCountryName("in")).toBe("India");
      expect(normalizeCountryName("bharat")).toBe("India");
      expect(normalizeCountryName("usa")).toBe("United States");
    });
  });

  describe("parseLocationSpec", () => {
    it("parses complete City, State, Country", () => {
      const spec = parseLocationSpec("Shimla, Himachal Pradesh, India");
      expect(spec.city).toBe("Shimla");
      expect(spec.state).toBe("Himachal Pradesh");
      expect(spec.country).toBe("India");
      expect(spec.hasExplicitHierarchy).toBe(true);
    });

    it("parses City, Country", () => {
      const spec = parseLocationSpec("Chandigarh, India");
      expect(spec.city).toBe("Chandigarh");
      expect(spec.country).toBe("India");
      expect(spec.state).toBeUndefined();
      expect(spec.hasExplicitHierarchy).toBe(true);
    });

    it("parses City, State", () => {
      const spec = parseLocationSpec("Manali, HP");
      expect(spec.city).toBe("Manali");
      expect(spec.state).toBe("Himachal Pradesh");
      expect(spec.hasExplicitHierarchy).toBe(true);
    });

    it("parses Sector + City + Country", () => {
      const spec = parseLocationSpec("Sector 17, Chandigarh, India");
      expect(spec.locality).toBe("Sector 17");
      expect(spec.city).toBe("Chandigarh");
      expect(spec.country).toBe("India");
      expect(spec.hasExplicitHierarchy).toBe(true);
    });

    it("parses 6-digit Indian PIN code", () => {
      const spec = parseLocationSpec("160017");
      expect(spec.pincode).toBe("160017");
      expect(spec.country).toBe("India");
    });

    it("parses empty input gracefully", () => {
      const spec = parseLocationSpec("   ");
      expect(spec.city).toBe("");
      expect(spec.hasExplicitHierarchy).toBe(false);
    });
  });

  describe("rankAndResolveLocation", () => {
    const shimlaCandidates: GeoLocation[] = [
      {
        name: "Shimla",
        state: "Rajasthan",
        country: "India",
        latitude: 28.69,
        longitude: 74.57,
        featureCode: "PPL",
      },
      {
        name: "Shīmla",
        state: "Haryana",
        country: "India",
        latitude: 29.63,
        longitude: 76.22,
        featureCode: "PPL",
      },
      {
        name: "Shimla",
        state: "Himachal Pradesh",
        country: "India",
        latitude: 31.10442,
        longitude: 77.16662,
        featureCode: "PPLA",
        population: 173503,
      },
    ];

    it("resolves exact City + State + Country without ambiguity", () => {
      const spec = parseLocationSpec("Shimla, Himachal Pradesh, India");
      const res = rankAndResolveLocation(spec, shimlaCandidates, "India");
      expect(res.isAmbiguous).toBe(false);
      expect(res.matchTier).toBe("EXACT_CITY_STATE_COUNTRY");
      expect(res.selected?.state).toBe("Himachal Pradesh");
      expect(res.selected?.latitude).toBeCloseTo(31.10442, 4);
      // Rajasthan and Haryana must be filtered out when Himachal Pradesh is specified
      expect(res.rankedCandidates).toHaveLength(1);
    });

    it("resolves City + Country without false ambiguity when a major admin center exists", () => {
      const spec = parseLocationSpec("Shimla, India");
      const res = rankAndResolveLocation(spec, shimlaCandidates, "India");
      expect(res.selected?.state).toBe("Himachal Pradesh");
      expect(res.matchTier).toBe("EXACT_CITY_COUNTRY");
    });

    it("resolves city-only Shimla to state capital using featureCode & population", () => {
      const spec = parseLocationSpec("Shimla");
      const res = rankAndResolveLocation(spec, shimlaCandidates, "India");
      expect(res.isAmbiguous).toBe(false);
      expect(res.selected?.state).toBe("Himachal Pradesh");
    });

    it("marks genuinely ambiguous equal-weight cities in different countries as ambiguous", () => {
      const hyderabadCandidates: GeoLocation[] = [
        { name: "Hyderabad", state: "Telangana", country: "India", latitude: 17.38, longitude: 78.48 },
        { name: "Hyderabad", state: "Sindh", country: "Pakistan", latitude: 25.39, longitude: 68.37 },
      ];
      const spec = parseLocationSpec("Hyderabad");
      const res = rankAndResolveLocation(spec, hyderabadCandidates, "India");
      expect(res.isAmbiguous).toBe(true);
      expect(res.ambiguousOptions).toEqual([
        "Hyderabad, Telangana, India",
        "Hyderabad, Sindh, Pakistan",
      ]);
    });

    it("uses fuzzy matching only when exact city matching fails", () => {
      const spec = parseLocationSpec("Shiml");
      const res = rankAndResolveLocation(spec, shimlaCandidates, "India");
      expect(res.matchTier).toBe("FUZZY");
      expect(res.selected?.state).toBe("Himachal Pradesh");
    });

    it("deduplicates near-identical coordinates", () => {
      const dupes: GeoLocation[] = [
        { name: "Delhi", state: "Delhi", country: "India", latitude: 28.6139, longitude: 77.209 },
        { name: "Delhi", state: "Delhi", country: "India", latitude: 28.615, longitude: 77.21 },
      ];
      expect(deduplicateLocations(dupes)).toHaveLength(1);
    });
  });
});
