import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LocationProvider, useLocation } from "./LocationContext";
import { FamilyProfileProvider, useFamilyProfile } from "./FamilyProfileContext";

const wrapper = ({ children }: { children: React.ReactNode }) => <LocationProvider><FamilyProfileProvider>{children}</FamilyProfileProvider></LocationProvider>;

describe("FamilyProfileProvider", () => {
  it("throws when the profile hook is used without a provider", () => {
    expect(() => renderHook(() => useFamilyProfile())).toThrow("useFamilyProfile must be used within a FamilyProfileProvider");
  });
  it("loads a valid saved profile, persists updates and resets to the current location", async () => {
    localStorage.clear();
    localStorage.setItem("clearskies-family-profile", JSON.stringify({
      location: { name: "Delhi", latitude: 28.6, longitude: 77.2 },
      familySize: 4, hasYoungChildren: true,
    }));
    const { result } = renderHook(() => ({ family: useFamilyProfile(), location: useLocation() }), { wrapper });
    await waitFor(() => expect(result.current.family.hasProfile).toBe(true));
    expect(result.current.family.profile.familySize).toBe(4);
    act(() => result.current.family.updateProfile({ notes: "Sensitive group" }));
    expect(JSON.parse(localStorage.getItem("clearskies-family-profile")!).notes).toBe("Sensitive group");
    act(() => result.current.family.resetProfile());
    expect(result.current.family.hasProfile).toBe(false);
    expect(localStorage.getItem("clearskies-family-profile")).toBeNull();
    expect(result.current.family.profile.location.name).toBe(result.current.location.location.name);
  });

  it("ignores malformed profiles and stays usable with defaults", async () => {
    localStorage.setItem("clearskies-family-profile", JSON.stringify({ familySize: -1 }));
    const { result } = renderHook(() => useFamilyProfile(), { wrapper });
    await waitFor(() => expect(result.current.profile.location.name).toBe("Delhi"));
    expect(result.current.hasProfile).toBe(false);
    expect(result.current.profile.familySize).toBe(3);
  });
});
