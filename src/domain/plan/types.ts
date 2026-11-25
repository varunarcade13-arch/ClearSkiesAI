import { z } from "zod";

export const DailyPlanPhaseSchema = z.object({
  timeSlot: z.string(), // e.g., "06:00 - 09:00"
  phaseName: z.string(), // e.g., "Morning Smog Peak Routine"
  action: z.string(),
  recommendation: z.string(),
  rationale: z.string(),
  exposureBenefit: z.string(), // e.g., "Reduces inhaled PM2.5 by ~70%"
  priority: z.enum(["CRITICAL", "HIGH", "MODERATE", "LOW"]),
  isIndoor: z.boolean(),
  maskRequired: z.boolean(),
});

export type DailyPlanPhase = z.infer<typeof DailyPlanPhaseSchema>;

export const PersonalizedPlanSchema = z.object({
  id: z.string(),
  generatedAt: z.string(),
  locationName: z.string(),
  aqiSnapshot: z.number(),
  aqiCategory: z.string(),
  vulnerabilityLevel: z.string(),
  phases: z.object({
    morning: DailyPlanPhaseSchema,
    outdoorActivity: DailyPlanPhaseSchema,
    commuting: DailyPlanPhaseSchema,
    indoorAirQuality: DailyPlanPhaseSchema,
    afternoon: DailyPlanPhaseSchema,
    evening: DailyPlanPhaseSchema,
    nightTime: DailyPlanPhaseSchema,
  }),
  keyTakeaway: z.string(),
  disclaimer: z.string(),
});

export type PersonalizedPlan = z.infer<typeof PersonalizedPlanSchema>;
