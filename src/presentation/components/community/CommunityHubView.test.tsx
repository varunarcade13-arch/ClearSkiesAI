import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CommunityHubView } from "./CommunityHubView";

vi.mock("@/presentation/context/LocationContext", () => ({ useLocation: () => ({ location: { name: "Delhi" } }) }));
const context = vi.hoisted(() => ({ aqi: 350 }));
vi.mock("@/presentation/context/AQIContext", () => ({ useAQI: () => ({ data: { aqi: context.aqi } }) }));

describe("CommunityHubView", () => {
  afterEach(() => vi.useRealTimers());

  it("toggles challenge pledges and updates participation totals", () => {
    render(<CommunityHubView />);
    expect(screen.getByText("1", { selector: ".text-2xl" })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Take Pledge" })[0]);
    expect(screen.getAllByRole("button", { name: "Pledged ✓" }).at(-1)).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("2", { selector: ".text-2xl" })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Pledged ✓" })[0]);
    expect(screen.getByText("1", { selector: ".text-2xl" })).toBeInTheDocument();
  });

  it("copies a summary using live metrics and clears the copied status", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<CommunityHubView />);
    fireEvent.click(screen.getByRole("button", { name: "Copy Clean-Air Card" }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Current AQI: 350"));
    expect(screen.getByRole("button", { name: "Copied Action Summary!" })).toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(2500);
    expect(screen.getByRole("button", { name: "Copy Clean-Air Card" })).toBeInTheDocument();
  });

  it("uses the live label when AQI is zero", () => {
    context.aqi = 0;
    const writeText = vi.fn();
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<CommunityHubView />);
    fireEvent.click(screen.getByRole("button", { name: "Copy Clean-Air Card" }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Current AQI: Live"));
    context.aqi = 350;
  });
});
