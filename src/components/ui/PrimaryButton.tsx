import { tokens as t } from "@/tokens";
import { Loader2 } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size    = "sm" | "md" | "lg";

interface PrimaryButtonProps {
  children:    ReactNode;
  onClick?:    () => void;
  variant?:    Variant;
  size?:       Size;
  disabled?:   boolean;
  loading?:    boolean;
  fullWidth?:  boolean;
  icon?:       ReactNode;
  style?:      CSSProperties;
  type?:       "button" | "submit";
}

const variantStyles: Record<Variant, CSSProperties> = {
  primary: {
    background: `linear-gradient(135deg, ${t.colors.primaryDark}, ${t.colors.primary})`,
    color:      "#fff",
    border:     "none",
    boxShadow:  `0 6px 20px ${t.colors.primaryGlow}`,
  },
  secondary: {
    background: t.colors.surface2,
    color:      t.colors.text80,
    border:     `1px solid ${t.colors.border}`,
  },
  danger: {
    background: t.colors.dangerSubtle,
    color:      t.colors.danger,
    border:     `1px solid rgba(248,113,113,0.2)`,
  },
  ghost: {
    background: "transparent",
    color:      t.colors.text50,
    border:     `1px solid ${t.colors.border}`,
  },
};

const sizeStyles: Record<Size, { height: number; fontSize: number; padding: string }> = {
  sm: { height: t.button.sm, fontSize: t.fontSize.sm,  padding: "0 14px" },
  md: { height: t.button.md, fontSize: t.fontSize.md,  padding: "0 18px" },
  lg: { height: t.button.lg, fontSize: t.fontSize.lg,  padding: "0 22px" },
};

export const PrimaryButton = ({
  children,
  onClick,
  variant   = "primary",
  size      = "lg",
  disabled  = false,
  loading   = false,
  fullWidth = true,
  icon,
  style,
  type      = "button",
}: PrimaryButtonProps) => {
  const s = sizeStyles[size];
  const v = variantStyles[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width:          fullWidth ? "100%" : "auto",
        height:         s.height,
        padding:        s.padding,
        borderRadius:   t.radius.md,
        fontSize:       s.fontSize,
        fontWeight:     t.fontWeight.bold,
        fontFamily:     "inherit",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        gap:            8,
        cursor:         disabled || loading ? "not-allowed" : "pointer",
        opacity:        disabled ? 0.4 : 1,
        transition:     "opacity 0.15s, transform 0.1s",
        ...v,
        ...style,
      }}
    >
      {loading ? (
        <Loader2 size={t.icon.md} style={{ animation: "spin 1s linear infinite" }} />
      ) : icon ? (
        icon
      ) : null}
      {children}
    </button>
  );
};
