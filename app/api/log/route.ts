import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// Receives errors from the client-side ErrorBoundary and writes them to the daily log file.
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { source, message, stack } = (await req.json()) as {
      source?: string;
      message?: string;
      stack?: string;
    };
    logger.error(source ?? "client", message ?? "Unknown error", stack);
  } catch {
    logger.error("api/log", "Failed to parse incoming error payload");
  }
  return NextResponse.json({ ok: true });
}
