'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// ─── Full Message type used in Chatbot ───
export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date; // <-- Date, not number
  // optional fields used by your chatbot
  recommendations?: Array<{
    id: string;
    name: string;
    price: number;
    defaultSize: number;
    defaultColor: string;
  }>;
  products?: Array<{
    id: string;
    name: string;
    price: number;
    gender: string;
    material: string;
    category: string;
    image: string;
    variants: Array<{
      id: string;
      size: number;
      stock: number;
      color: string;
    }>;
  }>;
  cart?: Array<{
    id: string;
    productId: string;
    name: string;
    size: number;
    color: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
};

interface ChatContextType {
  messages: Message[];
  addMessage: (message: Omit<Message, 'id' | 'timestamp'> & { timestamp?: Date }) => void;
  clearMessages: () => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);
const STORAGE_KEY = 'chat_messages';

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        const withDates = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(withDates);
      } catch (e) {
        console.error('Failed to parse chat messages', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever messages change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages, isLoaded]);

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'> & { timestamp?: Date }) => {
    const newMsg: Message = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
      timestamp: message.timestamp || new Date(),
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  const clearMessages = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <ChatContext.Provider value={{ messages, addMessage, clearMessages, setMessages }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};