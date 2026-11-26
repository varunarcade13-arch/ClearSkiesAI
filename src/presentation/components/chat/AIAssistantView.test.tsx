import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AIAssistantView } from "./AIAssistantView";

const chatContext: { data: { aqi: number } | null; weather: { temperature: number } | null } = vi.hoisted(() => ({ data: { aqi: 210 }, weather: { temperature: 24 } }));
vi.mock("@/presentation/context/LocationContext", () => ({ useLocation: () => ({ location: { name: "Delhi" } }) }));
vi.mock("@/presentation/context/AQIContext", () => ({ useAQI: () => chatContext }));
vi.mock("@/presentation/context/FamilyProfileContext", () => ({ useFamilyProfile: () => ({ profile: { hasYoungChildren: true } }) }));

afterEach(() => vi.unstubAllGlobals());

describe("AIAssistantView", () => {
  beforeEach(() => { chatContext.data = { aqi: 210 }; chatContext.weather = { temperature: 24 }; });

  it("sends a typed message and renders structured AI guidance", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ answer: "Stay indoors.", actionableTips: ["Close windows"], scientificRationale: "Particles are elevated.", suggestedFollowUps: ["What about masks?"] }) });
    vi.stubGlobal("fetch", fetchMock);
    render(<AIAssistantView />);
    expect(screen.getByRole("log", { name: "Conversation with ClearSkies AI" })).toHaveAttribute("aria-busy", "false");
    fireEvent.change(screen.getByRole("textbox", { name: "Message for ClearSkies AI Assistant" }), { target: { value: "  Should I walk?  " } });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(await screen.findByText("Stay indoors.")).toBeInTheDocument();
    expect(screen.getByText("Close windows")).toBeInTheDocument();
    expect(screen.getByText("Particles are elevated.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/chat", expect.objectContaining({ method: "POST", body: expect.stringContaining("Should I walk?") }));
    fireEvent.click(screen.getByRole("button", { name: /What about masks/ }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it("ignores blank input, sends on Enter, and reports request failures", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);
    render(<AIAssistantView />);
    const input = screen.getByRole("textbox", { name: "Message for ClearSkies AI Assistant" });
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.submit(input.closest("form")!);
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: "Air quality?" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Enter", shiftKey: false });
    expect(await screen.findByText(/network issue communicating with the AI service/)).toBeInTheDocument();
  });

  it("sends a suggested prompt and reports non-success HTTP responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, statusText: "Rate limited" });
    vi.stubGlobal("fetch", fetchMock);
    render(<AIAssistantView />);
    fireEvent.click(screen.getByRole("button", { name: "Should I cancel my early morning walk?" }));
    expect(await screen.findByText(/network issue communicating with the AI service/)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("uses loading and unavailable labels for missing or zero AQI and weather", () => {
    chatContext.data = { aqi: 0 };
    chatContext.weather = null;
    render(<AIAssistantView />);
    expect(screen.getByText(/Current AQI: Loading/)).toBeInTheDocument();
    expect(screen.getByText(/AQI: N\/A.*Temp: N\/A/)).toBeInTheDocument();
  });

  it("renders location comparison cards when present in response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        answer: "Comparison summary: Mohali has cleaner air than Delhi.",
        actionableTips: ["Wear mask in Delhi"],
        scientificRationale: "Inversion traps particulates.",
        suggestedFollowUps: ["Check weather"],
        locationsCompared: [
          { name: "Mohali", aqi: 178, category: "Moderate", pm25: 82, source: "Open-Meteo" },
          { name: "Delhi", aqi: 368, category: "Very Poor", pm25: 195, source: "CPCB" },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<AIAssistantView />);
    fireEvent.change(screen.getByRole("textbox", { name: "Message for ClearSkies AI Assistant" }), { target: { value: "Compare Mohali and Delhi" } });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(await screen.findByText("Location Air Quality Comparison")).toBeInTheDocument();
    expect(screen.getByText("Mohali")).toBeInTheDocument();
    expect(screen.getByText("AQI 178")).toBeInTheDocument();
    expect(screen.getByText("Delhi")).toBeInTheDocument();
    expect(screen.getByText("AQI 368")).toBeInTheDocument();
  });
});
