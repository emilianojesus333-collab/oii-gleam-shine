import { Home, Dumbbell, MessageCircle, Apple, History } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { tokens as t } from "@/tokens";

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Dumbbell,      label: "Treino",    path: "/workout"   },
    { icon: MessageCircle, label: "Chat",      path: "/chat"      },
    { icon: Home,          label: "Início",    path: "/home"      },
    { icon: Apple,         label: "Nutrição",  path: "/nutrition" },
    { icon: History,       label: "Histórico", path: "/history"   },
  ];

  if (location.pathname === "/chat") return null;

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom"
      style={{ padding: "0 8px 8px" }}
    >
      <div
        className="flex items-center justify-around mx-auto max-w-[430px]"
        style={{
          height: t.nav.height,
          backgroundColor: t.colors.navBg,
          borderRadius: t.radius.xl,
          border: `1px solid ${t.colors.border}`,
          padding: "0 8px",
        }}
      >
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center flex-1 cursor-pointer"
              style={{ gap: 4, opacity: active ? 1 : 0.38 }}
            >
              <item.icon size={t.icon.lg} strokeWidth={1.5} color="#fff" />
              <span style={{ fontSize: t.fontSize.xxs, fontWeight: t.fontWeight.semibold, color: "#fff", lineHeight: 1 }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
