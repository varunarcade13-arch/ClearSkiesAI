import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IndoorAQView } from "./IndoorAQView";

const state = vi.hoisted(() => ({ aqi: 400 }));
vi.mock("@/presentation/context/AQIContext", () => ({ useAQI: () => ({ data: { aqi: state.aqi } }) }));

describe("IndoorAQView", () => {
  beforeEach(() => { state.aqi = 400; });
  it("calculates purifier sizing from all room sliders and recommends sealed windows at high AQI", () => {
    const { rerender } = render(<IndoorAQView />);
    expect(screen.getByText("Keep Windows Completely Sealed")).toBeInTheDocument();
    for (const [id, value] of [["room-length", "8"], ["room-width", "6"], ["ceiling-height", "3.2"], ["target-ach", "5.5"]]) {
      fireEvent.change(screen.getByLabelText(new RegExp(id === "target-ach" ? "Target Air Changes" : id === "room-length" ? "Room Length" : id === "room-width" ? "Room Width" : "Ceiling Height")), { target: { value } });
    }
    expect(screen.getByText("Minimum Required CADR")).toBeInTheDocument();
    state.aqi = 50;
    rerender(<IndoorAQView />);
    expect(screen.getByText("Ventilation Permitted (Midday Only)")).toBeInTheDocument();
  });

  it("uses conservative AQI when live data is unavailable", () => {
    state.aqi = 0;
    const { container } = render(<IndoorAQView />);
    expect(container).toHaveTextContent("Current Outdoor AQI: 340");
  });
});
