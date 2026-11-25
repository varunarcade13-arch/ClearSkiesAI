import { NextRequest, NextResponse } from "next/server";
import { container } from "@/application/container";
import { z } from "zod";
import { checkRateLimit, readJsonBody, safeServerError } from "../_utils";

const chatRequestSchema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(1200) })).min(1).max(20),
  context: z.object({ locationName: z.string().trim().min(1).max(120) }).passthrough().optional(),
});

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const limited = checkRateLimit(req, "chat", 32 * 1024);
    if (limited) return limited;
    const body = chatRequestSchema.safeParse(await readJsonBody(req, 32 * 1024));
    if (!body.success) return NextResponse.json({ error: "Invalid chat request." }, { status: 400 });

    const response = await container.executeChatUseCase.execute({
      messages: body.data.messages,
      context: body.data.context || { locationName: "Current Area" },
    });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    if (error instanceof RangeError) return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
    return safeServerError();
  }
}
