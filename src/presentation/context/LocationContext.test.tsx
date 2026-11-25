import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocationProvider, useLocation } from "./LocationContext";

const wrapper = ({ children }: { children: React.ReactNode }) => <LocationProvider>{children}</LocationProvider>;
const position = (latitude: number, longitude: number) => ({ coords: { latitude, longitude } }) as GeolocationPosition;
let geoDescriptor: PropertyDescriptor | undefined;

function setGeolocation(getCurrentPosition: Geolocation["getCurrentPosition"]) {
  Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition } });
}

describe("LocationProvider", () => {
  it("throws when the location hook is used without a provider", () => {
    expect(() => renderHook(() => useLocation())).toThrow("useLocation must be used within a LocationProvider");
  });
  beforeEach(() => { localStorage.clear(); geoDescriptor = Object.getOwnPropertyDescriptor(navigator, "geolocation"); });
  afterEach(() => {
    vi.unstubAllGlobals();
    if (geoDescriptor) Object.defineProperty(navigator, "geolocation", geoDescriptor);
    else Reflect.deleteProperty(navigator, "geolocation");
  });

  it("loads only validated saved location and standard data", async () => {
    localStorage.setItem("clearskies-location", JSON.stringify({ name: "Paris", latitude: 48.8, longitude: 2.3 }));
    localStorage.setItem("clearskies-standard", "US_AQI");
    const { result } = renderHook(() => useLocation(), { wrapper });
    await waitFor(() => expect(result.current.location.name).toBe("Paris"));
    expect(result.current.standard).toBe("US_AQI");
  });

  it("ignores invalid saved values and persists manual selections", async () => {
    localStorage.setItem("clearskies-location", JSON.stringify({ name: "", latitude: 999, longitude: 0 }));
    localStorage.setItem("clearskies-standard", "UNKNOWN");
    const { result } = renderHook(() => useLocation(), { wrapper });
    expect(result.current.location.name).toBe("Delhi");
    expect(result.current.standard).toBe("INDIAN_NAQI");
    act(() => result.current.setLocation({ name: "Pune", latitude: 18.5, longitude: 73.8, country: "India" }));
    act(() => result.current.setStandard("US_AQI"));
    expect(JSON.parse(localStorage.getItem("clearskies-location")!).name).toBe("Pune");
    expect(localStorage.getItem("clearskies-standard")).toBe("US_AQI");
  });

  it("reports unsupported and denied geolocation", async () => {
    Reflect.deleteProperty(navigator, "geolocation");
    const { result, rerender } = renderHook(() => useLocation(), { wrapper });
    await act(async () => expect(await result.current.detectCurrentLocation()).toBe(false));
    expect(result.current.locationError).toMatch(/not supported/i);
    setGeolocation((_success, failure) => failure!({ code: 1, PERMISSION_DENIED: 1 } as GeolocationPositionError));
    rerender();
    await act(async () => expect(await result.current.detectCurrentLocation()).toBe(false));
    expect(result.current.locationError).toMatch(/permission was denied/i);
    expect(result.current.isDetectingLocation).toBe(false);
    setGeolocation((_success, failure) => failure!({ code: 2, PERMISSION_DENIED: 1 } as GeolocationPositionError));
    await act(async () => expect(await result.current.detectCurrentLocation()).toBe(false));
    expect(result.current.locationError).toMatch(/Unable to retrieve your location/);
  });

  it("reverse geocodes current coordinates and persists the resolved name", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ name: "Bengaluru", country: "India" }) }));
    setGeolocation((success) => success(position(12.9716, 77.5946)));
    const { result } = renderHook(() => useLocation(), { wrapper });
    await act(async () => expect(await result.current.detectCurrentLocation()).toBe(true));
    await waitFor(() => expect(result.current.location.name).toBe("Bengaluru"));
    expect(result.current.location.latitude).toBe(12.9716);
    expect(localStorage.getItem("clearskies-location")).toContain("Bengaluru");
  });

  it.each([[28.6139, 77.209, "Delhi"], [40, -70, "Nearby location"]] as const)("uses a safe location fallback when reverse lookup fails", async (lat, lng, name) => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    setGeolocation((success) => success(position(lat, lng)));
    const { result } = renderHook(() => useLocation(), { wrapper });
    await act(async () => expect(await result.current.detectCurrentLocation()).toBe(true));
    await waitFor(() => expect(result.current.location.name).toBe(name));
    expect(result.current.locationError).toBeTruthy();
  });

  it("uses coordinate fallback when reverse geocoding responds unsuccessfully", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    setGeolocation((success) => success(position(40, -70)));
    const { result } = renderHook(() => useLocation(), { wrapper });
    await act(async () => expect(await result.current.detectCurrentLocation()).toBe(true));
    expect(result.current.location.name).toBe("Nearby location");
  });
});
