"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { AirQualityData, AQIForecastData } from "@/domain/aqi/types";
import { WeatherData } from "@/domain/weather/types";
import { AirQualityAlert } from "@/domain/alert/evaluator";
import { useLocation } from "./LocationContext";

interface AQIContextType {
  data: AirQualityData | null;
  weather: WeatherData | null;
  forecast: AQIForecastData | null;
  alerts: AirQualityAlert[];
  isLoading: boolean;
  error: string | null;
  refreshAQI: () => Promise<void>;
  dismissAlert: (alertId: string) => void;
  notificationsEnabled: boolean;
  requestNotificationPermission: () => Promise<boolean>;
}

const AQIContext = createContext<AQIContextType | undefined>(undefined);

export function AQIProvider({ children }: { children: React.ReactNode }) {
  const { location, standard } = useLocation();

  const [data, setData] = useState<AirQualityData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<AQIForecastData | null>(null);
  const [alerts, setAlerts] = useState<AirQualityAlert[]>([]);
  const [previousAqi, setPreviousAqi] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
    }
  }, []);

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      const granted = permission === "granted";
      setNotificationsEnabled(granted);
      return granted;
    } catch {
      return false;
    }
  };

  const fetchAQIData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        lat: location.latitude.toString(),
        lng: location.longitude.toString(),
        standard,
      });

      if (previousAqi !== undefined) {
        params.set("prevAqi", previousAqi.toString());
      }

      // 1. Fetch live AQI & Weather
      const aqiRes = await fetch(`/api/aqi?${params.toString()}`);
      if (!aqiRes.ok) {
        throw new Error(`Failed to load live air quality: ${aqiRes.statusText}`);
      }
      const aqiJson = await aqiRes.json();

      setData(aqiJson.aqi);
      setWeather(aqiJson.weather);
      setAlerts(aqiJson.alerts || []);
      setPreviousAqi(aqiJson.aqi.aqi);

      // Trigger browser notification for critical alert if enabled
      if (
        notificationsEnabled &&
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        const severeAlert = (aqiJson.alerts || []).find((a: AirQualityAlert) => a.severity === "CRITICAL");
        if (severeAlert) {
          new Notification(`ClearSkies AI: ${severeAlert.title}`, {
            body: severeAlert.message,
            icon: "/favicon.ico",
          });
        }
      }

      // 2. Fetch forecast
      const forecastRes = await fetch(`/api/forecast?${params.toString()}`);
      if (forecastRes.ok) {
        const forecastJson = await forecastRes.json();
        setForecast(forecastJson);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error connecting to air quality service.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [location.latitude, location.longitude, standard, previousAqi, notificationsEnabled]);

  useEffect(() => {
    fetchAQIData();
  }, [fetchAQIData]);

  const refreshAQI = async () => {
    await fetchAQIData();
  };

  const dismissAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  return (
    <AQIContext.Provider
      value={{
        data,
        weather,
        forecast,
        alerts,
        isLoading,
        error,
        refreshAQI,
        dismissAlert,
        notificationsEnabled,
        requestNotificationPermission,
      }}
    >
      {children}
    </AQIContext.Provider>
  );
}

export function useAQI(): AQIContextType {
  const context = useContext(AQIContext);
  if (!context) {
    throw new Error("useAQI must be used within an AQIProvider");
  }
  return context;
}
