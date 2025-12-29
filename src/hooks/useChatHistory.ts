import { useState, useEffect } from 'react';

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'liftmate_chat_history';
const MAX_CONVERSATIONS = 20;

export function useChatHistory() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Load conversations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConversations(parsed);
      } catch (e) {
        console.error('Error loading chat history:', e);
      }
    }
  }, []);

  // Save conversations to localStorage
  const saveConversations = (convs: ChatConversation[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
    setConversations(convs);
  };

  // Create a new conversation
  const createConversation = (initialMessage: ChatMessage): string => {
    const id = Date.now().toString();
    const newConversation: ChatConversation = {
      id,
      title: 'Nova conversa',
      messages: [initialMessage],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updated = [newConversation, ...conversations].slice(0, MAX_CONVERSATIONS);
    saveConversations(updated);
    setCurrentConversationId(id);
    return id;
  };

  // Add message to current conversation
  const addMessage = (conversationId: string, message: ChatMessage) => {
    const updated = conversations.map(conv => {
      if (conv.id === conversationId) {
        const messages = [...conv.messages, message];
        // Update title based on first user message
        let title = conv.title;
        if (message.isUser && conv.messages.filter(m => m.isUser).length === 0) {
          title = message.text.slice(0, 40) + (message.text.length > 40 ? '...' : '');
        }
        return {
          ...conv,
          messages,
          title,
          updatedAt: Date.now(),
        };
      }
      return conv;
    });
    saveConversations(updated);
  };

  // Get current conversation
  const getCurrentConversation = (): ChatConversation | null => {
    return conversations.find(c => c.id === currentConversationId) || null;
  };

  // Load a conversation
  const loadConversation = (id: string) => {
    setCurrentConversationId(id);
  };

  // Delete a conversation
  const deleteConversation = (id: string) => {
    const updated = conversations.filter(c => c.id !== id);
    saveConversations(updated);
    if (currentConversationId === id) {
      setCurrentConversationId(null);
    }
  };

  // Clear current conversation (start fresh)
  const clearCurrentConversation = () => {
    setCurrentConversationId(null);
  };

  return {
    conversations,
    currentConversationId,
    createConversation,
    addMessage,
    getCurrentConversation,
    loadConversation,
    deleteConversation,
    clearCurrentConversation,
    setCurrentConversationId,
  };
}
