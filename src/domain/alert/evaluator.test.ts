import { describe, it, expect } from "vitest";
import { evaluateAirQualityAlerts } from "./evaluator";

describe("Alert Evaluator", () => {
  it("triggers CRITICAL emergency alert when AQI >= 400", () => {
    const alerts = evaluateAirQualityAlerts(420, undefined, "Severe");
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe("CRITICAL");
    expect(alerts[0].title).toContain("EMERGENCY");
    expect(alerts[0].action).toContain("Strictly avoid all outdoor exposure");
  });

  it("triggers WARNING alert when AQI is between 300 and 399", () => {
    const alerts = evaluateAirQualityAlerts(340, undefined, "Very Poor");
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe("WARNING");
    expect(alerts[0].title).toContain("High Pollution Alert");
  });

  it("detects rapid deterioration when AQI spikes by >= 40 points", () => {
    // 250 increased to 310 (delta = +60). Triggers both Very Poor alert and Rapid Deterioration alert
    const alerts = evaluateAirQualityAlerts(310, 250, "Very Poor");
    expect(alerts.length).toBe(2);
    const rapidAlert = alerts.find((a) => a.title.includes("Rapid"));
    expect(rapidAlert).toBeDefined();
    expect(rapidAlert?.severity).toBe("WARNING");
  });

  it("detects significant improvement when AQI drops by >= 50 points", () => {
    // 220 dropped to 140 (delta = -80)
    const alerts = evaluateAirQualityAlerts(140, 220, "Moderate");
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe("SUCCESS");
    expect(alerts[0].title).toContain("Significant Air Quality Improvement");
  });

  it("returns no alerts for normal moderate conditions without rapid shifts", () => {
    const alerts = evaluateAirQualityAlerts(120, 115, "Moderate");
    expect(alerts.length).toBe(0);
  });
});
