import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Send, ArrowLeft, Menu, Plus, MoreHorizontal, Dumbbell, Heart, RefreshCw, TrendingUp as Progress, Utensils, Moon, Loader2, Mic, MicOff, Volume2, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { getWorkoutStats } from "@/data/workoutHistory";
import { useChatHistory, ChatMessage } from "@/hooks/useChatHistory";
import { ChatHistorySheet } from "@/components/chat/ChatHistorySheet";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface CompletedExercisesData {
  date: string;
  exercises: string[];
  workout: string | null;
  muscleGroups?: string[];
}

const Chat = () => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [showHistorySheet, setShowHistorySheet] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Continuous conversation mode
  const [continuousMode, setContinuousMode] = useState(() => {
    const saved = localStorage.getItem("liftmate_continuous_mode");
    return saved === "true";
  });

  const {
    conversations,
    currentConversationId,
    createConversation,
    addMessage,
    getCurrentConversation,
    loadConversation,
    deleteConversation,
    clearCurrentConversation,
  } = useChatHistory();

  const {
    isRecording,
    isTranscribing,
    isSpeaking,
    startRecording,
    stopRecording,
    cancelRecording,
    speakText,
    stopSpeaking,
  } = useVoiceChat();

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

  // Load onboarding data
  const onboardingData = useMemo(() => {
    const saved = localStorage.getItem("liftmate_onboarding");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  }, []);

  // Load AI name
  const aiName = useMemo(() => {
    return localStorage.getItem("liftmate_ai_name") || "LiftMate";
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load conversation or start fresh
  useEffect(() => {
    if (currentConversationId) {
      const conv = getCurrentConversation();
      if (conv) {
        setMessages(conv.messages);
        return;
      }
    }
    setMessages([]);
  }, [currentConversationId]);

  const streamChat = async (userMessageText: string, conversationId: string) => {
    setIsLoading(true);
    
    // Prepare messages for API (convert to OpenAI format)
    const apiMessages = messages.map(m => ({
      role: m.isUser ? 'user' : 'assistant',
      content: m.text,
    }));
    apiMessages.push({ role: 'user', content: userMessageText });

    // Prepare context
    const context = {
      stats: workoutStats,
      todayExercises: completedExercisesData,
      onboarding: onboardingData,
    };

    try {
      // Obter token do utilizador para evitar 401 / Invalid JWT
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const authHeaders: Record<string, string> = {};
      if (session?.access_token) {
        authHeaders["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify({ messages: apiMessages, context }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          toast.error("Limite de pedidos excedido. Tenta novamente em alguns segundos.");
        } else if (response.status === 402) {
          toast.error("Créditos esgotados. Adiciona mais créditos na área de definições.");
        } else {
          toast.error(errorData.error || "Erro ao comunicar com a IA");
        }
        setIsLoading(false);
        return;
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";
      let streamDone = false;

      // Create initial assistant message
      const aiMessageId = (Date.now() + 1).toString();
      const initialAiMessage: ChatMessage = {
        id: aiMessageId,
        text: "",
        isUser: false,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, initialAiMessage]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        // Process line-by-line
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              // Update the last message with new content
              setMessages(prev => 
                prev.map((m, i) => 
                  i === prev.length - 1 ? { ...m, text: assistantContent } : m
                )
              );
            }
          } catch {
            // Incomplete JSON, put it back
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
            }
          } catch { /* ignore */ }
        }
      }

      // Save final message to history
      if (assistantContent) {
        const finalAiMessage: ChatMessage = {
          id: aiMessageId,
          text: assistantContent,
          isUser: false,
          timestamp: Date.now(),
        };
        addMessage(conversationId, finalAiMessage);
      }

    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Erro ao comunicar com a IA. Tenta novamente.");
      // Remove the empty assistant message if there was an error
      setMessages(prev => prev.filter(m => m.text !== ""));
    } finally {
      setIsLoading(false);
      
      // Auto-start recording in continuous mode
      if (continuousMode && !isRecording) {
        setTimeout(() => {
          startRecording();
        }, 500);
      }
    }
  };

  const handleSend = async (text?: string) => {
    const messageText = text || inputValue;
    if (!messageText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    // If no current conversation, create one
    let convId = currentConversationId;
    if (!convId) {
      convId = await createConversation(userMessage);
      if (!convId) {
        toast.error("Erro ao criar conversa. Faz login para guardar o histórico.");
        return;
      }
    } else {
      addMessage(convId, userMessage);
    }

    // Stream AI response
    streamChat(messageText, convId);
  };

  const handleQuickCommand = (command: string) => {
    handleSend(command);
  };

  const handleNewConversation = () => {
    clearCurrentConversation();
    setMessages([]);
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
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-[#0d0d0d]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/5"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <button
            onClick={() => setShowHistorySheet(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/5"
          >
            <Menu className="h-5 w-5 text-white" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <h1 className="text-base font-semibold text-white">{aiName}</h1>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleNewConversation}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/5"
          >
            <Plus className="h-5 w-5 text-white" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/5">
                <MoreHorizontal className="h-5 w-5 text-white" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#1a1a1a] border-white/10">
              {/* Continuous mode toggle */}
              <div className="flex items-center justify-between px-2 py-2">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-white/60" />
                  <span className="text-sm text-white">Conversa contínua</span>
                </div>
                <Switch
                  checked={continuousMode}
                  onCheckedChange={(checked) => {
                    setContinuousMode(checked);
                    localStorage.setItem("liftmate_continuous_mode", String(checked));
                    toast.success(checked ? "Modo contínuo ativado" : "Modo contínuo desativado");
                  }}
                />
              </div>
              <DropdownMenuSeparator className="bg-white/10" />
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="flex flex-col gap-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                <Dumbbell className="h-8 w-8 text-white/40" />
              </div>
              <h2 className="mb-2 text-lg font-medium text-white">Olá! Sou o {aiName}</h2>
              <p className="max-w-xs text-sm text-white/60">
                Pergunta-me sobre treinos, nutrição, recuperação ou o teu progresso!
              </p>
            </div>
          )}
          
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.isUser
                    ? "bg-white text-[#0d0d0d]"
                    : "bg-[#1a1a1a] text-white border border-white/10"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-line">
                  {message.text || (
                    <span className="flex items-center gap-2 text-white/60">
                      <motion.span 
                        className="flex items-center gap-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            className="h-2 w-2 rounded-full bg-primary"
                            animate={{
                              scale: [1, 1.3, 1],
                              opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                              duration: 0.8,
                              repeat: Infinity,
                              delay: i * 0.2,
                              ease: "easeInOut",
                            }}
                          />
                        ))}
                      </motion.span>
                    </span>
                  )}
                </p>
                {/* Voice button for AI messages with animation */}
                {!message.isUser && message.text && (
                  <motion.button
                    onClick={() => isSpeaking ? stopSpeaking() : speakText(message.text)}
                    className="mt-2 flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
                    disabled={isTranscribing}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isSpeaking ? (
                      <>
                        {/* Animated sound bars for playing state */}
                        <div className="flex items-center gap-0.5 h-3.5 w-3.5">
                          {[...Array(3)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="w-0.5 bg-white/60 rounded-full"
                              animate={{
                                height: ["4px", "12px", "4px"],
                              }}
                              transition={{
                                duration: 0.4,
                                repeat: Infinity,
                                delay: i * 0.15,
                                ease: "easeInOut",
                              }}
                            />
                          ))}
                        </div>
                        <span>A reproduzir...</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-3.5 w-3.5" />
                        <span>Ouvir</span>
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-white/10 p-4 pb-8 safe-area-bottom bg-[#0d0d0d]">
        {/* Recording indicator with enhanced animation */}
        {isRecording && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 flex items-center justify-center gap-3"
          >
            {/* Animated sound waves */}
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-red-500 rounded-full"
                  animate={{
                    height: ["8px", "20px", "8px"],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
            <span className="text-sm text-red-400 font-medium">A gravar...</span>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-red-500 rounded-full"
                  animate={{
                    height: ["8px", "20px", "8px"],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: (4 - i) * 0.1,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
        
        {isTranscribing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-3 flex items-center justify-center gap-2 text-white/60"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="h-4 w-4" />
            </motion.div>
            <span className="text-sm">A transcrever...</span>
          </motion.div>
        )}
        
        <div className="flex items-center gap-2">
          {/* Voice recording button with animations */}
          <motion.button
            onClick={async () => {
              if (isRecording) {
                const text = await stopRecording();
                if (text) {
                  setInputValue(text);
                }
              } else {
                startRecording();
              }
            }}
            disabled={isLoading || isTranscribing}
            whileTap={{ scale: 0.9 }}
            animate={isRecording ? {
              scale: [1, 1.1, 1],
              boxShadow: ["0 0 0 0 rgba(239,68,68,0.4)", "0 0 0 12px rgba(239,68,68,0)", "0 0 0 0 rgba(239,68,68,0.4)"],
            } : {}}
            transition={isRecording ? { duration: 1.5, repeat: Infinity } : {}}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
              isRecording 
                ? "bg-red-500 text-white" 
                : "bg-[#1a1a1a] text-white/60 hover:text-white border border-white/10"
            } disabled:opacity-50`}
          >
            {isRecording ? (
              <motion.div
                animate={{ scale: [1, 0.8, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <MicOff className="h-5 w-5" />
              </motion.div>
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </motion.button>
          
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={isRecording ? "A ouvir..." : "Escreve ou grava..."}
            disabled={isLoading || isRecording}
            className="flex-1 rounded-2xl bg-[#1a1a1a] border border-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50"
          />
          
          <motion.button
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isLoading || isRecording}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0d0d0d] disabled:opacity-50"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="h-5 w-5" />
              </motion.div>
            ) : (
              <Send className="h-5 w-5" />
            )}
          </motion.button>
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
