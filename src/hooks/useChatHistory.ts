import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

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

const MAX_CONVERSATIONS = 50;

export function useChatHistory() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch conversations from Supabase
  const fetchConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data: convs, error: convsError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(MAX_CONVERSATIONS);

      if (convsError) throw convsError;

      if (!convs || convs.length === 0) {
        setConversations([]);
        setIsLoading(false);
        return;
      }

      // Fetch messages for all conversations
      const conversationIds = convs.map(c => c.id);
      const { data: msgs, error: msgsError } = await supabase
        .from('messages')
        .select('*')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: true });

      if (msgsError) throw msgsError;

      // Map conversations with their messages
      const conversationsWithMessages: ChatConversation[] = convs.map(conv => ({
        id: conv.id,
        title: conv.title,
        createdAt: new Date(conv.created_at).getTime(),
        updatedAt: new Date(conv.updated_at).getTime(),
        messages: (msgs || [])
          .filter(m => m.conversation_id === conv.id)
          .map(m => ({
            id: m.id,
            text: m.content,
            isUser: m.is_user,
            timestamp: new Date(m.created_at).getTime(),
          })),
      }));

      setConversations(conversationsWithMessages);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load conversations when user changes
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Create a new conversation
  const createConversation = useCallback(async (initialMessage: ChatMessage): Promise<string> => {
    if (!user) return '';

    try {
      // Create conversation
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title: initialMessage.text.slice(0, 40) + (initialMessage.text.length > 40 ? '...' : ''),
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add initial message
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conv.id,
          content: initialMessage.text,
          is_user: initialMessage.isUser,
        });

      if (msgError) throw msgError;

      // Update local state
      const newConversation: ChatConversation = {
        id: conv.id,
        title: conv.title,
        messages: [initialMessage],
        createdAt: new Date(conv.created_at).getTime(),
        updatedAt: new Date(conv.updated_at).getTime(),
      };

      setConversations(prev => [newConversation, ...prev].slice(0, MAX_CONVERSATIONS));
      setCurrentConversationId(conv.id);

      return conv.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return '';
    }
  }, [user]);

  // Add message to current conversation
  const addMessage = useCallback(async (conversationId: string, message: ChatMessage) => {
    if (!user) return;

    try {
      // Insert message to Supabase
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: message.text,
          is_user: message.isUser,
        });

      if (msgError) throw msgError;

      // Update local state
      setConversations(prev => prev.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            messages: [...conv.messages, message],
            updatedAt: Date.now(),
          };
        }
        return conv;
      }));
    } catch (error) {
      console.error('Error adding message:', error);
    }
  }, [user]);

  // Get current conversation
  const getCurrentConversation = useCallback((): ChatConversation | null => {
    return conversations.find(c => c.id === currentConversationId) || null;
  }, [conversations, currentConversationId]);

  // Load a conversation
  const loadConversation = useCallback((id: string) => {
    setCurrentConversationId(id);
  }, []);

  // Delete a conversation
  const deleteConversation = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setConversations(prev => prev.filter(c => c.id !== id));
      if (currentConversationId === id) {
        setCurrentConversationId(null);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  }, [user, currentConversationId]);

  // Clear current conversation (start fresh)
  const clearCurrentConversation = useCallback(() => {
    setCurrentConversationId(null);
  }, []);

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
    isLoading,
  };
}
