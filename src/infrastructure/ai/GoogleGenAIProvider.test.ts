import { describe, it, expect, vi } from "vitest";
import { GoogleGenAIProvider } from "./GoogleGenAIProvider";
import { FamilyProfile } from "@/domain/family/types";
import { AirQualityData } from "@/domain/aqi/types";
import { GoogleGenAI } from "@google/genai";

describe("GoogleGenAIProvider", () => {
  const mockAqi: AirQualityData = {
    aqi: 360,
    category: "Very Poor",
    standard: "INDIAN_NAQI",
    dominantPollutant: "PM2.5",
    pollutants: {
      pm25: { code: "pm25", name: "PM2.5", value: 190, unit: "µg/m³" },
    },
    source: "Mock Station",
    sourceType: "STATION_OBSERVATION",
    attribution: "CPCB",
    timestamp: new Date().toISOString(),
    isStale: false,
    healthAdvisory: {
      general: "High respiratory risk.",
      sensitiveGroups: "Remain indoors.",
      actionableAdvice: ["Wear N95."],
    },
  };

  const mockProfile: FamilyProfile = {
    location: { name: "Delhi", latitude: 28.61, longitude: 77.2, country: "India" },
    familySize: 3,
    hasYoungChildren: true,
    hasElderly: true,
    hasRespiratorySensitivities: true,
    workRoutine: "hybrid",
    commuteMethod: "metro_train",
    exerciseTiming: "early_morning",
    homeType: "apartment",
    airPurifierStatus: "single_room",
  };

  it("operates in Demo Mode when GEMINI_API_KEY is not configured", async () => {
    const provider = new GoogleGenAIProvider(undefined);
    expect(provider.isConfigured).toBe(false);

    // General question
    const generalChat = await provider.generateChatResponse(
      [{ role: "user", content: "What precautions should I take?" }],
      { locationName: "Delhi", aqiData: mockAqi }
    );
    expect(generalChat.isDemoMode).toBe(true);
    expect(generalChat.answer).toContain("DEMO MODE");
    expect(generalChat.actionableTips.length).toBeGreaterThan(0);

    // Child in park question
    const childChat = await provider.generateChatResponse(
      [{ role: "user", content: "Can my child play in the park today?" }],
      { locationName: "Delhi", aqiData: mockAqi }
    );
    expect(childChat.answer).toContain("children should strictly avoid outdoor sports");

    // Morning walk question
    const walkChat = await provider.generateChatResponse(
      [{ role: "user", content: "Should I go for my morning jog?" }],
      { locationName: "Delhi", aqiData: mockAqi }
    );
    expect(walkChat.answer).toContain("Morning walks must be suspended");

    // Air purifier question
    const purifierChat = await provider.generateChatResponse(
      [{ role: "user", content: "Is an air purifier worth it?" }],
      { locationName: "Delhi", aqiData: mockAqi }
    );
    expect(purifierChat.answer).toContain("Air purifiers with True HEPA");
  });

  it("generates a comprehensive 7-phase personalized plan in demo mode", async () => {
    const provider = new GoogleGenAIProvider(undefined);
    const plan = await provider.generatePersonalizedPlan(mockProfile, mockAqi);

    expect(plan.locationName).toBe("Delhi");
    expect(plan.aqiSnapshot).toBe(360);
    expect(plan.vulnerabilityLevel).toBe("HIGH");
    expect(plan.phases.morning).toBeDefined();
    expect(plan.phases.outdoorActivity).toBeDefined();
    expect(plan.phases.commuting).toBeDefined();
    expect(plan.phases.indoorAirQuality).toBeDefined();
    expect(plan.phases.afternoon).toBeDefined();
    expect(plan.phases.evening).toBeDefined();
    expect(plan.phases.nightTime).toBeDefined();
    expect(plan.disclaimer).toContain("does not constitute medical diagnosis");
  });

  it("handles live Gemini SDK calls when configured", async () => {
    const provider = new GoogleGenAIProvider("mock-api-key");
    expect(provider.isConfigured).toBe(true);

    const generateContent = vi.fn().mockResolvedValue({
      text: JSON.stringify({
        answer: "Live AI advice: Stay indoors and seal rooms.",
        actionableTips: ["Wear N95", "Run HEPA filter"],
        scientificRationale: "Thermal inversion traps particulates.",
        suggestedFollowUps: ["When to open windows?"],
      }),
    });

    // @ts-expect-error Mocking the private SDK client for an isolated unit test.
    provider.genAI = { models: { generateContent } } as unknown as GoogleGenAI;

    const res = await provider.generateChatResponse(
      [{ role: "user", content: "How is the air quality?" }],
      { locationName: "Delhi", aqiData: mockAqi }
    );

    expect(res.isDemoMode).toBe(false);
    expect(res.answer).toBe("Live AI advice: Stay indoors and seal rooms.");
    expect(res.actionableTips).toEqual(["Wear N95", "Run HEPA filter"]);

    // Test error fallback
    generateContent.mockRejectedValueOnce(new Error("Quota exhausted"));
    const fallbackRes = await provider.generateChatResponse(
      [{ role: "user", content: "How is the air?" }],
      { locationName: "Delhi", aqiData: mockAqi }
    );
    expect(fallbackRes.isDemoMode).toBe(true);
  });

  it("uses fallback chat for empty, malformed, or schema-invalid model output", async () => {
    const provider = new GoogleGenAIProvider("mock-api-key");
    const generateContent = vi.fn();
    // @ts-expect-error Inject a controlled SDK boundary for tests.
    provider.genAI = { models: { generateContent } } as unknown as GoogleGenAI;
    for (const text of [undefined, "not-json", JSON.stringify({ answer: "", actionableTips: [], scientificRationale: "x", suggestedFollowUps: [] })]) {
      generateContent.mockResolvedValueOnce({ text });
      const answer = await provider.generateChatResponse([{ role: "assistant", content: "hello" }], { locationName: "" });
      expect(answer.isDemoMode).toBe(true);
      expect(answer.answer).toContain("DEMO MODE");
    }
  });

  it("validates live family plan output and falls back for malformed plans", async () => {
    const demoPlan = await new GoogleGenAIProvider(undefined).generatePersonalizedPlan(mockProfile, mockAqi);
    const provider = new GoogleGenAIProvider("mock-api-key");
    const generateContent = vi.fn().mockResolvedValue({ text: JSON.stringify(demoPlan) });
    // @ts-expect-error Inject a controlled SDK boundary for tests.
    provider.genAI = { models: { generateContent } } as unknown as GoogleGenAI;
    const weather = { temperature: 12, apparentTemperature: 11, relativeHumidity: 70, windSpeed: 3, windDirection: 20, surfacePressure: 1010, weatherCode: 3, condition: "Cloudy", source: "test", timestamp: new Date().toISOString(), inversionRisk: { level: "LOW" as const, score: 10, description: "mixing", isStagnant: false } };
    await expect(provider.generatePersonalizedPlan(mockProfile, mockAqi, weather)).resolves.toMatchObject({ locationName: "Delhi", aqiSnapshot: 360 });
    generateContent.mockResolvedValueOnce({ text: "{}" });
    await expect(provider.generatePersonalizedPlan(mockProfile, mockAqi)).resolves.toMatchObject({ locationName: "Delhi", aqiSnapshot: 360 });
  });

  it("creates lower vulnerability demo plans with low-AQI ventilation advice", async () => {
    const profile: FamilyProfile = { ...mockProfile, hasYoungChildren: false, hasElderly: false, hasRespiratorySensitivities: false, airPurifierStatus: "whole_home", commuteMethod: "metro_train" };
    const lowAqi = { ...mockAqi, aqi: 40, category: "Good" as const };
    const result = await new GoogleGenAIProvider(undefined).generatePersonalizedPlan(profile, lowAqi);
    expect(result.vulnerabilityLevel).toBe("STANDARD");
    expect(result.phases.afternoon.recommendation).toContain("cross-ventilation");
  });

  it("falls back when Gemini returns an empty plan response", async () => {
    const provider = new GoogleGenAIProvider("mock-api-key");
    // @ts-expect-error Controlled SDK boundary for the empty-response case.
    provider.genAI = { models: { generateContent: vi.fn().mockResolvedValue({ text: "" }) } } as unknown as GoogleGenAI;
    const result = await provider.generatePersonalizedPlan(mockProfile, mockAqi);
    expect(result.locationName).toBe("Delhi");
    expect(result.phases.morning).toBeDefined();
  });

  it("builds live prompts for lower-risk families and complete environmental context", async () => {
    const provider = new GoogleGenAIProvider("mock-api-key");
    const demoPlan = await new GoogleGenAIProvider(undefined).generatePersonalizedPlan(mockProfile, mockAqi);
    const planCall = vi.fn().mockResolvedValue({ text: JSON.stringify(demoPlan) });
    // @ts-expect-error Controlled SDK boundary for deterministic prompt inspection.
    provider.genAI = { models: { generateContent: planCall } } as unknown as GoogleGenAI;
    const lowRiskProfile: FamilyProfile = { ...mockProfile, hasYoungChildren: false, hasElderly: false, hasRespiratorySensitivities: false, airPurifierStatus: "whole_home" };
    await provider.generatePersonalizedPlan(lowRiskProfile, { ...mockAqi, pollutants: {} });
    expect(planCall.mock.calls[0][0].contents).toContain("Young Children: No");
    expect(planCall.mock.calls[0][0].contents).toContain("PM2.5: N/A");
    expect(planCall.mock.calls[0][0].contents).toContain("Typical winter smog");
    await provider.generatePersonalizedPlan(mockProfile, mockAqi);
    const moderateProfile: FamilyProfile = { ...lowRiskProfile, hasYoungChildren: true };
    await provider.generatePersonalizedPlan(moderateProfile, mockAqi);
    expect(planCall.mock.calls[2][0].contents).toContain('"vulnerabilityLevel": "MODERATE"');
    const moderateDemo = await new GoogleGenAIProvider(undefined).generatePersonalizedPlan(moderateProfile, mockAqi);
    expect(moderateDemo.vulnerabilityLevel).toBe("MODERATE");

    const chatCall = vi.fn().mockResolvedValue({ text: JSON.stringify({ answer: "Advice", actionableTips: [], scientificRationale: "Reason", suggestedFollowUps: [] }) });
    // @ts-expect-error Controlled SDK boundary for prompt coverage.
    provider.genAI = { models: { generateContent: chatCall } } as unknown as GoogleGenAI;
    await provider.generateChatResponse([{ role: "user", content: "What should we do?" }], {
      locationName: "Delhi", aqiData: { ...mockAqi, pollutants: { pm25: { code: "pm25", name: "PM2.5", value: 0, unit: "µg/m³" } } },
      weatherData: { temperature: 10, apparentTemperature: 9, relativeHumidity: 75, windSpeed: 3, windDirection: 1, surfacePressure: 1010, weatherCode: 45, condition: "Fog", source: "test", timestamp: new Date().toISOString(), inversionRisk: { level: "HIGH", score: 75, description: "stagnant", isStagnant: true } },
      familyProfile: lowRiskProfile,
    });
    const prompt = chatCall.mock.calls[0][0].contents as string;
    expect(prompt).toContain("Family Size: 3");
    expect(prompt).toContain("PM2.5: Unknown");
    expect(prompt).toContain("10°C, Fog");
    expect(prompt).toContain("Young Children: No");
    await provider.generateChatResponse([{ role: "user", content: "Protect my household" }], { locationName: "Delhi", aqiData: mockAqi, familyProfile: mockProfile });
    expect(chatCall.mock.calls[1][0].contents).toContain("Young Children: Yes");
  });
});
