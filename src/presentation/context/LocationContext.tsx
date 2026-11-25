"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { GeoLocation, GeoLocationSchema } from "@/domain/family/types";
import { AQIStandard } from "@/domain/aqi/types";
import { CPCB_PRESET_CITIES } from "@/infrastructure/aqi/CPCBReferenceProvider";

interface LocationContextType {
  location: GeoLocation;
  setLocation: (loc: GeoLocation) => void;
  standard: AQIStandard;
  setStandard: (std: AQIStandard) => void;
  isDetectingLocation: boolean;
  detectCurrentLocation: () => Promise<boolean>;
  locationError: string | null;
}

const DEFAULT_LOCATION: GeoLocation = {
  name: "Delhi",
  locality: "Mandir Marg",
  state: "Delhi",
  country: "India",
  latitude: 28.6139,
  longitude: 77.209,
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocationState] = useState<GeoLocation>(DEFAULT_LOCATION);
  const [standard, setStandardState] = useState<AQIStandard>("INDIAN_NAQI");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedLoc = localStorage.getItem("clearskies-location");
      if (savedLoc) {
        const parsed = GeoLocationSchema.safeParse(JSON.parse(savedLoc));
        if (parsed.success) setLocationState(parsed.data);
      }
      const savedStd = localStorage.getItem("clearskies-standard") as AQIStandard | null;
      if (savedStd && ["INDIAN_NAQI", "US_AQI"].includes(savedStd)) {
        setStandardState(savedStd);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const setLocation = (loc: GeoLocation) => {
    setLocationState(loc);
    setLocationError(null);
    try {
      localStorage.setItem("clearskies-location", JSON.stringify(loc));
    } catch {
      // Ignore
    }
  };

  const setStandard = (std: AQIStandard) => {
    setStandardState(std);
    try {
      localStorage.setItem("clearskies-standard", std);
    } catch {
      // Ignore
    }
  };

  const detectCurrentLocation = async (): Promise<boolean> => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return false;
    }

    setIsDetectingLocation(true);
    setLocationError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          void (async () => {
            const preset = CPCB_PRESET_CITIES.find(
              (city) => Math.abs(city.latitude - lat) < 0.25 && Math.abs(city.longitude - lng) < 0.25
            );

            try {
              const response = await fetch(`/api/locations/reverse?lat=${lat}&lng=${lng}`);
              if (!response.ok) throw new Error("Reverse geocoding failed");

              const resolvedLocation = (await response.json()) as GeoLocation;
              setLocation({ ...resolvedLocation, latitude: lat, longitude: lng });
              setLocationError(null);
            } catch {
              if (preset) {
                setLocation({
                  name: preset.name,
                  locality: preset.stationName.split(",")[0],
                  state: preset.state,
                  country: preset.country,
                  latitude: lat,
                  longitude: lng,
                });
                setLocationError("Using the nearest known city name; detailed GPS place lookup is unavailable.");
              } else {
                setLocation({
                  name: "Nearby location",
                  locality: `${lat.toFixed(3)}°, ${lng.toFixed(3)}°`,
                  country: "GPS coordinates",
                  latitude: lat,
                  longitude: lng,
                });
                setLocationError("Could not find a place name for this GPS point. Showing its coordinates instead.");
              }
            } finally {
              setIsDetectingLocation(false);
              resolve(true);
            }
          })();
        },
        (err) => {
          setIsDetectingLocation(false);
          let msg = "Unable to retrieve your location.";
          if (err.code === err.PERMISSION_DENIED) {
            msg = "Location permission was denied. Please search or select a city manually.";
          }
          setLocationError(msg);
          resolve(false);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  };

  return (
    <LocationContext.Provider
      value={{
        location,
        setLocation,
        standard,
        setStandard,
        isDetectingLocation,
        detectCurrentLocation,
        locationError,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation(): LocationContextType {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}
