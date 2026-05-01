import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: Route not found:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 max-w-sm w-full"
      >
        <div className="w-20 h-20 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto">
          <span className="text-4xl font-black text-muted-foreground">404</span>
        </div>

        <div>
          <h1 className="text-xl font-bold text-foreground mb-2">Página não encontrada</h1>
          <p className="text-sm text-muted-foreground">
            O endereço <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{location.pathname}</span> não existe.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/home", { replace: true })}
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground"
          >
            <Home className="h-4 w-4" />
            Ir para o Início
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-border py-3.5 text-sm font-semibold text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
