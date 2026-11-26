import { GeoLocation } from "@/domain/family/types";

export interface ParsedLocationSpec {
  raw: string;
  city: string;
  locality?: string;
  state?: string;
  country?: string;
  pincode?: string;
  hasExplicitHierarchy: boolean;
}

export interface LocationMatchResult {
  selected?: GeoLocation;
  rankedCandidates: GeoLocation[];
  isAmbiguous: boolean;
  ambiguousOptions?: string[];
  matchTier:
    | "EXACT_CITY_STATE_COUNTRY"
    | "EXACT_CITY_COUNTRY"
    | "EXACT_CITY_STATE"
    | "EXACT_CITY_CONTEXT"
    | "EXACT_CITY"
    | "FUZZY"
    | "NONE";
}

const STATE_ALIASES: Record<string, string> = {
  hp: "Himachal Pradesh",
  "h.p.": "Himachal Pradesh",
  "h.p": "Himachal Pradesh",
  "himachal": "Himachal Pradesh",
  pb: "Punjab",
  hr: "Haryana",
  dl: "Delhi",
  nct: "Delhi",
  "new delhi": "Delhi",
  up: "Uttar Pradesh",
  "u.p.": "Uttar Pradesh",
  uk: "Uttarakhand",
  ua: "Uttarakhand",
  uttaranchal: "Uttarakhand",
  mh: "Maharashtra",
  ka: "Karnataka",
  tn: "Tamil Nadu",
  wb: "West Bengal",
  rj: "Rajasthan",
  gj: "Gujarat",
  mp: "Madhya Pradesh",
  "m.p.": "Madhya Pradesh",
  jk: "Jammu and Kashmir",
  "j&k": "Jammu and Kashmir",
  ch: "Chandigarh",
  tg: "Telangana",
  ts: "Telangana",
  ap: "Andhra Pradesh",
  kl: "Kerala",
  ga: "Goa",
  br: "Bihar",
  jh: "Jharkhand",
  od: "Odisha",
  or: "Odisha",
  as: "Assam",
  cg: "Chhattisgarh",
};

const COUNTRY_ALIASES: Record<string, string> = {
  in: "India",
  ind: "India",
  bharat: "India",
  hindustan: "India",
  india: "India",
  us: "United States",
  usa: "United States",
  "u.s.": "United States",
  "u.s.a.": "United States",
  "united states": "United States",
  "united states of america": "United States",
  uk: "United Kingdom",
  "u.k.": "United Kingdom",
  "united kingdom": "United Kingdom",
  "great britain": "United Kingdom",
  england: "United Kingdom",
  uae: "United Arab Emirates",
  "u.a.e.": "United Arab Emirates",
  "united arab emirates": "United Arab Emirates",
  pk: "Pakistan",
  pakistan: "Pakistan",
  bd: "Bangladesh",
  bangladesh: "Bangladesh",
  np: "Nepal",
  nepal: "Nepal",
  cn: "China",
  china: "China",
  jp: "Japan",
  japan: "Japan",
  sg: "Singapore",
  singapore: "Singapore",
  au: "Australia",
  australia: "Australia",
  fr: "France",
  france: "France",
  de: "Germany",
  germany: "Germany",
  ca: "Canada",
  canada: "Canada",
  th: "Thailand",
  thailand: "Thailand",
};

const CITY_ALIASES: Record<string, string> = {
  gurugram: "Gurgaon",
  bangalore: "Bengaluru",
  calcutta: "Kolkata",
  bombay: "Mumbai",
  madras: "Chennai",
  trivandrum: "Thiruvananthapuram",
  poona: "Pune",
  banaras: "Varanasi",
  benares: "Varanasi",
  simla: "Shimla",
};

/**
 * Strips Unicode diacritics, trims whitespace, and collapses internal spaces.
 */
export function normalizeLocationToken(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[?!;:()]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[,.\s]+|[,.\s]+$/g, "");
}

export function normalizeCityName(city: string): string {
  const clean = normalizeLocationToken(city);
  const lower = clean.toLowerCase();
  if (CITY_ALIASES[lower]) {
    return CITY_ALIASES[lower];
  }
  return clean
    .split(/\s+/)
    .map((w) => {
      if (/^\d+[A-Za-z]?$/.test(w)) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

export function normalizeStateName(state: string): string {
  const clean = normalizeLocationToken(state);
  const lower = clean.toLowerCase();
  if (STATE_ALIASES[lower]) {
    return STATE_ALIASES[lower];
  }
  return clean
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function normalizeCountryName(country: string): string {
  const clean = normalizeLocationToken(country);
  const lower = clean.toLowerCase();
  if (COUNTRY_ALIASES[lower]) {
    return COUNTRY_ALIASES[lower];
  }
  return clean
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function isKnownCountry(token: string): boolean {
  const lower = normalizeLocationToken(token).toLowerCase();
  return Boolean(COUNTRY_ALIASES[lower]);
}

/**
 * Parses a location string (e.g. "Shimla, Himachal Pradesh, India", "Sector 17, Chandigarh", "160017")
 * into structured city, locality, state, and country constraints.
 */
export function parseLocationSpec(raw: string): ParsedLocationSpec {
  const trimmed = normalizeLocationToken(raw);
  if (!trimmed) {
    return { raw, city: "", hasExplicitHierarchy: false };
  }

  // Check 6-digit Indian PIN code
  const pinMatch = trimmed.match(/^\b([1-9][0-9]{5})\b$/);
  if (pinMatch) {
    return {
      raw,
      city: pinMatch[1],
      pincode: pinMatch[1],
      country: "India",
      hasExplicitHierarchy: false,
    };
  }

  // Split by comma for hierarchical locations: "City, State, Country" or "City, Country" or "City, State"
  const parts = trimmed
    .split(",")
    .map((p) => normalizeLocationToken(p))
    .filter((p) => p.length > 0);

  if (parts.length >= 3) {
    const firstIsSector = /^(?:sector|sec)\s+\d+[a-z]?$/i.test(parts[0]);
    if (firstIsSector && parts.length >= 4) {
      return {
        raw,
        locality: normalizeCityName(parts[0]),
        city: normalizeCityName(parts[1]),
        state: normalizeStateName(parts[2]),
        country: normalizeCountryName(parts[3]),
        hasExplicitHierarchy: true,
      };
    }
    if (firstIsSector) {
      // e.g. "Sector 17, Chandigarh, India"
      const thirdIsCountry = isKnownCountry(parts[2]);
      return {
        raw,
        locality: normalizeCityName(parts[0]),
        city: normalizeCityName(parts[1]),
        ...(thirdIsCountry
          ? { country: normalizeCountryName(parts[2]) }
          : { state: normalizeStateName(parts[2]) }),
        hasExplicitHierarchy: true,
      };
    }
    return {
      raw,
      city: normalizeCityName(parts[0]),
      state: normalizeStateName(parts[1]),
      country: normalizeCountryName(parts[2]),
      hasExplicitHierarchy: true,
    };
  }

  if (parts.length === 2) {
    const firstIsSector = /^(?:sector|sec)\s+\d+[a-z]?$/i.test(parts[0]);
    if (firstIsSector) {
      return {
        raw,
        locality: normalizeCityName(parts[0]),
        city: normalizeCityName(parts[1]),
        hasExplicitHierarchy: false,
      };
    }
    if (isKnownCountry(parts[1])) {
      return {
        raw,
        city: normalizeCityName(parts[0]),
        country: normalizeCountryName(parts[1]),
        hasExplicitHierarchy: true,
      };
    }
    return {
      raw,
      city: normalizeCityName(parts[0]),
      state: normalizeStateName(parts[1]),
      hasExplicitHierarchy: true,
    };
  }

  // Single comma-less string: check for "Sector 17 Chandigarh"
  const sectorPrefixMatch = trimmed.match(/^((?:sector|sec)\s+\d+[a-z]?)\s+(.+)$/i);
  if (sectorPrefixMatch) {
    return {
      raw,
      locality: normalizeCityName(sectorPrefixMatch[1]),
      city: normalizeCityName(sectorPrefixMatch[2]),
      hasExplicitHierarchy: false,
    };
  }

  return {
    raw,
    city: normalizeCityName(parts[0]),
    hasExplicitHierarchy: false,
  };
}

function compareNormalized(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  return normalizeLocationToken(a).toLowerCase() === normalizeLocationToken(b).toLowerCase();
}

function stateMatches(candidateState?: string, targetState?: string): boolean {
  if (!candidateState || !targetState) return false;
  const normCand = normalizeStateName(candidateState).toLowerCase();
  const normTarget = normalizeStateName(targetState).toLowerCase();
  if (normCand === normTarget) return true;
  // Handle NCT of Delhi vs Delhi
  if (
    (normCand.includes("delhi") && normTarget === "delhi") ||
    (normTarget.includes("delhi") && normCand === "delhi")
  ) {
    return true;
  }
  return false;
}

function countryMatches(candidateCountry?: string, targetCountry?: string): boolean {
  if (!candidateCountry || !targetCountry) return false;
  return (
    normalizeCountryName(candidateCountry).toLowerCase() ===
    normalizeCountryName(targetCountry).toLowerCase()
  );
}

function cityMatchesExact(candidate: GeoLocation, targetCity: string): boolean {
  const normTarget = normalizeCityName(targetCity).toLowerCase();
  const normCand = normalizeCityName(candidate.name).toLowerCase();
  if (normCand === normTarget) return true;
  // Also match raw name without alias
  if (normalizeLocationToken(candidate.name).toLowerCase() === normalizeLocationToken(targetCity).toLowerCase()) {
    return true;
  }
  return false;
}

/**
 * Deduplicates candidates that refer to the exact same geographic place.
 */
export function deduplicateLocations(candidates: GeoLocation[]): GeoLocation[] {
  const unique: GeoLocation[] = [];
  for (const item of candidates) {
    const isDup = unique.some((existing) => {
      const closeCoords =
        Math.abs(existing.latitude - item.latitude) < 0.08 &&
        Math.abs(existing.longitude - item.longitude) < 0.08;
      const sameHierarchy =
        compareNormalized(existing.name, item.name) &&
        compareNormalized(existing.state || "", item.state || "") &&
        compareNormalized(existing.country || "", item.country || "");
      return closeCoords || sameHierarchy;
    });
    if (!isDup) {
      unique.push(item);
    }
  }
  return unique;
}

/**
 * Ranks and validates geocoding candidates against a ParsedLocationSpec.
 * Priority:
 * 1. Exact city + state + country match
 * 2. Exact city + country match
 * 3. Exact city + state match
 * 4. Exact city match with reliable country context
 * 5. Exact city match
 * 6. Fuzzy matching only when exact matching fails
 */
export function rankAndResolveLocation(
  spec: ParsedLocationSpec,
  rawCandidates: GeoLocation[],
  defaultCountryContext?: string
): LocationMatchResult {
  if (!rawCandidates || rawCandidates.length === 0 || !spec.city) {
    return { rankedCandidates: [], isAmbiguous: false, matchTier: "NONE" };
  }

  const candidates = deduplicateLocations(rawCandidates);

  // If explicit state or country constraints are given, filter out candidates that explicitly contradict them
  let pool = candidates;
  if (spec.state) {
    const stateFiltered = pool.filter((c) => stateMatches(c.state, spec.state));
    if (stateFiltered.length > 0) {
      pool = stateFiltered;
    }
  }
  if (spec.country) {
    const countryFiltered = pool.filter((c) => countryMatches(c.country, spec.country));
    if (countryFiltered.length > 0) {
      pool = countryFiltered;
    }
  }

  type ScoredCandidate = {
    location: GeoLocation;
    score: number;
    tier: LocationMatchResult["matchTier"];
    exactCity: boolean;
    exactState: boolean;
    exactCountry: boolean;
  };

  const scored: ScoredCandidate[] = pool.map((c) => {
    const exactCity = cityMatchesExact(c, spec.city);
    const exactState = spec.state ? stateMatches(c.state, spec.state) : false;
    const exactCountry = spec.country ? countryMatches(c.country, spec.country) : false;
    const contextCountryMatch =
      !spec.country && defaultCountryContext ? countryMatches(c.country, defaultCountryContext) : false;

    let baseScore = 0;
    let tier: LocationMatchResult["matchTier"] = "NONE";

    if (exactCity && exactState && exactCountry) {
      baseScore = 1000;
      tier = "EXACT_CITY_STATE_COUNTRY";
    } else if (exactCity && exactCountry && !spec.state) {
      baseScore = 850;
      tier = "EXACT_CITY_COUNTRY";
    } else if (exactCity && exactState && !spec.country) {
      baseScore = 800;
      tier = "EXACT_CITY_STATE";
    } else if (exactCity && exactCountry) {
      baseScore = 700;
      tier = "EXACT_CITY_COUNTRY";
    } else if (exactCity && contextCountryMatch) {
      baseScore = 600;
      tier = "EXACT_CITY_CONTEXT";
    } else if (exactCity) {
      baseScore = 500;
      tier = "EXACT_CITY";
    } else {
      // Fuzzy / partial match
      const candLower = normalizeLocationToken(c.name).toLowerCase();
      const targetLower = normalizeLocationToken(spec.city).toLowerCase();
      if (candLower.includes(targetLower) || targetLower.includes(candLower)) {
        baseScore = 250 + (exactState ? 150 : 0) + (exactCountry ? 100 : 0);
      } else {
        baseScore = 100 + (exactState ? 150 : 0) + (exactCountry ? 100 : 0);
      }
      tier = "FUZZY";
    }

    // Tie-breakers for prominence (state/national capital, population)
    let prominenceBonus = 0;
    if (c.featureCode === "PPLC") prominenceBonus += 60;
    else if (c.featureCode === "PPLA") prominenceBonus += 45;
    else if (c.featureCode === "PPLA2") prominenceBonus += 25;

    if (typeof c.population === "number" && c.population > 0) {
      prominenceBonus += Math.min(40, Math.log10(c.population + 1) * 5);
    }

    return {
      location: c,
      score: baseScore + prominenceBonus,
      tier,
      exactCity,
      exactState,
      exactCountry,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored[0];
  const rankedCandidates = scored.map((s) => s.location);

  // If explicit state or country constraints were provided and satisfied, resolve unambiguously
  if (
    (spec.state && top.exactState) ||
    (spec.country && top.exactCountry && (!spec.state || top.exactState))
  ) {
    return {
      selected: top.location,
      rankedCandidates,
      isAmbiguous: false,
      matchTier: top.tier,
    };
  }

  // City-only ambiguity check: only trigger when multiple distinct candidates share the exact city name
  // across different states/countries AND there is no clear dominant administrative center
  if (!spec.hasExplicitHierarchy && scored.length >= 2) {
    const second = scored[1];
    const bothExactCity = top.exactCity && second.exactCity;
    const differentAdmin =
      !compareNormalized(top.location.country || "", second.location.country || "") ||
      !compareNormalized(top.location.state || "", second.location.state || "");

    if (bothExactCity && differentAdmin) {
      // Check if top is clearly dominant (e.g., state/national capital with large population while second is small/unpopulated)
      const topIsMajorAdmin =
        (top.location.featureCode === "PPLC" || top.location.featureCode === "PPLA") &&
        (top.location.population ?? 0) >= 50000;
      const secondIsMajor =
        (second.location.featureCode === "PPLC" || second.location.featureCode === "PPLA") ||
        (second.location.population ?? 0) >= 50000;

      // Also if top matched reliable country context and second is in a different country, prefer top unless both have no population/feature metadata
      const topHasContextAdvantage =
        top.tier === "EXACT_CITY_CONTEXT" && second.tier !== "EXACT_CITY_CONTEXT" && topIsMajorAdmin;

      if (!topIsMajorAdmin || (secondIsMajor && !topHasContextAdvantage)) {
        const options = Array.from(
          new Set(
            scored
              .filter((s) => s.exactCity)
              .slice(0, 3)
              .map((s) =>
                [s.location.name, s.location.state, s.location.country]
                  .filter((p) => Boolean(p) && p !== "Global")
                  .join(", ")
              )
          )
        );
        if (options.length > 1) {
          return {
            selected: top.location,
            rankedCandidates,
            isAmbiguous: true,
            ambiguousOptions: options,
            matchTier: top.tier,
          };
        }
      }
    }
  }

  return {
    selected: top.location,
    rankedCandidates,
    isAmbiguous: false,
    matchTier: top.tier,
  };
}
