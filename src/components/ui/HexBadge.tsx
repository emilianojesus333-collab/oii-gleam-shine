interface HexBadgeProps {
  label: string;
  size?: number;
}

/**
 * Hexagonal badge used as section header icon throughout the app.
 * Fill: #1E40AF (dark blue), text: white 10px/900.
 */
export const HexBadge = ({ label, size = 38 }: HexBadgeProps) => (
  <div
    style={{
      width: size,
      height: size,
      background: "#1E40AF",
      clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    <span
      style={{
        color: "white",
        fontSize: 11,
        fontWeight: 900,
        letterSpacing: "-0.5px",
        lineHeight: 1,
        userSelect: "none",
      }}
    >
      {label}
    </span>
  </div>
);
