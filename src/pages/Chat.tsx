import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Send, ArrowLeft, Loader2, MicOff, Volume2, Activity, Clock, Menu, AudioLines } from "lucide-react";
import { HexBadge } from "@/components/ui/HexBadge";
import { motion } from "framer-motion";
import { useChatHistory, ChatMessage } from "@/hooks/useChatHistory";
import { ChatHistorySheet } from "@/components/chat/ChatHistorySheet";

import { QuickCommandsSheet } from "@/components/chat/QuickCommandsSheet";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { useAuth } from "@/hooks/useAuth";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useSubscriptionContext } from "@/contexts/SubscriptionContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { collectUserContext, formatContextForAI } from "@/utils/userContextCollector";
import { formatMemoryForAI, extractAndStoreFromMessage } from "@/lib/chatMemory";
import { executeActionsFromResponse, stripActionsFromText } from "@/lib/chatActions";
import { loadMemories, formatMemoriesForAI, detectAndSaveMemories } from "@/utils/chatMemory";
import { executeChatAction } from "@/utils/chatActions";

const thinkingStates = [
  "A pensar...",
  "A analisar o teu treino...",
  "A verificar a fadiga muscular...",
  "A calcular as tuas necessidades...",
  "A preparar a resposta..."
];

const Chat = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingText, setThinkingText] = useState("A pensar...");
  const thinkingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [showHistorySheet, setShowHistorySheet] = useState(false);
  const [showCommandsSheet, setShowCommandsSheet] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const {
    conversations,
    currentConversationId,
    createConversation,
    addMessage,
    getCurrentConversation,
    loadConversation,
    deleteConversation,
    clearCurrentConversation
  } = useChatHistory();

  const {
    isRecording,
    isTranscribing,
    isSpeaking,
    startRecording,
    stopRecording,
    cancelRecording,
    speakText,
    stopSpeaking
  } = useVoiceChat();

  const { settings: userSettings } = useUserSettings();
  const aiName = useMemo(() => userSettings?.ai_name || "LiftMate", [userSettings]);

  // ── Daily message limit ──────────────────────────────────
  const { isSubscriptionValid } = useSubscriptionContext();
  const [dailyCount, setDailyCount] = useState<number>(0);

  useEffect(() => {
    if (!user?.id) return;
    const today = new Date().toISOString().split("T")[0];
    const key = `liftmate_chat_usage_${user.id}_${today}`;
    const saved = JSON.parse(localStorage.getItem(key) || '{"count":0}');
    setDailyCount(saved.count as number);
  }, [user?.id]);

  const dailyLimit = isSubscriptionValid() ? 50 : 20;
  const usagePct = Math.round((dailyCount / dailyLimit) * 100);

  const incrementUsage = () => {
    if (!user?.id) return;
    const today = new Date().toISOString().split("T")[0];
    const key = `liftmate_chat_usage_${user.id}_${today}`;
    const next = dailyCount + 1;
    localStorage.setItem(key, JSON.stringify({ count: next, date: today }));
    setDailyCount(next);
  };

  const bannerVariant: "hidden" | "warning" | "danger" | "limit" =
    usagePct >= 100 ? "limit" :
    usagePct >= 95  ? "danger" :
    usagePct >= 85  ? "hidden" :
    usagePct >= 80  ? "warning" : "hidden";
  // ─────────────────────────────────────────────────────────

  // Read prefill message from navigation state (e.g. from FatigueAlertCard)
  useEffect(() => {
    const navState = location.state as { prefill?: string } | null;
    if (navState?.prefill) {
      setInputValue(navState.prefill);
      // Clear state so it doesn't repopulate on re-renders
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    setIsThinking(true);
    setThinkingText("A pensar...");
    let thinkingIndex = 0;
    thinkingIntervalRef.current = setInterval(() => {
      thinkingIndex = (thinkingIndex + 1) % thinkingStates.length;
      setThinkingText(thinkingStates[thinkingIndex]);
    }, 1800);

    const apiMessages = messages.map((m) => ({
      role: m.isUser ? "user" : "assistant",
      content: m.text
    }));
    apiMessages.push({ role: "user", content: userMessageText });

    const userContext = await collectUserContext(user?.id);
    const memories = user?.id ? await loadMemories(user.id) : [];
    const formattedContext = formatContextForAI(userContext)
      + (user?.id ? formatMemoryForAI(user.id) : "")
      + formatMemoriesForAI(memories);

    const userName = userContext.profile.userName || user?.email?.split("@")[0] || "atleta";
    const systemPrompt = `És o ${aiName}, assistente pessoal de fitness do ${userName}.

PERSONALIDADE:
- Fala como um amigo próximo que percebe de fitness — informal, direto, natural
- Usa palavras do dia a dia: "olha", "então", "percebi", "repara", "deixa eu te dizer", "acredita", "vai ser fixe", "tás bom?"
- NUNCA uses linguagem clínica ou formal: nunca "deve consumir", "recomenda-se", "é aconselhável", "proteínas são essenciais"
- Faz referência SEMPRE aos dados reais do utilizador — nunca respondas de forma genérica
- Quando vês um padrão nos dados diz-o diretamente: "olha, reparei que..."
- Máximo 3-4 frases por resposta — vai direto ao assunto
- Usa o nome do utilizador naturalmente, não em todas as frases

DADOS REAIS DISPONÍVEIS:
${formattedContext}

REGRAS DE OURO:
- Se o utilizador perguntar sobre alimentação → usa os dados de fadiga + treino do dia para personalizar
- Se perguntar sobre treino → referencia a última sessão e os músculos trabalhados
- Se perguntar sobre recuperação → menciona os dias desde o último treino por músculo
- Se não tiveres dados suficientes → pergunta uma coisa específica para personalizar melhor
- NUNCA dás uma lista de bullet points — fala em texto corrido como uma conversa normal
- NUNCA começas com "Claro!", "Ótima pergunta!", "Com certeza!" — vai direto ao ponto

EXEMPLOS DE COMO FALAR:

❌ ERRADO: "Deve consumir carboidratos complexos e proteínas de alta qualidade para otimizar a recuperação muscular."

✅ CERTO: "Então, vi que fizeste perna ontem com um volume alto — tás com fadiga de certeza. Come arroz com frango ou batata-doce com atum, algo simples mas que te vai ajudar a recuperar. E bebe água — a tua hidratação hoje ainda tá baixa."

❌ ERRADO: "É recomendável realizar exercícios de mobilidade para facilitar a recuperação."

✅ CERTO: "Olha, os teus ombros e costas já estão recuperados mas as pernas ainda precisam de mais um dia. Hoje faz só mobilidade leve ou vai descansar mesmo — não vale a pena forçar."

REGRA CRÍTICA — AÇÕES OBRIGATÓRIAS:
Quando o utilizador pedir para mudar, reagendar, alterar ou criar algo no plano de treino ou metas, OBRIGATORIAMENTE inclui na tua resposta um bloco de ação no formato EXATO abaixo — sem espaços extra, sem quebras de linha dentro do bloco:

Para reagendar treino: [ACTION:rescheduleWorkout:{"from":"Segunda-feira","to":"Quarta-feira"}]
Para atualizar plano semanal: [ACTION:updateSchedule:{"Segunda-feira":["Peito","Bíceps"],"Terça-feira":["Descanso"]}]
Para criar meta: [ACTION:addGoal:{"description":"descrição da meta","targetDate":"2026-06-01","category":"força"}]

REGRAS ABSOLUTAS SOBRE AÇÕES:
- O bloco [ACTION:...] DEVE aparecer na resposta sempre que o utilizador pedir uma alteração ao plano
- O bloco é removido automaticamente antes de mostrar ao utilizador — ele nunca o vê
- Se não incluíres o bloco, a ação NÃO é executada e o utilizador fica frustrado
- Coloca SEMPRE o bloco no final da tua resposta, numa linha separada
- Usa os nomes dos dias em português completo: "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"`;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authHeaders: Record<string, string> = {};
      if (session?.access_token) {
        authHeaders["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ messages: apiMessages, context: systemPrompt })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) toast.error("Limite de pedidos excedido. Tenta novamente em alguns segundos.");else
        if (response.status === 402) toast.error("Créditos esgotados. Adiciona mais créditos na área de definições.");else
        toast.error(errorData.error || "Erro ao comunicar com a IA");
        setIsLoading(false);
        return;
      }

      // Resposta recebida — para o estado de thinking
      setIsThinking(false);
      if (thinkingIntervalRef.current) {
        clearInterval(thinkingIntervalRef.current);
        thinkingIntervalRef.current = null;
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";
      let streamDone = false;

      const aiMessageId = (Date.now() + 1).toString();
      const initialAiMessage: ChatMessage = { id: aiMessageId, text: "", isUser: false, timestamp: Date.now() };
      setMessages((prev) => [...prev, initialAiMessage]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {streamDone = true;break;}
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta;
            const content = delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              const displayText = stripActionsFromText(assistantContent)
                .replace(/\[ACTION:\w+:[^\]]*(?:\[[^\]]*\][^\]]*)*\]/g, "").trim();
              setMessages((prev) => prev.map((m, i) => i === prev.length - 1 ? { ...m, text: displayText } : m));
            } else if (delta?.tool_calls?.length > 0) {
              setThinkingText("A pesquisar na web...");
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

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
            if (content) assistantContent += content;
          } catch {}
        }
      }

      if (assistantContent) {
        // Strip both action formats before displaying to user
        const displayText = stripActionsFromText(assistantContent)
          .replace(/\[ACTION:\w+:[^\]]*(?:\[[^\]]*\][^\]]*)*\]/g, "")
          .trim();

        addMessage(conversationId, { id: aiMessageId, text: displayText, isUser: false, timestamp: Date.now() });

        // Final clean bubble update
        setMessages((prev) =>
          prev.map((m) => (m.id === aiMessageId ? { ...m, text: displayText } : m))
        );

        // Execute <!--ACTION:--> format (lib/chatActions: water, meals, reminders, navigate)
        const libResults = await executeActionsFromResponse(assistantContent, navigate);
        libResults.forEach((r) => {
          if (!r.success) console.warn("[ChatAction] lib failed:", r.action, r.message);
        });

        // Execute [ACTION:TYPE:{JSON}] format (utils/chatActions: schedule, goals)
        if (user?.id && /\[ACTION:\w+:/.test(assistantContent)) {
          const result = await executeChatAction(user.id, assistantContent);
          if (result) toast.success(result.message);
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Erro ao comunicar com a IA. Tenta novamente.");
      setMessages((prev) => prev.filter((m) => m.text !== ""));
    } finally {
      setIsLoading(false);
      setIsThinking(false);
      if (thinkingIntervalRef.current) {
        clearInterval(thinkingIntervalRef.current);
        thinkingIntervalRef.current = null;
      }
    }
  };

  const handleSend = async (text?: string) => {
    const messageText = text || inputValue;
    if (!messageText.trim() || isLoading) return;

    if (usagePct >= 100) {
      toast.error(`Atingiste o limite de ${dailyLimit} mensagens diárias. Volta amanhã!`);
      return;
    }

    const userMessage: ChatMessage = { id: Date.now().toString(), text: messageText, isUser: true, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    incrementUsage();

    // Auto-extract facts (localStorage) + persist ao Supabase (chat_memory)
    if (user?.id) {
      extractAndStoreFromMessage(user.id, messageText);
      detectAndSaveMemories(user.id, messageText);
    }

    let convId = currentConversationId;
    if (!convId) {
      convId = await createConversation(userMessage);
      if (!convId) {toast.error("Erro ao criar conversa. Faz login para guardar o histórico.");return;}
    } else {
      addMessage(convId, userMessage);
    }
    streamChat(messageText, convId);
  };

  const handleNewConversation = () => {
    clearCurrentConversation();
    setMessages([]);
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-black">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A2A] bg-black">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/5">
          
          <ArrowLeft className="h-5 w-5 text-[#F3F4F6]" />
        </button>

        <div className="flex items-center gap-2">
          <HexBadge label="CH" size={30} />
          <Activity className="h-4 w-4 text-[#F3F4F6]" />
          <h1 className="text-base font-semibold text-[#F3F4F6]">{aiName} AI</h1>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowHistorySheet(true)}
            className="flex h-10 items-center gap-1.5 rounded-full px-2 hover:bg-white/5">
            
            <Clock className="h-4 w-4 text-[#F3F4F6]" />
            <span className="text-xs text-[#F3F4F6]/70">Histórico</span>
          </button>
          <button
            onClick={() => setShowCommandsSheet(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/5">
            
            <Menu className="h-5 w-5 text-[#F3F4F6]" />
          </button>
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 bg-black">
        <div className="flex flex-col gap-4">
          {messages.length === 0 &&
          <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#1A1A1A]">
                <Activity className="h-8 w-8 text-[#F3F4F6]" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-[#F3F4F6]">{aiName} AI</h2>
              <p className="max-w-xs text-sm text-white/40">
                Treino, nutrição, recuperação e estratégia personalizada.
              </p>
            </div>
          }

          {messages.map((message) =>
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}>
            
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.isUser ? "bg-[#1A1A1A]" : ""}`}>
                <p className="text-sm leading-relaxed whitespace-pre-line text-[#F3F4F6]">
                  {message.text ||
                <span className="flex items-center gap-1">
                      {[0, 1, 2].map((i) =>
                  <motion.span
                    key={i}
                    className="h-2 w-2 rounded-full bg-[#3B82F6]"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }} />

                  )}
                    </span>
                }
                </p>
                {!message.isUser && message.text &&
              <button
                onClick={() => isSpeaking ? stopSpeaking() : speakText(message.text)}
                className="mt-2 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
                disabled={isTranscribing}>
                
                    {isSpeaking ?
                <div className="flex items-center gap-0.5 h-3.5">
                        {[0, 1, 2].map((i) =>
                  <motion.div
                    key={i}
                    className="w-0.5 bg-white/50 rounded-full"
                    animate={{ height: ["4px", "12px", "4px"] }}
                    transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.15 }} />

                  )}
                      </div> :

                <Volume2 className="h-3.5 w-3.5" />
                }
                    <span>{isSpeaking ? "A reproduzir..." : "Ouvir"}</span>
                  </button>
              }
              </div>
            </motion.div>
          )}
          {isThinking && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div style={{ maxWidth: '85%' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', marginBottom: 4, paddingLeft: 4 }}>
                  ✦ {aiName}
                </div>
                <div style={{
                  background: '#141414',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '18px 18px 18px 4px',
                  padding: '14px 18px',
                  display: 'flex', alignItems: 'center', gap: 10
                }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.4)',
                        animation: `dotPulse 1.4s ease-in-out ${i * 0.2}s infinite`
                      }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
                    {thinkingText}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Daily usage banner */}
      {bannerVariant !== "hidden" && (
        <div style={{
          margin: "0 16px 8px",
          padding: "10px 14px",
          borderRadius: 12,
          background: bannerVariant === "limit"
            ? "rgba(239,68,68,0.12)"
            : bannerVariant === "danger"
            ? "rgba(239,68,68,0.08)"
            : "rgba(251,191,36,0.08)",
          border: `1px solid ${bannerVariant === "limit" || bannerVariant === "danger" ? "rgba(239,68,68,0.25)" : "rgba(251,191,36,0.2)"}`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{
              fontSize: 12, fontWeight: 600,
              color: bannerVariant === "limit" || bannerVariant === "danger" ? "rgba(239,68,68,0.9)" : "rgba(251,191,36,0.9)",
            }}>
              {bannerVariant === "limit"
                ? `Limite diário atingido (${dailyLimit}/${dailyLimit})`
                : `${dailyCount}/${dailyLimit} mensagens hoje`}
            </span>
            {bannerVariant === "limit" && !isSubscriptionValid() && (
              <button
                onClick={() => navigate("/paywall")}
                style={{
                  fontSize: 11, fontWeight: 700, color: "#2563EB",
                  background: "none", border: "none", cursor: "pointer", padding: 0,
                }}
              >
                Subscrever →
              </button>
            )}
          </div>
          <div style={{ height: 3, borderRadius: 99, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${Math.min(usagePct, 100)}%`,
              borderRadius: 99,
              background: bannerVariant === "limit" || bannerVariant === "danger" ? "#EF4444" : "#FBBF24",
              transition: "width 0.3s ease",
            }} />
          </div>
          {bannerVariant === "limit" && (
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 6 }}>
              {isSubscriptionValid() ? "O limite reinicia à meia-noite." : "Subscreve para aumentar o limite para 50/dia."}
            </p>
          )}
        </div>
      )}

      {/* Bottom input bar */}
      <div className="px-4 pb-8 pt-3 safe-area-bottom bg-black">
        {/* Recording indicator */}
        {isRecording &&
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 flex items-center justify-center gap-3">
          
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) =>
            <motion.div
              key={i}
              className="w-1 bg-red-500 rounded-full"
              animate={{ height: ["8px", "20px", "8px"] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }} />

            )}
            </div>
            <span className="text-sm text-red-400 font-medium">A gravar...</span>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) =>
            <motion.div
              key={i}
              className="w-1 bg-red-500 rounded-full"
              animate={{ height: ["8px", "20px", "8px"] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: (4 - i) * 0.1 }} />

            )}
            </div>
          </motion.div>
        }

        {isTranscribing &&
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-3 flex items-center justify-center gap-2 text-white/60">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <Loader2 className="h-4 w-4" />
            </motion.div>
            <span className="text-sm">A transcrever...</span>
          </motion.div>
        }

        {/* Pill input */}
        <div className="flex items-center gap-2 rounded-full bg-[#1A1A1A]/80 border border-white/10 pl-5 pr-1.5 py-1.5">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={usagePct >= 100 ? "Limite diário atingido — volta amanhã" : isRecording ? "A gravar..." : "Perguntar ao chat..."}
            disabled={isLoading || isRecording || usagePct >= 100}
            className="flex-1 bg-transparent text-sm text-[#F3F4F6] placeholder:text-white/30 focus:outline-none disabled:opacity-50" />
          

          <motion.button
            onClick={async () => {
              if (isRecording) {
                const text = await stopRecording();
                if (text) setInputValue(text);
              } else {
                startRecording();
              }
            }}
            disabled={isLoading || isTranscribing}
            whileTap={{ scale: 0.9 }}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
            isRecording ? "bg-red-500 text-white" : "text-white/40 hover:text-white/60"} disabled:opacity-50`
            }>
            
            {isRecording ?
            <MicOff className="h-4 w-4" /> :

            <AudioLines className="h-5 w-5" />
            }
          </motion.button>

          <motion.button
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isLoading || isRecording || usagePct >= 100}
            whileTap={{ scale: 0.95 }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-white disabled:opacity-40">
            
            {isLoading ?
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <Loader2 className="h-4 w-4" />
              </motion.div> :

            <Send className="h-4 w-4" />
            }
          </motion.button>
        </div>
      </div>

      {/* Sheets */}
      <ChatHistorySheet
        open={showHistorySheet}
        onOpenChange={setShowHistorySheet}
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={(id) => loadConversation(id)}
        onDeleteConversation={deleteConversation}
        onNewConversation={handleNewConversation} />
      
      <QuickCommandsSheet
        open={showCommandsSheet}
        onOpenChange={setShowCommandsSheet}
        onCommand={(cmd) => handleSend(cmd)} />

    </div>);

};

export default Chat;