import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, CheckCircle2, TrendingUp, Flame, Calendar, Menu, Plus, MoreHorizontal, Dumbbell, Heart, RefreshCw, TrendingUp as Progress, Utensils, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getWorkoutStats } from "@/data/workoutHistory";
import { useChatHistory, ChatMessage } from "@/hooks/useChatHistory";
import { ChatHistorySheet } from "@/components/chat/ChatHistorySheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CompletedExercisesData {
  date: string;
  exercises: string[];
  workout: string | null;
  muscleGroups?: string[];
}

// AI Response generator based on context
function generateAIResponse(
  input: string, 
  stats: ReturnType<typeof getWorkoutStats>,
  todayExercises: CompletedExercisesData | null
): string {
  const lowerInput = input.toLowerCase();
  
  // Suggest workout
  if (lowerInput.includes("sugere") && (lowerInput.includes("treino") || lowerInput.includes("exercício"))) {
    const onboardingData = localStorage.getItem("liftmate_onboarding");
    let suggestion = "Com base no teu perfil, sugiro:\n\n";
    
    if (onboardingData) {
      const data = JSON.parse(onboardingData);
      const focus = data.focusMuscles || [];
      
      if (focus.length > 0) {
        suggestion += `Foco em ${focus.join(", ")}:\n`;
        suggestion += "• 4 séries de 8-12 reps no exercício principal\n";
        suggestion += "• 3 séries de 10-15 reps nos acessórios\n";
        suggestion += "• Descanso de 60-90s entre séries\n\n";
      }
    }
    
    suggestion += "Aquecimento: 5-10 min cardio leve\n";
    suggestion += "Treino: 45-60 min\n";
    suggestion += "Alongamento: 5-10 min no final";
    
    return suggestion;
  }
  
  // Substitute exercise
  if (lowerInput.includes("substitui") || lowerInput.includes("alternativa") || lowerInput.includes("substituir")) {
    return "Posso ajudar-te a encontrar alternativas! Diz-me qual exercício queres substituir e porquê (falta equipamento, dor, preferência) e sugiro opções equivalentes que trabalham os mesmos músculos.";
  }
  
  // Nutrition tips
  if (lowerInput.includes("nutrição") || lowerInput.includes("alimentação") || lowerInput.includes("comer") || lowerInput.includes("dieta")) {
    const onboardingData = localStorage.getItem("liftmate_onboarding");
    let tips = "";
    
    if (onboardingData) {
      const data = JSON.parse(onboardingData);
      if (data.goal === "Ganhar massa") {
        tips = "Para ganhar massa:\n\n";
        tips += "• Superávit calórico de 300-500 kcal\n";
        tips += "• 1.6-2.2g proteína/kg de peso\n";
        tips += "• Refeição pós-treino em até 2h\n";
        tips += "• Carboidratos complexos antes do treino";
      } else if (data.goal === "Perder peso") {
        tips = "Para perder peso:\n\n";
        tips += "• Déficit calórico de 300-500 kcal\n";
        tips += "• Alta proteína para preservar músculo\n";
        tips += "• Fibras para saciedade\n";
        tips += "• Hidratação adequada (água antes das refeições)";
      } else {
        tips = "Para manter e tonificar:\n\n";
        tips += "• Calorias de manutenção\n";
        tips += "• Proteína adequada (1.4-1.6g/kg)\n";
        tips += "• Alimentação balanceada\n";
        tips += "• Consistência é a chave";
      }
    } else {
      tips = "Dicas gerais de nutrição:\n\n";
      tips += "• Proteína em cada refeição\n";
      tips += "• Carboidratos antes do treino\n";
      tips += "• Hidratação constante\n";
      tips += "• Evita processados";
    }
    
    return tips;
  }
  
  // Sleep/rest tips
  if (lowerInput.includes("sono") || lowerInput.includes("dormir") || lowerInput.includes("descanso") || lowerInput.includes("descansar")) {
    return "Para otimizar recuperação e sono:\n\n• 7-9 horas de sono por noite\n• Horário consistente de deitar\n• Evita ecrãs 1h antes de dormir\n• Ambiente escuro e fresco\n• Evita cafeína após 14h\n• Alongamento leve antes de dormir\n\nO sono é quando os músculos recuperam e crescem!";
  }
  
  // Progress/stats questions
  if (lowerInput.includes("progresso") || lowerInput.includes("estatística") || lowerInput.includes("stats")) {
    if (stats.totalSessions === 0) {
      return "Ainda não tens sessões registadas. Começa a marcar exercícios como concluídos na Home e vou acompanhar o teu progresso!";
    }
    
    let response = `Aqui está o teu progresso:\n\n`;
    response += `• Total de sessões: ${stats.totalSessions}\n`;
    response += `• Esta semana: ${stats.thisWeekSessions} sessões\n`;
    response += `• Streak atual: ${stats.currentStreak} dias\n`;
    response += `• Taxa média de conclusão: ${stats.averageCompletionRate}%\n`;
    
    if (stats.mostTrainedMuscles.length > 0) {
      response += `\nMúsculos mais treinados:\n`;
      stats.mostTrainedMuscles.slice(0, 3).forEach((m, i) => {
        response += `${i + 1}. ${m.muscle} (${m.count}x)\n`;
      });
    }
    
    return response;
  }
  
  // Streak questions
  if (lowerInput.includes("streak") || lowerInput.includes("consecutivo")) {
    if (stats.currentStreak > 0) {
      return `Tens uma streak de ${stats.currentStreak} dias consecutivos! Continua assim para não quebrar o ritmo. Cada dia conta!`;
    }
    return "Ainda não tens uma streak ativa. Treina hoje e amanhã para começares uma!";
  }
  
  // Recovery/tired
  if (lowerInput.includes("dor") || lowerInput.includes("cansado") || lowerInput.includes("cansaço") || lowerInput.includes("recuper")) {
    const todayCount = todayExercises?.exercises.length || 0;
    let response = "";
    
    if (todayCount > 0) {
      response = `Depois de ${todayCount} exercícios hoje, é normal sentir alguma fadiga. `;
    }
    
    response += "Recomendo:\n\n";
    response += "• Hidratação adequada (2-3L de água)\n";
    response += "• Alongamentos de 10-15 min\n";
    response += "• Sono de qualidade (7-8h)\n";
    response += "• Proteína na próxima refeição\n\n";
    response += "Amanhã vais estar mais forte!";
    
    return response;
  }
  
  // What to do next
  if (lowerInput.includes("próximo") || lowerInput.includes("seguir") || lowerInput.includes("agora") || lowerInput.includes("fazer")) {
    if (todayExercises && todayExercises.exercises.length > 0) {
      return `Já completaste ${todayExercises.exercises.length} exercícios hoje! Continua com o próximo da lista, mantendo boa forma e respiração controlada. Se já terminaste tudo, foca na recuperação!`;
    }
    return "Começa pelo primeiro exercício da tua lista. Aquecimento de 5-10 min, depois foca na técnica antes de aumentar a carga!";
  }
  
  // Positive feedback
  if (lowerInput.includes("bem") || lowerInput.includes("ótimo") || lowerInput.includes("bom") || lowerInput.includes("consegui")) {
    const todayCount = todayExercises?.exercises.length || 0;
    if (todayCount > 0) {
      return `Fantástico! Com ${todayCount} exercícios feitos hoje e ${stats.totalSessions} sessões no total, estás a evoluir muito bem!\n\nMantém essa consistência - é ela que traz resultados!`;
    }
    return "Fico feliz! A consistência é a chave. Continua assim e os resultados vão aparecer!";
  }
  
  // Muscles trained
  if (lowerInput.includes("músculo") || lowerInput.includes("treinei") || lowerInput.includes("treino mais")) {
    if (stats.mostTrainedMuscles.length > 0) {
      let response = "Análise dos teus treinos:\n\n";
      stats.mostTrainedMuscles.forEach((m, i) => {
        response += `${i + 1}. ${m.muscle}: ${m.count} sessões\n`;
      });
      
      if (stats.mostTrainedMuscles.length >= 2) {
        const top = stats.mostTrainedMuscles[0].count;
        const second = stats.mostTrainedMuscles[1].count;
        if (top > second * 2) {
          response += `\nAtenção: Estás a treinar muito mais ${stats.mostTrainedMuscles[0].muscle}. Considera equilibrar com outros grupos!`;
        }
      }
      
      return response;
    }
    return "Ainda não tenho dados suficientes. Continua a registar os teus treinos e vou analisar os padrões!";
  }
  
  // Default response
  return `Entendi! Com base no teu histórico de ${stats.totalSessions} sessões${stats.currentStreak > 0 ? ` e streak de ${stats.currentStreak} dias` : ""}, estou aqui para te ajudar. Pergunta-me sobre o teu progresso, dicas de recuperação, ou sugestões de treino!`;
}

const Chat = () => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");
  const [showWorkoutContext, setShowWorkoutContext] = useState(true);
  const [showHistorySheet, setShowHistorySheet] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const {
    conversations,
    currentConversationId,
    createConversation,
    addMessage,
    getCurrentConversation,
    loadConversation,
    deleteConversation,
    clearCurrentConversation,
    setCurrentConversationId,
  } = useChatHistory();

  // Load workout stats
  const workoutStats = useMemo(() => getWorkoutStats(), []);

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

  // Build initial message based on workout context and history
  const getInitialMessage = (): ChatMessage => {
    const hasHistory = workoutStats.totalSessions > 0;
    const hasTodayExercises = completedExercisesData && completedExercisesData.exercises.length > 0;

    if (hasTodayExercises && hasHistory) {
      const exerciseList = completedExercisesData!.exercises.slice(0, 3).join(", ");
      const moreCount = completedExercisesData!.exercises.length > 3 
        ? ` e mais ${completedExercisesData!.exercises.length - 3}` 
        : "";
      
      let streakMessage = "";
      if (workoutStats.currentStreak > 1) {
        streakMessage = `\n\nEstás numa streak de ${workoutStats.currentStreak} dias consecutivos! `;
      }
      
      return {
        id: "1",
        text: `Olá! Vi que já completaste ${completedExercisesData!.exercises.length} exercício(s) hoje: ${exerciseList}${moreCount}. Excelente trabalho!${streakMessage}\n\nCom ${workoutStats.totalSessions} sessões no teu histórico, posso analisar o teu progresso e dar-te sugestões personalizadas. Como te posso ajudar?`,
        isUser: false,
        timestamp: Date.now(),
      };
    } else if (hasHistory) {
      return {
        id: "1",
        text: `Olá! Tens ${workoutStats.totalSessions} sessões registadas. ${workoutStats.currentStreak > 0 ? `Streak atual: ${workoutStats.currentStreak} dias!` : ""}\n\nPosso analisar o teu progresso, sugerir exercícios ou ajudar-te com o treino de hoje. O que precisas?`,
        isUser: false,
        timestamp: Date.now(),
      };
    } else if (hasTodayExercises) {
      const exerciseList = completedExercisesData!.exercises.join(", ");
      return {
        id: "1",
        text: `Olá! Vi que já completaste ${completedExercisesData!.exercises.length} exercício(s) hoje: ${exerciseList}. Excelente trabalho!\n\nComo te sentes? Posso ajudar-te com dicas de recuperação ou sugerir variações.`,
        isUser: false,
        timestamp: Date.now(),
      };
    }
    
    return {
      id: "1",
      text: "Olá! Sou o teu assistente de treino. Começa a marcar exercícios como concluídos e vou acompanhar o teu progresso ao longo do tempo. Como posso ajudar-te hoje?",
      isUser: false,
      timestamp: Date.now(),
    };
  };

  // Load conversation or start fresh
  useEffect(() => {
    if (currentConversationId) {
      const conv = getCurrentConversation();
      if (conv) {
        setMessages(conv.messages);
        return;
      }
    }
    // Start with initial message for new conversation
    setMessages([getInitialMessage()]);
  }, [currentConversationId]);

  const handleSend = (text?: string) => {
    const messageText = text || inputValue;
    if (!messageText.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: Date.now(),
    };

    // If no current conversation, create one
    let convId = currentConversationId;
    if (!convId) {
      const initialMsg = getInitialMessage();
      convId = createConversation(initialMsg);
    }

    addMessage(convId, userMessage);
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    // Simulate AI response with full context
    setTimeout(() => {
      const responseText = generateAIResponse(messageText, workoutStats, completedExercisesData);
      
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        isUser: false,
        timestamp: Date.now(),
      };
      
      addMessage(convId!, aiResponse);
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  const handleQuickCommand = (command: string) => {
    handleSend(command);
  };

  const handleNewConversation = () => {
    clearCurrentConversation();
    setMessages([getInitialMessage()]);
  };

  const handleSelectConversation = (id: string) => {
    loadConversation(id);
  };

  const quickCommands = [
    { label: "Sugere treino", icon: Dumbbell, command: "Sugere-me um treino para hoje" },
    { label: "Recuperação", icon: Heart, command: "Dá-me dicas de recuperação" },
    { label: "Substituir", icon: RefreshCw, command: "Quero substituir um exercício" },
    { label: "Progresso", icon: Progress, command: "Mostra o meu progresso" },
    { label: "Nutrição", icon: Utensils, command: "Dicas de nutrição" },
    { label: "Descanso", icon: Moon, command: "Dicas de sono e descanso" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#0d0d0d]">
      {/* Header - ChatGPT style */}
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-[#0d0d0d]">
        {/* Left - History menu */}
        <button
          onClick={() => setShowHistorySheet(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/5"
        >
          <Menu className="h-5 w-5 text-white" />
        </button>

        {/* Center - Title */}
        <div className="flex items-center gap-1">
          <h1 className="text-base font-semibold text-white">LiftMate IA</h1>
          {conversations.length > 0 && (
            <span className="text-xs text-white/40">{conversations.length}</span>
          )}
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-1">
          {/* New chat */}
          <button
            onClick={handleNewConversation}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/5"
          >
            <Plus className="h-5 w-5 text-white" />
          </button>

          {/* Quick commands dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/5">
                <MoreHorizontal className="h-5 w-5 text-white" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[#1a1a1a] border-white/10">
              {quickCommands.map((cmd) => (
                <DropdownMenuItem
                  key={cmd.label}
                  onClick={() => handleQuickCommand(cmd.command)}
                  className="flex items-center gap-2 text-white hover:bg-white/10 focus:bg-white/10"
                >
                  <cmd.icon className="h-4 w-4 text-white/60" />
                  <span>{cmd.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Stats Banner */}
      <AnimatePresence>
        {showWorkoutContext && workoutStats.totalSessions > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-white/10"
          >
            <div className="bg-white/5 px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-white">O teu progresso</p>
                <button
                  onClick={() => setShowWorkoutContext(false)}
                  className="text-xs text-white/50 hover:text-white"
                >
                  Ocultar
                </button>
              </div>
              
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex items-center gap-2 rounded-lg bg-white/5 p-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-white/50">Total</p>
                    <p className="text-sm font-bold text-white">{workoutStats.totalSessions}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-white/5 p-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-xs text-white/50">Streak</p>
                    <p className="text-sm font-bold text-white">{workoutStats.currentStreak}d</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-white/5 p-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-xs text-white/50">Taxa</p>
                    <p className="text-sm font-bold text-white">{workoutStats.averageCompletionRate}%</p>
                  </div>
                </div>
              </div>
              
              {/* Today's exercises */}
              {completedExercisesData && completedExercisesData.exercises.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {completedExercisesData.exercises.slice(0, 4).map((exercise, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {exercise}
                    </span>
                  ))}
                  {completedExercisesData.exercises.length > 4 && (
                    <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/50">
                      +{completedExercisesData.exercises.length - 4}
                    </span>
                  )}
                </div>
              )}
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
                    ? "bg-white text-[#0d0d0d]"
                    : "bg-[#1a1a1a] text-white border border-white/10"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-white/10 p-4 pb-8 safe-area-bottom bg-[#0d0d0d]">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Escreve a tua mensagem..."
            className="flex-1 rounded-2xl bg-[#1a1a1a] border border-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputValue.trim()}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0d0d0d] transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* History Sheet */}
      <ChatHistorySheet
        open={showHistorySheet}
        onOpenChange={setShowHistorySheet}
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={deleteConversation}
        onNewConversation={handleNewConversation}
      />
    </div>
  );
};

export default Chat;
