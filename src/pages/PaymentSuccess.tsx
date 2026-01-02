import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { useSubscription } from "@/hooks/useSubscription";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const [subscriptionSynced, setSubscriptionSynced] = useState(false);
  const [syncAttempts, setSyncAttempts] = useState(0);
  const { checkSubscription, isSubscriptionValid, isTrialing, status } = useSubscription();
  const syncingRef = useRef(false);

  // Sync subscription status with Stripe with retry logic
  useEffect(() => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    const syncSubscription = async () => {
      console.log("[PaymentSuccess] Starting subscription sync, attempt:", syncAttempts + 1);
      
      try {
        // Wait for Stripe webhook to process - increase wait time for more reliability
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Force refresh subscription status from Stripe
        await checkSubscription();
        
        // Check if subscription is now valid
        const valid = isSubscriptionValid();
        const trialing = isTrialing;
        
        console.log("[PaymentSuccess] Sync result:", { valid, trialing, status });
        
        if (valid || trialing || status === "active") {
          console.log("[PaymentSuccess] Subscription confirmed as active/trialing");
          setSubscriptionSynced(true);
        } else if (syncAttempts < 3) {
          // Retry if not yet active (webhook might still be processing)
          console.log("[PaymentSuccess] Subscription not yet active, retrying...");
          setSyncAttempts(prev => prev + 1);
          syncingRef.current = false;
        } else {
          // After 3 attempts, proceed anyway - user paid and will be synced eventually
          console.log("[PaymentSuccess] Max retries reached, proceeding anyway");
          setSubscriptionSynced(true);
        }
      } catch (error) {
        console.error("[PaymentSuccess] Error syncing subscription:", error);
        // Even if sync fails, allow navigation after max attempts
        if (syncAttempts >= 2) {
          setSubscriptionSynced(true);
        } else {
          setSyncAttempts(prev => prev + 1);
          syncingRef.current = false;
        }
      }
    };

    syncSubscription();
  }, [checkSubscription, isSubscriptionValid, isTrialing, status, syncAttempts]);

  useEffect(() => {
    // Trigger confetti celebration
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: colors
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    // Center burst
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: colors
      });
    }, 500);
  }, []);

  useEffect(() => {
    // Only start countdown after subscription is synced
    if (!subscriptionSynced) return;

    // Countdown timer
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Navigate to home after countdown
    const timeout = setTimeout(() => {
      navigate("/home", { replace: true });
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [navigate, subscriptionSynced]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      {/* Success Icon */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 200, 
          damping: 15,
          delay: 0.2 
        }}
        className="relative mb-8"
      >
        <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center">
          <CheckCircle className="w-16 h-16 text-primary" />
        </div>
        
        {/* Sparkles around the icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute -top-2 -right-2"
        >
          <Sparkles className="w-8 h-8 text-yellow-500" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="absolute -bottom-1 -left-3"
        >
          <Sparkles className="w-6 h-6 text-yellow-500" />
        </motion.div>
      </motion.div>

      {/* Success Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center space-y-4"
      >
        <h1 className="text-3xl font-black text-foreground">
          Pagamento Confirmado! 🎉
        </h1>
        <p className="text-muted-foreground max-w-sm">
          Bem-vindo ao LiftMate Premium! Agora tens acesso a todas as funcionalidades.
        </p>
      </motion.div>

      {/* Countdown */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12 text-center"
      >
        {subscriptionSynced ? (
          <>
            <p className="text-sm text-muted-foreground mb-2">
              A redirecionar para a Home em
            </p>
            <motion.div
              key={countdown}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl font-bold text-primary"
            >
              {countdown}
            </motion.div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">
              A ativar a tua subscrição...
            </p>
          </div>
        )}
      </motion.div>

      {/* Manual redirect button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate("/home", { replace: true })}
        disabled={!subscriptionSynced}
        className="mt-8 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50"
      >
        {subscriptionSynced ? "Ir para a Home agora" : "A processar..."}
      </motion.button>
    </div>
  );
};

export default PaymentSuccess;