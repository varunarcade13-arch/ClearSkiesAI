import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { AirQualityData } from "@/domain/aqi/types";
import { FamilyProfile, calculateVulnerabilityScore } from "@/domain/family/types";
import { PersonalizedPlan, PersonalizedPlanSchema } from "@/domain/plan/types";
import { WeatherData } from "@/domain/weather/types";
import { InputSanitizer } from "../security/Sanitizer";
import {
  ChatMessage,
  ChatContext,
  ChatResponse,
  IGenAIProvider,
} from "./IGenAIProvider";

const ChatOutputSchema = z.object({
  answer: z.string().trim().min(1).max(3000),
  actionableTips: z.array(z.string().trim().min(1).max(500)).max(8),
  scientificRationale: z.string().trim().min(1).max(1500),
  suggestedFollowUps: z.array(z.string().trim().min(1).max(300)).max(6),
});

export class GoogleGenAIProvider implements IGenAIProvider {
  private genAI: GoogleGenAI | null = null;
  private apiKey: string | undefined;
  private modelId: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY;
    this.modelId = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite";
    if (this.apiKey && this.apiKey.trim().length > 0) {
      this.genAI = new GoogleGenAI({ apiKey: this.apiKey });
    }
  }

  get isConfigured(): boolean {
    return Boolean(this.genAI);
  }

  async generateChatResponse(
    messages: ChatMessage[],
    context: ChatContext
  ): Promise<ChatResponse> {
    if (!this.genAI) {
      return this.generateDemoChatResponse(messages, context);
    }

    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    const userPrompt = lastUserMessage?.content || "What should I do about the pollution today?";
    const safePrompt = InputSanitizer.wrapSafePrompt(userPrompt);

    const systemInstruction = this.buildChatSystemPrompt(context);

    try {
      const promptPayload = `
${systemInstruction}

CONVERSATION HISTORY:
${messages
  .slice(-4)
  .map((m) => `${m.role.toUpperCase()}: ${InputSanitizer.sanitizeText(m.content, 300)}`)
  .join("\n")}

LATEST USER QUERY:
${safePrompt}

Respond strictly in the following JSON format:
{
  "answer": "Concise, actionable direct answer to the user.",
  "actionableTips": ["Specific practical step 1", "Specific practical step 2", "Specific practical step 3"],
  "scientificRationale": "Brief scientific reason linking current PM2.5 / weather inversion to this advice.",
  "suggestedFollowUps": ["Follow-up question 1", "Follow-up question 2"]
}
`;

      const result = await this.genAI.models.generateContent({
        model: this.modelId,
        contents: promptPayload,
        config: { temperature: 0.2, maxOutputTokens: 800, responseMimeType: "application/json" },
      });
      const text = result.text;
      if (!text) throw new Error("Gemini returned an empty response");
      const parsed = ChatOutputSchema.parse(JSON.parse(text));

      return {
        answer: InputSanitizer.sanitizeText(parsed.answer, 3000),
        actionableTips: parsed.actionableTips.map((tip) => InputSanitizer.sanitizeText(tip, 500)),
        scientificRationale: InputSanitizer.sanitizeText(parsed.scientificRationale, 1500),
        suggestedFollowUps: parsed.suggestedFollowUps.map((q) => InputSanitizer.sanitizeText(q, 300)),
        isDemoMode: false,
        modelUsed: `Google ${this.modelId}`,
      };
    } catch {
      return this.generateDemoChatResponse(
        messages,
        context,
        "Gemini request failed. Check the key, model access, network, and quota."
      );
    }
  }

  async generatePersonalizedPlan(
    profile: FamilyProfile,
    aqiData: AirQualityData,
    weatherData?: WeatherData
  ): Promise<PersonalizedPlan> {
    if (!this.genAI) {
      return this.generateDemoPersonalizedPlan(profile, aqiData, weatherData);
    }

    const vulnerability = calculateVulnerabilityScore(profile);
    const systemPrompt = `
You are the Lead Environmental Health Architect for ClearSkies AI.
Your mission is to generate a comprehensive 7-phase daily protection plan for a family navigating winter smog.

CRITICAL RULES:
1. Base all recommendations on the actual location (${profile.location.name}), current AQI (${aqiData.aqi} - ${aqiData.category}), and family vulnerabilities.
2. Under no circumstances provide clinical medical prescriptions or replace professional medical advice.
3. If family has young children (${profile.hasYoungChildren}), elderly (${profile.hasElderly}), or respiratory conditions (${profile.hasRespiratorySensitivities}), enforce strict indoor protection.
4. Consider commute (${profile.commuteMethod}) and workout timing (${profile.exerciseTiming}).
5. Output valid JSON matching the exact schema.
`;

    try {
      const prompt = `
${systemPrompt}

FAMILY PROFILE:
- Location: ${profile.location.name}, ${profile.location.state || ""}
- Family Size: ${profile.familySize}
- Young Children: ${profile.hasYoungChildren ? "Yes" : "No"}
- Elderly Members: ${profile.hasElderly ? "Yes" : "No"}
- Respiratory Sensitivities: ${profile.hasRespiratorySensitivities ? `Yes (${profile.respiratoryDetails || "General sensitivity"})` : "None"}
- Work Mode: ${profile.workRoutine}
- Commute: ${profile.commuteMethod}
- Exercise Time: ${profile.exerciseTiming}
- Home Type: ${profile.homeType}
- Air Purifier: ${profile.airPurifierStatus}

ENVIRONMENTAL SNAPSHOT:
- Current AQI: ${aqiData.aqi} (${aqiData.category})
- Dominant Pollutant: ${aqiData.dominantPollutant}
- PM2.5: ${aqiData.pollutants.pm25?.value || "N/A"} µg/m³
- PM10: ${aqiData.pollutants.pm10?.value || "N/A"} µg/m³
- Weather: ${weatherData ? `${weatherData.temperature}°C, ${weatherData.relativeHumidity}% humidity, wind ${weatherData.windSpeed} km/h, ${weatherData.condition}` : "Typical winter smog"}
- Inversion Stagnation Risk: ${weatherData?.inversionRisk.level || "HIGH"}

Generate a JSON response following this structure:
{
  "id": "plan-${Date.now()}",
  "generatedAt": "${new Date().toISOString()}",
  "locationName": "${profile.location.name}",
  "aqiSnapshot": ${aqiData.aqi},
  "aqiCategory": "${aqiData.category}",
  "vulnerabilityLevel": "${vulnerability.score > 60 ? "HIGH" : vulnerability.score > 35 ? "MODERATE" : "STANDARD"}",
  "phases": {
    "morning": {
      "timeSlot": "06:00 - 09:00",
      "phaseName": "Morning Smog Peak Routine",
      "action": "...",
      "recommendation": "...",
      "rationale": "...",
      "exposureBenefit": "...",
      "priority": "CRITICAL",
      "isIndoor": true,
      "maskRequired": true
    },
    "outdoorActivity": {
      "timeSlot": "09:00 - 12:00",
      "phaseName": "Outdoor & School Precautions",
      "action": "...",
      "recommendation": "...",
      "rationale": "...",
      "exposureBenefit": "...",
      "priority": "HIGH",
      "isIndoor": true,
      "maskRequired": true
    },
    "commuting": {
      "timeSlot": "Commute Hours",
      "phaseName": "Transit & In-Cabin Recirculation",
      "action": "...",
      "recommendation": "...",
      "rationale": "...",
      "exposureBenefit": "...",
      "priority": "HIGH",
      "isIndoor": false,
      "maskRequired": true
    },
    "indoorAirQuality": {
      "timeSlot": "All Day Continuous",
      "phaseName": "Indoor Air Quality & Filtration",
      "action": "...",
      "recommendation": "...",
      "rationale": "...",
      "exposureBenefit": "...",
      "priority": "CRITICAL",
      "isIndoor": true,
      "maskRequired": false
    },
    "afternoon": {
      "timeSlot": "12:30 - 15:30",
      "phaseName": "Afternoon Low-Pollution Window",
      "action": "...",
      "recommendation": "...",
      "rationale": "...",
      "exposureBenefit": "...",
      "priority": "MODERATE",
      "isIndoor": true,
      "maskRequired": false
    },
    "evening": {
      "timeSlot": "17:00 - 20:30",
      "phaseName": "Evening Rush-Hour Containment",
      "action": "...",
      "recommendation": "...",
      "rationale": "...",
      "exposureBenefit": "...",
      "priority": "HIGH",
      "isIndoor": true,
      "maskRequired": true
    },
    "nightTime": {
      "timeSlot": "21:00 - 06:00",
      "phaseName": "Night-Time Restorative Sleep",
      "action": "...",
      "recommendation": "...",
      "rationale": "...",
      "exposureBenefit": "...",
      "priority": "CRITICAL",
      "isIndoor": true,
      "maskRequired": false
    }
  },
  "keyTakeaway": "...",
  "disclaimer": "This plan provides environmental health guidance only and does not constitute medical diagnosis or prescription."
}
`;

      const result = await this.genAI.models.generateContent({
        model: this.modelId,
        contents: prompt,
        config: { temperature: 0.1, maxOutputTokens: 1800, responseMimeType: "application/json" },
      });
      if (!result.text) throw new Error("Gemini returned an empty response");
      const parsed = JSON.parse(result.text);
      const validated = PersonalizedPlanSchema.parse(parsed);
      return validated;
    } catch {
      return this.generateDemoPersonalizedPlan(profile, aqiData, weatherData);
    }
  }

  private buildChatSystemPrompt(context: ChatContext): string {
    const aqi = context.aqiData ? `${context.aqiData.aqi} (${context.aqiData.category})` : "Elevated Winter Baseline (Demo)";
    const loc = context.locationName || "Selected Area";
    const profile = context.familyProfile;

    return `
You are the ClearSkies AI Assistant, an expert in urban air quality, atmospheric science, and environmental health protection.

CURRENT LOCATION & METRICS:
- Location: ${loc}
- Live AQI: ${aqi}
- PM2.5: ${context.aqiData?.pollutants.pm25?.value || "Unknown"} µg/m³
- Dominant Pollutant: ${context.aqiData?.dominantPollutant || "PM2.5"}
- Weather: ${context.weatherData ? `${context.weatherData.temperature}°C, ${context.weatherData.condition}, humidity ${context.weatherData.relativeHumidity}%, wind ${context.weatherData.windSpeed} km/h` : "Winter calm inversion"}
- Atmospheric Inversion Risk: ${context.weatherData?.inversionRisk.level || "HIGH"}

FAMILY CONTEXT (If Provided):
${
  profile
    ? `- Family Size: ${profile.familySize}
- Young Children: ${profile.hasYoungChildren ? "Yes" : "No"}
- Elderly: ${profile.hasElderly ? "Yes" : "No"}
- Respiratory Issues: ${profile.hasRespiratorySensitivities ? "Yes" : "No"}
- Exercise Timing: ${profile.exerciseTiming}
- Air Purifier: ${profile.airPurifierStatus}`
    : "- General public user."
}

INSTRUCTIONS:
1. Provide accurate, empathetic, and evidence-backed guidance.
2. Explain WHY (e.g., thermal inversion, particulate infiltration, minute ventilation during exercise).
3. Distinguish measured facts from recommendations. Never invent fake readings.
4. MEDICAL DISCLAIMER: Never prescribe medicines, diagnose ailments, or tell patients to alter physician-prescribed asthma or pulmonary inhalers. Suggest environmental containment and consulting doctors for medical needs.
`;
  }

  private generateDemoChatResponse(
    messages: ChatMessage[],
    context: ChatContext,
    reason = "Add GEMINI_API_KEY for live GenAI"
  ): ChatResponse {
    const userMsg = [...messages].reverse().find((m) => m.role === "user")?.content.toLowerCase() || "";
    const aqi = context.aqiData?.aqi || 340;
    const loc = context.locationName || "Delhi-NCR";

    let answer = `At the current AQI of ${aqi} in ${loc}, outdoor air is hazardous to breathe without protection. Fine particulate matter (PM2.5) easily penetrates deep into lung alveoli and enters the bloodstream.`;
    const tips = [
      "Wear a certified N95 or FFP2 respirator mask whenever stepping outdoors.",
      "Reschedule all outdoor aerobic workouts to indoor sessions to prevent deep inhalation of particles.",
      "Keep home windows sealed and operate HEPA air purifiers in occupied living rooms and bedrooms.",
    ];
    let rationale = "Winter nocturnal temperature inversions trap surface vehicular exhaust and biomass smoke close to the ground.";
    const followUps = [
      "When is the best time to ventilate my house today?",
      "Is it safe for my child to play outdoors in the afternoon?",
      "How can I set up an effective DIY air filter?",
    ];

    if (userMsg.includes("child") || userMsg.includes("park") || userMsg.includes("school")) {
      answer = `With AQI at ${aqi} in ${loc}, children should strictly avoid outdoor sports and park visits today. Children breathe 50% more air per kilogram of body weight than adults, making outdoor exertion dangerous in this smog.`;
      tips[0] = "Keep children indoors during recess and physical education periods.";
      tips[1] = "Engage in indoor board games, reading, or creative crafts rather than outdoor playgrounds.";
      tips[2] = "If commute to school is required, ensure an appropriately sized child N95 mask is worn tightly.";
      rationale = "Developing lung parenchyma and smaller airways are disproportionately irritated by acid aerosols and PM2.5.";
    } else if (userMsg.includes("walk") || userMsg.includes("jog") || userMsg.includes("exercise") || userMsg.includes("workout")) {
      answer = `Morning walks must be suspended when AQI is ${aqi}. In early mornings, cold ground temperatures create a thermal inversion lid that concentrates toxic particulates right at chest level.`;
      tips[0] = "Shift workouts indoors: substitute outdoor runs with indoor yoga, bodyweight circuits, or skipping.";
      tips[1] = "If you must go outside, do so around 1:00 PM - 3:00 PM when solar warming temporarily lifts the inversion layer.";
      tips[2] = "Always wear a well-fitted N95 mask if walking outdoors; a surgical or cloth mask does not filter PM2.5.";
      rationale = "Aerobic exertion increases minute ventilation from ~8 L/min to 50+ L/min, multiplying inhaled particulate mass.";
    } else if (userMsg.includes("purifier") || userMsg.includes("indoor") || userMsg.includes("hepa")) {
      answer = `Air purifiers with True HEPA (H13) and activated carbon filters are highly recommended in ${loc}. They consistently remove 90-99% of indoor airborne particles when rooms are properly sealed.`;
      tips[0] = "Place the purifier in the bedroom 1-2 meters away from walls and bed for optimal laminar flow.";
      tips[1] = "Run on Medium or Auto mode 24/7 during severe winter smog; turning it off allows rapid outdoor particulate infiltration.";
      tips[2] = "Avoid ionizers or ozone-generating machines; rely strictly on mechanical HEPA and carbon filtration.";
      rationale = "HEPA filters use interception, impaction, and diffusion to trap particles down to 0.1 microns without ozone byproduct.";
    }

    return {
      answer: `[DEMO MODE – ${reason}]\n\n${answer}`,
      actionableTips: tips,
      scientificRationale: rationale,
      suggestedFollowUps: followUps,
      isDemoMode: true,
      modelUsed: "Rule-Based Environmental Science Engine (Demo Mode)",
    };
  }

  private generateDemoPersonalizedPlan(
    profile: FamilyProfile,
    aqiData: AirQualityData,
    weatherData?: WeatherData
  ): PersonalizedPlan {
    const aqi = aqiData.aqi;
    const vulnerability = calculateVulnerabilityScore(profile);

    return {
      id: `plan-demo-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      locationName: profile.location.name,
      aqiSnapshot: aqi,
      aqiCategory: aqiData.category,
      vulnerabilityLevel: vulnerability.score > 60 ? "HIGH" : vulnerability.score > 35 ? "MODERATE" : "STANDARD",
      phases: {
        morning: {
          timeSlot: "06:00 - 09:00",
          phaseName: "Morning Inversion Smog Shield",
          action: "Keep all windows tightly shut; switch morning exercise indoors.",
          recommendation: "Cancel early morning walks or outdoor workouts. Use indoor yoga or stretching. Ensure children wear N95 masks for school commute.",
          rationale: "Cold ground temperatures cause severe temperature inversion, concentrating toxic vehicular and industrial particulates at ground level.",
          exposureBenefit: "Reduces morning respiratory particulate intake by ~80%",
          priority: "CRITICAL",
          isIndoor: true,
          maskRequired: true,
        },
        outdoorActivity: {
          timeSlot: "09:00 - 12:00",
          phaseName: "Mid-Morning Restricted Movement",
          action: "Minimize outdoor errands; use air-filtered transportation.",
          recommendation: "Keep outdoor transit brief. Avoid open-air two-wheelers if possible; prefer metro or enclosed car with AC recirculation.",
          rationale: "Daytime vehicular rush-hour increases ambient nitrogen dioxide (NO2) and carbon monoxide (CO) alongside PM2.5.",
          exposureBenefit: "Lowers direct road-side tailpipe exposure by ~65%",
          priority: "HIGH",
          isIndoor: true,
          maskRequired: true,
        },
        commuting: {
          timeSlot: "Work Commute",
          phaseName: "Safe Transit & Cabin Sealing",
          action: "Set vehicle AC to internal recirculation mode; wear N95 in transit.",
          recommendation: "Never draw raw exterior air through vehicle vents. If walking between stations, wear a snug N95 respirator.",
          rationale: "Bumper-to-bumper traffic contains peak concentrations of ultrafine diesel particulates and tire wear aerosols.",
          exposureBenefit: "Cuts vehicle cabin PM2.5 by 80-85%",
          priority: "HIGH",
          isIndoor: false,
          maskRequired: true,
        },
        indoorAirQuality: {
          timeSlot: "Continuous All-Day",
          phaseName: "Home Air Filtration & Damp Cleaning",
          action: "Run HEPA air purifiers; switch to damp microfiber mopping.",
          recommendation: "Operate air purifiers on Auto/Medium speed. Avoid dry broom sweeping or incense burning which resuspends fine particles.",
          rationale: "Indoor air quality rapidly mirrors outdoor air without continuous mechanical filtration and source control.",
          exposureBenefit: "Maintains indoor PM2.5 below 25 µg/m³ despite severe outdoor air",
          priority: "CRITICAL",
          isIndoor: true,
          maskRequired: false,
        },
        afternoon: {
          timeSlot: "12:30 - 15:30",
          phaseName: "Solar Dispersion Window",
          action: "Optimal window for essential errands or brief midday aeration if needed.",
          recommendation: aqi > 300
            ? "Keep windows sealed even during afternoon due to severe baseline."
            : "Brief 10-15 minute cross-ventilation allowed if room feels stuffy, followed by high purifier speed.",
          rationale: "Maximum solar heating elevates the planetary boundary layer, providing temporary atmospheric dispersion.",
          exposureBenefit: "Lowest diurnal pollution window of the day",
          priority: "MODERATE",
          isIndoor: true,
          maskRequired: aqi > 200,
        },
        evening: {
          timeSlot: "17:30 - 20:30",
          phaseName: "Evening Peak Resurgence Containment",
          action: "Seal all entryways before sunset; perform facial and saline rinse on return.",
          recommendation: "Ensure all family members are indoors before twilight. Rinse eyes and gargle with lukewarm saline water to wash deposited soot.",
          rationale: "Sun setting triggers rapid ground cooling and boundary layer collapse, trapping evening traffic fumes.",
          exposureBenefit: "Prevents acute nighttime bronchospasm and mucous membrane irritation",
          priority: "HIGH",
          isIndoor: true,
          maskRequired: true,
        },
        nightTime: {
          timeSlot: "21:00 - 06:00",
          phaseName: "Restorative Sleep & Air Quality Management",
          action: "Run bedroom air purifier in whisper/sleep mode; close bedroom door.",
          recommendation: "Keep purifier running 1.5 meters from bed headboard. Keep room temperature moderate (18-21°C) to prevent cold airway constriction.",
          rationale: "Continuous clean air during 8 hours of sleep allows pulmonary ciliary clearance and lowers systemic inflammatory markers.",
          exposureBenefit: "Ensures 8 hours of sub-15 µg/m³ clean air inhalation",
          priority: "CRITICAL",
          isIndoor: true,
          maskRequired: false,
        },
      },
      keyTakeaway: `Severe smog active in ${profile.location.name}. Strictly avoid early morning outdoor exertion, keep living areas sealed with HEPA filtration, and enforce N95 mask usage during unavoidable commutes.`,
      disclaimer: "This plan provides environmental health guidance only and does not constitute medical diagnosis or prescription.",
    };
  }
}
