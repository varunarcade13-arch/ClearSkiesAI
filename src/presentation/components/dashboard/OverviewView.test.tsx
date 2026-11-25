import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OverviewView } from "./OverviewView";

const state = vi.hoisted(() => ({
  aqi: { location: { name: "Delhi", state: "NCT", country: "India" } as { name: string; state?: string; country?: string }, data: null as any, weather: null as any, forecast: null as any, isLoading: false, error: null as string | null },
  profile: { familySize: 3, hasYoungChildren: false, hasElderly: false, hasRespiratorySensitivities: false },
}));
vi.mock("@/presentation/context/LocationContext", () => ({ useLocation: () => ({ location: state.aqi.location }) }));
vi.mock("@/presentation/context/AQIContext", () => ({ useAQI: () => state.aqi }));
vi.mock("@/presentation/context/FamilyProfileContext", () => ({ useFamilyProfile: () => ({ profile: state.profile }) }));
vi.mock("./TrendChart", () => ({ TrendChart: ({ title }: { title: string }) => <div>{title}</div> }));
const data = { aqi: 275, category: "Poor", dominantPollutant: "PM2.5", pollutants: { pm25: { value: 80 } }, healthAdvisory: { general: "Limit outdoor exposure." } };

beforeEach(() => {
  state.aqi.location = { name: "Delhi", state: "NCT" };
  state.aqi.data = null; state.aqi.weather = null; state.aqi.forecast = null; state.aqi.isLoading = false; state.aqi.error = null;
  state.profile = { familySize: 3, hasYoungChildren: false, hasElderly: false, hasRespiratorySensitivities: false };
});

describe("OverviewView", () => {
  it("renders loading, error, and empty states", () => {
    state.aqi.isLoading = true;
    const { rerender } = render(<OverviewView onNavigate={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading live air intelligence for Delhi");
    state.aqi.isLoading = false; state.aqi.error = "Service unavailable";
    rerender(<OverviewView onNavigate={vi.fn()} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Service unavailable");
    state.aqi.error = null;
    const { container } = render(<OverviewView onNavigate={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows live metrics, forecast, risk variations and all navigation actions", () => {
    state.aqi.data = data;
    state.aqi.weather = { temperature: 21, relativeHumidity: 55, windSpeed: 4, condition: "Haze", inversionRisk: { level: "MODERATE", score: 0 } };
    state.aqi.forecast = { historical24h: [] };
    state.profile.hasYoungChildren = true; state.profile.hasElderly = true; state.profile.hasRespiratorySensitivities = true;
    const navigate = vi.fn();
    render(<OverviewView onNavigate={navigate} />);
    expect(screen.getByText("Limit outdoor exposure.")).toBeInTheDocument();
    expect(screen.getByText("21°C")).toBeInTheDocument();
    expect(screen.getByText("Kids Seniors Asthma")).toBeInTheDocument();
    expect(screen.getByText("Past 24-Hour Air Quality Evolution")).toBeInTheDocument();
    for (const [label, tab] of [["Ask Gemini Assistant", "ai-assistant"], ["Personalized Family Plan", "family-plan"], ["View Full Pollutant Breakdown", "live-aqi"], ["Explore Workout Alternatives", "recommendations"], ["Air Purifier CADR Calculator", "indoor-aq"], ["Commute Carbon Comparator", "sustainability"]]) {
      fireEvent.click(screen.getByRole("button", { name: label }));
      expect(navigate).toHaveBeenLastCalledWith(tab);
    }
  });

  it("uses fallbacks for absent weather, station state, and PM2.5 data", () => {
    state.aqi.location = { name: "Somewhere", state: "", country: "" };
    state.aqi.data = { ...data, source: "test", sourceType: "MODEL_ESTIMATE", station: undefined, pollutants: {} };
    state.aqi.weather = null;
    render(<OverviewView onNavigate={vi.fn()} />);
    expect(screen.getAllByText("N/A")).toHaveLength(2);
    expect(screen.getByText("Calm Smog Haze")).toBeInTheDocument();
    expect(screen.getByText("Wind: Calm")).toBeInTheDocument();
    expect(screen.getByText("HIGH")).toBeInTheDocument();
    expect(screen.getByText("Score: 75/100")).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.tagName === "P" && Boolean(element.textContent?.includes("(Active)")))).toBeInTheDocument();
    expect(screen.getByText("Protected")).toBeInTheDocument();
    state.aqi.location = { name: "Delhi", state: "NCT" };
  });
});
