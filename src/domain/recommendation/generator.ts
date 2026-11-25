import { FamilyProfile } from "../family/types";
import { RoutineRecommendation } from "./types";
import { AQICategory } from "../aqi/types";

export function generateRoutineRecommendations(
  aqi: number,
  category: AQICategory,
  profile?: FamilyProfile
): RoutineRecommendation[] {
  const recommendations: RoutineRecommendation[] = [];

  // 1. COMMUTE RECOMMENDATIONS
  if (aqi >= 150) {
    if (profile?.commuteMethod === "solo_car") {
      recommendations.push({
        id: "commute-metro-shift",
        category: "COMMUTE",
        title: "Shift to Metro or Carpool During Severe Smog",
        whatToDo: "Switch daily commute to rapid transit (Metro) or shared carpooling rather than driving solo.",
        whyRecommended: "Vehicular exhaust is the single largest ground-level source of PM2.5 and toxic NOx in urban corridors.",
        environmentalImpact: {
          co2eKgSaved: 3.2,
          pmGramsAvoided: 8.5,
          description: "Avoids ~3.2 kg CO2e and reduces tailpipe PM emissions significantly per 20km trip.",
        },
        personalExposureBenefit: {
          percentageReduction: 60,
          description: "Underground and enclosed metro stations have 40-70% lower PM2.5 exposure than open bumper-to-bumper road corridors.",
        },
        practicalDifficulty: "Low",
        financialCost: "Free",
        verificationTag: "PEER_REVIEWED_ESTIMATE",
        assumptions: "Based on Indian Central Road Research Institute (CRRI) average commuter emission factors for a 20 km urban round-trip.",
        applicableAqiThreshold: 150,
      });
    }

    recommendations.push({
      id: "commute-cabin-recirculate",
      category: "COMMUTE",
      title: "Activate Internal Air Recirculation & Seal Vehicle Cabin",
      whatToDo: "Set vehicle AC to internal recirculation mode and inspect cabin pollen/HEPA filter.",
      whyRecommended: "Drawing outdoor air in traffic brings unfiltered diesel soot and tyre wear straight into the vehicle breathing zone.",
      environmentalImpact: {
        co2eKgSaved: 0.1,
        pmGramsAvoided: 0.2,
        description: "Optimizes thermal efficiency of air conditioning while preventing cabin air contamination.",
      },
      personalExposureBenefit: {
        percentageReduction: 80,
        description: "Reduces in-cabin PM2.5 concentrations by up to 80-85% compared to drawing raw outside traffic air.",
      },
      practicalDifficulty: "Low",
      financialCost: "Free",
      verificationTag: "MEASURED_OBSERVATION",
      assumptions: "Verified across automotive cabin air quality studies (Atmospheric Environment, 2018).",
      applicableAqiThreshold: 100,
    });
  }

  // 2. FITNESS & EXERCISE RECOMMENDATIONS
  if (aqi >= 201) {
    recommendations.push({
      id: "fitness-indoor-shift",
      category: "FITNESS",
      title: "Shift Aerobic Workouts Indoors – Cancel Early Morning Outdoor Runs",
      whatToDo: "Replace morning jogging, brisk walking, or cycling with indoor yoga, resistance training, or home treadmill workouts.",
      whyRecommended: "Deep rapid breathing during intense aerobic exercise increases alveolar deposition of fine particles by 400-500%.",
      environmentalImpact: {
        co2eKgSaved: 0,
        pmGramsAvoided: 0,
        description: "Zero direct environmental delta, but prevents exertion during high pollution spikes.",
      },
      personalExposureBenefit: {
        percentageReduction: 85,
        description: "Prevents inhaling roughly 150-250 micrograms of PM2.5 directly into deep lung tissue per workout.",
      },
      practicalDifficulty: "Medium",
      financialCost: "Free",
      verificationTag: "MEASURED_OBSERVATION",
      assumptions: "Calculated from minute ventilation rate (VE ~ 50 L/min during running vs 10 L/min at rest) in 300+ AQI air.",
      applicableAqiThreshold: 200,
    });
  } else if (aqi >= 101) {
    recommendations.push({
      id: "fitness-time-shift",
      category: "FITNESS",
      title: "Reschedule Outdoor Workouts to Midday (12 PM - 3 PM)",
      whatToDo: "Avoid dawn (6 AM - 8 AM) and dusk (6 PM - 9 PM) outdoor workouts; exercise around solar noon if needed.",
      whyRecommended: "Solar heating breaks the winter nocturnal temperature inversion, resulting in better atmospheric mixing and lower ground-level PM2.5.",
      environmentalImpact: {
        co2eKgSaved: 0,
        pmGramsAvoided: 0,
        description: "Better dispersion timing.",
      },
      personalExposureBenefit: {
        percentageReduction: 40,
        description: "Midday PM2.5 concentrations are typically 30-50% lower than dawn rush hour inversion peaks.",
      },
      practicalDifficulty: "Low",
      financialCost: "Free",
      verificationTag: "PEER_REVIEWED_ESTIMATE",
      assumptions: "Derived from diurnal particulate boundary layer profiles recorded by CPCB stations across North Indian plains.",
      applicableAqiThreshold: 100,
    });
  }

  // 3. HOME & INDOOR LIVING
  if (aqi >= 200) {
    recommendations.push({
      id: "home-damp-mop",
      category: "HOME_INDOOR",
      title: "Switch from Dry Sweeping to Damp Mopping with Microfiber",
      whatToDo: "Never use dry brooms or feather dusters; use a damp microfiber cloth and wet mop.",
      whyRecommended: "Dry sweeping resuspends settled toxic fine dust back into the breathing zone for 2-4 hours.",
      environmentalImpact: {
        co2eKgSaved: 0,
        pmGramsAvoided: 2.1,
        description: "Prevents indoor dust resuspension.",
      },
      personalExposureBenefit: {
        percentageReduction: 55,
        description: "Halves indoor particulate resuspension spikes compared to traditional dry broom sweeping.",
      },
      practicalDifficulty: "Low",
      financialCost: "Free",
      verificationTag: "MEASURED_OBSERVATION",
      assumptions: "Measured in residential indoor air monitoring studies under ISO cleanroom dusting protocols.",
      applicableAqiThreshold: 150,
    });
  }

  // 4. ENERGY & CONSERVATION
  recommendations.push({
    id: "energy-efficient-heating",
    category: "ENERGY",
    title: "Optimize Space Heating & Avoid Solid Fuel / Waste Burning",
    whatToDo: "Never burn dry leaves, wood, or plastic refuse for warmth. Use thermal insulation curtains and efficient oil/radiant heaters.",
    whyRecommended: "Open biomass and waste burning in winter produces massive polycyclic aromatic hydrocarbons (PAHs) and black carbon right in neighborhoods.",
    environmentalImpact: {
      co2eKgSaved: 4.8,
      pmGramsAvoided: 35.0,
      description: "Prevents release of ~35 grams of toxic black carbon and carcinogenic aromatics per burning event.",
    },
    personalExposureBenefit: {
      percentageReduction: 90,
      description: "Immediate prevention of toxic localized smoke plumes entering neighborhood balconies and windows.",
    },
    practicalDifficulty: "Low",
    financialCost: "Free",
    verificationTag: "PEER_REVIEWED_ESTIMATE",
    assumptions: "Based on CPCB and TERI emission factor inventory for municipal solid waste open combustion.",
    applicableAqiThreshold: 50,
  });

  // 5. COMMUNITY ACTION
  recommendations.push({
    id: "community-errand-bundling",
    category: "COMMUNITY",
    title: "Combine Weekly Errands into a Single Consolidated Trip",
    whatToDo: "Group grocery trips, pharmacy visits, and social errands into one trip rather than making multiple cold-engine vehicle starts.",
    whyRecommended: "Cold engine starts emit up to 3x more hydrocarbons and carbon monoxide before catalytic converters reach operating temperature.",
    environmentalImpact: {
      co2eKgSaved: 1.8,
      pmGramsAvoided: 3.2,
      description: "Saves ~1.8 kg CO2e and avoids 3 cold-start exhaust cycles weekly.",
    },
    personalExposureBenefit: {
      percentageReduction: 35,
      description: "Limits cumulative time spent idling in street traffic during peak pollution hours.",
    },
    practicalDifficulty: "Low",
    financialCost: "Free",
    verificationTag: "PEER_REVIEWED_ESTIMATE",
    assumptions: "EPA cold-start vehicle emissions model based on three 4 km consolidated trips.",
    applicableAqiThreshold: 50,
  });

  return recommendations;
}
