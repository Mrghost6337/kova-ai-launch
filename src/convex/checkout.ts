"use node";

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import Stripe from "stripe";
import { action } from "./_generated/server";
import { PLANS } from "./plans";

export const createCheckout = action({
  args: {
    planId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("You need to be signed in to purchase Kova AI.");
    }

    const plan = PLANS.find((p) => p.id === args.planId);
    if (!plan || plan.amountCents === 0) {
      throw new Error("That plan is not available for purchase.");
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error(
        "Payments are not configured yet. Add STRIPE_SECRET_KEY to finish checkout.",
      );
    }

    const stripe = new Stripe(secretKey);
    const siteUrl = process.env.SITE_URL || "https://kova-ai.example";

    const session = await stripe.checkout.sessions.create({
      mode: plan.mode,
      client_reference_id: userId,
      metadata: { userId, planId: plan.id, planName: plan.name },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: plan.currency,
            product_data: {
              name: `Kova AI — ${plan.name}`,
              description: plan.description,
            },
            unit_amount: plan.amountCents,
            recurring:
              plan.mode === "subscription" ? { interval: "month" } : undefined,
          },
        },
      ],
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/app`,
    });

    return { url: session.url };
  },
});
