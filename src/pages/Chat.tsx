import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Send, ArrowLeft, Loader2, MicOff, Volume2, AudioLines, Activity, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useChatHistory, ChatMessage } from "@/hooks/useChatHistory";
import { ChatHistorySheet } from "@/components/chat/ChatHistorySheet";
import { QuickCommandsSheet } from "@/components/chat/QuickCommandsSheet";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { useAuth } from "@/hooks/useAuth";
import { useUserSettings } from "@/hooks/useUserSettings";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { collectUserContext, formatContextForAI } from "@/utils/userContextCollector";
import { SlidersHorizontal } from "lucide-react";

const Chat = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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

    const apiMessages = messages.map((m) => ({
      role: m.isUser ? "user" : "assistant",
      content: m.text
    }));
    apiMessages.push({ role: "user", content: userMessageText });

    const userContext = await collectUserContext(user?.id);
    const formattedContext = formatContextForAI(userContext);

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
          body: JSON.stringify({ messages: apiMessages, context: formattedContext })
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
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages((prev) => prev.map((m, i) => i === prev.length - 1 ? { ...m, text: assistantContent } : m));
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
        addMessage(conversationId, { id: aiMessageId, text: assistantContent, isUser: false, timestamp: Date.now() });
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Erro ao comunicar com a IA. Tenta novamente.");
      setMessages((prev) => prev.filter((m) => m.text !== ""));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (text?: string) => {
    const messageText = text || inputValue;
    if (!messageText.trim() || isLoading) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), text: messageText, isUser: true, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

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
    <div className="flex min-h-screen flex-col bg-[#0B0F14]">
      {/* Header - minimal */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#1F2937] bg-black">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/5">
          
          <ArrowLeft className="h-5 w-5 text-[#F3F4F6]" />
        </button>

        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#F3F4F6]" />
          <h1 className="text-base font-semibold text-[#F3F4F6]">{aiName} AI</h1>
        </div>

        <button
          onClick={() => setShowHistorySheet(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/5">
          
          <Clock className="h-5 w-5 text-[#F3F4F6]" />
        </button>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 bg-black">
        <div className="flex flex-col gap-4">
          {messages.length === 0 &&
          <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#1F2937]">
                <Activity className="h-8 w-8 text-[#F3F4F6]" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-[#F3F4F6] bg-black">{aiName} AI</h2>
              <p className="max-w-xs text-sm text-white/50">
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
            
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.isUser ? "bg-[#1F2937]" : ""}`}>
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
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bottom input bar */}
      <div className="border-t border-[#1F2937] p-4 pb-8 safe-area-bottom bg-black">
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

        {/* Text input */}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder={isRecording ? "A gravar..." : "Escreve uma mensagem..."}
          disabled={isLoading || isRecording}
          className="w-full rounded-2xl bg-[#1F2937] border border-white/10 px-4 py-3 text-[#F3F4F6] placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 disabled:opacity-50 mb-3" />
        

        {/* Action buttons row */}
        <div className="flex items-center justify-between">
          {/* Left - Menu icon */}
          <button
            onClick={() => setShowCommandsSheet(true)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1F2937] hover:bg-[#2a3444] transition-colors">
            
            <SlidersHorizontal className="h-5 w-5 text-white/60" />
          </button>

          {/* Right - Mic + Send grouped */}
          <div className="flex items-center gap-2">
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
              animate={
              isRecording ?
              {
                scale: [1, 1.1, 1],
                boxShadow: [
                "0 0 0 0 rgba(239,68,68,0.4)",
                "0 0 0 12px rgba(239,68,68,0)",
                "0 0 0 0 rgba(239,68,68,0.4)"]

              } :
              {}
              }
              transition={isRecording ? { duration: 1.5, repeat: Infinity } : {}}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
              isRecording ?
              "bg-red-500 text-white" :
              "bg-[#1F2937] text-white/60 hover:text-white"} disabled:opacity-50`
              }>
              
              {isRecording ?
              <motion.div animate={{ scale: [1, 0.8, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
                  <MicOff className="h-5 w-5" />
                </motion.div> :

              <AudioLines className="h-5 w-5" />
              }
            </motion.button>

            <motion.button
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isLoading || isRecording}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F3F4F6] text-[#0B0F14] disabled:opacity-40">
              
              {isLoading ?
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                  <Loader2 className="h-5 w-5" />
                </motion.div> :

              <Send className="h-5 w-5" />
              }
            </motion.button>
          </div>
        </div>
      </div>

      {/* History Sheet */}
      <ChatHistorySheet
        open={showHistorySheet}
        onOpenChange={setShowHistorySheet}
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={(id) => loadConversation(id)}
        onDeleteConversation={deleteConversation}
        onNewConversation={handleNewConversation} />
      

      {/* Quick Commands Sheet */}
      <QuickCommandsSheet
        open={showCommandsSheet}
        onOpenChange={setShowCommandsSheet}
        onCommand={(cmd) => handleSend(cmd)} />
      
    </div>);

};

export default Chat;