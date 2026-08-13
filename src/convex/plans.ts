import { query } from "./_generated/server";

export interface Plan {
  id: string;
  name: string;
  description: string;
  priceLabel: string;
  cadence: string;
  amountCents: number;
  currency: string;
  mode: "subscription" | "payment";
  popular?: boolean;
}

// Single source of truth for what Kova AI sells.
export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "Explore the core of Kova AI on your iPhone.",
    priceLabel: "€0",
    cadence: "/ month",
    amountCents: 0,
    currency: "eur",
    mode: "payment",
  },
  {
    id: "pro",
    name: "Pro",
    description: "Advanced AI features, higher limits and automation.",
    priceLabel: "€19",
    cadence: "/ month",
    amountCents: 1900,
    currency: "eur",
    mode: "subscription",
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    description: "Team workflows, collaboration and priority support.",
    priceLabel: "Custom",
    cadence: "",
    amountCents: 0,
    currency: "eur",
    mode: "payment",
  },
];

export const plans = query({
  args: {},
  handler: async () => {
    return PLANS;
  },
});
