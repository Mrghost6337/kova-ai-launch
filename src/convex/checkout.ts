"use node";

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import Stripe from "stripe";
import { action } from "./_generated/server";
import { PLANS } from "./plans";

export const createCheckout = action({
  args: {
    planId: v.string(),
    billingInterval: v.optional(v.union(v.literal("month"), v.literal("year"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("You need to be signed in to purchase a KOVA plan.");
    }

    const plan = PLANS.find((candidate) => candidate.id === args.planId);
    if (!plan) {
      throw new Error("That KOVA plan is not available for purchase.");
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error(
        "Payments are not configured yet. Add STRIPE_SECRET_KEY to finish checkout.",
      );
    }

    const stripe = new Stripe(secretKey);
    const siteUrl = process.env.SITE_URL || "https://kova-ai.example";
    const billingInterval = args.billingInterval ?? "month";
    const amount =
      billingInterval === "year"
        ? plan.annualAmountCents
        : plan.monthlyAmountCents;
    const priceLabel =
      billingInterval === "year"
        ? plan.annualPriceLabel
        : plan.monthlyPriceLabel;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      client_reference_id: userId,
      metadata: {
        userId,
        planId: plan.id,
        planName: plan.name,
        billingInterval,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: plan.currency,
            product_data: {
              name: `${plan.name} — ${billingInterval === "year" ? "Annual" : "Monthly"}`,
              description: `${plan.description} ${priceLabel} per ${billingInterval}.`,
            },
            unit_amount: amount,
            recurring: { interval: billingInterval },
          },
        },
      ],
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/pricing`,
    });

    return { url: session.url };
  },
});
