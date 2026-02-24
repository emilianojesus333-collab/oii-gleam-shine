import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Crown, Sparkles, Shield, Zap, Brain, Dumbbell, ChefHat, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SUBSCRIPTION_PRODUCTS } from "@/hooks/useSubscription";
import { useSubscriptionContext } from "@/contexts/SubscriptionContext";
import { usePricing } from "@/hooks/usePricing";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

const benefits = [
  { icon: Brain, text: "AI Coach Pessoal 24/7" },
  { icon: Dumbbell, text: "Planos de treino personalizados" },
  { icon: ChefHat, text: "Nutrição inteligente com scanner" },
  { icon: Zap, text: "Análise de progresso avançada" },
  { icon: Sparkles, text: "Receitas e meal plans adaptados" },
  { icon: Shield, text: "Suporte prioritário" },
];

const Paywall = () => {
  const navigate = useNavigate();
  const { createCheckout, isSubscriptionValid, shouldShowPaywall, isLoading, isTrialing } = useSubscriptionContext();
  const { pricing, isLoading: pricingLoading } = usePricing();
  const { toast } = useToast();
  const { signOut } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!isLoading && (!shouldShowPaywall() || isSubscriptionValid() || isTrialing)) {
      navigate("/home", { replace: true });
    }
  }, [isLoading, isTrialing, navigate]);
  // Stable deps only — shouldShowPaywall/isSubscriptionValid are derived from context state

  const handleSubscribe = async (priceId: string, planName: string) => {
    try {
      setLoadingPlan(planName);
      await createCheckout(priceId);
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o checkout. Tenta novamente.",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      navigate("/auth?logout=1", { replace: true });
    } catch {
      toast({ title: "Erro", description: "Não foi possível terminar sessão.", variant: "destructive" });
    } finally {
      setLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const annualPriceId = pricing?.annual.price_id || SUBSCRIPTION_PRODUCTS.annual.price_id;
  const monthlyPriceId = pricing?.monthly.price_id || SUBSCRIPTION_PRODUCTS.monthly.price_id;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl opacity-30" />

      <div className="relative z-10 container mx-auto px-4 py-8 flex flex-col min-h-screen">
        {/* Logout button */}
        <div className="flex justify-end mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-muted-foreground hover:text-foreground gap-2"
          >
            <LogOut className="w-4 h-4" />
            {loggingOut ? "A sair..." : "Terminar sessão"}
          </Button>
        </div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
            <Crown className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">LiftMate Pro</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Desbloqueia o Teu <span className="text-primary">Potencial Máximo</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Transforma o teu corpo com o poder da inteligência artificial e coaching personalizado.
          </p>
        </motion.div>

        {/* Benefits */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 gap-3 mb-8 max-w-md mx-auto w-full">
          {benefits.map((benefit, index) => (
            <motion.div key={benefit.text} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + index * 0.05 }} className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <benefit.icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-foreground/80">{benefit.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Pricing Cards */}
        <div className="flex-1 flex flex-col justify-center gap-4 max-w-md mx-auto w-full">
          {/* Annual Plan */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="relative p-5 border border-primary/50 bg-card">
              <div className="absolute -top-2.5 left-4">
                <span className="bg-primary text-primary-foreground text-[10px] font-medium px-2.5 py-1 rounded-full">
                  Melhor valor
                </span>
              </div>
              <div className="flex items-center justify-between mb-4 mt-1">
                <div>
                  <h3 className="text-base font-semibold">Anual</h3>
                  {pricingLoading ? (
                    <Skeleton className="h-4 w-20 mt-1" />
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {pricing ? pricing.annual.formatted_price : `${SUBSCRIPTION_PRODUCTS.annual.total}€`}/ano
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {pricingLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-2xl font-bold">
                          {pricing
                            ? pricing.annual.monthly_equivalent_formatted
                            : `${SUBSCRIPTION_PRODUCTS.annual.price.toFixed(2).replace(".", ",")}€`}
                        </span>
                        <span className="text-sm text-muted-foreground">/mês</span>
                      </div>
                      <p className="text-[10px] text-primary">
                        Poupas {pricing ? pricing.savings_percent : 20}% vs mensal
                      </p>
                    </>
                  )}
                </div>
              </div>
              <Button
                onClick={() => handleSubscribe(annualPriceId, "annual")}
                disabled={loadingPlan !== null}
                className="w-full h-12 font-medium"
              >
                {loadingPlan === "annual" ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Começar 7 dias grátis"
                )}
              </Button>
            </Card>
          </motion.div>

          {/* Monthly Plan */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="p-5 border border-border/30 bg-card/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold">Mensal</h3>
                  <p className="text-xs text-muted-foreground">Cancela quando quiseres</p>
                </div>
                <div className="text-right">
                  {pricingLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-2xl font-bold">
                        {pricing ? pricing.monthly.formatted_price : `${SUBSCRIPTION_PRODUCTS.monthly.price}€`}
                      </span>
                      <span className="text-sm text-muted-foreground">/mês</span>
                    </div>
                  )}
                </div>
              </div>
              <Button
                onClick={() => handleSubscribe(monthlyPriceId, "monthly")}
                disabled={loadingPlan !== null}
                variant="outline"
                className="w-full h-12 font-medium"
              >
                {loadingPlan === "monthly" ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Escolher Mensal"
                )}
              </Button>
            </Card>
          </motion.div>
        </div>

        {/* Trust */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center mt-8 space-y-4">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span className="text-sm">Pagamento seguro via Stripe</span>
          </div>
          <p className="text-xs text-muted-foreground/70 max-w-xs mx-auto">
            Teste gratuito de 7 dias. Cancela quando quiseres, sem compromisso.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Paywall;
