import { NextRequest, NextResponse } from "next/server";
import { container } from "@/application/container";
import { checkRateLimit, getCoordinates, safeServerError } from "../_utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const limited = checkRateLimit(req, "recommendations");
    if (limited) return limited;
    const { searchParams } = new URL(req.url);
    const coordinates = getCoordinates(searchParams);
    if (!coordinates.success) return NextResponse.json({ error: "Invalid location coordinates." }, { status: 400 });

    const recommendations = await container.getRecommendationsUseCase.execute(
      coordinates.data.latitude,
      coordinates.data.longitude
    );

    return NextResponse.json(recommendations);
  } catch (error) {
    return safeServerError();
  }
}
