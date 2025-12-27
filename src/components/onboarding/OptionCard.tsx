import { motion } from "framer-motion";

interface OptionCardProps {
  label: string;
  selected?: boolean;
  onClick: () => void;
  rightText?: string;
}

export const OptionCard = ({ label, selected, onClick, rightText }: OptionCardProps) => {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full rounded-xl px-4 py-3.5 text-left text-[15px] font-medium transition-all ${
        selected
          ? "bg-foreground text-background"
          : "bg-card text-foreground hover:bg-muted"
      } ${rightText ? "flex items-center justify-between" : ""}`}
    >
      <span>{label}</span>
      {rightText && (
        <span className={`text-sm ${selected ? "text-background/70" : "text-muted-foreground"}`}>
          {rightText}
        </span>
      )}
    </motion.button>
  );
};
