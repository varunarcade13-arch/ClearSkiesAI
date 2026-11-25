import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider, useTheme } from "./ThemeProvider";

const wrapper = ({ children }: { children: React.ReactNode }) => <ThemeProvider>{children}</ThemeProvider>;

describe("ThemeProvider", () => {
  it("loads valid preferences, applies system changes and toggles both ways", async () => {
    localStorage.clear();
    localStorage.setItem("clearskies-theme", "system");
    let changeListener: (() => void) | undefined;
    const removeListener = vi.fn();
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: (_event: string, listener: () => void) => { changeListener = listener; },
      removeEventListener: removeListener,
    }));
    const { result, unmount } = renderHook(() => useTheme(), { wrapper });
    await waitFor(() => expect(result.current.theme).toBe("system"));
    expect(result.current.resolvedTheme).toBe("light");
    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe("dark");
    await waitFor(() => expect(result.current.resolvedTheme).toBe("dark"));
    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe("light");
    act(() => result.current.setTheme("system"));
    await waitFor(() => expect(changeListener).toBeDefined());
    act(() => changeListener?.());
    unmount();
    expect(removeListener).toHaveBeenCalled();
    expect(localStorage.getItem("clearskies-theme")).toBe("system");
  });

  it("ignores invalid saved preferences and follows dark system preference", async () => {
    localStorage.setItem("clearskies-theme", "invalid");
    vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    const { result } = renderHook(() => useTheme(), { wrapper });
    await waitFor(() => expect(result.current.resolvedTheme).toBe("dark"));
    expect(result.current.theme).toBe("system");
  });

  it("ignores operating-system updates for an explicit theme and guards the hook", async () => {
    localStorage.setItem("clearskies-theme", "dark");
    let listener: (() => void) | undefined;
    vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: (_: string, cb: () => void) => { listener = cb; }, removeEventListener: vi.fn() }));
    const { result } = renderHook(() => useTheme(), { wrapper });
    await waitFor(() => expect(result.current.theme).toBe("dark"));
    act(() => listener?.());
    expect(result.current.resolvedTheme).toBe("dark");
    expect(() => renderHook(() => useTheme())).toThrow("useTheme must be used within a ThemeProvider");
  });
});
