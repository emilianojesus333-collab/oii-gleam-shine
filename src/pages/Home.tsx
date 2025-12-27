import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="px-6 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-foreground">LiftMate</h1>
        <p className="mt-1 text-muted-foreground">Olá! Pronto para treinar?</p>
      </header>

      <main className="flex-1 px-6">
        <div className="rounded-2xl bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Treino de Hoje</h2>
          <p className="mt-2 text-muted-foreground">
            Conversa com a IA para começar o teu treino personalizado.
          </p>
        </div>
      </main>

      {/* Chat FAB */}
      <button
        onClick={() => navigate("/chat")}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </div>
  );
};

export default Home;
