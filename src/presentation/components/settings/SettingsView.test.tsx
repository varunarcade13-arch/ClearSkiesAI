import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsView } from "./SettingsView";

const mocks = vi.hoisted(() => ({
  theme: "system" as string, setTheme: vi.fn(), standard: "INDIAN_NAQI" as string, setStandard: vi.fn(),
  notificationsEnabled: false, requestNotificationPermission: vi.fn(), resetProfile: vi.fn(),
}));
vi.mock("@/presentation/theme/ThemeProvider", () => ({ useTheme: () => ({ theme: mocks.theme, setTheme: mocks.setTheme }) }));
vi.mock("@/presentation/context/LocationContext", () => ({ useLocation: () => ({ standard: mocks.standard, setStandard: mocks.setStandard }) }));
vi.mock("@/presentation/context/AQIContext", () => ({ useAQI: () => ({ notificationsEnabled: mocks.notificationsEnabled, requestNotificationPermission: mocks.requestNotificationPermission }) }));
vi.mock("@/presentation/context/FamilyProfileContext", () => ({ useFamilyProfile: () => ({ resetProfile: mocks.resetProfile }) }));

describe("SettingsView", () => {
  afterEach(() => vi.useRealTimers());
  beforeEach(() => {
    mocks.theme = "system"; mocks.standard = "INDIAN_NAQI"; mocks.notificationsEnabled = false;
    mocks.setTheme.mockClear(); mocks.setStandard.mockClear(); mocks.requestNotificationPermission.mockClear(); mocks.resetProfile.mockClear();
    localStorage.clear();
  });

  it("updates themes, AQI standard, alerts, and clears local data", () => {
    vi.useFakeTimers();
    const { rerender } = render(<SettingsView />);
    for (const [theme, label] of [["light", "Light Theme"], ["dark", "Dark Theme"], ["system", "System Sync"]] as const) {
      mocks.theme = theme;
      rerender(<SettingsView />);
      expect(screen.getByRole("button", { name: new RegExp(label) })).toHaveAttribute("aria-pressed", "true");
      fireEvent.click(screen.getByRole("button", { name: new RegExp(label) }));
      expect(mocks.setTheme).toHaveBeenCalledWith(theme);
    }
    fireEvent.click(screen.getByRole("button", { name: /Indian National AQI/ }));
    expect(mocks.setStandard).toHaveBeenCalledWith("INDIAN_NAQI");
    fireEvent.click(screen.getByRole("button", { name: /United States EPA Standard AQI/ }));
    expect(mocks.setStandard).toHaveBeenCalledWith("US_AQI");
    fireEvent.click(screen.getByRole("button", { name: "Enable Alerts" }));
    expect(mocks.requestNotificationPermission).toHaveBeenCalled();
    localStorage.setItem("clearskies-location", "saved");
    fireEvent.click(screen.getByRole("button", { name: "Clear Stored Data" }));
    expect(mocks.resetProfile).toHaveBeenCalled();
    expect(localStorage.getItem("clearskies-location")).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("Stored data cleared.");
    expect(screen.getByRole("button", { name: "Cleared Successfully!" })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByRole("button", { name: "Clear Stored Data" })).toBeInTheDocument();
  });

  it("renders selected US and notifications enabled state", () => {
    mocks.standard = "US_AQI"; mocks.notificationsEnabled = true;
    render(<SettingsView />);
    expect(screen.getByRole("button", { name: "Alerts Enabled ✓" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /United States EPA Standard AQI/ })).toHaveAttribute("aria-pressed", "true");
  });
});
