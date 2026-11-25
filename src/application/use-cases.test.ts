import { describe, it, expect, vi } from "vitest";
import { GetLiveAQIUseCase } from "./aqi/GetLiveAQIUseCase";
import { GetForecastUseCase } from "./aqi/GetForecastUseCase";
import { ExecuteGeminiChatUseCase } from "./chat/ExecuteGeminiChatUseCase";
import { GenerateFamilyPlanUseCase } from "./plan/GenerateFamilyPlanUseCase";
import { GetRecommendationsUseCase } from "./recommendations/GetRecommendationsUseCase";
import { AirQualityData, AQIForecastData } from "@/domain/aqi/types";
import { WeatherData } from "@/domain/weather/types";

describe("Application Layer Use Cases", () => {
  const mockAqi: AirQualityData = {
    aqi: 320,
    category: "Very Poor",
    standard: "INDIAN_NAQI",
    dominantPollutant: "PM2.5",
    pollutants: {},
    source: "Test",
    sourceType: "STATION_OBSERVATION",
    attribution: "CPCB",
    timestamp: new Date().toISOString(),
    isStale: false,
    healthAdvisory: { general: "", sensitiveGroups: "", actionableAdvice: [] },
  };

  const mockWeather: WeatherData = {
    temperature: 15,
    apparentTemperature: 14,
    relativeHumidity: 75,
    windSpeed: 4,
    windDirection: 270,
    surfacePressure: 1015,
    weatherCode: 45,
    condition: "Fog",
    source: "Test",
    timestamp: new Date().toISOString(),
    inversionRisk: { level: "HIGH", score: 60, description: "", isStagnant: true },
  };

  describe("GetLiveAQIUseCase", () => {
    it("coordinates AQI and weather services and evaluates alerts", async () => {
      const mockAqiService = {
        providerName: "MockAQI",
        getAirQuality: vi.fn().mockResolvedValue(mockAqi),
        getForecast: vi.fn(),
      };
      const mockWeatherService = {
        providerName: "MockWeather",
        getWeather: vi.fn().mockResolvedValue(mockWeather),
      };

      const useCase = new GetLiveAQIUseCase(mockAqiService, mockWeatherService);
      const result = await useCase.execute(28.61, 77.2, "INDIAN_NAQI", 250);

      expect(result.aqi.aqi).toBe(320);
      expect(result.weather.temperature).toBe(15);
      expect(result.alerts.length).toBeGreaterThan(0); // 320 is Very Poor + rapid increase
    });
  });

  describe("GetForecastUseCase", () => {
    it("retrieves forecast from AQI service", async () => {
      const mockForecast: AQIForecastData = {
        current: mockAqi,
        historical24h: [],
        forecast72h: [],
        standard: "INDIAN_NAQI",
        source: "Test",
        sourceType: "MODEL_ESTIMATE",
        generatedAt: new Date().toISOString(),
      };

      const mockAqiService = {
        providerName: "MockAQI",
        getAirQuality: vi.fn(),
        getForecast: vi.fn().mockResolvedValue(mockForecast),
      };

      const useCase = new GetForecastUseCase(mockAqiService);
      const res = await useCase.execute(28.61, 77.2);
      expect(res.sourceType).toBe("MODEL_ESTIMATE");
    });
  });

  describe("ExecuteGeminiChatUseCase", () => {
    it("throws error if messages array is empty", async () => {
      const mockAi = {
        isConfigured: false,
        generateChatResponse: vi.fn(),
        generatePersonalizedPlan: vi.fn(),
      };
      const useCase = new ExecuteGeminiChatUseCase(mockAi);
      await expect(
        useCase.execute({ messages: [], context: { locationName: "Delhi" } })
      ).rejects.toThrow("Chat request must include at least one message.");
    });

    it("sanitizes messages and delegates to AI provider", async () => {
      const mockAi = {
        isConfigured: false,
        generateChatResponse: vi.fn().mockResolvedValue({
          answer: "Response text",
          actionableTips: [],
          scientificRationale: "",
          suggestedFollowUps: [],
          isDemoMode: true,
          modelUsed: "Demo",
        }),
        generatePersonalizedPlan: vi.fn(),
      };

      const useCase = new ExecuteGeminiChatUseCase(mockAi);
      const res = await useCase.execute({
        messages: [{ role: "user", content: "<b>Hello</b>" }],
        context: { locationName: "Delhi" },
      });

      expect(res.answer).toBe("Response text");
      expect(mockAi.generateChatResponse).toHaveBeenCalledWith(
        [{ role: "user", content: "Hello" }],
        { locationName: "Delhi" }
      );
    });
  });

  describe("GenerateFamilyPlanUseCase", () => {
    it("validates family profile, fetches context, and returns plan", async () => {
      const mockAqiService = {
        providerName: "MockAQI",
        getAirQuality: vi.fn().mockResolvedValue(mockAqi),
        getForecast: vi.fn(),
      };
      const mockWeatherService = {
        providerName: "MockWeather",
        getWeather: vi.fn().mockResolvedValue(mockWeather),
      };
      const mockAi = {
        isConfigured: false,
        generateChatResponse: vi.fn(),
        generatePersonalizedPlan: vi.fn().mockResolvedValue({
          id: "plan-1",
          locationName: "Delhi",
        }),
      };

      const useCase = new GenerateFamilyPlanUseCase(
        mockAqiService,
        mockWeatherService,
        mockAi
      );

      const profileInput = {
        location: { name: "Delhi", latitude: 28.61, longitude: 77.2, country: "India" },
        familySize: 3,
        hasYoungChildren: true,
        hasElderly: false,
        hasRespiratorySensitivities: false,
      };

      const plan = await useCase.execute(profileInput);
      expect(plan.id).toBe("plan-1");
    });
  });

  describe("GetRecommendationsUseCase", () => {
    it("fetches AQI and generates tailored recommendations", async () => {
      const mockAqiService = {
        providerName: "MockAQI",
        getAirQuality: vi.fn().mockResolvedValue(mockAqi),
        getForecast: vi.fn(),
      };

      const useCase = new GetRecommendationsUseCase(mockAqiService);
      const recs = await useCase.execute(28.61, 77.2);

      expect(recs.length).toBeGreaterThan(0);
    });
  });
});
