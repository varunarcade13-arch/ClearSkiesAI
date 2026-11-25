import { NextRequest, NextResponse } from "next/server";
import { container } from "@/application/container";
import { checkRateLimit, getAQIStandard, getCoordinates, safeServerError } from "../_utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const limited = checkRateLimit(req, "forecast");
    if (limited) return limited;
    const { searchParams } = new URL(req.url);
    const standard = getAQIStandard(searchParams.get("standard"));
    const coordinates = getCoordinates(searchParams);
    if (!coordinates.success || !standard) {
      return NextResponse.json(
        { error: "Invalid forecast request parameters." },
        { status: 400 }
      );
    }

    const forecast = await container.getForecastUseCase.execute(
      coordinates.data.latitude,
      coordinates.data.longitude,
      standard
    );

    return NextResponse.json(forecast, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
      },
    });
  } catch (error) {
    return safeServerError();
  }
}
