import { describe, it, expect } from "vitest";
import { mapWMOCodeToCondition, evaluateInversionRisk } from "./types";

describe("Weather Domain Logic", () => {
  describe("mapWMOCodeToCondition", () => {
    it("maps standard WMO weather codes to readable strings", () => {
      expect(mapWMOCodeToCondition(0)).toBe("Clear Sky");
      expect(mapWMOCodeToCondition(1)).toBe("Mainly Clear / Partly Cloudy");
      expect(mapWMOCodeToCondition(2)).toBe("Mainly Clear / Partly Cloudy");
      expect(mapWMOCodeToCondition(3)).toBe("Overcast");
      expect(mapWMOCodeToCondition(45)).toBe("Fog / Smog Haze");
      expect(mapWMOCodeToCondition(48)).toBe("Fog / Smog Haze");
      expect(mapWMOCodeToCondition(53)).toBe("Drizzle");
      expect(mapWMOCodeToCondition(63)).toBe("Rain");
      expect(mapWMOCodeToCondition(73)).toBe("Snow");
      expect(mapWMOCodeToCondition(81)).toBe("Rain Showers");
      expect(mapWMOCodeToCondition(95)).toBe("Thunderstorm");
      expect(mapWMOCodeToCondition(999)).toBe("Hazy");
    });
  });

  describe("evaluateInversionRisk", () => {
    it("identifies CRITICAL winter inversion with low wind, high humidity, cold temp", () => {
      // wind < 4 (+40), humidity > 80 (+35), temp < 12 (+25) => score = 100
      const result = evaluateInversionRisk(8, 88, 2.5);
      expect(result.level).toBe("CRITICAL");
      expect(result.score).toBe(100);
      expect(result.isStagnant).toBe(true);
      expect(result.description).toContain("Critical winter inversion");
    });

    it("identifies HIGH inversion risk under typical smoggy evening", () => {
      // wind 6 (< 8: +25), humidity 70 (< 80: +20), temp 15 (< 18: +15) => score = 60
      const result = evaluateInversionRisk(15, 70, 6);
      expect(result.level).toBe("HIGH");
      expect(result.isStagnant).toBe(false);
    });

    it("identifies MODERATE inversion risk", () => {
      // wind 10 (< 14: +10), humidity 55 (< 65: +10), temp 16 (< 18: +15) => score = 35
      const result = evaluateInversionRisk(16, 55, 10);
      expect(result.level).toBe("MODERATE");
    });

    it("identifies LOW inversion risk with brisk winds and dry air", () => {
      const result = evaluateInversionRisk(26, 40, 20);
      expect(result.level).toBe("LOW");
      expect(result.score).toBe(0);
      expect(result.isStagnant).toBe(false);

      // Temperature between 18 and 24
      const mild = evaluateInversionRisk(21, 40, 20);
      expect(mild.score).toBe(5);
    });
  });
});
