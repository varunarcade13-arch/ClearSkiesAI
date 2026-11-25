import { describe, it, expect } from "vitest";
import {
  calculateSubIndex,
  getIndianNAQICategory,
  getUSAQICategory,
  getAQICategory,
  calculateOverallAQI,
  getHealthAdvisory,
} from "./calculator";

describe("AQI Calculator Domain", () => {
  describe("calculateSubIndex", () => {
    it("handles concentration gaps between integer breakpoints", () => {
      expect(calculateSubIndex("pm25", 30.5, "INDIAN_NAQI")).toBe(50);
      expect(calculateSubIndex("pm25", 120.5, "INDIAN_NAQI")).toBe(300);
    });
    it("returns null for negative or NaN values", () => {
      expect(calculateSubIndex("pm25", -5)).toBeNull();
      expect(calculateSubIndex("pm25", NaN)).toBeNull();
    });

    it("returns null for unknown pollutant", () => {
      expect(calculateSubIndex("unknown_gas", 50)).toBeNull();
    });

    it("calculates accurate Indian NAQI sub-index for PM2.5", () => {
      // 0-30 -> 0-50
      expect(calculateSubIndex("pm25", 15, "INDIAN_NAQI")).toBe(25);
      expect(calculateSubIndex("pm25", 30, "INDIAN_NAQI")).toBe(50);

      // 31-60 -> 51-100
      const subIdx = calculateSubIndex("pm25", 45, "INDIAN_NAQI");
      expect(subIdx).toBeGreaterThanOrEqual(74);
      expect(subIdx).toBeLessThanOrEqual(76);

      // Severe range: 251-500 -> 401-500
      expect(calculateSubIndex("pm25", 251, "INDIAN_NAQI")).toBe(401);
      // Above 500 concentration caps at 500
      expect(calculateSubIndex("pm25", 600, "INDIAN_NAQI")).toBe(500);
    });

    it("calculates accurate Indian NAQI sub-index for PM10, NO2, SO2, CO, and O3", () => {
      expect(calculateSubIndex("pm10", 25, "INDIAN_NAQI")).toBe(25);
      expect(calculateSubIndex("no2", 20, "INDIAN_NAQI")).toBe(25);
      expect(calculateSubIndex("so2", 20, "INDIAN_NAQI")).toBe(25);
      expect(calculateSubIndex("co", 0.5, "INDIAN_NAQI")).toBe(25);
      expect(calculateSubIndex("o3", 25, "INDIAN_NAQI")).toBe(25);
    });

    it("handles boundary float gap between intervals", () => {
      // Between 30 and 31 for PM2.5 in Indian NAQI
      const gapVal = calculateSubIndex("pm25", 30.5, "INDIAN_NAQI");
      expect(gapVal).toBe(50);
    });

    it("calculates US EPA AQI sub-index for PM2.5", () => {
      // 0-12 -> 0-50
      expect(calculateSubIndex("pm25", 6.0, "US_AQI")).toBe(25);
      // > 500.4 caps at 500
      expect(calculateSubIndex("pm25", 600, "US_AQI")).toBe(500);
    });
  });

  describe("getIndianNAQICategory", () => {
    it("correctly identifies all 6 Indian CPCB categories", () => {
      expect(getIndianNAQICategory(40)).toBe("Good");
      expect(getIndianNAQICategory(80)).toBe("Satisfactory");
      expect(getIndianNAQICategory(150)).toBe("Moderate");
      expect(getIndianNAQICategory(250)).toBe("Poor");
      expect(getIndianNAQICategory(350)).toBe("Very Poor");
      expect(getIndianNAQICategory(450)).toBe("Severe");
    });
  });

  describe("getUSAQICategory", () => {
    it("correctly maps US AQI values to unified category names", () => {
      expect(getUSAQICategory(30)).toBe("Good");
      expect(getUSAQICategory(80)).toBe("Satisfactory");
      expect(getUSAQICategory(120)).toBe("Moderate");
      expect(getUSAQICategory(180)).toBe("Poor");
      expect(getUSAQICategory(250)).toBe("Very Poor");
      expect(getUSAQICategory(350)).toBe("Severe");
    });
  });

  describe("getAQICategory", () => {
    it("dispatches correctly according to standard parameter", () => {
      expect(getAQICategory(80, "INDIAN_NAQI")).toBe("Satisfactory");
      expect(getAQICategory(120, "US_AQI")).toBe("Moderate");
    });
  });

  describe("calculateOverallAQI", () => {
    it("identifies highest sub-index as overall AQI and dominant pollutant", () => {
      const measurements = {
        pm25: 180, // Sub index ~ 340 (Very Poor)
        pm10: 100, // Sub index = 100 (Satisfactory)
        no2: 20,   // Sub index = 25 (Good)
      };

      const result = calculateOverallAQI(measurements, "INDIAN_NAQI");
      expect(result.aqi).toBeGreaterThanOrEqual(300);
      expect(result.dominantPollutant).toBe("pm25");
      expect(result.category).toBe("Very Poor");
      expect(result.subIndices.pm25).toBeDefined();
    });

    it("handles empty measurements with default baseline", () => {
      const result = calculateOverallAQI({});
      expect(result.aqi).toBe(0);
      expect(result.category).toBe("Good");
      expect(result.dominantPollutant).toBe("none");
    });

    it("handles invalid pollutant measurements gracefully", () => {
      const result = calculateOverallAQI({ unknown_gas: -10 });
      expect(result.aqi).toBe(0);
      expect(result.category).toBe("Good");
      expect(result.dominantPollutant).toBe("pm25");
    });
  });

  describe("getHealthAdvisory", () => {
    it("returns specific actionable advisory for each category", () => {
      const categories = ["Good", "Satisfactory", "Moderate", "Poor", "Very Poor", "Severe"] as const;
      for (const cat of categories) {
        const adv = getHealthAdvisory(cat);
        expect(adv.general).toBeTruthy();
        expect(adv.sensitiveGroups).toBeTruthy();
        expect(adv.actionableAdvice.length).toBeGreaterThan(0);
      }
    });
  });
});
