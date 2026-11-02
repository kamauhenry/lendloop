import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, requireAuth } from "./_helpers";

// Called from the Clerk webhook route (svix-verified). Public because
// ConvexHttpClient can't call internalMutation, but the clerkId arg is
// validated against the signed Clerk JWT so no user can overwrite another's record.
export const upsertUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    webhookSecret: v.string(),
  },
  handler: async (ctx, { clerkId, name, email, webhookSecret }) => {
    // Verify the caller knows the server-side webhook secret — prevents
    // any browser client from calling this mutation directly.
    if (webhookSecret !== process.env.CLERK_WEBHOOK_SECRET) {
      throw new ConvexError("Unauthorized");
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { name, email });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId,
      name,
      email,
      role: "user",
    });
  },
});

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});

export const setRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("user")),
  },
  handler: async (ctx, { userId, role }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(userId, { role });
  },
});

export const setTrustedLender = mutation({
  args: {
    userId: v.id("users"),
    trusted: v.boolean(),
  },
  handler: async (ctx, { userId, trusted }) => {
    await requireAdmin(ctx);
    // Mark all tools by this user as trustedLender
    const tools = await ctx.db
      .query("tools")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", userId))
      .collect();
    await Promise.all(tools.map((t) => ctx.db.patch(t._id, { trustedLender: trusted })));
  },
});

// Called on first authenticated page load to ensure user exists in Convex
export const ensureUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (existing) return existing._id;

    return await ctx.db.insert("users", {
      clerkId: identity.subject,
      name: identity.name ?? identity.email ?? "Unknown",
      email: identity.email ?? "",
      role: "user",
    });
  },
});
