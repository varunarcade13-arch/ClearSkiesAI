import { NextRequest, NextResponse } from "next/server";
import { container } from "@/application/container";
import { checkRateLimit } from "../../_utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const latitude = Number(searchParams.get("lat"));
  const longitude = Number(searchParams.get("lng"));

  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return NextResponse.json({ error: "Valid latitude and longitude are required." }, { status: 400 });
  }

  try {
    const limited = checkRateLimit(request, "reverse-location");
    if (limited) return limited;
    const location = await container.reverseGeocodingService.reverseGeocode(latitude, longitude);
    return NextResponse.json(location);
  } catch {
    return NextResponse.json(
      { error: "Could not resolve a nearby place name. Coordinates will be shown instead." },
      { status: 503 }
    );
  }
}
