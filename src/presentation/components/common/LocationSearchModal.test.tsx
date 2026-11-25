import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LocationSearchModal } from "./LocationSearchModal";

const mocks = vi.hoisted(() => ({ setLocation: vi.fn(), detectCurrentLocation: vi.fn(), isDetectingLocation: false, locationError: null as string | null }));
vi.mock("@/presentation/context/LocationContext", () => ({ useLocation: () => mocks }));
const location = { name: "Mumbai", locality: "Bandra", state: "Maharashtra", country: "India", latitude: 19.06, longitude: 72.83 };

describe("LocationSearchModal", () => {
  it("does not render while closed and selects a popular preset", () => {
    const onClose = vi.fn();
    const { rerender } = render(<LocationSearchModal isOpen={false} onClose={onClose} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    rerender(<LocationSearchModal isOpen onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /Delhi/ }));
    expect(mocks.setLocation).toHaveBeenCalledWith(expect.objectContaining({ name: "Delhi" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("searches, selects a result, supports Escape and detect success", async () => {
    const onClose = vi.fn();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [location] }));
    mocks.detectCurrentLocation.mockResolvedValue(true);
    render(<LocationSearchModal isOpen onClose={onClose} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Search city or area name" }), { target: { value: "Mum" } });
    expect(await screen.findByRole("button", { name: /Mumbai/ }, { timeout: 1500 })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Mumbai/ }));
    expect(mocks.setLocation).toHaveBeenCalledWith(location);
    expect(onClose).toHaveBeenCalledOnce();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole("button", { name: "Auto-Detect Current Location (GPS)" }));
    await waitFor(() => expect(mocks.detectCurrentLocation).toHaveBeenCalledOnce());
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("traps keyboard focus and restores focus when closed", () => {
    const onClose = vi.fn();
    const trigger = document.createElement("button");
    document.body.append(trigger);
    trigger.focus();
    const { rerender } = render(<LocationSearchModal isOpen onClose={onClose} />);
    const dialog = screen.getByRole("dialog");
    const controls = dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])');
    controls[0].focus();
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(controls[controls.length - 1]);
    fireEvent.keyDown(window, { key: "Tab" });
    expect(document.activeElement).toBe(controls[0]);
    controls[1].focus();
    fireEvent.keyDown(window, { key: "Tab" });
    expect(document.activeElement).toBe(controls[1]);
    rerender(<LocationSearchModal isOpen={false} onClose={onClose} />);
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it("does not trap Tab when closed", () => {
    render(<LocationSearchModal isOpen={false} onClose={vi.fn()} />);
    fireEvent.keyDown(window, { key: "Tab" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens without saving a non-HTML active element for focus restoration", () => {
    const graphic = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    graphic.setAttribute("tabindex", "-1");
    document.body.append(graphic);
    graphic.focus();
    const { unmount } = render(<LocationSearchModal isOpen onClose={vi.fn()} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    unmount();
    graphic.remove();
  });

  it("closes only when the modal backdrop is clicked", () => {
    const onClose = vi.fn();
    render(<LocationSearchModal isOpen onClose={onClose} />);
    const dialog = screen.getByRole("dialog");
    fireEvent.mouseDown(dialog.querySelector("div")!);
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.mouseDown(dialog);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("keeps the dialog open when geolocation fails and announces loading and errors", async () => {
    const onClose = vi.fn();
    mocks.isDetectingLocation = true;
    mocks.locationError = "Permission denied";
    const { rerender } = render(<LocationSearchModal isOpen onClose={onClose} />);
    expect(screen.getByRole("button", { name: "Detecting GPS Coordinates..." })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("Permission denied");
    mocks.isDetectingLocation = false;
    mocks.locationError = null;
    mocks.detectCurrentLocation.mockResolvedValueOnce(false);
    rerender(<LocationSearchModal isOpen onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Auto-Detect Current Location (GPS)" }));
    await waitFor(() => expect(mocks.detectCurrentLocation).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
  });

  it("handles unsuccessful search responses without rendering preset suggestions", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });
    vi.stubGlobal("fetch", fetchMock);
    render(<LocationSearchModal isOpen onClose={vi.fn()} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Search city or area name" }), { target: { value: "Unknown place" } });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce(), { timeout: 1500 });
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("0 locations found"), { timeout: 1500 });
    expect(screen.queryByText("Popular Smog-Monitored Cities")).not.toBeInTheDocument();
  });
});
