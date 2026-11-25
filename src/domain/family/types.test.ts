import { describe, it, expect } from "vitest";
import { calculateVulnerabilityScore, FamilyProfileSchema, FamilyProfile } from "./types";

describe("Family Domain Logic", () => {
  const baseProfile: FamilyProfile = {
    location: {
      name: "Delhi",
      latitude: 28.61,
      longitude: 77.2,
      country: "India",
    },
    familySize: 4,
    hasYoungChildren: false,
    hasElderly: false,
    hasRespiratorySensitivities: false,
    workRoutine: "hybrid",
    commuteMethod: "metro_train",
    exerciseTiming: "afternoon",
    homeType: "apartment",
    airPurifierStatus: "single_room",
  };

  it("calculates baseline score for healthy household with metro commute", () => {
    const result = calculateVulnerabilityScore(baseProfile);
    expect(result.score).toBe(20);
    expect(result.factors.length).toBe(0);
  });

  it("adds factors for children, elderly, asthma, and open commute", () => {
    const vulnerableProfile: FamilyProfile = {
      ...baseProfile,
      hasYoungChildren: true,
      hasElderly: true,
      hasRespiratorySensitivities: true,
      airPurifierStatus: "none",
      commuteMethod: "two_wheeler",
    };

    const result = calculateVulnerabilityScore(vulnerableProfile);
    // 20 (base) + 25 (kids) + 25 (elderly) + 30 (asthma) + 15 (no purifier) + 10 (2-wheeler) = 125, capped at 100
    expect(result.score).toBe(100);
    expect(result.factors.length).toBe(5);
  });

  it("validates valid FamilyProfileSchema objects", () => {
    const valid = FamilyProfileSchema.parse(baseProfile);
    expect(valid.familySize).toBe(4);
    expect(valid.location.name).toBe("Delhi");
  });

  it("rejects invalid familySize or out-of-range coordinates", () => {
    expect(() =>
      FamilyProfileSchema.parse({
        ...baseProfile,
        familySize: 0,
      })
    ).toThrow();

    expect(() =>
      FamilyProfileSchema.parse({
        ...baseProfile,
        location: { ...baseProfile.location, latitude: 120 },
      })
    ).toThrow();
  });
});
