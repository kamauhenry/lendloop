import { NextRequest, NextResponse } from "next/server";
import { verify } from "@/lib/hmac";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const signature = req.headers.get("x-webhook-signature") ?? "";
  const secret = process.env.CONVEX_WEBHOOK_SECRET;

  if (!secret) {
    logger.error("webhooks/n8n", "CONVEX_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const body = await req.text();

  const valid = await verify(body, signature, secret);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body) as Record<string, unknown>;
  logger.info("webhooks/n8n", `received event: ${event.event ?? "unknown"}`);

  // Extend here to act on events — e.g. trigger push notifications, update UI state, etc.

  return NextResponse.json({ ok: true });
}
