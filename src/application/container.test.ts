import { describe, expect, it } from "vitest";
import { container } from "./container";

describe("application service container", () => {
  it("constructs services once and returns the same singleton", () => {
    const ServiceContainer = container.constructor as unknown as { instance?: unknown; getInstance: () => unknown };
    ServiceContainer.instance = undefined;
    const created = ServiceContainer.getInstance();
    expect(created).toBeTruthy();
    expect(ServiceContainer.getInstance()).toBe(created);
    expect(container.getLiveAQIUseCase).toBeTruthy();
  });
});
