import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/presentation/components/common/Header", () => ({
  Header: ({ onTabChange }: { onTabChange: (tab: string) => void }) => React.createElement("button", { onClick: () => onTabChange("unknown") }, "Unknown tab"),
}));
vi.mock("@/presentation/components/dashboard/OverviewView", () => ({
  OverviewView: ({ onNavigate }: { onNavigate: (tab: string) => void }) => React.createElement(React.Fragment, null,
    React.createElement("h2", null, "Fallback overview"),
    React.createElement("button", { onClick: () => onNavigate("overview") }, "Overview navigate")),
}));
vi.mock("@/presentation/components/alerts/AlertBanner", () => ({
  AlertBanner: () => React.createElement("div", null, "Alerts"),
}));

import HomePage from "./page";

describe("home page route selection", () => {
  it("falls back to overview for an unrecognized tab value", () => {
    render(<HomePage />);
    fireEvent.click(screen.getByRole("button", { name: "Unknown tab" }));
    expect(screen.getByRole("heading", { name: "Fallback overview" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Overview navigate" }));
    expect(screen.getByRole("heading", { name: "ClearSkies AI: overview" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Overview navigate" }));
    expect(screen.getByRole("heading", { name: "ClearSkies AI: overview" })).toBeInTheDocument();
  });
});
