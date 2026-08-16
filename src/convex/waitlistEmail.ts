"use node";

import { vly } from "../lib/vly-integrations";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import { v } from "convex/values";

export const join = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const signup = await ctx.runMutation(internal.waitlist.add, { email });

    if (signup.status === "already") {
      return { status: "already" as const, emailSent: false };
    }

    const result = await vly.email.send({
      to: email,
      subject: "You’re on the KOVA AI waitlist",
      text: "You’re on the KOVA AI waitlist. We’ll let you know when KOVA is ready.",
      html: `
        <div style="margin:0;background:#050505;padding:40px 20px;font-family:Arial,sans-serif;color:#f5f5f5">
          <div style="max-width:520px;margin:0 auto;border:1px solid #2b2b2b;border-radius:24px;background:#101010;padding:36px">
            <p style="margin:0 0 24px;color:#999;font-size:12px;letter-spacing:3px;text-transform:uppercase">KOVA AI</p>
            <h1 style="margin:0 0 16px;font-size:30px;line-height:1.1;font-weight:600">You’re on the waitlist.</h1>
            <p style="margin:0;color:#bdbdbd;font-size:16px;line-height:1.6">Thanks for joining KOVA. We’ll send you an update when the adaptive coach is ready for you.</p>
            <p style="margin:28px 0 0;color:#777;font-size:13px;line-height:1.5">No spam. Just KOVA updates.</p>
          </div>
        </div>
      `,
    });

    if (!result.success) {
      console.error("KOVA waitlist confirmation email failed:", result.error);
      return { status: "added" as const, emailSent: false };
    }

    return { status: "added" as const, emailSent: true };
  },
});
