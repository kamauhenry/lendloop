import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { requireAdmin, requireAuth } from "./_helpers";

const categoryValidator = v.union(
  v.literal("power tools"),
  v.literal("garden"),
  v.literal("kitchen"),
  v.literal("camping"),
  v.literal("other"),
);

const conditionValidator = v.union(
  v.literal("new"),
  v.literal("good"),
  v.literal("fair"),
  v.literal("worn"),
);

// Public — id, name, category only (no owner details)
export const listAvailable = query({
  args: {},
  handler: async (ctx) => {
    const tools = await ctx.db
      .query("tools")
      .withIndex("by_available", (q) => q.eq("available", true))
      .collect();
    return tools.map(({ _id, name, category }) => ({ _id, name, category }));
  },
});

// Authenticated — paginated, with optional category + availability filters.
// Category uses the index for efficient filtering; availableOnly is post-filtered per page.
export const listAll = query({
  args: {
    paginationOpts: paginationOptsValidator,
    category: v.optional(categoryValidator),
    availableOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, { paginationOpts, category, availableOnly }) => {
    await requireAuth(ctx);

    const result = category
      ? await ctx.db
          .query("tools")
          .withIndex("by_category", (q) => q.eq("category", category))
          .paginate(paginationOpts)
      : await ctx.db.query("tools").paginate(paginationOpts);

    return {
      ...result,
      page: availableOnly ? result.page.filter((t) => t.available) : result.page,
    };
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    return await ctx.db
      .query("tools")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", user._id))
      .collect();
  },
});

export const getById = query({
  args: { toolId: v.id("tools") },
  handler: async (ctx, { toolId }) => {
    await requireAuth(ctx);
    return await ctx.db.get(toolId);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    category: categoryValidator,
    condition: conditionValidator,
    description: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    return await ctx.db.insert("tools", {
      ...args,
      ownerId: user._id,
      available: true,
      trustedLender: false,
    });
  },
});

export const update = mutation({
  args: {
    toolId: v.id("tools"),
    name: v.optional(v.string()),
    category: v.optional(categoryValidator),
    condition: v.optional(conditionValidator),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, { toolId, ...updates }) => {
    const user = await requireAuth(ctx);
    const tool = await ctx.db.get(toolId);
    if (!tool) throw new ConvexError("Tool not found");
    if (tool.ownerId !== user._id) throw new ConvexError("Not your tool");

    await ctx.db.patch(toolId, updates);
  },
});

export const remove = mutation({
  args: { toolId: v.id("tools") },
  handler: async (ctx, { toolId }) => {
    const user = await requireAuth(ctx);
    const tool = await ctx.db.get(toolId);
    if (!tool) throw new ConvexError("Tool not found");
    if (tool.ownerId !== user._id && user.role !== "admin") {
      throw new ConvexError("Not authorised");
    }
    await ctx.db.delete(toolId);
  },
});

export const setAvailable = mutation({
  args: { toolId: v.id("tools"), available: v.boolean() },
  handler: async (ctx, { toolId, available }) => {
    const user = await requireAuth(ctx);
    const tool = await ctx.db.get(toolId);
    if (!tool) throw new ConvexError("Tool not found");
    if (tool.ownerId !== user._id) throw new ConvexError("Not your tool");
    await ctx.db.patch(toolId, { available });
  },
});
