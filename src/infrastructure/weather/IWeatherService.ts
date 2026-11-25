import { WeatherData } from "@/domain/weather/types";

export interface IWeatherService {
  providerName: string;
  getWeather(latitude: number, longitude: number): Promise<WeatherData>;
}
