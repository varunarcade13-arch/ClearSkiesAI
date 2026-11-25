"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { FamilyProfile, FamilyProfileSchema } from "@/domain/family/types";
import { useLocation } from "./LocationContext";

interface FamilyProfileContextType {
  profile: FamilyProfile;
  updateProfile: (updates: Partial<FamilyProfile>) => void;
  resetProfile: () => void;
  hasProfile: boolean;
}

const FamilyProfileContext = createContext<FamilyProfileContextType | undefined>(undefined);

export function FamilyProfileProvider({ children }: { children: React.ReactNode }) {
  const { location } = useLocation();

  const defaultProfile: FamilyProfile = {
    location,
    familySize: 3,
    hasYoungChildren: false,
    hasElderly: false,
    hasRespiratorySensitivities: false,
    workRoutine: "hybrid",
    commuteMethod: "metro_train",
    exerciseTiming: "afternoon",
    homeType: "apartment",
    airPurifierStatus: "single_room",
  };

  const [profile, setProfileState] = useState<FamilyProfile>(defaultProfile);
  const [hasProfile, setHasProfile] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("clearskies-family-profile");
      if (saved) {
        const parsed = FamilyProfileSchema.safeParse(JSON.parse(saved));
        if (parsed.success) {
          setProfileState(parsed.data);
          setHasProfile(true);
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  // Synchronize profile location when global location changes
  useEffect(() => {
    setProfileState((prev) => ({
      ...prev,
      location,
    }));
  }, [location]);

  const updateProfile = (updates: Partial<FamilyProfile>) => {
    setProfileState((prev) => {
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem("clearskies-family-profile", JSON.stringify(updated));
      } catch {
        // Ignore
      }
      setHasProfile(true);
      return updated;
    });
  };

  const resetProfile = () => {
    try {
      localStorage.removeItem("clearskies-family-profile");
    } catch {
      // Ignore
    }
    setProfileState({
      ...defaultProfile,
      location,
    });
    setHasProfile(false);
  };

  return (
    <FamilyProfileContext.Provider value={{ profile, updateProfile, resetProfile, hasProfile }}>
      {children}
    </FamilyProfileContext.Provider>
  );
}

export function useFamilyProfile(): FamilyProfileContextType {
  const context = useContext(FamilyProfileContext);
  if (!context) {
    throw new Error("useFamilyProfile must be used within a FamilyProfileProvider");
  }
  return context;
}
