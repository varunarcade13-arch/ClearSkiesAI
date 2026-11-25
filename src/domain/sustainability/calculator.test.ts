import { describe, it, expect } from "vitest";
import { compareTransportOptions } from "./calculator";

describe("Sustainability Commute Calculator", () => {
  it("calculates emissions and health status across all transport modes", () => {
    // 10km one way, 5 days a week => 100km total weekly
    const result = compareTransportOptions(10, 5, 250);

    expect(result.options.length).toBe(8);

    // Solo petrol car: 170g/km * 100km = 17 kg CO2
    const petrol = result.options.find((o) => o.mode === "solo_petrol_car");
    expect(petrol?.weeklyCo2Kg).toBe(17);
    expect(petrol?.isSafeAtCurrentAqi).toBe(true);

    // Metro: 16g/km * 100km = 1.6 kg CO2
    const metro = result.options.find((o) => o.mode === "metro_train");
    expect(metro?.weeklyCo2Kg).toBe(1.6);
    expect(result.bestHealthSafeOption.mode).toBe("metro_train");

    // Walking/cycling has maxSafeAqi of 120, so at 250 it should flag high exposure risk!
    const cycle = result.options.find((o) => o.mode === "cycling_walking");
    expect(cycle?.isSafeAtCurrentAqi).toBe(false);
    expect(cycle?.healthSafetyNote).toContain("High health risk");

    // Bus has maxSafeAqi of 300, so at 250 it's safe
    const bus = result.options.find((o) => o.mode === "public_bus");
    expect(bus?.isSafeAtCurrentAqi).toBe(true);

    // E-scooter has maxSafeAqi of 150, so at 160 it's unsafe
    const result160 = compareTransportOptions(5, 5, 160);
    const scooter = result160.options.find((o) => o.mode === "electric_two_wheeler");
    expect(scooter?.isSafeAtCurrentAqi).toBe(false);
    expect(scooter?.healthSafetyNote).toContain("High health risk");
  });

  it("handles high AQI where even public bus exceeds safe limit", () => {
    const result = compareTransportOptions(10, 5, 380);
    const bus = result.options.find((o) => o.mode === "public_bus");
    expect(bus?.isSafeAtCurrentAqi).toBe(false);
    expect(bus?.healthSafetyNote).toContain("Elevated particulate exposure");
  });

  it("selects the lowest-emission fallback if every option is unsafe", () => {
    const result = compareTransportOptions(10, 5, 1000);
    expect(result.options.every((option) => !option.isSafeAtCurrentAqi)).toBe(true);
    expect(result.bestEcoOption.weeklyCo2Kg).toBe(Math.min(...result.options.map((option) => option.weeklyCo2Kg)));
  });
});
