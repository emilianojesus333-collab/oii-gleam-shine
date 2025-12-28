import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Dumbbell, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

interface CompletedExercisesData {
  date: string;
  exercises: string[];
  workout: string | null;
}

const Chat = () => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");
  const [showWorkoutContext, setShowWorkoutContext] = useState(true);

  // Load completed exercises from localStorage
  const completedExercisesData = useMemo((): CompletedExercisesData | null => {
    const saved = localStorage.getItem("liftmate_completed_exercises");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.date === new Date().toDateString() && parsed.exercises.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error("Error parsing completed exercises:", e);
      }
    }
    return null;
  }, []);

  // Build initial message based on workout context
  const getInitialMessage = (): Message => {
    if (completedExercisesData && completedExercisesData.exercises.length > 0) {
      const exerciseList = completedExercisesData.exercises.join(", ");
      return {
        id: "1",
        text: `Olá! Vi que já completaste ${completedExercisesData.exercises.length} exercício(s) hoje: ${exerciseList}. Excelente trabalho! 💪\n\nComo te sentes? Posso ajudar-te com dicas de recuperação, sugerir variações, ou analisar o teu progresso.`,
        isUser: false,
      };
    }
    return {
      id: "1",
      text: "Olá! Sou o teu assistente de treino. Como posso ajudar-te hoje?",
      isUser: false,
    };
  };

  const [messages, setMessages] = useState<Message[]>([getInitialMessage()]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    // Build context for AI response
    const workoutContext = completedExercisesData 
      ? `O utilizador completou hoje: ${completedExercisesData.exercises.join(", ")}. Treino: ${completedExercisesData.workout || "Não especificado"}.`
      : "O utilizador ainda não completou exercícios hoje.";

    // Simulate AI response with workout context
    setTimeout(() => {
      let responseText = "Entendi! Vou analisar isso e preparar uma sugestão personalizada para ti.";
      
      // Simple context-aware responses
      const lowerInput = inputValue.toLowerCase();
      if (lowerInput.includes("dor") || lowerInput.includes("cansado") || lowerInput.includes("cansaço")) {
        responseText = completedExercisesData 
          ? `Depois de completares ${completedExercisesData.exercises.length} exercícios, é normal sentir algum cansaço. Recomendo: descanso adequado, hidratação, e alongamentos leves. Amanhã vais estar mais forte! 💪`
          : "Descanso é fundamental! Certifica-te que estás a dormir bem e a manter-te hidratado.";
      } else if (lowerInput.includes("próximo") || lowerInput.includes("seguir") || lowerInput.includes("agora")) {
        if (completedExercisesData && completedExercisesData.exercises.length > 0) {
          responseText = `Ótimo progresso! Já completaste ${completedExercisesData.exercises.length} exercícios. Continua com o próximo da lista, mantendo boa forma e respiração controlada.`;
        } else {
          responseText = "Começa pelo primeiro exercício da tua lista. Foca na técnica antes de aumentar a carga!";
        }
      } else if (lowerInput.includes("bem") || lowerInput.includes("ótimo") || lowerInput.includes("bom")) {
        responseText = completedExercisesData
          ? `Fantástico! Com ${completedExercisesData.exercises.length} exercícios feitos, estás no caminho certo. Mantém essa energia! 🔥`
          : "Fico feliz em ouvir isso! Vamos manter esse ritmo!";
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        isUser: false,
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-4 border-b border-border px-4 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-card"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-foreground">LiftMate IA</h1>
          <p className="text-sm text-muted-foreground">O teu treinador pessoal</p>
        </div>
      </header>

      {/* Workout Context Banner */}
      <AnimatePresence>
        {showWorkoutContext && completedExercisesData && completedExercisesData.exercises.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border"
          >
            <div className="bg-primary/10 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                    <Dumbbell className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Treino de hoje: {completedExercisesData.workout || "Não definido"}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-primary" />
                      {completedExercisesData.exercises.length} exercício(s) concluído(s)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWorkoutContext(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Ocultar
                </button>
              </div>
              
              {/* Exercise pills */}
              <div className="mt-2 flex flex-wrap gap-1">
                {completedExercisesData.exercises.slice(0, 5).map((exercise, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {exercise}
                  </span>
                ))}
                {completedExercisesData.exercises.length > 5 && (
                  <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                    +{completedExercisesData.exercises.length - 5} mais
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="flex flex-col gap-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.isUser
                    ? "bg-foreground text-background"
                    : "bg-card text-foreground"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border p-4 safe-area-bottom">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Escreve a tua mensagem..."
            className="flex-1 rounded-2xl bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;