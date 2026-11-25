import { describe, it, expect } from "vitest";
import { calculateRequiredCADR, getVentilationGuidance } from "./calculator";

describe("Indoor Air Quality Calculator", () => {
  describe("calculateRequiredCADR", () => {
    it("calculates accurate CADR and CFM for standard bedroom dimensions", () => {
      // 4m x 3m x 2.8m = 33.6 m3. Target 4.5 ACH => 151.2 -> 151 m3/h. CFM = 151 / 1.699 = 89
      const result = calculateRequiredCADR(4, 3, 2.8, 4.5);
      expect(result.roomVolumeM3).toBe(33.6);
      expect(result.requiredCADRm3h).toBe(151);
      expect(result.requiredCADRcfm).toBe(89);
      expect(result.recommendedFilterType).toContain("True HEPA H13");
      expect(result.fanSpeedGuidance).toContain("Normal / Medium");
    });

    it("recommends high/turbo speed when target ACH is 5 or higher", () => {
      const result = calculateRequiredCADR(5, 4, 3, 5);
      expect(result.fanSpeedGuidance).toContain("High / Turbo");
    });
  });

  describe("getVentilationGuidance", () => {
    it("advises complete sealing during Severe AQI (>=300)", () => {
      const guidance = getVentilationGuidance(380);
      expect(guidance.isSafeToOpenWindows).toBe(false);
      expect(guidance.durationMinutes).toBe(0);
      expect(guidance.optimalTimeSlot).toContain("None");
      expect(guidance.scientificReason).toContain("Severe winter smog");
    });

    it("advises restricted 10-minute midday cross-ventilation during Poor/Very Poor AQI (200-299)", () => {
      const guidance = getVentilationGuidance(250);
      expect(guidance.isSafeToOpenWindows).toBe(false);
      expect(guidance.durationMinutes).toBe(10);
      expect(guidance.optimalTimeSlot).toContain("13:00 - 14:00");
    });

    it("advises midday cross-ventilation during Moderate AQI (100-199)", () => {
      const guidance = getVentilationGuidance(140);
      expect(guidance.isSafeToOpenWindows).toBe(true);
      expect(guidance.durationMinutes).toBe(45);
      expect(guidance.optimalTimeSlot).toContain("11:30 - 15:30");
    });

    it("advises all-day continuous ventilation when AQI is clean (<100)", () => {
      const guidance = getVentilationGuidance(45);
      expect(guidance.isSafeToOpenWindows).toBe(true);
      expect(guidance.durationMinutes).toBe(180);
      expect(guidance.optimalTimeSlot).toContain("All Day");
    });
  });
});
