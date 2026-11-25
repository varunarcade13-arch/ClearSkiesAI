import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AlertBanner } from "./AlertBanner";

const alertState = vi.hoisted(() => ({ alerts: [] as Array<{ id: string; title: string; message: string; severity: string; action?: string }>, dismiss: vi.fn() }));
vi.mock("@/presentation/context/AQIContext", () => ({ useAQI: () => ({ alerts: alertState.alerts, dismissAlert: alertState.dismiss }) }));

describe("AlertBanner", () => {
  it("renders nothing for an empty alert list", () => {
    alertState.alerts = [];
    const { container } = render(<AlertBanner />);
    expect(container.firstChild).toBeNull();
  });

  it.each(["CRITICAL", "WARNING", "SUCCESS", "INFO"])("renders and dismisses %s messages with optional actions", (severity) => {
    alertState.alerts = [{ id: severity, title: `${severity} alert`, message: "Air changed", severity, ...(severity === "CRITICAL" ? { action: "Stay indoors" } : {}) }];
    render(<AlertBanner />);
    expect(screen.getByRole("alert")).toHaveTextContent(`${severity} alert`);
    if (severity === "CRITICAL") expect(screen.getByText("Action: Stay indoors")).toBeInTheDocument();
    else expect(screen.queryByText(/Action:/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: `Dismiss alert: ${severity} alert` }));
    expect(alertState.dismiss).toHaveBeenCalledWith(severity);
  });
});
