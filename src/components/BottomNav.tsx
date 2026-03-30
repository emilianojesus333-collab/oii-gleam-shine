import { Home, Dumbbell, Apple, MessageCircle, Droplets } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Início", path: "/home" },
    { icon: Dumbbell, label: "Treino", path: "/workout" },
    { icon: Apple, label: "Nutrição", path: "/nutrition" },
    { icon: MessageCircle, label: "Chat", path: "/chat" },
    { icon: Droplets, label: "Hidratação", path: "/hydration" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#222] safe-area-bottom" style={{ backgroundColor: '#111311' }}>
      <div className="flex items-center justify-around h-16 max-w-[430px] mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center justify-center gap-1 flex-1 h-full touch-target"
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-white rounded-full" />
              )}
              <item.icon
                size={22}
                strokeWidth={1.5}
                className="text-white"
              />
              <span
                className={`text-[10px] leading-none text-white ${
                  active ? "font-medium" : "opacity-70"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
