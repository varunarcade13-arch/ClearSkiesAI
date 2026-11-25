import { NextRequest, NextResponse } from "next/server";
import { container } from "@/application/container";
import { checkRateLimit, safeServerError } from "../_utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const limited = checkRateLimit(req, "locations");
    if (limited) return limited;
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    if (query.length > 120) return NextResponse.json({ error: "Search query is too long." }, { status: 400 });
    if (!query.trim()) {
      return NextResponse.json([]);
    }

    const locations = await container.locationService.searchLocations(query);
    return NextResponse.json(locations);
  } catch (error) {
    return safeServerError();
  }
}
