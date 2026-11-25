export type VerificationTag =
  | "MEASURED_OBSERVATION"
  | "PEER_REVIEWED_ESTIMATE"
  | "AI_ASSISTED_SIMULATION";

export type PracticalDifficulty = "Low" | "Medium" | "High";
export type FinancialCost = "Free" | "Low" | "Moderate" | "High";

export interface RoutineRecommendation {
  id: string;
  category: "COMMUTE" | "FITNESS" | "HOME_INDOOR" | "ENERGY" | "COMMUNITY";
  title: string;
  whatToDo: string;
  whyRecommended: string;
  environmentalImpact: {
    co2eKgSaved: number;
    pmGramsAvoided: number;
    description: string;
  };
  personalExposureBenefit: {
    percentageReduction: number; // e.g. 75%
    description: string;
  };
  practicalDifficulty: PracticalDifficulty;
  financialCost: FinancialCost;
  verificationTag: VerificationTag;
  assumptions: string;
  applicableAqiThreshold: number; // Minimum AQI where this becomes active/vital
}
