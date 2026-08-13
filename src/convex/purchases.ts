import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

export const recordPurchase = internalMutation({
  args: {
    userId: v.optional(v.string()),
    planId: v.string(),
    planName: v.string(),
    amount: v.number(),
    currency: v.string(),
    status: v.string(),
    stripeSessionId: v.string(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("purchases")
      .withIndex("by_session", (q) =>
        q.eq("stripeSessionId", args.stripeSessionId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        amount: args.amount,
        email: args.email,
      });
      return existing._id;
    }

    return await ctx.db.insert("purchases", {
      userId: args.userId ?? undefined,
      planId: args.planId,
      planName: args.planName,
      amount: args.amount,
      currency: args.currency,
      status: args.status,
      stripeSessionId: args.stripeSessionId,
      email: args.email,
    });
  },
});

export const myPurchases = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    return await ctx.db
      .query("purchases")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const markPendingPurchase = mutation({
  args: {
    planId: v.string(),
    planName: v.string(),
    amount: v.number(),
    currency: v.string(),
    stripeSessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("You need to be signed in to purchase Kova AI.");
    }
    return await ctx.db.insert("purchases", {
      userId,
      planId: args.planId,
      planName: args.planName,
      amount: args.amount,
      currency: args.currency,
      status: "pending",
      stripeSessionId: args.stripeSessionId,
    });
  },
});
