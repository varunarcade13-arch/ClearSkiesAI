import { describe, it, expect } from "vitest";
import { generateRoutineRecommendations } from "./generator";
import { FamilyProfile } from "../family/types";

describe("Routine Recommendation Generator", () => {
  const profile: FamilyProfile = {
    location: { name: "Delhi", latitude: 28.61, longitude: 77.2, country: "India" },
    familySize: 3,
    hasYoungChildren: true,
    hasElderly: false,
    hasRespiratorySensitivities: false,
    workRoutine: "hybrid",
    commuteMethod: "solo_car",
    exerciseTiming: "early_morning",
    homeType: "apartment",
    airPurifierStatus: "single_room",
  };

  it("generates comprehensive commute, fitness, indoor, energy, and community guidance for AQI >= 201", () => {
    const recs = generateRoutineRecommendations(260, "Poor", profile);
    expect(recs.length).toBeGreaterThanOrEqual(5);

    const commuteRec = recs.find((r) => r.id === "commute-metro-shift");
    expect(commuteRec).toBeDefined();
    expect(commuteRec?.environmentalImpact.co2eKgSaved).toBeGreaterThan(0);
    expect(commuteRec?.personalExposureBenefit.percentageReduction).toBe(60);

    const fitnessRec = recs.find((r) => r.id === "fitness-indoor-shift");
    expect(fitnessRec).toBeDefined();
    expect(fitnessRec?.whatToDo).toContain("Replace morning jogging");

    const dampMopRec = recs.find((r) => r.id === "home-damp-mop");
    expect(dampMopRec).toBeDefined();

    const energyRec = recs.find((r) => r.id === "energy-efficient-heating");
    expect(energyRec).toBeDefined();
  });

  it("recommends midday exercise rescheduling for moderate AQI (101-200)", () => {
    const recs = generateRoutineRecommendations(140, "Moderate");
    const fitnessRec = recs.find((r) => r.id === "fitness-time-shift");
    expect(fitnessRec).toBeDefined();
    expect(fitnessRec?.title).toContain("Midday (12 PM - 3 PM)");
    expect(fitnessRec?.whatToDo).toContain("solar noon");
  });

  it("omits pollution-specific protection advice when AQI is under 101", () => {
    const recs = generateRoutineRecommendations(50, "Good");
    expect(recs.some((r) => r.id === "fitness-indoor-shift" || r.id === "fitness-time-shift")).toBe(false);
  });
});
