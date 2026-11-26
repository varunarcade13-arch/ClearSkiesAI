import { describe, it, expect, vi, beforeEach } from "vitest";
import { ExecuteGeminiChatUseCase } from "./ExecuteGeminiChatUseCase";
import { IGenAIProvider, ChatContext, ChatResponse } from "@/infrastructure/ai/IGenAIProvider";
import { ILocationService } from "@/infrastructure/location/ILocationService";
import { IAQIService } from "@/infrastructure/aqi/IAQIService";
import { IWeatherService } from "@/infrastructure/weather/IWeatherService";
import { AirQualityData } from "@/domain/aqi/types";
import { WeatherData } from "@/domain/weather/types";
import { GeoLocation } from "@/domain/family/types";

describe("ExecuteGeminiChatUseCase - Comprehensive Scenarios", () => {
  let mockAiProvider: IGenAIProvider;
  let mockLocationService: ILocationService;
  let mockAqiService: IAQIService;
  let mockWeatherService: IWeatherService;

  const mockDelhiAqi: AirQualityData = {
    aqi: 368,
    category: "Very Poor",
    standard: "INDIAN_NAQI",
    dominantPollutant: "PM2.5",
    pollutants: {
      pm25: { code: "pm25", name: "PM2.5", value: 195.4, unit: "µg/m³" },
      pm10: { code: "pm10", name: "PM10", value: 312.0, unit: "µg/m³" },
    },
    source: "CPCB Mandir Marg",
    sourceType: "STATION_OBSERVATION",
    attribution: "CPCB",
    timestamp: "2026-11-26T06:00:00.000Z",
    isStale: false,
    healthAdvisory: { general: "", sensitiveGroups: "", actionableAdvice: [] },
  };

  const mockMohaliAqi: AirQualityData = {
    aqi: 178,
    category: "Moderate",
    standard: "INDIAN_NAQI",
    dominantPollutant: "PM2.5",
    pollutants: {
      pm25: { code: "pm25", name: "PM2.5", value: 82.0, unit: "µg/m³" },
      pm10: { code: "pm10", name: "PM10", value: 135.0, unit: "µg/m³" },
    },
    source: "PPCB Sector 53",
    sourceType: "STATION_OBSERVATION",
    attribution: "PPCB",
    timestamp: "2026-11-26T06:00:00.000Z",
    isStale: false,
    healthAdvisory: { general: "", sensitiveGroups: "", actionableAdvice: [] },
  };

  const mockChandigarhAqi: AirQualityData = {
    aqi: 185,
    category: "Moderate",
    standard: "INDIAN_NAQI",
    dominantPollutant: "PM2.5",
    pollutants: {
      pm25: { code: "pm25", name: "PM2.5", value: 85.0, unit: "µg/m³" },
      pm10: { code: "pm10", name: "PM10", value: 140.0, unit: "µg/m³" },
    },
    source: "CPCC Sector 22",
    sourceType: "STATION_OBSERVATION",
    attribution: "CPCC",
    timestamp: "2026-11-26T06:00:00.000Z",
    isStale: false,
    healthAdvisory: { general: "", sensitiveGroups: "", actionableAdvice: [] },
  };

  const mockWeather: WeatherData = {
    temperature: 18,
    apparentTemperature: 18,
    relativeHumidity: 65,
    windSpeed: 4.2,
    windDirection: 280,
    surfacePressure: 1012,
    weatherCode: 0,
    condition: "Clear",
    source: "Open-Meteo",
    timestamp: "2026-11-26T06:00:00.000Z",
    inversionRisk: { level: "HIGH", score: 65, description: "Stagnant", isStagnant: true },
  };

  beforeEach(() => {
    mockAiProvider = {
      isConfigured: true,
      generateChatResponse: vi.fn().mockImplementation(async (_messages, context: ChatContext) => ({
        answer: `AI Answer for ${context.locationName}`,
        actionableTips: ["Wear mask"],
        scientificRationale: "Scientific reason",
        suggestedFollowUps: ["Follow up"],
        isDemoMode: false,
        modelUsed: "TestModel",
      })),
      generatePersonalizedPlan: vi.fn(),
    };

    mockLocationService = {
      searchLocations: vi.fn().mockImplementation(async (query: string): Promise<GeoLocation[]> => {
        const q = query.toLowerCase();
        if (q.includes("mohali")) {
          return [{ name: "Mohali", state: "Punjab", country: "India", latitude: 30.68, longitude: 76.72 }];
        }
        if (q.includes("chandigarh")) {
          return [{ name: "Chandigarh", locality: "Sector 17", state: "Chandigarh", country: "India", latitude: 30.73, longitude: 76.78 }];
        }
        if (q.includes("delhi")) {
          return [{ name: "Delhi", state: "Delhi", country: "India", latitude: 28.61, longitude: 77.21 }];
        }
        if (q.includes("gurgaon")) {
          return [{ name: "Gurgaon", state: "Haryana", country: "India", latitude: 28.46, longitude: 77.03 }];
        }
        if (q.includes("mumbai")) {
          return [{ name: "Mumbai", state: "Maharashtra", country: "India", latitude: 19.07, longitude: 72.88 }];
        }
        if (q === "hyderabad") {
          return [
            { name: "Hyderabad", state: "Telangana", country: "India", latitude: 17.38, longitude: 78.48 },
            { name: "Hyderabad", state: "Sindh", country: "Pakistan", latitude: 25.39, longitude: 68.37 },
          ];
        }
        return [];
      }),
      reverseGeocode: vi.fn(),
    };

    mockAqiService = {
      providerName: "MockAQIService",
      getAirQuality: vi.fn().mockImplementation(async (lat: number) => {
        if (Math.abs(lat - 30.68) < 0.025) return mockMohaliAqi;
        if (Math.abs(lat - 30.73) < 0.025) return mockChandigarhAqi;
        if (Math.abs(lat - 28.61) < 0.025) return mockDelhiAqi;
        return mockDelhiAqi;
      }),
      getForecast: vi.fn(),
    };

    mockWeatherService = {
      providerName: "MockWeatherService",
      getWeather: vi.fn().mockResolvedValue(mockWeather),
    };
  });

  it("1. Explicit location overrides current GPS location", async () => {
    const useCase = new ExecuteGeminiChatUseCase(
      mockAiProvider,
      mockLocationService,
      mockAqiService,
      mockWeatherService
    );

    const res = await useCase.execute({
      messages: [{ role: "user", content: "What is the AQI of Mohali?" }],
      context: {
        locationName: "Delhi",
        aqiData: mockDelhiAqi,
        weatherData: mockWeather,
      },
    });

    expect(mockLocationService.searchLocations).toHaveBeenCalledWith("Mohali");
    expect(mockAqiService.getAirQuality).toHaveBeenCalledWith(30.68, 76.72);
    expect(mockAiProvider.generateChatResponse).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        locationName: expect.stringContaining("Mohali"),
        aqiData: mockMohaliAqi,
      })
    );
    expect(res.answer).toContain("Mohali");
  });

  it("2. Mohali query retrieves Mohali data", async () => {
    const useCase = new ExecuteGeminiChatUseCase(
      mockAiProvider,
      mockLocationService,
      mockAqiService,
      mockWeatherService
    );

    await useCase.execute({
      messages: [{ role: "user", content: "Tell me the pollution level in Mohali" }],
      context: { locationName: "Mumbai", aqiData: mockDelhiAqi },
    });

    const callContext = (mockAiProvider.generateChatResponse as any).mock.calls[0][1] as ChatContext;
    expect(callContext.resolvedLocations?.[0].aqiData?.aqi).toBe(178);
    expect(callContext.resolvedLocations?.[0].aqiData?.category).toBe("Moderate");
  });

  it("3. Delhi query retrieves Delhi data", async () => {
    const useCase = new ExecuteGeminiChatUseCase(
      mockAiProvider,
      mockLocationService,
      mockAqiService,
      mockWeatherService
    );

    await useCase.execute({
      messages: [{ role: "user", content: "What is the AQI in Delhi?" }],
      context: { locationName: "Mohali", aqiData: mockMohaliAqi },
    });

    const callContext = (mockAiProvider.generateChatResponse as any).mock.calls[0][1] as ChatContext;
    expect(callContext.resolvedLocations?.[0].aqiData?.aqi).toBe(368);
    expect(callContext.resolvedLocations?.[0].aqiData?.category).toBe("Very Poor");
  });

  it("4. Multiple locations retrieve independent AQI data for comparison", async () => {
    const useCase = new ExecuteGeminiChatUseCase(
      mockAiProvider,
      mockLocationService,
      mockAqiService,
      mockWeatherService
    );

    const res = await useCase.execute({
      messages: [{ role: "user", content: "Is the air quality better in Mohali or Delhi?" }],
      context: { locationName: "Bangalore" },
    });

    expect(mockLocationService.searchLocations).toHaveBeenCalledWith("Mohali");
    expect(mockLocationService.searchLocations).toHaveBeenCalledWith("Delhi");
    expect(res.locationsCompared).toHaveLength(2);
    expect(res.locationsCompared?.[0].name).toContain("Mohali");
    expect(res.locationsCompared?.[1].name).toContain("Delhi");
  });

  it("5. Current-location queries use GPS location", async () => {
    const useCase = new ExecuteGeminiChatUseCase(
      mockAiProvider,
      mockLocationService,
      mockAqiService,
      mockWeatherService
    );

    await useCase.execute({
      messages: [{ role: "user", content: "What is the AQI near me?" }],
      context: { locationName: "Delhi", aqiData: mockDelhiAqi, weatherData: mockWeather },
    });

    expect(mockLocationService.searchLocations).not.toHaveBeenCalled();
    const callContext = (mockAiProvider.generateChatResponse as any).mock.calls[0][1] as ChatContext;
    expect(callContext.locationName).toBe("Delhi");
    expect(callContext.aqiData?.aqi).toBe(368);
  });

  it("6. Missing location uses the appropriate default/context", async () => {
    const useCase = new ExecuteGeminiChatUseCase(
      mockAiProvider,
      mockLocationService,
      mockAqiService,
      mockWeatherService
    );

    await useCase.execute({
      messages: [{ role: "user", content: "Should I open windows today?" }],
      context: { locationName: "Chandigarh", aqiData: mockChandigarhAqi },
    });

    const callContext = (mockAiProvider.generateChatResponse as any).mock.calls[0][1] as ChatContext;
    expect(callContext.locationName).toBe("Chandigarh");
  });

  it("7. Invalid or unresolvable location produces a clear, transparent response without falling back to GPS", async () => {
    const useCase = new ExecuteGeminiChatUseCase(
      mockAiProvider,
      mockLocationService,
      mockAqiService,
      mockWeatherService
    );

    const res = await useCase.execute({
      messages: [{ role: "user", content: "What is the AQI of Atlantis?" }],
      context: { locationName: "Delhi", aqiData: mockDelhiAqi },
    });

    expect(res.answer).toContain("could not resolve the location \"Atlantis\"");
    expect(res.answer).not.toContain("368"); // Did NOT use Delhi AQI
    expect(mockAiProvider.generateChatResponse).not.toHaveBeenCalled();
  });

  it("8. Ambiguous location requests clarification", async () => {
    const useCase = new ExecuteGeminiChatUseCase(
      mockAiProvider,
      mockLocationService,
      mockAqiService,
      mockWeatherService
    );

    const res = await useCase.execute({
      messages: [{ role: "user", content: "What is the AQI of Hyderabad?" }],
      context: { locationName: "Delhi", aqiData: mockDelhiAqi },
    });

    expect(res.answer).toContain("Multiple places matched \"Hyderabad\"");
    expect(res.answer).toContain("Telangana");
    expect(res.answer).toContain("Sindh");
    expect(mockAiProvider.generateChatResponse).not.toHaveBeenCalled();
  });

  it("9. Geocoding failure does not silently use GPS", async () => {
    (mockLocationService.searchLocations as any).mockRejectedValueOnce(new Error("Geocoding network error"));

    const useCase = new ExecuteGeminiChatUseCase(
      mockAiProvider,
      mockLocationService,
      mockAqiService,
      mockWeatherService
    );

    const res = await useCase.execute({
      messages: [{ role: "user", content: "What is the AQI of Pune?" }],
      context: { locationName: "Delhi", aqiData: mockDelhiAqi },
    });

    expect(res.answer).toContain("could not resolve the location \"Pune\"");
    expect(res.answer).not.toContain("368");
  });

  it("10. AQI provider fallback works", async () => {
    const useCase = new ExecuteGeminiChatUseCase(
      mockAiProvider,
      mockLocationService,
      mockAqiService,
      mockWeatherService
    );

    const res = await useCase.execute({
      messages: [{ role: "user", content: "AQI in Mohali" }],
      context: { locationName: "Delhi" },
    });

    expect(res.answer).toBeDefined();
    expect(mockAqiService.getAirQuality).toHaveBeenCalled();
  });

  it("11. All AQI providers failing is handled correctly and clearly communicated", async () => {
    (mockAqiService.getAirQuality as any).mockRejectedValueOnce(new Error("Providers down"));

    const useCase = new ExecuteGeminiChatUseCase(
      mockAiProvider,
      mockLocationService,
      mockAqiService,
      mockWeatherService
    );

    const res = await useCase.execute({
      messages: [{ role: "user", content: "What is the AQI of Mohali?" }],
      context: { locationName: "Delhi", aqiData: mockDelhiAqi },
    });

    expect(res.answer).toContain("Live air quality measurements are temporarily unavailable for Mohali");
    expect(res.answer).not.toContain("368"); // Did NOT return Delhi AQI
  });

  it("12. Gemini receives the correct location and AQI context", async () => {
    const useCase = new ExecuteGeminiChatUseCase(
      mockAiProvider,
      mockLocationService,
      mockAqiService,
      mockWeatherService
    );

    await useCase.execute({
      messages: [{ role: "user", content: "What is the pollution in Sector 17 Chandigarh?" }],
      context: { locationName: "Delhi", aqiData: mockDelhiAqi },
    });

    const callContext = (mockAiProvider.generateChatResponse as any).mock.calls[0][1] as ChatContext;
    expect(callContext.locationName).toContain("Chandigarh");
    expect(callContext.resolvedLocations?.[0].aqiData?.aqi).toBe(185);
  });

  it("13. Follow-up location changes override previous locations", async () => {
    const useCase = new ExecuteGeminiChatUseCase(
      mockAiProvider,
      mockLocationService,
      mockAqiService,
      mockWeatherService
    );

    await useCase.execute({
      messages: [
        { role: "user", content: "What is the AQI of Mohali?" },
        { role: "assistant", content: "Mohali AQI is 178." },
        { role: "user", content: "What about Chandigarh?" },
      ],
      context: { locationName: "Delhi" },
    });

    expect(mockLocationService.searchLocations).toHaveBeenCalledWith("Chandigarh");
    const callContext = (mockAiProvider.generateChatResponse as any).mock.calls[0][1] as ChatContext;
    expect(callContext.locationName).toContain("Chandigarh");
    expect(callContext.aqiData?.aqi).toBe(185);
  });

  it("14. General questions are not incorrectly forced into AQI lookup", async () => {
    const useCase = new ExecuteGeminiChatUseCase(
      mockAiProvider,
      mockLocationService,
      mockAqiService,
      mockWeatherService
    );

    await useCase.execute({
      messages: [{ role: "user", content: "What does PM2.5 mean?" }],
      context: { locationName: "Delhi", aqiData: mockDelhiAqi },
    });

    expect(mockLocationService.searchLocations).not.toHaveBeenCalled();
    const callContext = (mockAiProvider.generateChatResponse as any).mock.calls[0][1] as ChatContext;
    expect(callContext.generalQuery).toBe(true);
  });

  it("15. Missing pollutant values or partial measurements are handled correctly", async () => {
    const partialAqi: AirQualityData = {
      ...mockMohaliAqi,
      pollutants: {},
    };
    (mockAqiService.getAirQuality as any).mockResolvedValueOnce(partialAqi);

    const useCase = new ExecuteGeminiChatUseCase(
      mockAiProvider,
      mockLocationService,
      mockAqiService,
      mockWeatherService
    );

    const res = await useCase.execute({
      messages: [{ role: "user", content: "What is the AQI of Mohali?" }],
      context: { locationName: "Delhi" },
    });

    expect(res).toBeDefined();
    const callContext = (mockAiProvider.generateChatResponse as any).mock.calls[0][1] as ChatContext;
    expect(callContext.resolvedLocations?.[0].aqiData?.pollutants).toEqual({});
  });

  it("handles comparisons between current location and another city", async () => {
    const useCase = new ExecuteGeminiChatUseCase(
      mockAiProvider,
      mockLocationService,
      mockAqiService,
      mockWeatherService
    );

    const res = await useCase.execute({
      messages: [{ role: "user", content: "Compare AQI of my current location with Gurgaon" }],
      context: { locationName: "Delhi", aqiData: mockDelhiAqi, weatherData: mockWeather },
    });

    expect(res.locationsCompared?.some((l) => l.name === "Delhi")).toBe(true);
    expect(res.locationsCompared?.some((l) => l.name.includes("Gurgaon"))).toBe(true);
  });

  it("handles missing context AQI by dynamically resolving coordinates and weather", async () => {
    const useCase = new ExecuteGeminiChatUseCase(
      mockAiProvider,
      mockLocationService,
      mockAqiService,
      mockWeatherService
    );

    const res = await useCase.execute({
      messages: [{ role: "user", content: "What is the AQI near me?" }],
      context: { locationName: "Delhi" },
    });

    expect(mockLocationService.searchLocations).toHaveBeenCalledWith("Delhi");
    expect(mockAqiService.getAirQuality).toHaveBeenCalled();
    expect(res).toBeDefined();
  });

  it("handles empty locationName in general inquiry and handles weatherService failure gracefully", async () => {
    (mockWeatherService.getWeather as any).mockRejectedValueOnce(new Error("Weather down"));

    const useCase = new ExecuteGeminiChatUseCase(
      mockAiProvider,
      mockLocationService,
      mockAqiService,
      mockWeatherService
    );

    const res = await useCase.execute({
      messages: [{ role: "user", content: "What is photosynthesis?" }],
      context: { locationName: "" },
    });

    expect(res.answer).toBeDefined();

    // Weather failure on explicit location
    const res2 = await useCase.execute({
      messages: [{ role: "user", content: "AQI in Mohali" }],
      context: { locationName: "Delhi" },
    });
    expect(res2.answer).toBeDefined();
  });

  it("throws error when messages are empty and handles use case without location service", async () => {
    const useCaseOnlyAi = new ExecuteGeminiChatUseCase(mockAiProvider);

    await expect(
      useCaseOnlyAi.execute({ messages: [], context: { locationName: "Delhi" } })
    ).rejects.toThrow("Chat request must include at least one message.");

    const res = await useCaseOnlyAi.execute({
      messages: [{ role: "user", content: "What is the AQI of Mohali?" }],
      context: { locationName: "Delhi" },
    });
    expect(res.answer).toBeDefined();
  });
});
