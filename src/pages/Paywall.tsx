import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Check, Shield, LogOut, Crown } from "lucide-react";
import { SUBSCRIPTION_PRODUCTS } from "@/hooks/useSubscription";
import { useSubscriptionContext } from "@/contexts/SubscriptionContext";
import { usePricing } from "@/hooks/usePricing";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import gymBackground from "@/assets/gym-background.jpeg";

const features = [
  "Chat IA com memória e contexto real",
  "Plano de treino personalizado",
  "Nutrição com scanner de código de barras",
  "Relatório semanal automático",
  "Biblioteca de 300+ exercícios",
  "Recuperação muscular inteligente",
];

type Plan = "monthly" | "annual";

const Paywall = () => {
  const navigate = useNavigate();
  const { createCheckout, isSubscriptionValid, shouldShowPaywall, isLoading, isTrialing, checkSubscription } = useSubscriptionContext();
  const { pricing, isLoading: pricingLoading } = usePricing();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<Plan>("annual");
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!isLoading && (!shouldShowPaywall() || isSubscriptionValid() || isTrialing)) {
      navigate("/home", { replace: true });
    }
  }, [isLoading, isTrialing, navigate]);

  const annualPriceId = pricing?.annual.price_id || SUBSCRIPTION_PRODUCTS.annual.price_id;
  const monthlyPriceId = pricing?.monthly.price_id || SUBSCRIPTION_PRODUCTS.monthly.price_id;

  const monthlyPrice = pricing?.monthly.formatted_price || `${SUBSCRIPTION_PRODUCTS.monthly.price}€`;
  const annualTotal = pricing
    ? pricing.annual.formatted_price
    : `${SUBSCRIPTION_PRODUCTS.annual.total}€`;
  const annualMonthly = pricing
    ? pricing.annual.monthly_equivalent_formatted
    : `${SUBSCRIPTION_PRODUCTS.annual.price.toFixed(2).replace(".", ",")}€`;
  const savingsPercent = pricing?.savings_percent || 20;

  const handleSubscribe = async () => {
    try {
      setLoadingCheckout(true);
      const priceId = selectedPlan === "annual" ? annualPriceId : monthlyPriceId;
      await createCheckout(priceId);
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o checkout. Tenta novamente.",
        variant: "destructive",
      });
    } finally {
      setLoadingCheckout(false);
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const ctaLabel = selectedPlan === "annual"
    ? `Começar agora — ${annualTotal}/ano`
    : `Começar agora — ${monthlyPrice}/mês`;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#000000", display: "flex", flexDirection: "column" }}>

      {/* Hero */}
      <div style={{ position: "relative", height: 220, flexShrink: 0 }}>
        <img
          src={gymBackground}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.7) 60%, #000 100%)",
        }} />

        {/* Logout button */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          style={{
            position: "absolute", top: 48, right: 16,
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 20, padding: "6px 12px",
            display: "flex", alignItems: "center", gap: 6,
            color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}
        >
          <LogOut size={13} />
          {loggingOut ? "A sair..." : "Sair"}
        </button>

        {/* Logo + headline */}
        <div style={{
          position: "absolute", bottom: 24, left: 0, right: 0, textAlign: "center", padding: "0 24px",
        }}>
          <p style={{ fontSize: 11, letterSpacing: "0.2em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 6 }}>
            LIFTMATE
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#fff", lineHeight: 1.15, margin: 0 }}>
            {isTrialing ? "O teu trial terminou" : "Continua a transformar\no teu corpo"}
          </h1>
        </div>
      </div>

      {/* Scroll content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px 40px" }}>

        {/* Subtitle */}
        <p style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 24 }}>
          Junta-te a milhares de atletas que já usam o LiftMate
        </p>

        {/* Features */}
        <div style={{ marginBottom: 28 }}>
          {features.map((f) => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                background: "rgba(34,197,94,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Check size={11} color="#22C55E" strokeWidth={3} />
              </div>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{f}</span>
            </div>
          ))}
        </div>

        {/* Plan cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>

          {/* Annual card — highlighted */}
          <motion.button
            whileTap={{ scale: 0.985 }}
            onClick={() => setSelectedPlan("annual")}
            style={{
              width: "100%", textAlign: "left", cursor: "pointer",
              background: selectedPlan === "annual"
                ? "linear-gradient(135deg, #1E3A8A, #1D4ED8)"
                : "#141414",
              border: selectedPlan === "annual"
                ? "2px solid #2563EB"
                : "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16, padding: "16px 16px 14px", position: "relative", overflow: "hidden",
            }}
          >
            {/* Badge */}
            <span style={{
              position: "absolute", top: 12, right: 12,
              background: "#FBBF24", color: "#000",
              fontSize: 9, fontWeight: 800, letterSpacing: "0.05em",
              padding: "3px 8px", borderRadius: 20,
            }}>
              POUPA {savingsPercent}%
            </span>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Anual</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              {pricingLoading
                ? <div style={{ width: 60, height: 28, background: "rgba(255,255,255,0.1)", borderRadius: 6 }} />
                : <span style={{ fontSize: 28, fontWeight: 900, color: "#fff" }}>{annualMonthly}</span>
              }
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>/mês</span>
            </div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
              = {annualTotal}/ano · faturado anualmente
            </p>
          </motion.button>

          {/* Monthly card */}
          <motion.button
            whileTap={{ scale: 0.985 }}
            onClick={() => setSelectedPlan("monthly")}
            style={{
              width: "100%", textAlign: "left", cursor: "pointer",
              background: selectedPlan === "monthly" ? "#1A1A1A" : "#0D0D0D",
              border: selectedPlan === "monthly"
                ? "2px solid rgba(255,255,255,0.25)"
                : "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16, padding: "16px 16px 14px",
            }}
          >
            <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Mensal</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              {pricingLoading
                ? <div style={{ width: 48, height: 28, background: "rgba(255,255,255,0.1)", borderRadius: 6 }} />
                : <span style={{ fontSize: 28, fontWeight: 900, color: "#fff" }}>{monthlyPrice}</span>
              }
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>/mês</span>
            </div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Cancela quando quiseres</p>
          </motion.button>
        </div>

        {/* CTA button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubscribe}
          disabled={loadingCheckout}
          style={{
            width: "100%", height: 52, borderRadius: 100,
            background: "#2563EB", border: "none", color: "#fff",
            fontSize: 15, fontWeight: 800, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            opacity: loadingCheckout ? 0.7 : 1,
            marginBottom: 16,
          }}
        >
          {loadingCheckout ? (
            <div style={{ width: 20, height: 20, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          ) : (
            <>
              <Crown size={16} />
              {ctaLabel}
            </>
          )}
        </motion.button>

        {/* Footer */}
        <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 20 }}>
          Sem compromisso · Cancela quando quiseres
        </p>

        {/* Trust + restore */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.3)" }}>
            <Shield size={13} />
            <span style={{ fontSize: 11 }}>Pagamento seguro via Stripe</span>
          </div>
          <button
            onClick={async () => {
              try {
                await checkSubscription(false);
                if (isSubscriptionValid()) {
                  toast({ title: "Compra restaurada!", description: "A tua subscrição está ativa." });
                  navigate("/home", { replace: true });
                } else {
                  toast({ title: "Sem subscrição ativa", description: "Não encontrámos nenhuma compra associada a esta conta.", variant: "destructive" });
                }
              } catch {
                toast({ title: "Erro", description: "Não foi possível verificar a subscrição.", variant: "destructive" });
              }
            }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 11, color: "rgba(255,255,255,0.3)",
              textDecoration: "underline", textUnderlineOffset: 2,
            }}
          >
            Restaurar compra
          </button>
        </div>
      </div>
    </div>
  );
};

export default Paywall;
