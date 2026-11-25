import { FamilyProfile } from "@/domain/family/types";
import { RoutineRecommendation } from "@/domain/recommendation/types";
import { generateRoutineRecommendations } from "@/domain/recommendation/generator";
import { IAQIService } from "@/infrastructure/aqi/IAQIService";

export class GetRecommendationsUseCase {
  constructor(private aqiService: IAQIService) {}

  async execute(
    latitude: number,
    longitude: number,
    profile?: FamilyProfile
  ): Promise<RoutineRecommendation[]> {
    const aqiData = await this.aqiService.getAirQuality(latitude, longitude, "INDIAN_NAQI");
    return generateRoutineRecommendations(aqiData.aqi, aqiData.category, profile);
  }
}
