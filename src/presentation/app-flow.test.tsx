import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";
import { ThemeProvider } from "@/presentation/theme/ThemeProvider";
import { LocationProvider } from "@/presentation/context/LocationContext";
import { FamilyProfileProvider } from "@/presentation/context/FamilyProfileContext";
import { AQIProvider } from "@/presentation/context/AQIContext";
import { CPCBReferenceProvider } from "@/infrastructure/aqi/CPCBReferenceProvider";

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, statusText: status === 200 ? "OK" : "Failed", json: async () => body };
}

describe("ClearSkies application navigation", () => {
  it("renders dashboard data and navigates through every primary view", async () => {
    localStorage.clear();
    const aqi = CPCBReferenceProvider.getSampleData("Delhi");
    const weather = {
      temperature: 16, apparentTemperature: 15, relativeHumidity: 70, windSpeed: 4,
      windDirection: 20, surfacePressure: 1010, weatherCode: 3, condition: "Cloudy",
      source: "test weather", timestamp: new Date().toISOString(),
      inversionRisk: { level: "MODERATE", explanation: "Mixing", recommendation: "Take care" },
    };
    const forecast = {
      current: aqi, historical24h: [], forecast72h: [], standard: "INDIAN_NAQI",
      source: "test forecast", sourceType: "MODEL_ESTIMATE", generatedAt: new Date().toISOString(),
    };
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith("/api/aqi")) return response({ aqi, weather, alerts: [] }) as Response;
      if (url.startsWith("/api/forecast")) return response(forecast) as Response;
      if (url.startsWith("/api/locations?")) return response([]) as Response;
      if (url.startsWith("/api/locations/reverse")) return response({ name: "Delhi", latitude: 28.6139, longitude: 77.209, country: "India" }) as Response;
      if (url.startsWith("/api/recommendations")) return response([]) as Response;
      return response({}) as Response;
    }));

    render(<ThemeProvider><LocationProvider><FamilyProfileProvider><AQIProvider><HomePage /></AQIProvider></FamilyProfileProvider></LocationProvider></ThemeProvider>);
    await screen.findByRole("heading", { name: /ClearSkies AI/i });
    await waitFor(() => expect(fetch).toHaveBeenCalled());

    for (const [label, selector, value] of [
      ["Live AQI", "text", /Monitoring Station:/i],
      ["AI Assistant", "log", "Conversation with ClearSkies AI"],
      ["My Family Plan", "heading", /Family Protection Architecture/i],
      ["Daily Recommendations", "heading", /Smart Daily Routines/i],
      ["Indoor Air Quality", "heading", /Indoor Air Quality Assistant/i],
      ["Sustainable Living", "heading", /Sustainable Alternatives/i],
      ["Community", "heading", /Community Action Hub/i],
      ["Settings", "heading", /Application Preferences & Settings/i],
      ["Overview", "button", /Live AQI/i],
    ] as const) {
      fireEvent.click(screen.getByRole("button", { name: label }));
      if (selector === "text") await screen.findAllByText(value as RegExp);
      else await screen.findByRole(selector as "heading" | "log" | "button", { name: value as string | RegExp });
    }
  });
});
