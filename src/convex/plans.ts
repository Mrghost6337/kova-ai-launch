import { query } from "./_generated/server";

export type BillingInterval = "month" | "year";

export interface Plan {
  id: "pro" | "ultra";
  name: string;
  description: string;
  monthlyPriceLabel: string;
  annualPriceLabel: string;
  monthlyAmountCents: number;
  annualAmountCents: number;
  currency: string;
  popular?: boolean;
}

// Single source of truth for what KOVA sells.
export const PLANS: Plan[] = [
  {
    id: "pro",
    name: "KOVA PRO",
    description: "For serious lifters who want an adaptive AI coach.",
    monthlyPriceLabel: "$9.99",
    annualPriceLabel: "$79.99",
    monthlyAmountCents: 999,
    annualAmountCents: 7999,
    currency: "usd",
    popular: true,
  },
  {
    id: "ultra",
    name: "KOVA ULTRA",
    description: "The highest level of coaching for lifters ready to go further.",
    monthlyPriceLabel: "$19.99",
    annualPriceLabel: "$149.99",
    monthlyAmountCents: 1999,
    annualAmountCents: 14999,
    currency: "usd",
  },
];

export const plans = query({
  args: {},
  handler: async () => {
    return PLANS;
  },
});
