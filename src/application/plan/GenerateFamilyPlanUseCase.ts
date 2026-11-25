import { FamilyProfile, FamilyProfileSchema } from "@/domain/family/types";
import { PersonalizedPlan } from "@/domain/plan/types";
import { IAQIService } from "@/infrastructure/aqi/IAQIService";
import { IWeatherService } from "@/infrastructure/weather/IWeatherService";
import { IGenAIProvider } from "@/infrastructure/ai/IGenAIProvider";

export class GenerateFamilyPlanUseCase {
  constructor(
    private aqiService: IAQIService,
    private weatherService: IWeatherService,
    private aiProvider: IGenAIProvider
  ) {}

  async execute(profileInput: unknown): Promise<PersonalizedPlan> {
    const validatedProfile: FamilyProfile = FamilyProfileSchema.parse(profileInput);

    const [aqiData, weatherData] = await Promise.all([
      this.aqiService.getAirQuality(
        validatedProfile.location.latitude,
        validatedProfile.location.longitude,
        "INDIAN_NAQI"
      ),
      this.weatherService.getWeather(
        validatedProfile.location.latitude,
        validatedProfile.location.longitude
      ),
    ]);

    return this.aiProvider.generatePersonalizedPlan(
      validatedProfile,
      aqiData,
      weatherData
    );
  }
}
