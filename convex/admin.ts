import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./_helpers";

export const listAllLoans = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("loans").collect();
  },
});

export const removeTool = mutation({
  args: { toolId: v.id("tools") },
  handler: async (ctx, { toolId }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(toolId);
  },
});

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("users").collect();
  },
});
