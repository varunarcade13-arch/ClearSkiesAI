import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { container } from "@/application/container";
import { AQIStandard } from "@/domain/aqi/types";

const coordinateSchema = z.object({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
});

export function getCoordinates(params: URLSearchParams) {
  const lat = params.get("lat");
  const lng = params.get("lng");
  if (lat === null && lng === null) {
    return { success: true as const, data: { latitude: 28.6139, longitude: 77.209 } };
  }
  if (lat === null || lng === null || !/^-?\d+(?:\.\d+)?$/.test(lat) || !/^-?\d+(?:\.\d+)?$/.test(lng)) {
    return { success: false as const };
  }
  const result = coordinateSchema.safeParse({ latitude: Number(lat), longitude: Number(lng) });
  return result.success ? { success: true as const, data: result.data } : { success: false as const };
}

export function getAQIStandard(value: string | null): AQIStandard | undefined {
  if (value === null || value === "INDIAN_NAQI") return "INDIAN_NAQI";
  if (value === "US_AQI") return value;
  return undefined;
}

export function checkRateLimit(req: NextRequest, bucket: string, maxBytes?: number) {
  // The edge proxy must overwrite this header; do not forward a user-supplied value.
  const clientId = req.headers.get("x-real-ip") || "anonymous-client";
  const result = container.rateLimiter.isAllowed(`${bucket}:${clientId}`);
  if (!result.allowed) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }
  if (maxBytes !== undefined) {
    const contentLength = Number(req.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
    }
  }
  return null;
}

export async function readJsonBody(req: NextRequest, maxBytes: number): Promise<unknown> {
  const reader = req.body?.getReader();
  if (!reader) throw new Error("Request body is required");
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new RangeError("Request body is too large");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

export function safeServerError() {
  return NextResponse.json({ error: "The request could not be completed. Please try again." }, { status: 502 });
}
