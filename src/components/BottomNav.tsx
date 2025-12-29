import { Home, Dumbbell, MessageCircle, Bell, Plus } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const navItems = [
  { icon: Home, label: "Início", path: "/home" },
  { icon: Dumbbell, label: "Treino", path: "/workout" },
  { icon: MessageCircle, label: "Chat", path: "/chat" },
  { icon: Bell, label: "Alertas", path: "/alerts" },
];

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide BottomNav on Chat page to not block keyboard
  if (location.pathname === '/chat') {
    return null;
  }

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] max-w-[400px]">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex items-center justify-between bg-white/50 backdrop-blur-xl backdrop-saturate-150 rounded-full shadow-xl shadow-black/15 px-1.5 sm:px-2 py-1.5 sm:py-2 border border-white/30 safe-area-bottom"
      >
        {/* Left nav items */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {navItems.slice(0, 2).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <motion.button
                key={item.path}
                onClick={() => navigate(item.path)}
                whileTap={{ scale: 0.95 }}
                className={`flex flex-col items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all touch-target ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[9px] sm:text-[10px] font-medium mt-0.5">{item.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Center nutrition button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => navigate("/nutrition")}
          className="flex flex-col items-center justify-center -mt-6 sm:-mt-8 relative"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <Plus className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
          </div>
          <span className="text-[9px] sm:text-[10px] font-medium mt-0.5 sm:mt-1 text-foreground">Nutrição</span>
        </motion.button>

        {/* Right nav items */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {navItems.slice(2, 4).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <motion.button
                key={item.path}
                onClick={() => navigate(item.path)}
                whileTap={{ scale: 0.95 }}
                className={`flex flex-col items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all touch-target ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[9px] sm:text-[10px] font-medium mt-0.5">{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
