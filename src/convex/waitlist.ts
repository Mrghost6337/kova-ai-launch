import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const add = internalMutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();

    const existing = await ctx.db
      .query("waitlist")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existing) {
      return { status: "already" as const };
    }

    await ctx.db.insert("waitlist", { email });
    return { status: "added" as const };
  },
});
