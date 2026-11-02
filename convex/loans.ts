import { ConvexError, v } from "convex/values";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireAdmin, requireAuth } from "./_helpers";

// Set of toolIds where the current user has a pending/approved loan — used to disable Request buttons
export const myActiveToolIds = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    const active = await ctx.db
      .query("loans")
      .withIndex("by_borrowerId", (q) => q.eq("borrowerId", user._id))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "approved"),
        ),
      )
      .collect();
    return active.map((l) => l.toolId);
  },
});

// Returns the active (pending/approved) loan for a given tool by the current user, or null
export const myActiveRequest = query({
  args: { toolId: v.id("tools") },
  handler: async (ctx, { toolId }) => {
    const user = await requireAuth(ctx);
    return await ctx.db
      .query("loans")
      .withIndex("by_borrowerId", (q) => q.eq("borrowerId", user._id))
      .filter((q) =>
        q.and(
          q.eq(q.field("toolId"), toolId),
          q.or(
            q.eq(q.field("status"), "pending"),
            q.eq(q.field("status"), "approved"),
          ),
        ),
      )
      .first();
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    const loans = await ctx.db
      .query("loans")
      .withIndex("by_borrowerId", (q) => q.eq("borrowerId", user._id))
      .collect();

    // Attach tool name for display
    return await Promise.all(
      loans.map(async (loan) => {
        const tool = await ctx.db.get(loan.toolId);
        return { ...loan, toolName: tool?.name ?? "Unknown" };
      }),
    );
  },
});

export const listIncoming = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    const loans = await ctx.db
      .query("loans")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", user._id))
      .collect();

    return await Promise.all(
      loans.map(async (loan) => {
        const tool = await ctx.db.get(loan.toolId);
        const borrower = await ctx.db.get(loan.borrowerId);
        return {
          ...loan,
          toolName: tool?.name ?? "Unknown",
          borrowerName: borrower?.name ?? "Unknown",
          borrowerEmail: borrower?.email ?? "",
        };
      }),
    );
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const loans = await ctx.db.query("loans").collect();
    return await Promise.all(
      loans.map(async (loan) => {
        const tool = await ctx.db.get(loan.toolId);
        const borrower = await ctx.db.get(loan.borrowerId);
        const owner = await ctx.db.get(loan.ownerId);
        return {
          ...loan,
          toolName: tool?.name ?? "Unknown",
          borrowerName: borrower?.name ?? "Unknown",
          ownerName: owner?.name ?? "Unknown",
        };
      }),
    );
  },
});

export const create = mutation({
  args: {
    toolId: v.id("tools"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, { toolId, startDate, endDate }) => {
    const user = await requireAuth(ctx);
    const tool = await ctx.db.get(toolId);
    if (!tool) throw new ConvexError("Tool not found");
    if (!tool.available) throw new ConvexError("Tool is not available");
    if (tool.ownerId === user._id) throw new ConvexError("Cannot borrow your own tool");

    // Prevent duplicate active requests for the same tool by the same borrower
    const existing = await ctx.db
      .query("loans")
      .withIndex("by_borrowerId", (q) => q.eq("borrowerId", user._id))
      .filter((q) =>
        q.and(
          q.eq(q.field("toolId"), toolId),
          q.or(
            q.eq(q.field("status"), "pending"),
            q.eq(q.field("status"), "approved"),
          ),
        ),
      )
      .first();
    if (existing) throw new ConvexError("You already have an active request for this tool");

    const loanId = await ctx.db.insert("loans", {
      toolId,
      borrowerId: user._id,
      ownerId: tool.ownerId,
      startDate,
      endDate,
      status: "pending",
    });

    // Schedule n8n notification (best-effort, doesn't block the mutation)
    await ctx.scheduler.runAfter(0, internal.loans._notifyN8n, { loanId, event: "pending" });

    return loanId;
  },
});

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["approved", "declined"],
  approved: ["returned"],
  declined: [],
  returned: [],
  overdue: ["returned"],
};

export const updateStatus = mutation({
  args: {
    loanId: v.id("loans"),
    status: v.union(
      v.literal("approved"),
      v.literal("declined"),
      v.literal("returned"),
    ),
  },
  handler: async (ctx, { loanId, status }) => {
    const user = await requireAuth(ctx);
    const loan = await ctx.db.get(loanId);
    if (!loan) throw new ConvexError("Loan not found");

    const allowed = VALID_TRANSITIONS[loan.status] ?? [];
    if (!allowed.includes(status)) {
      throw new ConvexError(`Cannot transition from ${loan.status} to ${status}`);
    }

    // Approve/decline: owner only. Returned: owner OR borrower (either side can confirm handback).
    const isOwner = loan.ownerId === user._id;
    const isBorrower = loan.borrowerId === user._id;
    if (status === "returned") {
      if (!isOwner && !isBorrower) throw new ConvexError("Not your loan");
    } else {
      if (!isOwner) throw new ConvexError("Not your loan to manage");
    }

    await ctx.db.patch(loanId, { status });

    // Update tool availability when approved or returned
    if (status === "approved") {
      await ctx.db.patch(loan.toolId, { available: false });
    }
    if (status === "returned") {
      await ctx.db.patch(loan.toolId, { available: true });
    }

    await ctx.scheduler.runAfter(0, internal.loans._notifyN8n, { loanId, event: status });
  },
});

// Internal: called by scheduler to fire n8n webhook
export const _notifyN8n = internalMutation({
  args: { loanId: v.id("loans"), event: v.string() },
  handler: async (ctx, { loanId, event }) => {
    const loan = await ctx.db.get(loanId);
    if (!loan) return;

    const tool = await ctx.db.get(loan.toolId);
    const borrower = await ctx.db.get(loan.borrowerId);
    const owner = await ctx.db.get(loan.ownerId);

    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    const secret = process.env.CONVEX_WEBHOOK_SECRET;
    if (!webhookUrl || !secret) return; // silently skip if not configured

    const payload = JSON.stringify({
      event,
      loanId,
      toolName: tool?.name,
      borrowerEmail: borrower?.email,
      borrowerName: borrower?.name,
      ownerEmail: owner?.email,
      ownerName: owner?.name,
      startDate: loan.startDate,
      endDate: loan.endDate,
    });

    const signature = await hmacSign(payload, secret);

    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
      },
      body: payload,
    });
  },
});

// Internal query used by HTTP endpoint
export const _getOverdue = internalQuery({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().slice(0, 10);

    // Get approved loans past their end date
    const approved = await ctx.db
      .query("loans")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .collect();

    const overdue = approved.filter((l) => l.endDate < today);

    return await Promise.all(
      overdue.map(async (loan) => {
        const borrower = await ctx.db.get(loan.borrowerId);
        const tool = await ctx.db.get(loan.toolId);
        return {
          loanId: loan._id,
          borrowerEmail: borrower?.email ?? "",
          borrowerName: borrower?.name ?? "",
          toolName: tool?.name ?? "",
          endDate: loan.endDate,
          reminderSentAt: loan.reminderSentAt ?? null,
        };
      }),
    );
  },
});

export const markReminderSent = internalMutation({
  args: { loanId: v.id("loans") },
  handler: async (ctx, { loanId }) => {
    await ctx.db.patch(loanId, { reminderSentAt: Date.now() });
  },
});

// Web Crypto HMAC-SHA256 (available in Convex runtime)
async function hmacSign(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
