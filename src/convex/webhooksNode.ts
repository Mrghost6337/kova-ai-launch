"use node";

import { v } from "convex/values";
import Stripe from "stripe";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

export const handleStripeEvent = internalAction({
  args: {
    signature: v.string(),
    payload: v.string(),
  },
  handler: async (ctx, args) => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!secretKey || !webhookSecret) {
      return { ok: false, error: "Webhook not configured." };
    }

    let event: Stripe.Event;
    try {
      const stripe = new Stripe(secretKey);
      event = stripe.webhooks.constructEvent(
        args.payload,
        args.signature,
        webhookSecret,
      );
    } catch (error) {
      console.error("Stripe webhook verification failed:", error);
      return { ok: false, error: "Invalid signature." };
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === "paid") {
        await ctx.runMutation(internal.purchases.recordPurchase, {
          userId:
            session.client_reference_id ?? session.metadata?.userId ?? undefined,
          planId: session.metadata?.planId ?? "unknown",
          planName: session.metadata?.planName ?? "Kova AI",
          amount: session.amount_total ?? 0,
          currency: session.currency ?? "eur",
          status: "paid",
          stripeSessionId: session.id,
          email: session.customer_email ?? undefined,
        });
      }
    }

    return { ok: true, received: true };
  },
});
