import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SustainableLivingView } from "./SustainableLivingView";

const mock = vi.hoisted(() => ({ data: { aqi: 0 } as { aqi: number } | null }));
vi.mock("@/presentation/context/AQIContext", () => ({ useAQI: () => ({ data: mock.data }) }));

describe("SustainableLivingView", () => {
  it("calculates commute results and updates both distance and weekly commute sliders", () => {
    const { rerender } = render(<SustainableLivingView />);
    expect(screen.getByText("Round-Trip: 28 km/day")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/One-Way Travel Distance/), { target: { value: "30" } });
    fireEvent.change(screen.getByLabelText(/Work Commute Days per Week/), { target: { value: "2" } });
    expect(screen.getByText("Round-Trip: 60 km/day")).toBeInTheDocument();
    expect(screen.getByLabelText(/Work Commute Days per Week/)).toHaveValue("2");
    mock.data = null;
    rerender(<SustainableLivingView />);
    expect(screen.getByRole("table", { name: "Transport Mode Comparison" })).toBeInTheDocument();
  });
});
