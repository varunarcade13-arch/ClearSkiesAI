import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AQIProvider, useAQI } from "./AQIContext";
import { LocationProvider } from "./LocationContext";
import { CPCBReferenceProvider } from "@/infrastructure/aqi/CPCBReferenceProvider";

const wrapper = ({ children }: { children: React.ReactNode }) => <LocationProvider><AQIProvider>{children}</AQIProvider></LocationProvider>;
const aqi = CPCBReferenceProvider.getSampleData("Delhi");
const weather = { temperature: 10, apparentTemperature: 9, relativeHumidity: 80, windSpeed: 2, windDirection: 0, surfacePressure: 1010, weatherCode: 45, condition: "Fog", source: "test", timestamp: new Date().toISOString(), inversionRisk: { level: "HIGH", explanation: "stagnant", recommendation: "stay inside" } };
const payload = { aqi, weather, alerts: [{ id: "critical", severity: "CRITICAL", title: "Severe air", message: "Stay inside" }] };
const response = (body: unknown, ok = true) => ({ ok, statusText: ok ? "OK" : "Unavailable", json: async () => body });

afterEach(() => vi.unstubAllGlobals());

describe("AQIProvider", () => {
  it("loads AQI, weather, alerts and forecast, and supports dismiss and notification actions", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => url.startsWith("/api/aqi") ? response(payload) : response({ current: aqi, historical24h: [], forecast72h: [] })));
    const notification = vi.fn();
    vi.stubGlobal("Notification", class { static permission = "granted"; static requestPermission = vi.fn(async () => "granted"); constructor(title: string, options: unknown) { notification(title, options); } });
    const { result } = renderHook(() => useAQI(), { wrapper });
    await waitFor(() => expect(result.current.data?.aqi).toBe(aqi.aqi));
    expect(result.current.weather?.temperature).toBe(10);
    expect(result.current.alerts).toHaveLength(1);
    expect(result.current.notificationsEnabled).toBe(true);
    await waitFor(() => expect(notification).toHaveBeenCalledWith("ClearSkies AI: Severe air", expect.objectContaining({ body: "Stay inside" })));
    expect(result.current.forecast).toBeTruthy();
    act(() => result.current.dismissAlert("critical"));
    expect(result.current.alerts).toHaveLength(0);
    await act(async () => expect(await result.current.requestNotificationPermission()).toBe(true));
    await act(async () => result.current.refreshAQI());
  });

  it("keeps forecast unset when forecast API fails and reports AQI failures", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => url.startsWith("/api/aqi") ? response(payload) : response({}, false)));
    const { result, unmount } = renderHook(() => useAQI(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeTruthy());
    expect(result.current.forecast).toBeNull();
    unmount();

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network unavailable")));
    const failed = renderHook(() => useAQI(), { wrapper });
    await waitFor(() => expect(failed.result.current.error).toBe("network unavailable"));
    expect(failed.result.current.isLoading).toBe(false);
  });

  it("handles unsupported notification APIs and rejected permission prompts", async () => {
    const original = window.Notification;
    Reflect.deleteProperty(window, "Notification");
    vi.stubGlobal("fetch", vi.fn(async () => response(payload)));
    const { result, unmount } = renderHook(() => useAQI(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeTruthy());
    await act(async () => expect(await result.current.requestNotificationPermission()).toBe(false));
    unmount();
    vi.stubGlobal("Notification", { permission: "default", requestPermission: vi.fn().mockRejectedValue(new Error("denied")) });
    const rejected = renderHook(() => useAQI(), { wrapper });
    await act(async () => expect(await rejected.result.current.requestNotificationPermission()).toBe(false));
    if (original) vi.stubGlobal("Notification", original);
  });

  it("handles missing alert arrays, rejected primary responses, and non-Error failures", async () => {
    vi.stubGlobal("Notification", { permission: "default", requestPermission: vi.fn(async () => "denied") });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(response({ aqi, weather })).mockResolvedValueOnce(response({ aqi }, false)));
    const { result, unmount } = renderHook(() => useAQI(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeTruthy());
    expect(result.current.alerts).toEqual([]);
    expect(result.current.forecast).toBeNull();
    unmount();

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({}, false)));
    const failed = renderHook(() => useAQI(), { wrapper });
    await waitFor(() => expect(failed.result.current.error).toMatch(/Unavailable/));
    failed.unmount();

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue("offline"));
    const unknownFailure = renderHook(() => useAQI(), { wrapper });
    await waitFor(() => expect(unknownFailure.result.current.error).toBe("Error connecting to air quality service."));
  });

  it("does not notify for non-critical alerts", async () => {
    const notification = vi.fn();
    vi.stubGlobal("Notification", class { static permission = "granted"; static requestPermission = vi.fn(async () => "granted"); constructor(title: string, options: unknown) { notification(title, options); } });
    const nonCritical = { ...payload, alerts: [{ id: "moderate", severity: "MODERATE", title: "Air advisory", message: "Limit exertion" }] };
    vi.stubGlobal("fetch", vi.fn(async (url: string) => url.startsWith("/api/aqi") ? response(nonCritical) : response({ current: aqi, historical24h: [], forecast72h: [] })));
    const { result } = renderHook(() => useAQI(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeTruthy());
    expect(result.current.alerts).toHaveLength(1);
    await act(async () => { await result.current.requestNotificationPermission(); });
    await act(async () => { await result.current.refreshAQI(); });
    expect(notification).not.toHaveBeenCalled();
  });

  it("handles a null alert list while browser notifications are enabled", async () => {
    const notification = vi.fn();
    vi.stubGlobal("Notification", class { static permission = "granted"; static requestPermission = vi.fn(async () => "granted"); constructor(title: string, options: unknown) { notification(title, options); } });
    const noAlertList = { ...payload, alerts: null };
    vi.stubGlobal("fetch", vi.fn(async (url: string) => url.startsWith("/api/aqi") ? response(noAlertList) : response({ current: aqi, historical24h: [], forecast72h: [] })));
    const { result } = renderHook(() => useAQI(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeTruthy());
    await act(async () => { await result.current.requestNotificationPermission(); });
    await act(async () => { await result.current.refreshAQI(); });
    expect(result.current.alerts).toEqual([]);
    expect(notification).not.toHaveBeenCalled();
  });

  it("throws when useAQI is used without its provider", () => {
    expect(() => renderHook(() => useAQI())).toThrow("useAQI must be used within an AQIProvider");
  });
});
