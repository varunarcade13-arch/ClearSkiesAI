import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RecommendationsView } from "./RecommendationsView";

const recommendationContext = vi.hoisted(() => ({ aqi: 240 }));
vi.mock("@/presentation/context/LocationContext", () => ({ useLocation: () => ({ location: { name: "Delhi", latitude: 28, longitude: 77 } }) }));
vi.mock("@/presentation/context/AQIContext", () => ({ useAQI: () => ({ data: { aqi: recommendationContext.aqi } }) }));
vi.mock("@/presentation/context/FamilyProfileContext", () => ({ useFamilyProfile: () => ({ profile: { workRoutine: "remote", commuteMethod: "metro_train" } }) }));

const rec = (id: string, category: string) => ({
  id, category, title: `${category} advice`, whatToDo: "Act safely", whyRecommended: "Science",
  environmentalImpact: { description: "lower emissions" }, personalExposureBenefit: { description: "less exposure" },
  practicalDifficulty: "Low", financialCost: "Free", verificationTag: "MEASURED_OBSERVATION", assumptions: "Estimated",
});

afterEach(() => vi.unstubAllGlobals());

describe("RecommendationsView", () => {
  it("uses the live label when AQI is zero", async () => {
    recommendationContext.aqi = 0;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
    render(<RecommendationsView />);
    expect(await screen.findByText(/current AQI \(Live\)/i)).toBeInTheDocument();
    recommendationContext.aqi = 240;
  });

  it("loads recommendations and filters by every category and back to all", async () => {
    const list = [rec("c", "COMMUTE"), rec("f", "FITNESS"), rec("h", "HOME_INDOOR"), rec("e", "ENERGY"), rec("a", "COMMUNITY")];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => list }));
    render(<RecommendationsView />);
    await screen.findByText("COMMUTE advice");
    expect(screen.getAllByText("Calculation Assumptions:")).toHaveLength(5);
    for (const [label, expected] of [["Transit & Travel", "COMMUTE advice"], ["Exercise & Fitness", "FITNESS advice"], ["Home Practices", "HOME_INDOOR advice"], ["Energy & Warming", "ENERGY advice"], ["Community Action", "COMMUNITY advice"]]) {
      fireEvent.click(screen.getByRole("button", { name: label }));
      expect(screen.getByText(expected)).toBeInTheDocument();
      expect(screen.getAllByText(/advice$/)).toHaveLength(1);
      expect(screen.getByRole("button", { name: label })).toHaveAttribute("aria-pressed", "true");
    }
    fireEvent.click(screen.getByRole("button", { name: "All Guidance" }));
    await waitFor(() => expect(screen.getByText("COMMUNITY advice")).toBeInTheDocument());
  });

  it("handles non-success and network errors as empty results", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const first = render(<RecommendationsView />);
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
    expect(screen.queryByText(/advice$/)).not.toBeInTheDocument();
    first.unmount();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<RecommendationsView />);
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
    expect(screen.getByText("Smart Daily Routines")).toBeInTheDocument();
  });
});
