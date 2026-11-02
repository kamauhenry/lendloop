import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

const http = httpRouter();

// GET /api/overdue — called by n8n daily cron
// Protected by Bearer token
http.route({
  path: "/api/overdue",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = process.env.N8N_OVERDUE_TOKEN;

    if (!token || authHeader !== `Bearer ${token}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const loans = await ctx.runQuery(internal.loans._getOverdue, {});
    return new Response(JSON.stringify(loans), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// PATCH /api/loans/:id/reminder — called by n8n after sending reminder
http.route({
  path: "/api/reminder",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = process.env.N8N_OVERDUE_TOKEN;

    if (!token || authHeader !== `Bearer ${token}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as { loanId: string };
    if (!body.loanId) {
      return new Response(JSON.stringify({ error: "loanId required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ponytail: loanId cast — Convex IDs are opaque strings; HTTP boundary delivers plain string
    await ctx.runMutation(internal.loans.markReminderSent, {
      loanId: body.loanId as Id<"loans">,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
