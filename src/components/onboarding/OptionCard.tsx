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
      className={`w-full rounded-2xl px-5 py-4 text-left text-lg font-medium transition-all ${
        selected
          ? "bg-foreground text-background"
          : "bg-card text-foreground hover:bg-muted"
      } ${rightText ? "flex items-center justify-between" : ""}`}
    >
      <span>{label}</span>
      {rightText && (
        <span className={`text-base ${selected ? "text-background/70" : "text-muted-foreground"}`}>
          {rightText}
        </span>
      )}
    </motion.button>
  );
};
