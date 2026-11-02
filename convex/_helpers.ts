import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";

export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Unauthenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();
  if (!user) throw new ConvexError("User not found — please sign out and back in");

  return user;
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const user = await requireAuth(ctx);
  if (user.role !== "admin") throw new ConvexError("Admin access required");
  return user;
}
