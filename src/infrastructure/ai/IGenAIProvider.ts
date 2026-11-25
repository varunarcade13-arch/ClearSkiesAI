import { AirQualityData } from "@/domain/aqi/types";
import { FamilyProfile } from "@/domain/family/types";
import { PersonalizedPlan } from "@/domain/plan/types";
import { WeatherData } from "@/domain/weather/types";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatContext {
  locationName: string;
  aqiData?: AirQualityData;
  weatherData?: WeatherData;
  familyProfile?: FamilyProfile;
}

export interface ChatResponse {
  answer: string;
  actionableTips: string[];
  scientificRationale: string;
  suggestedFollowUps: string[];
  isDemoMode: boolean;
  modelUsed: string;
}

export interface IGenAIProvider {
  isConfigured: boolean;
  generateChatResponse(
    messages: ChatMessage[],
    context: ChatContext
  ): Promise<ChatResponse>;
  generatePersonalizedPlan(
    profile: FamilyProfile,
    aqiData: AirQualityData,
    weatherData?: WeatherData
  ): Promise<PersonalizedPlan>;
}
