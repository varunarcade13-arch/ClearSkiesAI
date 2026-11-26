import { AirQualityData } from "@/domain/aqi/types";
import { FamilyProfile } from "@/domain/family/types";
import { PersonalizedPlan } from "@/domain/plan/types";
import { WeatherData } from "@/domain/weather/types";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ResolvedLocationContext {
  requestedName: string;
  resolvedName: string;
  locality?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  aqiData?: AirQualityData;
  weatherData?: WeatherData;
  isCurrentLocation?: boolean;
  unresolved?: boolean;
  isAmbiguous?: boolean;
  ambiguousOptions?: string[];
  errorMessage?: string;
}

export interface LocationComparisonItem {
  name: string;
  aqi?: number;
  category?: string;
  dominantPollutant?: string;
  pm25?: number;
  pm10?: number;
  source?: string;
  timestamp?: string;
}

export interface ChatContext {
  locationName: string;
  aqiData?: AirQualityData;
  weatherData?: WeatherData;
  familyProfile?: FamilyProfile;
  resolvedLocations?: ResolvedLocationContext[];
  isComparison?: boolean;
  queryIntent?: string;
  generalQuery?: boolean;
}

export interface ChatResponse {
  answer: string;
  actionableTips: string[];
  scientificRationale: string;
  suggestedFollowUps: string[];
  isDemoMode: boolean;
  modelUsed: string;
  locationsCompared?: LocationComparisonItem[];
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
