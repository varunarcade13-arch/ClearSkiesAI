import { NextRequest, NextResponse } from "next/server";
import { container } from "@/application/container";
import { checkRateLimit, getAQIStandard, getCoordinates, safeServerError } from "../_utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const limited = checkRateLimit(req, "aqi");
    if (limited) return limited;

    const { searchParams } = new URL(req.url);
    const standard = getAQIStandard(searchParams.get("standard"));
    const prevAqiStr = searchParams.get("prevAqi");

    // Default to Delhi coordinates if not specified
    const coordinates = getCoordinates(searchParams);
    const prevAqi = prevAqiStr === null ? undefined : Number(prevAqiStr);
    if (!coordinates.success || !standard || (prevAqi !== undefined && (!Number.isInteger(prevAqi) || prevAqi < 0 || prevAqi > 500))) {
      return NextResponse.json(
        { error: "Invalid AQI request parameters." },
        { status: 400 }
      );
    }

    const result = await container.getLiveAQIUseCase.execute(
      coordinates.data.latitude,
      coordinates.data.longitude,
      standard,
      prevAqi
    );

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    return safeServerError();
  }
}
