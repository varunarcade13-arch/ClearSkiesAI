import { ChatMessage } from "@/infrastructure/ai/IGenAIProvider";

export type QueryIntent =
  | "AQI_QUERY"
  | "HEALTH_PROTECTION"
  | "INDOOR_AIR"
  | "WEATHER_OUTDOOR"
  | "SUSTAINABLE_LIVING"
  | "COMMUNITY_AWARENESS"
  | "GENERAL";

export type LocationQueryType = "EXPLICIT" | "CURRENT" | "NONE";

export interface AnalyzedQuery {
  intent: QueryIntent;
  locationType: LocationQueryType;
  explicitLocations: string[];
  isComparison: boolean;
  isCurrentLocationComparison: boolean;
  referencingPreviousLocation: boolean;
  resolvedContextLocation?: string;
  cleanedQuery: string;
}

// Well-known Indian & global metropolitan cities and regions for quick, high-precision matching
const KNOWN_LOCATIONS = [
  "mohali",
  "chandigarh",
  "delhi",
  "new delhi",
  "noida",
  "greater noida",
  "gurgaon",
  "gurugram",
  "faridabad",
  "ghaziabad",
  "mumbai",
  "bombay",
  "bengaluru",
  "bangalore",
  "kolkata",
  "calcutta",
  "chennai",
  "madras",
  "hyderabad",
  "pune",
  "ahmedabad",
  "jaipur",
  "lucknow",
  "kanpur",
  "patna",
  "bhopal",
  "indore",
  "ludhiana",
  "amritsar",
  "jalandhar",
  "patiala",
  "panchkula",
  "shimla",
  "dehradun",
  "agra",
  "varanasi",
  "srinagar",
  "jammu",
  "nagpur",
  "visakhapatnam",
  "coimbatore",
  "kochi",
  "thiruvananthapuram",
  "london",
  "new york",
  "tokyo",
  "paris",
  "beijing",
  "singapore",
  "dubai",
  "lahore",
  "dhaka",
  "kathmandu",
  "bangkok",
  "sydney",
];

const CURRENT_LOCATION_PATTERNS = [
  /\bnear\s+me\b/i,
  /\bmy\s+current\s+location\b/i,
  /\bcurrent\s+location\b/i,
  /\bmy\s+location\b/i,
  /\bwhere\s+i\s+am\b/i,
  /\baround\s+here\b/i,
  /\baround\s+me\b/i,
  /\bin\s+my\s+area\b/i,
  /\blocal\s+aqi\b/i,
  /\blocal\s+air\b/i,
  /\bhere\b/i,
];

/**
 * Normalizes place names and resolves common aliases
 */
export function normalizePlaceName(name: string): string {
  const trimmed = name.trim().replace(/^[,.\s]+|[,.\s]+$/g, "");
  const lower = trimmed.toLowerCase();

  if (lower === "gurugram") return "Gurgaon";
  if (lower === "bangalore") return "Bengaluru";
  if (lower === "calcutta") return "Kolkata";
  if (lower === "bombay") return "Mumbai";
  if (lower === "madras") return "Chennai";

  // Capitalize words
  return trimmed
    .split(/\s+/)
    .map((w) => {
      // Keep sector numbers like Sector 17
      if (/^\d+[A-Za-z]?$/.test(w)) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

/**
 * Detects whether the query has a comparison pattern between multiple locations
 */
function isComparisonQuery(text: string): boolean {
  return (
    /\b(?:compare|comparison|versus|vs\.?|better|worse|cleaner|more polluted|less polluted|difference between)\b/i.test(
      text
    ) || /\b(?:between|or)\b/i.test(text)
  );
}

/**
 * Filter out non-location words that might be caught by regexes
 */
function isStopWord(word: string): boolean {
  const stops = [
    "what", "what is", "where", "how", "why", "which", "is", "are", "the", "a", "an", "this", "that",
    "these", "those", "air", "quality", "pollution", "smog", "aqi", "city", "place", "area",
    "better", "worse", "cleaner", "more", "less", "good", "bad", "safe", "outside", "inside",
    "today", "now", "right now", "currently", "tomorrow", "yesterday", "morning", "evening",
    "family", "children", "child", "elderly", "mask", "masks", "purifier", "purifiers", "hepa",
    "walk", "exercise", "running", "jogging", "window", "windows", "ventilation", "there",
    "tell me", "check", "please", "level", "levels", "index",
  ];
  return stops.includes(word.toLowerCase().trim());
}

/**
 * Cleans extracted location candidate strings
 */
function cleanLocationCandidate(str: string): string {
  return str
    .replace(/\b(?:what is|where is|tell me|check|the|in|of|at|for|from|to|between|and|or|vs|versus|pollution|aqi|air quality|levels|level|index|today|now|right now|currently)\b/gi, "")
    .replace(/[?!,.:;()]/g, "")
    .trim();
}

/**
 * Extracts multiple locations from comparison phrases
 */
function extractComparisonLocations(text: string): { locations: string[]; includesCurrentLocation: boolean } {
  let includesCurrentLocation = false;
  const rawLocations: string[] = [];

  // Check if "current location" or "near me" is part of the comparison
  if (CURRENT_LOCATION_PATTERNS.some((p) => p.test(text))) {
    includesCurrentLocation = true;
  }

  // 1. Check for known locations mentioned in text
  for (const known of KNOWN_LOCATIONS) {
    const regex = new RegExp(`\\b${known}\\b`, "i");
    if (regex.test(text)) {
      const normalized = normalizePlaceName(known);
      if (!rawLocations.some((l) => l.toLowerCase() === normalized.toLowerCase())) {
        rawLocations.push(normalized);
      }
    }
  }

  // 2. Check for Sector patterns like "Sector 17 Chandigarh"
  const sectorMatches = text.match(/\b(?:Sector|Sec)\s+\d+(?:[A-Za-z])?(?:\s*,\s*|\s+)[A-Za-z]+/gi);
  if (sectorMatches) {
    for (const sm of sectorMatches) {
      const norm = normalizePlaceName(sm);
      const idx = rawLocations.findIndex((loc) => norm.toLowerCase().includes(loc.toLowerCase()));
      if (idx !== -1) {
        rawLocations[idx] = norm;
      } else {
        rawLocations.push(norm);
      }
    }
  }

  // 3. Fallback to parsing lists "between X and Y"
  if (rawLocations.length < 2) {
    const comparisonMatch = text.match(
      /(?:compare|between|in|of|cleaner,?\s*|better,?\s*)\s+([^?.]+?)(?:\s+aqi|\s+pollution|\s+air quality)?$/i
    );

    if (comparisonMatch && comparisonMatch[1]) {
      const listPart = comparisonMatch[1];
      const parts = listPart
        .split(/\s*,\s*|\s+and\s+|\s+or\s+|\s+vs\.?\s+|\s+versus\s+/i)
        .map((p) => p.trim())
        .filter((p) => p.length > 1);

      for (const part of parts) {
        if (CURRENT_LOCATION_PATTERNS.some((p) => p.test(part))) {
          includesCurrentLocation = true;
        } else {
          const cleaned = cleanLocationCandidate(part);
          if (cleaned && cleaned.length > 2 && !isStopWord(cleaned)) {
            const norm = normalizePlaceName(cleaned);
            if (!rawLocations.some((l) => l.toLowerCase() === norm.toLowerCase())) {
              rawLocations.push(norm);
            }
          }
        }
      }
    }
  }

  return { locations: Array.from(new Set(rawLocations)), includesCurrentLocation };
}

/**
 * Extracts a single explicit location from the text
 */
function extractSingleLocation(text: string): string | null {
  // Check for Sector X [City] patterns first, e.g. "Sector 17 Chandigarh" or "Sector 62, Noida"
  const sectorPattern = /\b(?:Sector|Sec)\s+\d+(?:[A-Za-z])?(?:[,\s]+[A-Za-z]+)?/i;
  const sectorMatch = text.match(sectorPattern);
  if (sectorMatch && sectorMatch[0].length > 6) {
    return normalizePlaceName(sectorMatch[0]);
  }

  // Check for 6-digit Indian PIN codes (e.g. 160017, 110001)
  const pinMatch = text.match(/\b([1-9][0-9]{5})\b/);
  if (pinMatch) {
    return pinMatch[1];
  }

  // Check against known metropolitan locations directly (highest precision!)
  for (const known of KNOWN_LOCATIONS) {
    const regex = new RegExp(`\\b${known}\\b`, "i");
    if (regex.test(text)) {
      return normalizePlaceName(known);
    }
  }

  // Prepositional patterns for other cities (e.g. "in Bristol", "of Seattle")
  const prepPatterns = [
    /(?:aqi|air quality|pollution|smog|levels?|index)\s+(?:in|of|for|at|around)\s+([A-Za-z\s.-]+)/i,
    /(?:in|of|for|at|around)\s+([A-Za-z\s.-]+?)(?:\s+(?:aqi|air quality|pollution|smog|levels?|index|right now|today|tomorrow|now|\?|$))/i,
    /(?:what about|how about|check)\s+([A-Za-z\s.-]+?)(?:\s+(?:aqi|air quality|pollution|smog|right now|today|\?|$))/i,
  ];

  for (const pattern of prepPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const candidate = cleanLocationCandidate(match[1]);
      if (candidate && candidate.length > 2 && !isStopWord(candidate)) {
        return normalizePlaceName(candidate);
      }
    }
  }

  return null;
}

/**
 * Determines the category / intent of the user question
 */
export function detectQueryIntent(text: string): QueryIntent {
  const lower = text.toLowerCase();

  // Community & awareness (check early for school/community initiatives)
  if (
    /\b(?:community|neighbourhood|neighborhood|schools?\s+protect|society\s+initiatives?|citizen\s+action)\b/i.test(
      lower
    )
  ) {
    return "COMMUNITY_AWARENESS";
  }

  // Health and family protection
  if (
    /\b(?:child|children|baby|infant|kid|kids|elderly|grandparents|parent|senior|pregnant|pregnancy|asthma|bronchitis|respiratory|lungs?|cough|breath|inhaler|safe to play|health precautions?)\b/i.test(
      lower
    )
  ) {
    return "HEALTH_PROTECTION";
  }

  // Indoor air quality
  if (
    /\b(?:indoor|inside|purifier|purifiers|hepa|filter|filters|cadr|open windows?|close windows?|ventilate|ventilation|dust|clean air inside|mopping|diy filter)\b/i.test(
      lower
    )
  ) {
    return "INDOOR_AIR";
  }

  // Weather & outdoor activities
  if (
    /\b(?:walk|walking|jog|jogging|run|running|exercise|workout|cycling|gym|outdoor sports?|inversion|temperature inversion|wind|humidity|stagnant|fog)\b/i.test(
      lower
    )
  ) {
    return "WEATHER_OUTDOOR";
  }

  // Sustainable living
  if (
    /\b(?:sustainable|sustainability|carbon footprint|emissions?|eco-friendly|green habit|commute alternative|public transit|metro vs car|reduce pollution at home)\b/i.test(
      lower
    )
  ) {
    return "SUSTAINABLE_LIVING";
  }

  // AQI and pollution queries
  if (
    /\b(?:aqi|air quality|pollution|smog|pm2\.?5|pm10|pollutants?|no2|so2|co|ozone|o3|hazard|cpcb|naqi)\b/i.test(
      lower
    ) ||
    isComparisonQuery(lower)
  ) {
    return "AQI_QUERY";
  }

  return "GENERAL";
}

/**
 * Searches conversation history to extract previously discussed locations
 */
function extractLocationsFromHistory(history: ChatMessage[]): string[] {
  const locations: string[] = [];
  const reversed = [...history].reverse();

  for (const msg of reversed) {
    if (msg.role === "user" || msg.role === "assistant") {
      for (const known of KNOWN_LOCATIONS) {
        const regex = new RegExp(`\\b${known}\\b`, "i");
        if (regex.test(msg.content)) {
          const norm = normalizePlaceName(known);
          if (!locations.some((l) => l.toLowerCase() === norm.toLowerCase())) {
            locations.push(norm);
          }
        }
      }
    }
  }

  return locations;
}

/**
 * Comprehensive analysis of user query and conversation context
 */
export function analyzeUserQuery(
  currentQuery: string,
  conversationHistory: ChatMessage[] = [],
  defaultLocationName?: string
): AnalyzedQuery {
  const cleaned = currentQuery.trim();
  const intent = detectQueryIntent(cleaned);
  const isComp = isComparisonQuery(cleaned);

  // Check if explicitly referencing previous location ("there", "in that city", "for that place")
  const referencesThere = /\b(?:there|in that city|for that place|in that location)\b/i.test(cleaned);

  // Check if follow-up comparison like "which one is better?", "which is cleaner?", "compare them"
  const isFollowUpComparison =
    isComp && !cleaned.match(/(?:between|in|of)\s+[A-Za-z0-9]+/i) && /\b(?:which one|which|both|they|them)\b/i.test(cleaned);

  // Check if follow-up switch like "what about Chandigarh?", "how about Delhi?"
  const isFollowUpSwitch = /^(?:what about|how about|and|what of)\s+([A-Za-z0-9\s,.-]+)/i.test(cleaned);

  if (isFollowUpComparison) {
    const historicalLocs = extractLocationsFromHistory(conversationHistory);
    if (historicalLocs.length >= 2) {
      return {
        intent: "AQI_QUERY",
        locationType: "EXPLICIT",
        explicitLocations: [historicalLocs[0], historicalLocs[1]],
        isComparison: true,
        isCurrentLocationComparison: false,
        referencingPreviousLocation: true,
        cleanedQuery: cleaned,
      };
    }
  }

  if (referencesThere) {
    const historicalLocs = extractLocationsFromHistory(conversationHistory);
    if (historicalLocs.length > 0) {
      return {
        intent,
        locationType: "EXPLICIT",
        explicitLocations: [historicalLocs[0]],
        isComparison: false,
        isCurrentLocationComparison: false,
        referencingPreviousLocation: true,
        resolvedContextLocation: historicalLocs[0],
        cleanedQuery: cleaned,
      };
    }
  }

  // 1. Check for comparison query with multiple locations
  if (isComp) {
    const { locations, includesCurrentLocation } = extractComparisonLocations(cleaned);
    if (locations.length >= 2 || (locations.length >= 1 && includesCurrentLocation)) {
      return {
        intent: "AQI_QUERY",
        locationType: "EXPLICIT",
        explicitLocations: locations,
        isComparison: true,
        isCurrentLocationComparison: includesCurrentLocation,
        referencingPreviousLocation: false,
        cleanedQuery: cleaned,
      };
    }
  }

  // 2. Check for current location intent (when not a multi-location comparison)
  const mentionsCurrentLoc = CURRENT_LOCATION_PATTERNS.some((p) => p.test(cleaned));
  if (mentionsCurrentLoc) {
    return {
      intent,
      locationType: "CURRENT",
      explicitLocations: defaultLocationName ? [defaultLocationName] : [],
      isComparison: false,
      isCurrentLocationComparison: false,
      referencingPreviousLocation: false,
      cleanedQuery: cleaned,
    };
  }

  // 3. Check for follow-up switch "What about Chandigarh?"
  if (isFollowUpSwitch) {
    const switchLoc = extractSingleLocation(cleaned);
    if (switchLoc) {
      return {
        intent: "AQI_QUERY",
        locationType: "EXPLICIT",
        explicitLocations: [switchLoc],
        isComparison: false,
        isCurrentLocationComparison: false,
        referencingPreviousLocation: true,
        cleanedQuery: cleaned,
      };
    }
  }

  // 4. Check for single explicit location
  const singleLoc = extractSingleLocation(cleaned);
  if (singleLoc) {
    return {
      intent,
      locationType: "EXPLICIT",
      explicitLocations: [singleLoc],
      isComparison: false,
      isCurrentLocationComparison: false,
      referencingPreviousLocation: false,
      cleanedQuery: cleaned,
    };
  }

  // 5. If query is an action-oriented or weather/indoor question without a specified place,
  // it naturally applies to the user's current environment
  const isLocationDependentAction =
    intent === "HEALTH_PROTECTION" ||
    intent === "INDOOR_AIR" ||
    intent === "WEATHER_OUTDOOR" ||
    /\b(?:should i|can i|is it safe|today|outside|morning walk|windows)\b/i.test(cleaned);

  if (isLocationDependentAction && defaultLocationName) {
    return {
      intent,
      locationType: "CURRENT",
      explicitLocations: [defaultLocationName],
      isComparison: false,
      isCurrentLocationComparison: false,
      referencingPreviousLocation: false,
      cleanedQuery: cleaned,
    };
  }

  // 6. Otherwise, general / conceptual question (no location required)
  return {
    intent,
    locationType: "NONE",
    explicitLocations: [],
    isComparison: false,
    isCurrentLocationComparison: false,
    referencingPreviousLocation: false,
    cleanedQuery: cleaned,
  };
}
