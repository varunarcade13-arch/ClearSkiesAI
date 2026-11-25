import { AirQualityData, AQIStandard } from "@/domain/aqi/types";
import { WeatherData } from "@/domain/weather/types";
import { AirQualityAlert, evaluateAirQualityAlerts } from "@/domain/alert/evaluator";
import { IAQIService } from "@/infrastructure/aqi/IAQIService";
import { IWeatherService } from "@/infrastructure/weather/IWeatherService";

export interface LiveAQIResult {
  aqi: AirQualityData;
  weather: WeatherData;
  alerts: AirQualityAlert[];
  standard: AQIStandard;
  timestamp: string;
}

export class GetLiveAQIUseCase {
  constructor(
    private aqiService: IAQIService,
    private weatherService: IWeatherService
  ) {}

  async execute(
    latitude: number,
    longitude: number,
    standard: AQIStandard = "INDIAN_NAQI",
    previousAqi?: number
  ): Promise<LiveAQIResult> {
    const [aqi, weather] = await Promise.all([
      this.aqiService.getAirQuality(latitude, longitude, standard),
      this.weatherService.getWeather(latitude, longitude),
    ]);

    const alerts = evaluateAirQualityAlerts(aqi.aqi, previousAqi, aqi.category);

    return {
      aqi,
      weather,
      alerts,
      standard,
      timestamp: new Date().toISOString(),
    };
  }
}
