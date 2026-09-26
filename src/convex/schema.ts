import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // completed Kova AI purchases.
    purchases: defineTable({
      userId: v.optional(v.string()), // the user that made the purchase
      planId: v.string(), // stable plan identifier
      planName: v.string(), // human-readable plan name
      amount: v.number(), // amount charged, in the smallest currency unit
      currency: v.string(), // three-letter currency code
      status: v.string(), // payment status from Stripe
      stripeSessionId: v.string(), // Stripe Checkout session id
      email: v.optional(v.string()), // customer email at purchase time
    })
      .index("by_user", ["userId"])
      .index("by_user_plan", ["userId", "planId"])
      .index("by_session", ["stripeSessionId"]),

    // early-access waitlist signups.
    waitlist: defineTable({
      email: v.string(),
    }).index("by_email", ["email"]),

    // Cache of food-database lookups (Open Food Facts / USDA FoodData Central)
    // for the Food page. One row per normalized query or barcode.
    foodCache: defineTable({
      key: v.string(),
      payload: v.any(),
      createdAt: v.number(),
    }).index("by_key", ["key"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
