import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FamilyPlanView } from "./FamilyPlanView";

const profile = { hasYoungChildren: false, hasElderly: false, hasRespiratorySensitivities: false, commuteMethod: "metro_train", exerciseTiming: "afternoon", airPurifierStatus: "none", workRoutine: "remote" };
const updateProfile = vi.fn();
const resetProfile = vi.fn();
const aqiState = vi.hoisted(() => ({ data: { aqi: 280 } as { aqi: number } | null }));
vi.mock("@/presentation/context/LocationContext", () => ({ useLocation: () => ({ location: { name: "Delhi", latitude: 28.6, longitude: 77.2 } }) }));
vi.mock("@/presentation/context/AQIContext", () => ({ useAQI: () => aqiState }));
vi.mock("@/presentation/context/FamilyProfileContext", () => ({ useFamilyProfile: () => ({ profile, updateProfile, resetProfile }) }));

afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); aqiState.data = { aqi: 280 }; Object.assign(profile, { hasYoungChildren: false, hasElderly: false, hasRespiratorySensitivities: false, airPurifierStatus: "none" }); });

describe("FamilyPlanView", () => {
  it("opens profile controls, updates household fields, and resets defaults", () => {
    render(<FamilyPlanView />);
    fireEvent.click(screen.getByRole("button", { name: "Configure Family Profile" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Young children under 10 in household" }));
    expect(updateProfile).toHaveBeenCalledWith({ hasYoungChildren: true });
    fireEvent.click(screen.getByRole("checkbox", { name: "Elderly members aged 60 or older in household" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Asthma or respiratory sensitivities in household" }));
    expect(updateProfile).toHaveBeenCalledWith({ hasElderly: true });
    expect(updateProfile).toHaveBeenCalledWith({ hasRespiratorySensitivities: true });
    fireEvent.change(screen.getByLabelText("Primary Commute Method"), { target: { value: "solo_car" } });
    expect(updateProfile).toHaveBeenCalledWith({ commuteMethod: "solo_car" });
    fireEvent.change(screen.getByLabelText("Preferred Exercise Timing"), { target: { value: "night" } });
    fireEvent.change(screen.getByLabelText("Home Air Purifier Status"), { target: { value: "whole_home" } });
    expect(updateProfile).toHaveBeenCalledWith({ exerciseTiming: "night" });
    expect(updateProfile).toHaveBeenCalledWith({ airPurifierStatus: "whole_home" });
    fireEvent.click(screen.getByRole("button", { name: "Reset to Defaults" }));
    expect(resetProfile).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Hide Profile Settings" }));
    expect(screen.queryByRole("button", { name: "Reset to Defaults" })).not.toBeInTheDocument();
  });

  it("reports failed plan generation", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, statusText: "Unavailable" });
    vi.stubGlobal("fetch", fetchMock);
    render(<FamilyPlanView />);
    const generate = screen.getByRole("button", { name: "Generate Personalized Plan" });
    fireEvent.click(generate);
    expect(await screen.findByRole("alert")).toHaveTextContent("Failed to generate plan: Unavailable");
    expect(fetchMock).toHaveBeenCalledWith("/api/plan", expect.objectContaining({ method: "POST" }));
  });

  it("renders a generated plan, including critical and standard phases", async () => {
    const phase = (phaseName: string, priority: "CRITICAL" | "HIGH" | "MODERATE" | "LOW") => ({ phaseName, timeSlot: "06:00-08:00", action: "Stay indoors", recommendation: "Use filtration", rationale: "Pollution is high", exposureBenefit: "Lower exposure", priority, isIndoor: true, maskRequired: true });
    const phases = Object.fromEntries(["morning", "outdoorActivity", "commuting", "indoorAirQuality", "afternoon", "evening", "nightTime"].map((key, index) => [key, phase(key, index === 0 ? "CRITICAL" : "MODERATE") ]));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "p1", generatedAt: "2025-01-01T12:00:00Z", locationName: "Delhi", aqiSnapshot: 280, aqiCategory: "Poor", vulnerabilityLevel: "Standard", phases, keyTakeaway: "Protect your household", disclaimer: "General advice" }) }));
    render(<FamilyPlanView />);
    fireEvent.click(screen.getByRole("button", { name: "Generate Personalized Plan" }));
    expect(await screen.findByText(/Active Plan for Delhi/)).toBeInTheDocument();
    expect(screen.getByText("Protect your household")).toBeInTheDocument();
    expect(screen.getAllByText("Use filtration")).toHaveLength(7);
    expect(screen.getByText("CRITICAL", { selector: "span" })).toBeInTheDocument();
  });

  it("renders standard, moderate and high vulnerability outcomes plus live AQI fallback", () => {
    const { rerender } = render(<FamilyPlanView />);
    expect(screen.getByText("Standard Profile")).toBeInTheDocument();
    expect(screen.getByText(/AQI 280/)).toBeInTheDocument();
    profile.hasYoungChildren = true;
    profile.airPurifierStatus = "whole_home";
    rerender(<FamilyPlanView />);
    expect(screen.getByText("Moderate Vulnerability")).toBeInTheDocument();
    profile.hasElderly = true;
    profile.hasRespiratorySensitivities = true;
    profile.airPurifierStatus = "none";
    aqiState.data = { aqi: 0 };
    rerender(<FamilyPlanView />);
    expect(screen.getByText("High Vulnerability")).toBeInTheDocument();
    expect(screen.getByText(/AQI Live/)).toBeInTheDocument();
  });

  it("uses a generic alert when plan generation throws a non-Error value", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue("network down"));
    render(<FamilyPlanView />);
    fireEvent.click(screen.getByRole("button", { name: "Generate Personalized Plan" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Error generating daily protection plan.");
  });
});
