import { Home, Dumbbell, MessageCircle, Apple, Droplets } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const navItems = [
  { icon: Dumbbell, label: "Treino", path: "/workout" },
  { icon: MessageCircle, label: "Chat", path: "/chat" },
  { icon: Home, label: "Início", path: "/home" },
  { icon: Apple, label: "Nutrição", path: "/nutrition" },
  { icon: Droplets, label: "Hidratação", path: "/hydration" },
];

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === "/chat") return null;

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom"
      style={{ padding: "0 8px 0 8px" }}
    >
      <div
        className="flex items-center justify-around mx-auto max-w-[430px]"
        style={{
          height: 68,
          backgroundColor: "#0D1118",
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.07)",
          padding: "0 8px",
        }}
      >
        {navItems.map((item) => {
          const active = isActive(item.path);
          const isHome = item.path === "/home";

          if (isHome) {
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center justify-center flex-1 cursor-pointer"
                style={{ gap: 4 }}
              >
                <div
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 28,
                    padding: "10px 20px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <item.icon size={22} strokeWidth={1.5} color="#000" />
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: "#000", lineHeight: 1 }}>
                    {item.label}
                  </span>
                </div>
              </button>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center flex-1 cursor-pointer"
              style={{ gap: 4, opacity: active ? 1 : 0.38 }}
            >
              <item.icon size={22} strokeWidth={1.5} color="#fff" />
              <span style={{ fontSize: 9.5, fontWeight: 600, color: "#fff", lineHeight: 1 }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
