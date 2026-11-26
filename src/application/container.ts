import { AggregatingAQIProvider } from "@/infrastructure/aqi/AggregatingAQIProvider";
import { OpenMeteoWeatherProvider } from "@/infrastructure/weather/OpenMeteoWeatherProvider";
import { OpenMeteoGeocodingProvider } from "@/infrastructure/location/OpenMeteoGeocodingProvider";
import { NominatimReverseGeocodingProvider } from "@/infrastructure/location/NominatimReverseGeocodingProvider";
import { GoogleGenAIProvider } from "@/infrastructure/ai/GoogleGenAIProvider";
import { SlidingWindowRateLimiter } from "@/infrastructure/security/RateLimiter";
import { GetLiveAQIUseCase } from "./aqi/GetLiveAQIUseCase";
import { GetForecastUseCase } from "./aqi/GetForecastUseCase";
import { ExecuteGeminiChatUseCase } from "./chat/ExecuteGeminiChatUseCase";
import { GenerateFamilyPlanUseCase } from "./plan/GenerateFamilyPlanUseCase";
import { GetRecommendationsUseCase } from "./recommendations/GetRecommendationsUseCase";

class ServiceContainer {
  private static instance: ServiceContainer;

  readonly aqiService: AggregatingAQIProvider;
  readonly weatherService: OpenMeteoWeatherProvider;
  readonly locationService: OpenMeteoGeocodingProvider;
  readonly reverseGeocodingService: NominatimReverseGeocodingProvider;
  readonly aiProvider: GoogleGenAIProvider;
  readonly rateLimiter: SlidingWindowRateLimiter;

  readonly getLiveAQIUseCase: GetLiveAQIUseCase;
  readonly getForecastUseCase: GetForecastUseCase;
  readonly executeChatUseCase: ExecuteGeminiChatUseCase;
  readonly generatePlanUseCase: GenerateFamilyPlanUseCase;
  readonly getRecommendationsUseCase: GetRecommendationsUseCase;

  private constructor() {
    const waqiToken = process.env.WAQI_API_TOKEN;
    const geminiKey = process.env.GEMINI_API_KEY;

    this.aqiService = new AggregatingAQIProvider(waqiToken);
    this.weatherService = new OpenMeteoWeatherProvider();
    this.locationService = new OpenMeteoGeocodingProvider();
    this.reverseGeocodingService = new NominatimReverseGeocodingProvider();
    this.aiProvider = new GoogleGenAIProvider(geminiKey);
    this.rateLimiter = new SlidingWindowRateLimiter(60, 60 * 1000); // 60 requests/min per IP

    this.getLiveAQIUseCase = new GetLiveAQIUseCase(this.aqiService, this.weatherService);
    this.getForecastUseCase = new GetForecastUseCase(this.aqiService);
    this.executeChatUseCase = new ExecuteGeminiChatUseCase(
      this.aiProvider,
      this.locationService,
      this.aqiService,
      this.weatherService
    );
    this.generatePlanUseCase = new GenerateFamilyPlanUseCase(
      this.aqiService,
      this.weatherService,
      this.aiProvider
    );
    this.getRecommendationsUseCase = new GetRecommendationsUseCase(this.aqiService);
  }

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }
}

export const container = ServiceContainer.getInstance();
