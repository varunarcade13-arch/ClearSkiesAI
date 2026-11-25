import { NextRequest, NextResponse } from "next/server";
import { container } from "@/application/container";
import { FamilyProfileSchema } from "@/domain/family/types";
import { checkRateLimit, readJsonBody, safeServerError } from "../_utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const limited = checkRateLimit(req, "plan", 16 * 1024);
    if (limited) return limited;
    const body = await readJsonBody(req, 16 * 1024) as { profile?: unknown };
    const profile = body && typeof body === "object" ? body.profile : undefined;
    if (!profile) {
      return NextResponse.json(
        { error: "Invalid payload: 'profile' object is required." },
        { status: 400 }
      );
    }

    const validatedProfile = FamilyProfileSchema.safeParse(profile);
    if (!validatedProfile.success) {
      return NextResponse.json({ error: "Family profile contains invalid or incomplete fields." }, { status: 400 });
    }

    const plan = await container.generatePlanUseCase.execute(validatedProfile.data);
    return NextResponse.json(plan);
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    if (error instanceof RangeError) return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
    return safeServerError();
  }
}
