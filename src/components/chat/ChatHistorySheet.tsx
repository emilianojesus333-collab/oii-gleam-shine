import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ChatConversation } from "@/hooks/useChatHistory";
import { MessageSquare, Trash2, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useLanguage } from "@/hooks/useLanguage";

interface ChatHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversations: ChatConversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onNewConversation: () => void;
}

export const ChatHistorySheet = ({
  open,
  onOpenChange,
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
}: ChatHistorySheetProps) => {
  const { t } = useLanguage();
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return t("chatHistory.today");
    if (days === 1) return t("chatHistory.yesterday");
    if (days < 7) return format(date, "EEEE");
    return format(date, "d MMM");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[300px] bg-[#0d0d0d] border-white/10 p-0">
        <SheetHeader className="p-4 border-b border-white/10">
          <SheetTitle className="text-white text-left">{t("chatHistory.title")}</SheetTitle>
        </SheetHeader>

        <div className="p-4">
          <button
            onClick={() => {
              onNewConversation();
              onOpenChange(false);
            }}
            className="w-full flex items-center gap-3 rounded-xl bg-primary/20 border border-primary/30 p-3 text-primary hover:bg-primary/30 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span className="font-medium">{t("chatHistory.newConversation")}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {conversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/50 text-sm">{t("chatHistory.noConversations")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv, index) => (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`group relative rounded-xl p-3 cursor-pointer transition-colors ${
                    currentConversationId === conv.id
                      ? "bg-white/10 border border-white/20"
                      : "bg-white/5 border border-transparent hover:bg-white/10"
                  }`}
                  onClick={() => {
                    onSelectConversation(conv.id);
                    onOpenChange(false);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-4 w-4 text-white/50 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{conv.title}</p>
                      <p className="text-xs text-white/40 mt-1">
                        {formatDate(conv.updatedAt)} · {conv.messages.length} msgs
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                    >
                      <Trash2 className="h-4 w-4 text-white/50 hover:text-red-400" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
