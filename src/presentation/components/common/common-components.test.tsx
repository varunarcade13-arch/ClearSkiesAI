import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AQIBadge, getAQIColorClasses } from "./AQIBadge";
import { Footer } from "./Footer";
import { SkipLink } from "./SkipLink";
import { TrendChart } from "../dashboard/TrendChart";

describe("shared display components", () => {
  it.each(["Good", "Satisfactory", "Moderate", "Poor", "Very Poor", "Severe"] as const)("maps %s AQI to an accessible badge", (category) => {
    const classes = getAQIColorClasses(category);
    expect(classes.bg).toBeTruthy();
    const { getByRole, rerender } = render(<AQIBadge category={category} aqi={42} />);
    expect(getByRole("status", { name: `Air Quality Index category: ${category}, index value: 42` })).toBeInTheDocument();
    rerender(<AQIBadge category={category} size="sm" />);
    expect(getByRole("status", { name: `Air Quality Index category: ${category}` })).toBeInTheDocument();
    rerender(<AQIBadge category={category} size="lg" className="custom" />);
    expect(getByRole("status").className).toContain("custom");
  });

  it("falls back to severe visual tokens for an unknown category", () => {
    expect(getAQIColorClasses("unknown" as never)).toEqual(getAQIColorClasses("Severe"));
  });

  it("renders the page skip link and footer content", () => {
    const { container } = render(<><SkipLink /><Footer /></>);
    expect(screen.getByRole("link", { name: "Skip to main content" })).toHaveAttribute("href", "#main-content");
    expect(container.querySelector("footer")).toHaveTextContent("ClearSkies AI");
  });

  it("provides an empty trend state and an accessible chart/table alternative", () => {
    const { rerender } = render(<TrendChart points={[]} title="AQI history" description="Summary" />);
    expect(screen.getByText(/No trend data currently available/i)).toBeInTheDocument();
    const points = [
      { timestamp: "2026-11-20T10:00:00.000Z", aqi: 80, pm25: 20, category: "Satisfactory" as const },
      { timestamp: "2026-11-20T11:00:00.000Z", aqi: 180, pm25: 60, pm10: 100, category: "Moderate" as const },
    ];
    rerender(<TrendChart points={points} title="AQI history" description="Hourly AQI summary" />);
    expect(screen.getByRole("img", { name: "AQI history" })).toHaveAccessibleDescription(/range from 80 to 180/);
    fireEvent.mouseEnter(screen.getAllByRole("img")[0].querySelectorAll("circle")[0]);
    fireEvent.click(screen.getByRole("button", { name: "Data Table View" }));
    expect(screen.getByRole("table", { name: "AQI history" })).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(4);
    fireEvent.click(screen.getByRole("button", { name: "Chart View" }));
    expect(screen.getByRole("img", { name: "AQI history" })).toBeInTheDocument();
    rerender(<TrendChart points={[{ ...points[0], pm10: 30 }, points[1]]} title="AQI history" description="Hourly AQI summary" />);
    fireEvent.click(screen.getByRole("button", { name: "Data Table View" }));
    expect(screen.getAllByRole("columnheader")).toHaveLength(5);
  });
});
