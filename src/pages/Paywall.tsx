import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Check, Crown, Sparkles, Shield, Zap, Brain, Dumbbell, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSubscription, SUBSCRIPTION_PRODUCTS } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";

// Email autorizado para bypass de dev
const DEV_AUTHORIZED_EMAIL = "emilianojesus333@gmail.com";

const Paywall = () => {
  const navigate = useNavigate();
  const { createCheckout, isSubscriptionValid, shouldShowPaywall, isLoading, isTrialing, status } = useSubscription();
  const { toast } = useToast();
  const { language } = useLanguage();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [devTapCount, setDevTapCount] = useState(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const devTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const benefits = [
    { icon: Brain, text: language === 'pt' ? "AI Coach Pessoal 24/7" : "Personal AI Coach 24/7" },
    { icon: Dumbbell, text: language === 'pt' ? "Planos de treino personalizados" : "Personalized workout plans" },
    { icon: ChefHat, text: language === 'pt' ? "Nutrição inteligente com scanner" : "Smart nutrition with scanner" },
    { icon: Zap, text: language === 'pt' ? "Análise de progresso avançada" : "Advanced progress analysis" },
    { icon: Sparkles, text: language === 'pt' ? "Receitas e meal plans adaptados" : "Adapted recipes and meal plans" },
    { icon: Shield, text: language === 'pt' ? "Suporte prioritário" : "Priority support" },
  ];

  // Get current user email
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);
    };
    getUser();
  }, []);

  // Secret dev mode: tap logo 5 times to bypass (only for authorized email)
  const handleDevTap = () => {
    // Only allow if user email matches authorized email
    if (userEmail?.toLowerCase() !== DEV_AUTHORIZED_EMAIL.toLowerCase()) {
      return; // Silently ignore taps from non-authorized users
    }

    setDevTapCount(prev => prev + 1);
    
    if (devTapTimeoutRef.current) {
      clearTimeout(devTapTimeoutRef.current);
    }
    
    devTapTimeoutRef.current = setTimeout(() => {
      setDevTapCount(0);
    }, 2000);
    
    if (devTapCount + 1 >= 5) {
      localStorage.setItem("liftmate_dev_bypass", "true");
      toast({
        title: language === 'pt' ? "🔓 Modo Dev Ativado" : "🔓 Dev Mode Activated",
        description: language === 'pt' ? "Bypass exclusivo ativado para ti." : "Exclusive bypass activated for you.",
      });
      setTimeout(() => {
        navigate("/home", { replace: true });
      }, 500);
    }
  };

  // CRITICAL: Check if user already has valid subscription and redirect
  useEffect(() => {
    if (!isLoading) {
      console.log("[Paywall] Checking subscription:", { 
        shouldShowPaywall: shouldShowPaywall(), 
        isSubscriptionValid: isSubscriptionValid(),
        isTrialing,
        status
      });
      
      // If user has valid subscription OR is trialing, redirect to home immediately
      if (!shouldShowPaywall() || isSubscriptionValid() || isTrialing) {
        console.log("[Paywall] User has access, redirecting to home");
        navigate("/home", { replace: true });
      }
    }
  }, [isLoading, shouldShowPaywall, isSubscriptionValid, isTrialing, status, navigate]);

  const handleSubscribe = async (priceId: string, planName: string) => {
    try {
      setLoadingPlan(planName);
      await createCheckout(priceId);
    } catch (error) {
      toast({
        title: language === 'pt' ? "Erro" : "Error",
        description: language === 'pt' 
          ? "Não foi possível iniciar o checkout. Tenta novamente." 
          : "Could not start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  // Show loading while checking subscription
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl opacity-30" />
      
      <div className="relative z-10 container mx-auto px-4 py-8 flex flex-col min-h-screen">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div 
            className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4 cursor-pointer select-none"
            onClick={handleDevTap}
          >
            <Crown className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">LiftMate Pro</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            {language === 'pt' ? (
              <>Desbloqueia o Teu <span className="text-primary">Potencial Máximo</span></>
            ) : (
              <>Unlock Your <span className="text-primary">Maximum Potential</span></>
            )}
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            {language === 'pt' 
              ? "Transforma o teu corpo com o poder da inteligência artificial e coaching personalizado."
              : "Transform your body with the power of artificial intelligence and personalized coaching."}
          </p>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3 mb-8 max-w-md mx-auto w-full"
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.text}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              className="flex items-center gap-2 text-sm"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <benefit.icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-foreground/80">{benefit.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Pricing Cards */}
        <div className="flex-1 flex flex-col justify-center gap-4 max-w-md mx-auto w-full">
          {/* Annual Plan - Best Value */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="relative p-5 border border-primary/50 bg-card">
              {/* Best Value Badge */}
              <div className="absolute -top-2.5 left-4">
                <span className="bg-primary text-primary-foreground text-[10px] font-medium px-2.5 py-1 rounded-full">
                  {language === 'pt' ? 'Melhor valor' : 'Best value'}
                </span>
              </div>

              <div className="flex items-center justify-between mb-4 mt-1">
                <div>
                  <h3 className="text-base font-semibold">{language === 'pt' ? 'Anual' : 'Annual'}</h3>
                  <p className="text-xs text-muted-foreground">{SUBSCRIPTION_PRODUCTS.annual.total}€/{language === 'pt' ? 'ano' : 'year'}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-2xl font-bold">{SUBSCRIPTION_PRODUCTS.annual.price.toFixed(2).replace('.', ',')}€</span>
                    <span className="text-sm text-muted-foreground">/{language === 'pt' ? 'mês' : 'mo'}</span>
                  </div>
                  <p className="text-[10px] text-primary">
                    {language === 'pt' ? 'Poupas 20% vs mensal' : 'Save 20% vs monthly'}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => handleSubscribe(SUBSCRIPTION_PRODUCTS.annual.price_id, "annual")}
                disabled={loadingPlan !== null}
                className="w-full h-12 font-medium"
              >
                {loadingPlan === "annual" ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  language === 'pt' ? "Começar 7 dias grátis" : "Start 7-day free trial"
                )}
              </Button>
            </Card>
          </motion.div>

          {/* Monthly Plan */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-5 border border-border/30 bg-card/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold">{language === 'pt' ? 'Mensal' : 'Monthly'}</h3>
                  <p className="text-xs text-muted-foreground">
                    {language === 'pt' ? 'Cancela quando quiseres' : 'Cancel anytime'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-2xl font-bold">{SUBSCRIPTION_PRODUCTS.monthly.price}€</span>
                    <span className="text-sm text-muted-foreground">/{language === 'pt' ? 'mês' : 'mo'}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => handleSubscribe(SUBSCRIPTION_PRODUCTS.monthly.price_id, "monthly")}
                disabled={loadingPlan !== null}
                variant="outline"
                className="w-full h-12 font-medium"
              >
                {loadingPlan === "monthly" ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  language === 'pt' ? "Escolher Mensal" : "Choose Monthly"
                )}
              </Button>
            </Card>
          </motion.div>
        </div>

        {/* Trust & Security */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8 space-y-4"
        >
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span className="text-sm">
              {language === 'pt' ? 'Pagamento seguro via Stripe' : 'Secure payment via Stripe'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground/70 max-w-xs mx-auto">
            {language === 'pt' 
              ? 'Teste gratuito de 7 dias. Cancela quando quiseres, sem compromisso.'
              : '7-day free trial. Cancel anytime, no commitment.'}
          </p>
          
        </motion.div>
      </div>
    </div>
  );
};

export default Paywall;
