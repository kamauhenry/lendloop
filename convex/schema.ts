import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("user")),
  }).index("by_clerkId", ["clerkId"]),

  tools: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    category: v.union(
      v.literal("power tools"),
      v.literal("garden"),
      v.literal("kitchen"),
      v.literal("camping"),
      v.literal("other"),
    ),
    condition: v.union(
      v.literal("new"),
      v.literal("good"),
      v.literal("fair"),
      v.literal("worn"),
    ),
    description: v.string(),
    imageUrl: v.optional(v.string()),
    available: v.boolean(),
    trustedLender: v.boolean(),
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_available", ["available"])
    .index("by_category", ["category"]),

  loans: defineTable({
    toolId: v.id("tools"),
    borrowerId: v.id("users"),
    ownerId: v.id("users"),
    startDate: v.string(), // ISO date string YYYY-MM-DD
    endDate: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("declined"),
      v.literal("returned"),
      v.literal("overdue"),
    ),
    reminderSentAt: v.optional(v.number()), // Unix timestamp ms
  })
    .index("by_borrowerId", ["borrowerId"])
    .index("by_ownerId", ["ownerId"])
    .index("by_toolId", ["toolId"])
    .index("by_status", ["status"]),
});
