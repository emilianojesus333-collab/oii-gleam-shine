import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";

const NotFound = () => {
  const location = useLocation();
  const { language } = useLanguage();

  const content = {
    en: {
      title: "404",
      message: "Oops! Page not found",
      returnHome: "Return to Home"
    },
    pt: {
      title: "404",
      message: "Ops! Página não encontrada",
      returnHome: "Voltar para o Início"
    }
  };

  const t = content[language];

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">{t.title}</h1>
        <p className="mb-4 text-xl text-muted-foreground">{t.message}</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          {t.returnHome}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
