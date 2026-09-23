import '@vly-ai/integrations';
import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import AppDashboard from "./pages/AppDashboard.tsx";
import Plan from "./pages/Plan.tsx";
import PlanDetail from "./pages/PlanDetail.tsx";
import { Progress, Profile, Settings, Upgrade } from "./pages/AppSections.tsx";
import FoodPage from "./pages/Food.tsx";
import ExerciseLibrary from "./pages/ExerciseLibrary.tsx";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { InstrumentationProvider } from "@/instrumentation.tsx";
import { ThemeProvider } from "@/hooks/use-theme";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { MotionConfig } from "framer-motion";
import { StrictMode, useEffect, lazy, Suspense } from "react";
import Landing from "./pages/Landing.tsx";
import ProductDetail from "./pages/ProductDetail.tsx";
import PricingPage from "./pages/PricingPage.tsx";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import "./index.css";
import "./types/global.d.ts";

// Lazy load route components for better code splitting
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess.tsx"));
const PublicProfile = lazy(() => import("./pages/PublicProfile.tsx"));
const Social = lazy(() => import("./pages/Social.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const About = lazy(() => import("./pages/About.tsx"));
const Team = lazy(() => import("./pages/Team.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));

// Simple loading fallback for route transitions
function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

const convexUrl = import.meta.env.VITE_CONVEX_URL;
if (!convexUrl) {
  throw new Error(
    "VITE_CONVEX_URL is not set. Add it in Vercel: Project → Settings → Environment Variables.",
  );
}
const convex = new ConvexReactClient(convexUrl);



function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <VlyToolbar />
    <InstrumentationProvider>
      <ThemeProvider>
        <ConvexAuthProvider client={convex}>
          <MotionConfig reducedMotion="user">
            <BrowserRouter>
            <RouteSyncer />
            <Suspense fallback={<RouteLoading />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/app" element={<ProductDetail />} />                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/about" element={<About />} />
                <Route path="/team" element={<Team />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/checkout/success" element={<CheckoutSuccess />} />
                <Route
                  path="/auth"
                  element={<AuthPage redirectAfterAuth="/dashboard" />}
                />
                <Route
                  path="/dashboard"
                  element={
                    <RequireAuth>
                      <AppDashboard />
                    </RequireAuth>
                  }
                />
                <Route path="/dashboard/plan" element={<RequireAuth><Plan /></RequireAuth>} />
                <Route path="/dashboard/plan/:id" element={<RequireAuth><PlanDetail /></RequireAuth>} />
                <Route path="/dashboard/food" element={<RequireAuth><FoodPage /></RequireAuth>} />
                <Route path="/dashboard/exercises" element={<RequireAuth><ExerciseLibrary /></RequireAuth>} />
                <Route path="/dashboard/progress" element={<RequireAuth><Progress /></RequireAuth>} />
                <Route path="/dashboard/social" element={<RequireAuth><Social /></RequireAuth>} />
                <Route path="/dashboard/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                <Route path="/dashboard/settings" element={<RequireAuth><Settings /></RequireAuth>} />
                <Route path="/dashboard/upgrade" element={<RequireAuth><Upgrade /></RequireAuth>} />
                <Route path="/u/:username" element={<RequireAuth><PublicProfile /></RequireAuth>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            </BrowserRouter>
            <Toaster />
          </MotionConfig>
        </ConvexAuthProvider>
      </ThemeProvider>
    </InstrumentationProvider>
  </StrictMode>,
);
