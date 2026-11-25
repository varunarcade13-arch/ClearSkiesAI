import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LiveAQIView } from "./LiveAQIView";

const state = vi.hoisted(() => ({ location: { name: "Delhi", state: "NCT", country: "India" }, standard: "INDIAN_NAQI", data: null as any, weather: null as any, forecast: null as any, isLoading: false, error: null as string | null, refreshAQI: vi.fn() }));
vi.mock("@/presentation/context/LocationContext", () => ({ useLocation: () => ({ location: state.location, standard: state.standard }) }));
vi.mock("@/presentation/context/AQIContext", () => ({ useAQI: () => state }));
const aqidata = { aqi: 400, category: "Severe", standard: "INDIAN_NAQI", dominantPollutant: "PM2.5", pollutants: { pm25: { code: "pm25", name: "PM2.5", value: 150, unit: "µg/m³", standardLimit: 60 }, pm10: { code: "pm10", name: "PM10", value: 40, unit: "µg/m³" } }, source: "Test", sourceType: "STATION_OBSERVATION", attribution: "CPCB", timestamp: "2025-01-01T12:00:00Z", isStale: false, healthAdvisory: { general: "Stay indoors", sensitiveGroups: "Protect sensitive groups", actionableAdvice: ["Wear a mask"] } };

beforeEach(() => { state.data = null; state.weather = null; state.forecast = null; state.isLoading = false; state.error = null; state.refreshAQI.mockClear(); });

describe("LiveAQIView", () => {
  it("renders loading, error retry, and empty states", () => {
    state.isLoading = true;
    const { rerender } = render(<LiveAQIView />);
    expect(screen.getByRole("status")).toHaveTextContent("Fetching live air quality observations for Delhi");
    state.isLoading = false; state.error = "Offline";
    rerender(<LiveAQIView />);
    fireEvent.click(screen.getByRole("button", { name: "Try Again" }));
    expect(state.refreshAQI).toHaveBeenCalledOnce();
    state.error = null;
    const { container } = render(<LiveAQIView />);
    expect(container.firstChild).toBeNull();
  });

  it("renders measured pollution, weather, inversion and forecast details", () => {
    state.data = aqidata;
    state.weather = { temperature: 10, apparentTemperature: 8, relativeHumidity: 80, windSpeed: 2, windDirection: 90, surfacePressure: 1012, condition: "Haze", inversionRisk: { level: "CRITICAL", score: 95, description: "Stagnant air", isStagnant: true } };
    const point = { timestamp: "2025-01-01T12:00:00Z", aqi: 350, category: "Severe", pm25: 150 };
    state.forecast = { historical24h: [point], forecast72h: [point] };
    render(<LiveAQIView />);
    expect(screen.getByText("Official Station Observation")).toBeInTheDocument();
    expect(screen.getByText("Stay indoors")).toBeInTheDocument();
    expect(screen.getByText("Stagnant air")).toBeInTheDocument();
    expect(screen.getByText("PM2.5")).toBeInTheDocument();
    expect(screen.getAllByText("Past 24-Hour Air Quality Trend").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Next 72-Hour Smog & Pollution Forecast").length).toBeGreaterThan(0);
  });

  it("renders alternate AQI standard, demo source, missing station and lower inversion risk", () => {
    state.standard = "US_AQI";
    state.location = { name: "Global City", state: "", country: "" };
    state.data = { ...aqidata, sourceType: "DEMO_SAMPLE", station: undefined, pollutants: {} };
    state.weather = { temperature: 18, apparentTemperature: 18, relativeHumidity: 65, windSpeed: 5, windDirection: 0, surfacePressure: 1013, condition: "Haze", inversionRisk: { level: "MODERATE", score: 40, description: "Mixing air", isStagnant: false } };
    render(<LiveAQIView />);
    expect(screen.getByText("DEMO SAMPLE")).toBeInTheDocument();
    expect(screen.getByText("US EPA Standard AQI")).toBeInTheDocument();
    expect(screen.getByText("Copernicus Atmospheric Transport Grid")).toBeInTheDocument();
    expect(screen.getByText("Active Mixing")).toBeInTheDocument();
    state.standard = "INDIAN_NAQI";
    state.location = { name: "Delhi", state: "NCT", country: "India" };
  });

  it("renders model estimates and high inversion risk", () => {
    state.data = { ...aqidata, sourceType: "MODEL_ESTIMATE", station: undefined };
    state.weather = { temperature: 18, apparentTemperature: 18, relativeHumidity: 65, windSpeed: 5, windDirection: 0, surfacePressure: 1013, condition: "Haze", inversionRisk: { level: "HIGH", score: 70, description: "Limited mixing", isStagnant: true } };
    render(<LiveAQIView />);
    expect(screen.getByText("Atmospheric Model Estimate")).toBeInTheDocument();
    expect(screen.getByText("HIGH RISK")).toBeInTheDocument();
  });
});
