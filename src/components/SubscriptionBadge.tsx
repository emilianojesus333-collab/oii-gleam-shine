import { Crown, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSubscriptionContext } from "@/contexts/SubscriptionContext";
import { SUBSCRIPTION_PRODUCTS } from "@/hooks/useSubscription";

interface SubscriptionBadgeProps {
  variant?: "default" | "compact";
  className?: string;
}

export const SubscriptionBadge = ({ variant = "default", className = "" }: SubscriptionBadgeProps) => {
  const { isLoading, subscribed, isTrialing, productId } = useSubscriptionContext();

  if (isLoading) return null;
  if (!subscribed && !isTrialing) return null;

  const getPlanName = () => {
    if (productId === SUBSCRIPTION_PRODUCTS.annual.price_id) return "Pro Anual";
    if (productId === SUBSCRIPTION_PRODUCTS.monthly.price_id) return "Pro Mensal";
    return "Pro";
  };

  if (isTrialing) {
    return (
      <Badge className={`gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 ${className}`}>
        <Sparkles className="h-3 w-3" />
        {variant === "default" && <span>Trial Ativo</span>}
      </Badge>
    );
  }

  return (
    <Badge className={`gap-1.5 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0 ${className}`}>
      <Crown className="h-3 w-3" />
      {variant === "default" && <span>{getPlanName()}</span>}
    </Badge>
  );
};
