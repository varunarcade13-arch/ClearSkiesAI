import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Header } from "./Header";

const mocks = vi.hoisted(() => ({ setStandard: vi.fn(), refreshAQI: vi.fn(), requestNotificationPermission: vi.fn(), setTheme: vi.fn(), theme: "system" as string, resolvedTheme: "light" as string, standard: "INDIAN_NAQI" as string, location: { name: "Delhi", state: "NCT", country: "India" } as { name: string; state?: string; country?: string }, data: null as { aqi: number; category: string; station?: { name: string } } | null, notificationsEnabled: false }));
vi.mock("@/presentation/context/LocationContext", () => ({ useLocation: () => ({ location: mocks.location, standard: mocks.standard, setStandard: mocks.setStandard }) }));
vi.mock("@/presentation/context/AQIContext", () => ({ useAQI: () => ({ data: mocks.data, isLoading: false, refreshAQI: mocks.refreshAQI, notificationsEnabled: mocks.notificationsEnabled, requestNotificationPermission: mocks.requestNotificationPermission }) }));
vi.mock("@/presentation/theme/ThemeProvider", () => ({ useTheme: () => ({ theme: mocks.theme, resolvedTheme: mocks.resolvedTheme, setTheme: mocks.setTheme }) }));
vi.mock("./LocationSearchModal", () => ({ LocationSearchModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => isOpen ? <div role="dialog"><button onClick={onClose}>Close finder</button></div> : null }));

describe("Header", () => {
  beforeEach(() => {
    mocks.standard = "INDIAN_NAQI";
    mocks.location = { name: "Delhi", state: "NCT", country: "India" };
    mocks.data = { aqi: 250, category: "Poor", station: { name: "Central station" } };
    mocks.notificationsEnabled = false;
    mocks.theme = "system";
    mocks.resolvedTheme = "light";
  });
  it("exposes location context, opens location search and runs global controls", () => {
    const onTabChange = vi.fn();
    render(<Header activeTab="overview" onTabChange={onTabChange} />);
    expect(screen.getByRole("group", { name: "Location and air quality context" })).toHaveTextContent("AQI shown for: Delhi, NCT");
    expect(screen.getByText("Central station")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Current location: Delhi/ }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close finder" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "NAQI (IN)" }));
    fireEvent.click(screen.getByRole("button", { name: "US AQI" }));
    fireEvent.click(screen.getByRole("button", { name: "Refresh air quality data" }));
    fireEvent.click(screen.getByRole("button", { name: "Toggle smog alert notifications" }));
    fireEvent.click(screen.getByRole("button", { name: /Current theme is system/ }));
    fireEvent.click(screen.getByRole("button", { name: "ClearSkies AI" }));
    expect(mocks.refreshAQI).toHaveBeenCalledOnce();
    expect(onTabChange).toHaveBeenCalledWith("overview");
    expect(mocks.requestNotificationPermission).toHaveBeenCalledOnce();
    expect(mocks.setTheme).toHaveBeenCalledWith("dark");
  });

  it("changes desktop tabs and closes mobile menu after selection", () => {
    const onTabChange = vi.fn();
    render(<Header activeTab="overview" onTabChange={onTabChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Live AQI" }));
    expect(onTabChange).toHaveBeenCalledWith("live-aqi");
    fireEvent.click(screen.getByRole("button", { name: "Open navigation menu" }));
    expect(screen.getByRole("navigation", { name: "Mobile Navigation" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("navigation", { name: "Mobile Navigation" }).querySelector("button[aria-pressed='true']")!);
    expect(mocks.setStandard).toHaveBeenCalledWith("INDIAN_NAQI");
    fireEvent.click(screen.getByRole("navigation", { name: "Mobile Navigation" }).querySelector("button[aria-pressed='false']")!);
    expect(mocks.setStandard).toHaveBeenCalledWith("US_AQI");
    fireEvent.click(screen.getByRole("navigation", { name: "Mobile Navigation" }).querySelector("button[aria-current='page']")!);
    expect(screen.queryByRole("navigation", { name: "Mobile Navigation" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open navigation menu" }));
    fireEvent.click(screen.getByRole("button", { name: "Close navigation menu" }));
    expect(screen.queryByRole("navigation", { name: "Mobile Navigation" })).not.toBeInTheDocument();
  });

  it.each([["system", "light", "dark"], ["dark", "dark", "light"], ["light", "light", "system"]])("cycles %s theme to %s", (theme, resolvedTheme, next) => {
    mocks.theme = theme;
    mocks.resolvedTheme = resolvedTheme;
    render(<Header activeTab="overview" onTabChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`Current theme is ${theme}`) }));
    expect(mocks.setTheme).toHaveBeenLastCalledWith(next);
  });

  it("renders alternate location, AQI standard, notification and theme states", () => {
    mocks.standard = "US_AQI";
    mocks.location = { name: "Pune", country: "India" };
    mocks.data = null;
    mocks.notificationsEnabled = true;
    mocks.theme = "dark";
    mocks.resolvedTheme = "dark";
    const { rerender } = render(<Header activeTab="settings" onTabChange={vi.fn()} />);
    expect(screen.getByText("Current location:", { exact: false })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "US AQI" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Toggle smog alert notifications" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Current theme is dark/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open navigation menu" }));
    expect(screen.getByRole("navigation", { name: "Mobile Navigation" }).querySelector("button[aria-pressed='true']")).toHaveTextContent("US AQI");
    mocks.theme = "light";
    mocks.resolvedTheme = "light";
    rerender(<Header activeTab="settings" onTabChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Current theme is light/ })).toBeInTheDocument();
  });

  it("renders location context without state or country", () => {
    mocks.location = { name: "Somewhere" };
    render(<Header activeTab="overview" onTabChange={vi.fn()} />);
    expect(screen.getByRole("group", { name: "Location and air quality context" })).toHaveTextContent("Current location: Somewhere");
    expect(screen.getByRole("group", { name: "Location and air quality context" })).not.toHaveTextContent(", ");
  });
});
