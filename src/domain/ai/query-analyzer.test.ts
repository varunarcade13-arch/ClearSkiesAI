import { describe, it, expect } from "vitest";
import {
  analyzeUserQuery,
  detectQueryIntent,
  normalizePlaceName,
} from "./query-analyzer";
import { ChatMessage } from "@/infrastructure/ai/IGenAIProvider";

describe("query-analyzer", () => {
  describe("normalizePlaceName", () => {
    it("handles common aliases and title-cases words", () => {
      expect(normalizePlaceName("gurugram")).toBe("Gurgaon");
      expect(normalizePlaceName("bangalore")).toBe("Bengaluru");
      expect(normalizePlaceName("calcutta")).toBe("Kolkata");
      expect(normalizePlaceName("bombay")).toBe("Mumbai");
      expect(normalizePlaceName("madras")).toBe("Chennai");
      expect(normalizePlaceName("new delhi")).toBe("New Delhi");
      expect(normalizePlaceName("sector 17 chandigarh")).toBe("Sector 17 Chandigarh");
      expect(normalizePlaceName("sec 62 noida")).toBe("Sec 62 Noida");
    });
  });

  describe("detectQueryIntent", () => {
    it("detects health and family protection queries", () => {
      expect(detectQueryIntent("Is it safe for children to play outside?")).toBe("HEALTH_PROTECTION");
      expect(detectQueryIntent("What precautions should elderly people take?")).toBe("HEALTH_PROTECTION");
      expect(detectQueryIntent("My baby has asthma and a persistent cough")).toBe("HEALTH_PROTECTION");
    });

    it("detects indoor air quality queries", () => {
      expect(detectQueryIntent("Should I open windows today?")).toBe("INDOOR_AIR");
      expect(detectQueryIntent("Are HEPA air purifiers effective?")).toBe("INDOOR_AIR");
      expect(detectQueryIntent("How can I reduce indoor dust?")).toBe("INDOOR_AIR");
    });

    it("detects weather and outdoor activity queries", () => {
      expect(detectQueryIntent("What is the best time for a morning walk?")).toBe("WEATHER_OUTDOOR");
      expect(detectQueryIntent("Is today suitable for outdoor exercise?")).toBe("WEATHER_OUTDOOR");
      expect(detectQueryIntent("How does temperature inversion affect smog?")).toBe("WEATHER_OUTDOOR");
    });

    it("detects sustainable living queries", () => {
      expect(detectQueryIntent("How can I reduce my carbon footprint?")).toBe("SUSTAINABLE_LIVING");
      expect(detectQueryIntent("Which commuting alternatives reduce emissions?")).toBe("SUSTAINABLE_LIVING");
    });

    it("detects community awareness queries", () => {
      expect(detectQueryIntent("How can our neighbourhood reduce pollution?")).toBe("COMMUNITY_AWARENESS");
      expect(detectQueryIntent("How can schools protect children during severe pollution?")).toBe("COMMUNITY_AWARENESS");
    });

    it("detects AQI queries", () => {
      expect(detectQueryIntent("What is the AQI of Mohali?")).toBe("AQI_QUERY");
      expect(detectQueryIntent("Explain PM2.5 and PM10")).toBe("AQI_QUERY");
      expect(detectQueryIntent("Why is smog so high?")).toBe("AQI_QUERY");
    });

    it("defaults to GENERAL for unrelated or generic inquiries", () => {
      expect(detectQueryIntent("Can you explain photosynthesis?")).toBe("GENERAL");
    });
  });

  describe("analyzeUserQuery - Explicit Locations", () => {
    it("extracts Mohali correctly when asked for Mohali AQI", () => {
      const res = analyzeUserQuery("What is the AQI of Mohali?", [], "Delhi");
      expect(res.locationType).toBe("EXPLICIT");
      expect(res.explicitLocations).toEqual(["Mohali"]);
      expect(res.isComparison).toBe(false);
    });

    it("extracts Chandigarh and Delhi for a direct comparison", () => {
      const res = analyzeUserQuery("Is the air quality better in Mohali or Delhi?", [], "Delhi");
      expect(res.locationType).toBe("EXPLICIT");
      expect(res.explicitLocations).toContain("Mohali");
      expect(res.explicitLocations).toContain("Delhi");
      expect(res.isComparison).toBe(true);
      expect(res.isCurrentLocationComparison).toBe(false);
    });

    it("extracts Sector 17 Chandigarh properly", () => {
      const res = analyzeUserQuery("What is the pollution level in Sector 17 Chandigarh?", [], "Delhi");
      expect(res.locationType).toBe("EXPLICIT");
      expect(res.explicitLocations[0]).toContain("Sector 17");
      expect(res.explicitLocations[0]).toContain("Chandigarh");
    });

    it("extracts Sector patterns where locality is not a pre-matched city", () => {
      const res = analyzeUserQuery("What is the pollution in Sector 22 Panchkula?", [], "Delhi");
      expect(res.locationType).toBe("EXPLICIT");
      expect(res.explicitLocations[0]).toContain("Sector 22 Panchkula");
    });

    it("extracts 6-digit PIN codes", () => {
      const res = analyzeUserQuery("Check AQI for 160017", [], "Delhi");
      expect(res.locationType).toBe("EXPLICIT");
      expect(res.explicitLocations).toEqual(["160017"]);
    });

    it("extracts multiple cities in a list comparison", () => {
      const res = analyzeUserQuery("Compare the pollution levels of Gurgaon, Noida and Delhi", [], "Delhi");
      expect(res.locationType).toBe("EXPLICIT");
      expect(res.isComparison).toBe(true);
      expect(res.explicitLocations).toContain("Gurgaon");
      expect(res.explicitLocations).toContain("Noida");
      expect(res.explicitLocations).toContain("Delhi");
    });

    it("extracts Mumbai when asked for Mumbai air quality", () => {
      const res = analyzeUserQuery("What is the AQI of Mumbai right now?", [], "Delhi");
      expect(res.locationType).toBe("EXPLICIT");
      expect(res.explicitLocations).toEqual(["Mumbai"]);
    });

    it("extracts unknown international cities using prepositional patterns", () => {
      const res = analyzeUserQuery("What is the air quality in Seattle right now?", [], "Delhi");
      expect(res.locationType).toBe("EXPLICIT");
      expect(res.explicitLocations).toEqual(["Seattle"]);

      const compRes = analyzeUserQuery("Compare Bristol and Seattle", [], "Delhi");
      expect(compRes.isComparison).toBe(true);
      expect(compRes.explicitLocations).toEqual(["Bristol", "Seattle"]);

      const sectorComp = analyzeUserQuery("Compare Sector 17 Chandigarh and Sector 62 Noida", [], "Delhi");
      expect(sectorComp.isComparison).toBe(true);
      expect(sectorComp.explicitLocations[0]).toContain("Sector 17");
      expect(sectorComp.explicitLocations[1]).toContain("Sector 62");

      const sectorNew = analyzeUserQuery("Compare Sector 53 Mohali and Delhi", [], "Delhi");
      expect(sectorNew.isComparison).toBe(true);
      expect(sectorNew.explicitLocations[0]).toContain("Sector 53");
    });
  });

  describe("analyzeUserQuery - Current Location Handling", () => {
    it("detects current location when asking 'near me'", () => {
      const res = analyzeUserQuery("What is the AQI near me?", [], "Delhi");
      expect(res.locationType).toBe("CURRENT");
      expect(res.explicitLocations).toEqual(["Delhi"]);
      expect(res.isComparison).toBe(false);
    });

    it("detects comparison between current location and Gurgaon", () => {
      const res = analyzeUserQuery("Compare AQI of my current location with Gurgaon", [], "Delhi");
      expect(res.locationType).toBe("EXPLICIT");
      expect(res.isComparison).toBe(true);
      expect(res.isCurrentLocationComparison).toBe(true);
      expect(res.explicitLocations).toContain("Gurgaon");
    });

    it("detects 'is my current location more polluted than Mohali'", () => {
      const res = analyzeUserQuery("Is my current location more polluted than Mohali?", [], "Delhi");
      expect(res.locationType).toBe("EXPLICIT");
      expect(res.isComparison).toBe(true);
      expect(res.isCurrentLocationComparison).toBe(true);
      expect(res.explicitLocations).toContain("Mohali");
    });

    it("uses current location for action questions without an explicit location", () => {
      const res = analyzeUserQuery("Should I open windows today?", [], "Noida");
      expect(res.locationType).toBe("CURRENT");
      expect(res.explicitLocations).toEqual(["Noida"]);
    });
  });

  describe("analyzeUserQuery - Conversational History & Follow-ups", () => {
    it("handles follow-up switch: 'What about Chandigarh?'", () => {
      const history: ChatMessage[] = [
        { role: "user", content: "What is the AQI of Mohali?" },
        { role: "assistant", content: "The AQI of Mohali is 178 (Moderate)." },
      ];
      const res = analyzeUserQuery("What about Chandigarh?", history, "Delhi");
      expect(res.locationType).toBe("EXPLICIT");
      expect(res.explicitLocations).toEqual(["Chandigarh"]);
      expect(res.referencingPreviousLocation).toBe(true);
    });

    it("handles follow-up comparison: 'Which one is better?'", () => {
      const history: ChatMessage[] = [
        { role: "user", content: "What is the AQI of Mohali?" },
        { role: "assistant", content: "The AQI in Mohali is 178." },
        { role: "user", content: "What about Chandigarh?" },
        { role: "assistant", content: "The AQI in Chandigarh is 185." },
      ];
      const res = analyzeUserQuery("Which one is better?", history, "Delhi");
      expect(res.locationType).toBe("EXPLICIT");
      expect(res.isComparison).toBe(true);
      expect(res.explicitLocations).toContain("Chandigarh");
      expect(res.explicitLocations).toContain("Mohali");
    });

    it("handles follow-up reference: 'What precautions should my family take there?'", () => {
      const history: ChatMessage[] = [
        { role: "user", content: "What is the AQI of Delhi?" },
        { role: "assistant", content: "The AQI in Delhi is 368." },
      ];
      const res = analyzeUserQuery("What precautions should my family take there?", history, "Mumbai");
      expect(res.locationType).toBe("EXPLICIT");
      expect(res.explicitLocations).toEqual(["Delhi"]);
      expect(res.referencingPreviousLocation).toBe(true);
    });
  });

  describe("analyzeUserQuery - General Conceptual Inquiries", () => {
    it("identifies general definition questions without forcing location", () => {
      const res = analyzeUserQuery("What does PM2.5 mean?", []);
      expect(res.locationType).toBe("NONE");
      expect(res.explicitLocations).toEqual([]);
      expect(res.isComparison).toBe(false);
    });

    it("identifies unrelated general knowledge questions without forcing location", () => {
      const res = analyzeUserQuery("How many continents are there on Earth?", []);
      expect(res.locationType).toBe("NONE");
      expect(res.intent).toBe("GENERAL");
    });
  });
});
