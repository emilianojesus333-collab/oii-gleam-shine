import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Sparkles, Shield, Zap, Brain, Dumbbell, ChefHat, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSubscription, SUBSCRIPTION_PRODUCTS } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";

const benefits = [
  { icon: Brain, text: "AI Coach Pessoal 24/7" },
  { icon: Dumbbell, text: "Planos de treino personalizados" },
  { icon: ChefHat, text: "Nutrição inteligente com scanner" },
  { icon: Zap, text: "Análise de progresso avançada" },
  { icon: Sparkles, text: "Receitas e meal plans adaptados" },
  { icon: Shield, text: "Suporte prioritário" },
];

const Paywall = () => {
  const { createCheckout, isLoading } = useSubscription();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string, planName: string) => {
    try {
      setLoadingPlan(planName);
      await createCheckout(priceId);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o checkout. Tenta novamente.",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl opacity-30" />
      
      <div className="relative z-10 container mx-auto px-4 py-8 flex flex-col min-h-screen">
        {/* Skip Button */}
        <button
          onClick={() => window.location.href = "/home"}
          className="absolute top-4 right-4 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors z-20"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
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
          {/* Annual Plan - Recommended */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
          <Card className="relative p-6 border-2 border-primary bg-gradient-to-br from-primary/10 to-background shadow-lg">
              {/* Recommended Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                  ⭐ RECOMENDADO
                </span>
              </div>

              <div className="flex items-center justify-between mb-4 mt-2">
                <div>
                  <h3 className="text-lg font-bold">Plano Anual</h3>
                  <p className="text-sm text-muted-foreground">Melhor valor</p>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{SUBSCRIPTION_PRODUCTS.annual.price}€</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <p className="text-xs text-primary font-medium">Poupas 40%</p>
                </div>
              </div>

              <Button
                onClick={() => handleSubscribe(SUBSCRIPTION_PRODUCTS.annual.price_id, "annual")}
                disabled={loadingPlan !== null}
                className="w-full h-14 text-lg font-semibold"
              >
                {loadingPlan === "annual" ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Começar Trial Grátis
                  </>
                )}
              </Button>
            </Card>
          </motion.div>

          {/* Monthly Plan */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6 border border-border/50 bg-card/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold">Plano Mensal</h3>
                  <p className="text-sm text-muted-foreground">Flexibilidade total</p>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{SUBSCRIPTION_PRODUCTS.monthly.price}€</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => handleSubscribe(SUBSCRIPTION_PRODUCTS.monthly.price_id, "monthly")}
                disabled={loadingPlan !== null}
                variant="outline"
                className="w-full h-14 text-lg font-semibold"
              >
                {loadingPlan === "monthly" ? (
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Escolher Mensal"
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
            <span className="text-sm">Pagamento seguro via Stripe</span>
          </div>
          <p className="text-xs text-muted-foreground/70 max-w-xs mx-auto">
            Teste gratuito de 7 dias. Cancela quando quiseres, sem compromisso.
          </p>
          
          {/* Skip Button - Dev mode */}
          <button
            onClick={() => window.location.href = "/home"}
            className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors underline underline-offset-2"
          >
            Pular por agora (dev)
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Paywall;
