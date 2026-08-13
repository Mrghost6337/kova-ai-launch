import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useAction } from "convex/react";
import { useState } from "react";
import { useNavigate } from "react-router";

export function useCheckout() {
  const { isAuthenticated } = useAuth();
  const createCheckout = useAction(api.checkout.createCheckout);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buy(planId: string) {
    setError(null);

    if (!isAuthenticated) {
      navigate(`/auth?returnTo=${encodeURIComponent("/app")}`);
      return;
    }

    setIsLoading(true);
    try {
      const result = await createCheckout({ planId });
      if (result.url) {
        window.location.href = result.url;
      } else {
        setError("Checkout could not be started. Please try again.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Checkout could not be started. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return { buy, isLoading, error };
}
