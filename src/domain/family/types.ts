import { z } from "zod";

export const GeoLocationSchema = z.object({
  name: z.string().min(1, "Location name is required"),
  locality: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default("India"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  pincode: z.string().optional(),
});

export type GeoLocation = z.infer<typeof GeoLocationSchema>;

export const WorkRoutineEnum = z.enum(["remote", "hybrid", "onsite"]);
export type WorkRoutine = z.infer<typeof WorkRoutineEnum>;

export const CommuteMethodEnum = z.enum([
  "metro_train",
  "electric_bus",
  "standard_bus",
  "carpool",
  "solo_car",
  "two_wheeler",
  "bicycle_walk",
]);
export type CommuteMethod = z.infer<typeof CommuteMethodEnum>;

export const ExerciseTimingEnum = z.enum([
  "early_morning", // 5 AM - 8 AM (Highest smog peak)
  "late_morning",  // 9 AM - 11 AM
  "afternoon",     // 12 PM - 4 PM (Best dispersion)
  "evening",       // 5 PM - 8 PM (Evening rush smog peak)
  "night",         // 9 PM - 11 PM
  "none",
]);
export type ExerciseTiming = z.infer<typeof ExerciseTimingEnum>;

export const HomeTypeEnum = z.enum(["apartment", "independent_house", "gated_community"]);
export type HomeType = z.infer<typeof HomeTypeEnum>;

export const AirPurifierStatusEnum = z.enum(["none", "single_room", "whole_home"]);
export type AirPurifierStatus = z.infer<typeof AirPurifierStatusEnum>;

export const FamilyProfileSchema = z.object({
  location: GeoLocationSchema,
  familySize: z.number().int().min(1).max(20).default(3),
  hasYoungChildren: z.boolean().default(false),
  hasElderly: z.boolean().default(false),
  hasRespiratorySensitivities: z.boolean().default(false),
  respiratoryDetails: z.string().max(200).optional(),
  workRoutine: WorkRoutineEnum.default("hybrid"),
  commuteMethod: CommuteMethodEnum.default("metro_train"),
  exerciseTiming: ExerciseTimingEnum.default("early_morning"),
  homeType: HomeTypeEnum.default("apartment"),
  airPurifierStatus: AirPurifierStatusEnum.default("single_room"),
  notes: z.string().max(500).optional(),
});

export type FamilyProfile = z.infer<typeof FamilyProfileSchema>;

/**
 * Calculates a vulnerability weight for the family (0.0 to 1.0)
 * Higher vulnerability necessitates stricter protective measures.
 */
export function calculateVulnerabilityScore(profile: FamilyProfile): {
  score: number; // 0 to 100
  factors: string[];
} {
  let score = 20; // baseline
  const factors: string[] = [];

  if (profile.hasYoungChildren) {
    score += 25;
    factors.push("Underdeveloped lungs in young children increase susceptibility to PM2.5.");
  }
  if (profile.hasElderly) {
    score += 25;
    factors.push("Cardiovascular and pulmonary reserves decrease with age; high vulnerability.");
  }
  if (profile.hasRespiratorySensitivities) {
    score += 30;
    factors.push("Pre-existing asthma, allergies, or COPD elevate attack risk on polluted days.");
  }
  if (profile.airPurifierStatus === "none") {
    score += 15;
    factors.push("No indoor HEPA filtration increases cumulative daily particulate dosage.");
  }
  if (profile.commuteMethod === "two_wheeler" || profile.commuteMethod === "bicycle_walk") {
    score += 10;
    factors.push("Open-air commute exposes family members to road-level exhaust and resuspended dust.");
  }

  return {
    score: Math.min(100, score),
    factors,
  };
}
