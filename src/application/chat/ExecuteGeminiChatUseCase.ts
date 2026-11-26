import {
  ChatMessage,
  ChatContext,
  ChatResponse,
  IGenAIProvider,
  ResolvedLocationContext,
  LocationComparisonItem,
} from "@/infrastructure/ai/IGenAIProvider";
import { InputSanitizer } from "@/infrastructure/security/Sanitizer";
import { ILocationService } from "@/infrastructure/location/ILocationService";
import { IAQIService } from "@/infrastructure/aqi/IAQIService";
import { IWeatherService } from "@/infrastructure/weather/IWeatherService";
import { analyzeUserQuery } from "@/domain/ai/query-analyzer";
import { AirQualityData } from "@/domain/aqi/types";
import { WeatherData } from "@/domain/weather/types";
import { GeoLocation } from "@/domain/family/types";

export interface ExecuteChatInput {
  messages: ChatMessage[];
  context: ChatContext;
}

export class ExecuteGeminiChatUseCase {
  constructor(
    private aiProvider: IGenAIProvider,
    private locationService?: ILocationService,
    private aqiService?: IAQIService,
    private weatherService?: IWeatherService
  ) {}

  async execute(input: ExecuteChatInput): Promise<ChatResponse> {
    if (!input.messages || input.messages.length === 0) {
      throw new Error("Chat request must include at least one message.");
    }

    // Sanitize user messages
    const sanitizedMessages: ChatMessage[] = input.messages.map((m) => ({
      role: m.role,
      content: InputSanitizer.sanitizeText(m.content, 1200),
    }));

    const lastUserMessage = [...sanitizedMessages].reverse().find((m) => m.role === "user");
    const userQuery = lastUserMessage?.content || "";

    const analysis = analyzeUserQuery(
      userQuery,
      sanitizedMessages,
      input.context.locationName
    );

    // If query is purely general / conceptual with no location requirement
    if (analysis.locationType === "NONE") {
      const generalContext: ChatContext = {
        locationName: input.context.locationName || "General",
        familyProfile: input.context.familyProfile,
        generalQuery: true,
        queryIntent: analysis.intent,
        resolvedLocations: [],
      };
      return this.aiProvider.generateChatResponse(sanitizedMessages, generalContext);
    }

    // If query explicitly mentions or compares locations
    if (analysis.locationType === "EXPLICIT" && analysis.explicitLocations.length > 0) {
      const resolvedLocations: ResolvedLocationContext[] = [];

      // If comparison includes current GPS location
      if (analysis.isCurrentLocationComparison) {
        resolvedLocations.push({
          requestedName: "My Current Location",
          resolvedName: input.context.locationName || "Current Location",
          isCurrentLocation: true,
          aqiData: input.context.aqiData,
          weatherData: input.context.weatherData,
        });
      }

      // Resolve each explicitly requested location
      for (const locName of analysis.explicitLocations) {
        const resolved = await this.resolveLocationAndMetrics(locName);
        resolvedLocations.push(resolved);
      }

      // Check for ambiguous location (if user gave a single ambiguous place name)
      const ambiguous = resolvedLocations.find((r) => r.isAmbiguous && r.ambiguousOptions && r.ambiguousOptions.length > 1);
      if (ambiguous && ambiguous.ambiguousOptions) {
        return {
          answer: `Multiple places matched "${ambiguous.requestedName}". Did you mean:\n${ambiguous.ambiguousOptions.map((o) => `• ${o}`).join("\n")}\n\nPlease specify which location you would like air quality information for.`,
          actionableTips: [
            "Include the state or country with your question.",
            `Example: "What is the AQI of ${ambiguous.ambiguousOptions[0]}?"`,
          ],
          scientificRationale:
            "Air quality index calculations rely on localized weather patterns, local sensor stations, and planetary boundary layer physics unique to each geographic coordinate.",
          suggestedFollowUps: ambiguous.ambiguousOptions.slice(0, 3).map((opt) => `What is the AQI of ${opt}?`),
          isDemoMode: !this.aiProvider.isConfigured,
          modelUsed: this.aiProvider.isConfigured ? "ClearSkies Resolution Engine" : "Rule-Based Location Engine",
        };
      }

      // Check if ALL explicitly requested locations are completely unresolvable
      const allExplicitUnresolved = resolvedLocations
        .filter((r) => !r.isCurrentLocation)
        .every((r) => r.unresolved);

      if (allExplicitUnresolved && resolvedLocations.length > 0) {
        const unresName = resolvedLocations[0].requestedName;
        return {
          answer: `I could not resolve the location "${unresName}". Please check the spelling or specify the state or country (e.g., "${unresName}, State"). I do not substitute your current GPS location when an explicit place is requested.`,
          actionableTips: [
            "Check for typos in the city or locality name.",
            "Try adding the state, province, or country.",
            "You can ask 'What is the AQI near me?' to check your current area.",
          ],
          scientificRationale:
            "Deterministic environmental safety requires verified geographic coordinates for ground stations or atmospheric models.",
          suggestedFollowUps: [
            "What is the AQI near me?",
            `What is the AQI of ${input.context.locationName || "Delhi"}?`,
          ],
          isDemoMode: !this.aiProvider.isConfigured,
          modelUsed: this.aiProvider.isConfigured ? "ClearSkies Resolution Engine" : "Rule-Based Location Engine",
        };
      }

      // Check if resolved coordinates had total AQI provider failure
      const aqiFailedLoc = resolvedLocations.find((r) => !r.unresolved && r.errorMessage && !r.aqiData);
      if (aqiFailedLoc && resolvedLocations.length === 1) {
        return {
          answer: `Live air quality measurements are temporarily unavailable for ${aqiFailedLoc.resolvedName}. The monitoring stations and atmospheric forecast models for this region did not return live readings.`,
          actionableTips: [
            "Please try again in a few moments as ground monitoring networks refresh.",
            "Check if nearby regional cities have active stations.",
            "Follow general winter smog containment if haze or irritation is observed.",
          ],
          scientificRationale:
            "Ground station telemetry and satellite data feeds can occasionally experience temporary network dropouts or maintenance cycles.",
          suggestedFollowUps: [
            "What is the AQI near me?",
            "What precautions should I take during winter smog?",
          ],
          isDemoMode: !this.aiProvider.isConfigured,
          modelUsed: this.aiProvider.isConfigured ? "ClearSkies Fault-Tolerant Engine" : "Rule-Based Engine",
        };
      }

      // Build comparison list if multiple locations
      const locationsCompared: LocationComparisonItem[] = resolvedLocations
        .filter((r) => r.aqiData)
        .map((r) => ({
          name: r.resolvedName,
          aqi: r.aqiData?.aqi,
          category: r.aqiData?.category,
          dominantPollutant: r.aqiData?.dominantPollutant,
          pm25: r.aqiData?.pollutants.pm25?.value,
          pm10: r.aqiData?.pollutants.pm10?.value,
          source: r.aqiData?.source,
          timestamp: r.aqiData?.timestamp,
        }));

      // Enrich context with the primary resolved location
      const primaryLoc = resolvedLocations.find((r) => r.aqiData) || resolvedLocations[0];
      const enrichedContext: ChatContext = {
        locationName: primaryLoc.resolvedName,
        aqiData: primaryLoc.aqiData,
        weatherData: primaryLoc.weatherData,
        familyProfile: input.context.familyProfile,
        resolvedLocations,
        isComparison: analysis.isComparison,
        queryIntent: analysis.intent,
        generalQuery: false,
      };

      const res = await this.aiProvider.generateChatResponse(sanitizedMessages, enrichedContext);
      if (locationsCompared.length > 1) {
        res.locationsCompared = locationsCompared;
      }
      return res;
    }

    // Default to Current Location (e.g. "What is the AQI near me?" or location-dependent actions)
    let currentAqi = input.context.aqiData;
    let currentWeather = input.context.weatherData;

    // If context AQI data is missing but services are present and location name is available
    if (!currentAqi && this.locationService && this.aqiService && input.context.locationName) {
      try {
        const locs = await this.locationService.searchLocations(input.context.locationName);
        if (locs.length > 0) {
          currentAqi = await this.aqiService.getAirQuality(locs[0].latitude, locs[0].longitude);
          if (this.weatherService) {
            currentWeather = await this.weatherService.getWeather(locs[0].latitude, locs[0].longitude);
          }
        }
      } catch {
        // Fall through with available context
      }
    }

    const currentLocContext: ResolvedLocationContext = {
      requestedName: input.context.locationName || "Current Location",
      resolvedName: input.context.locationName || "Current Location",
      isCurrentLocation: true,
      aqiData: currentAqi,
      weatherData: currentWeather,
    };

    const enrichedContext: ChatContext = {
      locationName: input.context.locationName || "Current Location",
      aqiData: currentAqi,
      weatherData: currentWeather,
      familyProfile: input.context.familyProfile,
      resolvedLocations: [currentLocContext],
      isComparison: false,
      queryIntent: analysis.intent,
      generalQuery: false,
    };

    return this.aiProvider.generateChatResponse(sanitizedMessages, enrichedContext);
  }

  private async resolveLocationAndMetrics(locName: string): Promise<ResolvedLocationContext> {
    if (!this.locationService) {
      return {
        requestedName: locName,
        resolvedName: locName,
        unresolved: false,
      };
    }

    try {
      const candidates: GeoLocation[] = await this.locationService.searchLocations(locName);

      if (!candidates || candidates.length === 0) {
        return {
          requestedName: locName,
          resolvedName: locName,
          unresolved: true,
          errorMessage: `No geographic coordinates found for '${locName}'.`,
        };
      }

      // Ambiguity check: if multiple distinct locations returned across different countries or states
      if (
        candidates.length >= 2 &&
        !locName.includes(",") &&
        candidates[0].name.toLowerCase() === locName.toLowerCase() &&
        candidates[1].name.toLowerCase() === locName.toLowerCase() &&
        (candidates[0].country !== candidates[1].country || candidates[0].state !== candidates[1].state)
      ) {
        const options = candidates.slice(0, 3).map((c) =>
          [c.name, c.state, c.country].filter(Boolean).join(", ")
        );
        return {
          requestedName: locName,
          resolvedName: locName,
          isAmbiguous: true,
          ambiguousOptions: Array.from(new Set(options)),
        };
      }

      const top = candidates[0];
      const fullName = [top.name, top.locality, top.state, top.country]
        .filter((part, idx, arr) => Boolean(part) && arr.indexOf(part) === idx && part !== "Global")
        .join(", ");

      let aqiData: AirQualityData | undefined;
      let weatherData: WeatherData | undefined;
      let errorMessage: string | undefined;

      if (this.aqiService) {
        try {
          aqiData = await this.aqiService.getAirQuality(top.latitude, top.longitude);
        } catch {
          errorMessage = `Live air quality is currently unavailable for ${top.name}`;
        }
      }

      if (this.weatherService) {
        try {
          weatherData = await this.weatherService.getWeather(top.latitude, top.longitude);
        } catch {
          // Weather is non-blocking
        }
      }

      return {
        requestedName: locName,
        resolvedName: fullName || top.name,
        locality: top.locality,
        state: top.state,
        country: top.country,
        latitude: top.latitude,
        longitude: top.longitude,
        aqiData,
        weatherData,
        unresolved: false,
        errorMessage,
      };
    } catch {
      return {
        requestedName: locName,
        resolvedName: locName,
        unresolved: true,
        errorMessage: `Failed to resolve location '${locName}'.`,
      };
    }
  }
}
