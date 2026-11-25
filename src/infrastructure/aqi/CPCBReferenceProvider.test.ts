import { describe, it, expect } from "vitest";
import { CPCBReferenceProvider } from "./CPCBReferenceProvider";

describe("CPCBReferenceProvider", () => {
  it("provides preset smog-monitored Indian cities", () => {
    const presets = CPCBReferenceProvider.getPresetCities();
    expect(presets.length).toBeGreaterThanOrEqual(6);
    expect(presets.some((p) => p.name === "Delhi")).toBe(true);
    expect(presets.some((p) => p.name === "Mumbai")).toBe(true);
  });

  it("finds preset city by matching geographic coordinates", () => {
    // Delhi is roughly 28.61, 77.20
    const matched = CPCBReferenceProvider.findPresetByCoords(28.615, 77.21);
    expect(matched).toBeDefined();
    expect(matched?.name).toBe("Delhi");

    // Coordinates far away return undefined
    const unmatched = CPCBReferenceProvider.findPresetByCoords(51.5, -0.12);
    expect(unmatched).toBeUndefined();
  });

  it("generates realistic baseline sample data clearly labeled as DEMO_SAMPLE", () => {
    const sample = CPCBReferenceProvider.getSampleData("Delhi", "INDIAN_NAQI");
    expect(sample.sourceType).toBe("DEMO_SAMPLE");
    expect(sample.source).toContain("DEMO SAMPLE");
    expect(sample.station?.name).toContain("Mandir Marg");
    expect(sample.pollutants.pm25.value).toBeGreaterThan(0);
    expect(sample.pollutants.pm10.value).toBeGreaterThan(0);
  });

  it("falls back to Delhi sample and supports the default city and standard", () => {
    const fallback = CPCBReferenceProvider.getSampleData("unknown city");
    expect(fallback.station?.city).toBe("Delhi");
    expect(fallback.standard).toBe("INDIAN_NAQI");
    expect(CPCBReferenceProvider.getSampleData().station?.city).toBe("Delhi");
  });
});
