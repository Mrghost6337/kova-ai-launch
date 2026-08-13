import { v } from "convex/values";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

export const stripeWebhook = httpAction(async (ctx, request) => {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing signature.", { status: 400 });
  }

  const payload = await request.text();

  const result = await ctx.runAction(internal.webhooksNode.handleStripeEvent, {
    signature,
    payload,
  });

  return new Response(JSON.stringify(result), {
    status: result.ok ? 200 : 400,
  });
});
