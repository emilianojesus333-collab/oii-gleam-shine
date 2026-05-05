import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { syncOfflineQueue } from "@/utils/offlineSync";

// Sync offline queue when connection is restored
window.addEventListener("online", async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      await syncOfflineQueue(session.user.id);
    }
  } catch {
    // Silently ignore — will retry on next online event
  }
});
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import Processing from "./pages/Processing";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Workout from "./pages/Workout";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import Hydration from "./pages/Hydration";
import Nutrition from "./pages/Nutrition";
import Paywall from "./pages/Paywall";
import PaymentSuccess from "./pages/PaymentSuccess";
import NotFound from "./pages/NotFound";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Support from "./pages/Support";
import FAQ from "./pages/FAQ";
import WorkoutSummary from "./pages/WorkoutSummary";
import History from "./pages/History";
import CoachingIA from "./pages/CoachingIA";
import AvaliacaoFisica from "./pages/AvaliacaoFisica";
import WorkoutComplete from "./pages/WorkoutComplete";
import Analytics from "./pages/Analytics";
import ExerciseLibrary from "./pages/ExerciseLibrary";
import PlanoSemanal from "./pages/PlanoSemanal";
import ChatIA from "./pages/ChatIA";
import ProtectedRoute from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SubscriptionProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route
              path="/processing"
              element={
                <ProtectedRoute requireOnboarding>
                  <Processing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/paywall"
              element={
                <ProtectedRoute requireOnboarding>
                  <Paywall />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-success"
              element={
                <ProtectedRoute>
                  <PaymentSuccess />
                </ProtectedRoute>
              }
            />
            <Route
              path="/home"
              element={
                <ProtectedRoute requireSubscription>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute requireSubscription>
                  <Chat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workout"
              element={
                <ProtectedRoute requireSubscription>
                  <Workout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/nutrition"
              element={
                <ProtectedRoute requireSubscription>
                  <Nutrition />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute requireSubscription>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hydration"
              element={
                <ProtectedRoute requireSubscription>
                  <Hydration />
                </ProtectedRoute>
              }
            />
            {/* Legacy redirect */}
            <Route
              path="/alerts"
              element={
                <ProtectedRoute requireSubscription>
                  <Hydration />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workout-summary/:sessionId"
              element={
                <ProtectedRoute requireSubscription>
                  <WorkoutSummary />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute requireSubscription>
                  <History />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coaching-ia"
              element={
                <ProtectedRoute requireSubscription>
                  <CoachingIA />
                </ProtectedRoute>
              }
            />
            <Route
              path="/avaliacao-fisica"
              element={
                <ProtectedRoute requireSubscription>
                  <AvaliacaoFisica />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workout-complete"
              element={
                <ProtectedRoute requireSubscription>
                  <WorkoutComplete />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute requireSubscription>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/exercises"
              element={
                <ProtectedRoute requireSubscription>
                  <ExerciseLibrary />
                </ProtectedRoute>
              }
            />
            <Route
              path="/plano-semanal"
              element={
                <ProtectedRoute requireSubscription>
                  <PlanoSemanal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat-ia"
              element={
                <ProtectedRoute requireSubscription>
                  <ChatIA />
                </ProtectedRoute>
              }
            />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/support" element={<Support />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SubscriptionProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
