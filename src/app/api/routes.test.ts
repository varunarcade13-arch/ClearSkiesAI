import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { getAQIStandard, getCoordinates, readJsonBody, safeServerError, checkRateLimit } from "./_utils";
import { container } from "@/application/container";
import { GET as getAqi } from "./aqi/route";
import { GET as getForecast } from "./forecast/route";
import { GET as getLocations } from "./locations/route";
import { GET as getReverse } from "./locations/reverse/route";
import { GET as getRecommendations } from "./recommendations/route";
import { POST as postChat } from "./chat/route";
import { POST as postPlan } from "./plan/route";

vi.mock("@/application/container", () => ({
  container: {
    rateLimiter: { isAllowed: vi.fn(() => ({ allowed: true, remaining: 5, resetMs: 1000 })), reset: vi.fn() },
    getLiveAQIUseCase: { execute: vi.fn(async (...args: unknown[]) => ({ args })) },
    getForecastUseCase: { execute: vi.fn(async (...args: unknown[]) => ({ args })) },
    locationService: { searchLocations: vi.fn(async (q: string) => [{ name: q }]) },
    reverseGeocodingService: { reverseGeocode: vi.fn(async (lat: number, lng: number) => ({ name: "City", latitude: lat, longitude: lng })) },
    getRecommendationsUseCase: { execute: vi.fn(async () => []) },
    executeChatUseCase: { execute: vi.fn(async () => ({ answer: "ok" })) },
    generatePlanUseCase: { execute: vi.fn(async () => ({ id: "plan" })) },
  },
}));

const request = (path: string, init?: ConstructorParameters<typeof NextRequest>[1]) => new NextRequest(`http://localhost${path}`, init);
const jsonRequest = (path: string, value: unknown, ip = "127.0.0.1") => request(path, {
  method: "POST", headers: { "content-type": "application/json", "x-real-ip": ip }, body: JSON.stringify(value),
});

describe("API utility validation", () => {
  it("validates coordinate pairs, defaults and AQI standards", () => {
    expect(getCoordinates(new URLSearchParams()).success).toBe(true);
    expect(getCoordinates(new URLSearchParams("lat=1")).success).toBe(false);
    expect(getCoordinates(new URLSearchParams("lat=1x&lng=0")).success).toBe(false);
    expect(getCoordinates(new URLSearchParams("lat=91&lng=0")).success).toBe(false);
    expect(getCoordinates(new URLSearchParams("lat=1.2&lng=-2.5"))).toEqual({ success: true, data: { latitude: 1.2, longitude: -2.5 } });
    expect(getAQIStandard(null)).toBe("INDIAN_NAQI");
    expect(getAQIStandard("INDIAN_NAQI")).toBe("INDIAN_NAQI");
    expect(getAQIStandard("US_AQI")).toBe("US_AQI");
    expect(getAQIStandard("nonsense")).toBeUndefined();
  });

  it("limits clients and reads bounded JSON bodies", async () => {
    expect(checkRateLimit(request("/", { headers: { "x-real-ip": "limit-client" } }), "test")).toBeNull();
    vi.mocked(container.rateLimiter.isAllowed).mockReturnValueOnce({ allowed: false, remaining: 0, resetMs: 100 });
    expect(checkRateLimit(request("/", { headers: { "x-real-ip": "limit-client" } }), "test")?.status).toBe(429);
    expect(checkRateLimit(request("/", { method: "POST", headers: { "content-length": "12" } }), "body", 5)?.status).toBe(413);
    await expect(readJsonBody(request("/"), 10)).rejects.toThrow("required");
    await expect(readJsonBody(jsonRequest("/", { a: 1 }), 2)).rejects.toThrow(RangeError);
    await expect(readJsonBody(jsonRequest("/", { a: 1 }), 100)).resolves.toEqual({ a: 1 });
    expect(safeServerError().status).toBe(502);
  });
});

describe("API route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(container.rateLimiter.isAllowed).mockReturnValue({ allowed: true, remaining: 5, resetMs: 1000 });
  });

  it("validates and handles AQI and forecast requests", async () => {
    expect((await getAqi(request("/api/aqi?lat=91&lng=0"))).status).toBe(400);
    expect((await getAqi(request("/api/aqi?standard=bad"))).status).toBe(400);
    expect((await getAqi(request("/api/aqi?prevAqi=501"))).status).toBe(400);
    const aqi = await getAqi(request("/api/aqi?lat=28&lng=77&prevAqi=100&standard=US_AQI"));
    expect(aqi.status).toBe(200);
    expect(container.getLiveAQIUseCase.execute).toHaveBeenCalledWith(28, 77, "US_AQI", 100);
    vi.mocked(container.getLiveAQIUseCase.execute).mockRejectedValueOnce(new Error("secret details"));
    expect((await getAqi(request("/api/aqi"))).status).toBe(502);
    vi.mocked(container.rateLimiter.isAllowed).mockReturnValueOnce({ allowed: false, remaining: 0, resetMs: 1 });
    expect((await getAqi(request("/api/aqi"))).status).toBe(429);
    expect((await getForecast(request("/api/forecast?lat=1"))).status).toBe(400);
    expect((await getForecast(request("/api/forecast?standard=unknown"))).status).toBe(400);
    expect((await getForecast(request("/api/forecast?lat=28&lng=77"))).status).toBe(200);
    vi.mocked(container.getForecastUseCase.execute).mockRejectedValueOnce(new Error("private"));
    expect((await getForecast(request("/api/forecast"))).status).toBe(502);
    vi.mocked(container.rateLimiter.isAllowed).mockReturnValueOnce({ allowed: false, remaining: 0, resetMs: 1 });
    expect((await getForecast(request("/api/forecast"))).status).toBe(429);
  });

  it("limits location lookup, handles reverse geocoding and recommendations", async () => {
    expect((await getLocations(request("/api/locations?q="))).status).toBe(200);
    expect((await getLocations(request("/api/locations"))).status).toBe(200);
    expect((await getLocations(request("/api/locations?q=%20%20"))).status).toBe(200);
    expect((await getLocations(request(`/api/locations?q=${"x".repeat(121)}`))).status).toBe(400);
    expect((await getLocations(request("/api/locations?q=Delhi"))).status).toBe(200);
    vi.mocked(container.locationService.searchLocations).mockRejectedValueOnce(new Error("private"));
    expect((await getLocations(request("/api/locations?q=Delhi"))).status).toBe(502);
    vi.mocked(container.rateLimiter.isAllowed).mockReturnValueOnce({ allowed: false, remaining: 0, resetMs: 1 });
    expect((await getLocations(request("/api/locations?q=Delhi"))).status).toBe(429);
    expect((await getReverse(request("/api/locations/reverse?lat=91&lng=1"))).status).toBe(400);
    expect((await getReverse(request("/api/locations/reverse?lat=28&lng=77"))).status).toBe(200);
    vi.mocked(container.reverseGeocodingService.reverseGeocode).mockRejectedValueOnce(new Error("private"));
    expect((await getReverse(request("/api/locations/reverse?lat=28&lng=77"))).status).toBe(503);
    vi.mocked(container.rateLimiter.isAllowed).mockReturnValueOnce({ allowed: false, remaining: 0, resetMs: 1 });
    expect((await getReverse(request("/api/locations/reverse?lat=28&lng=77"))).status).toBe(429);
    expect((await getRecommendations(request("/api/recommendations?lat=bad&lng=0"))).status).toBe(400);
    expect((await getRecommendations(request("/api/recommendations?lat=28&lng=77"))).status).toBe(200);
    vi.mocked(container.getRecommendationsUseCase.execute).mockRejectedValueOnce(new Error("private"));
    expect((await getRecommendations(request("/api/recommendations"))).status).toBe(502);
    vi.mocked(container.rateLimiter.isAllowed).mockReturnValueOnce({ allowed: false, remaining: 0, resetMs: 1 });
    expect((await getRecommendations(request("/api/recommendations"))).status).toBe(429);
  });

  it("validates chat and plan payloads, rate limits and hides provider errors", async () => {
    expect((await postChat(jsonRequest("/api/chat", { messages: [] }))).status).toBe(400);
    expect((await postChat(jsonRequest("/api/chat", { messages: [{ role: "system", content: "x" }] }))).status).toBe(400);
    expect((await postChat(jsonRequest("/api/chat", { messages: [{ role: "user", content: "hello" }] }))).status).toBe(200);
    expect((await postChat(jsonRequest("/api/chat", { messages: [{ role: "user", content: "hello" }], context: { locationName: "Pune" } }))).status).toBe(200);
    vi.mocked(container.executeChatUseCase.execute).mockRejectedValueOnce(new Error("secret"));
    expect((await postChat(jsonRequest("/api/chat", { messages: [{ role: "user", content: "hello" }] }))).status).toBe(502);
    const malformedChat = request("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: "{" });
    expect((await postChat(malformedChat)).status).toBe(400);
    const largeChat = request("/api/chat", { method: "POST", headers: { "content-type": "application/json", "content-length": "1" }, body: JSON.stringify({ messages: [{ role: "user", content: "x".repeat(33_000) }] }) });
    expect((await postChat(largeChat)).status).toBe(413);
    expect((await postPlan(jsonRequest("/api/plan", {}))).status).toBe(400);
    expect((await postPlan(jsonRequest("/api/plan", null))).status).toBe(400);
    expect((await postPlan(jsonRequest("/api/plan", { profile: { location: { name: "" } } }))).status).toBe(400);
    const profile = { location: { name: "Delhi", latitude: 28, longitude: 77 }, familySize: 2 };
    expect((await postPlan(jsonRequest("/api/plan", { profile }))).status).toBe(200);
    vi.mocked(container.generatePlanUseCase.execute).mockRejectedValueOnce(new Error("secret"));
    expect((await postPlan(jsonRequest("/api/plan", { profile }))).status).toBe(502);
    const malformedPlan = request("/api/plan", { method: "POST", headers: { "content-type": "application/json" }, body: "{" });
    expect((await postPlan(malformedPlan)).status).toBe(400);
    const largePlan = request("/api/plan", { method: "POST", headers: { "content-type": "application/json", "content-length": "1" }, body: JSON.stringify({ profile: { notes: "x".repeat(17_000) } }) });
    expect((await postPlan(largePlan)).status).toBe(413);
    vi.mocked(container.rateLimiter.isAllowed).mockReturnValueOnce({ allowed: false, remaining: 0, resetMs: 5 });
    expect((await postChat(jsonRequest("/api/chat", { messages: [{ role: "user", content: "x" }] }))).status).toBe(429);
    vi.mocked(container.rateLimiter.isAllowed).mockReturnValueOnce({ allowed: false, remaining: 0, resetMs: 5 });
    expect((await postPlan(jsonRequest("/api/plan", { profile }))).status).toBe(429);
  });
});
