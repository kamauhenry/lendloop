import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rateLimit";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

type ClerkUserEvent = {
  type: string;
  data: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email_addresses: Array<{ email_address: string; id: string }>;
    primary_email_address_id: string;
  };
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(`clerk:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "CLERK_WEBHOOK_SECRET not set" }, { status: 500 });
  }

  const svixId = req.headers.get("svix-id") ?? "";
  const svixTimestamp = req.headers.get("svix-timestamp") ?? "";
  const svixSignature = req.headers.get("svix-signature") ?? "";

  const body = await req.text();

  const wh = new Webhook(webhookSecret);
  let event: ClerkUserEvent;
  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkUserEvent;
  } catch {
    logger.warn("webhooks/clerk", "Invalid webhook signature");
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  if (event.type !== "user.created" && event.type !== "user.updated") {
    return NextResponse.json({ ok: true });
  }

  const { id, first_name, last_name, email_addresses, primary_email_address_id } = event.data;
  const primaryEmail = email_addresses.find((e) => e.id === primary_email_address_id);

  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  logger.info("webhooks/clerk", `syncing user ${event.type}: ${id}`);
  await convex.mutation(api.users.upsertUser, {
    clerkId: id,
    name: [first_name, last_name].filter(Boolean).join(" ") || "Unknown",
    email: primaryEmail?.email_address ?? "",
    webhookSecret: webhookSecret,
  });

  return NextResponse.json({ ok: true });
}
