import { AQIForecastData, AQIStandard } from "@/domain/aqi/types";
import { IAQIService } from "@/infrastructure/aqi/IAQIService";

export class GetForecastUseCase {
  constructor(private aqiService: IAQIService) {}

  async execute(
    latitude: number,
    longitude: number,
    standard: AQIStandard = "INDIAN_NAQI"
  ): Promise<AQIForecastData> {
    return this.aqiService.getForecast(latitude, longitude, standard);
  }
}
