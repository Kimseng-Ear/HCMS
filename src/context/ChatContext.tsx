import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { useAuth } from './AuthContext';
import { Api } from '../services/api';

interface ChatContextType {
  isOpen: boolean;
  activeUser: User | null;
  unreadCount: number;
  toggleChat: () => void;
  openChatWith: (user: User) => void;
  closeChat: () => void;
  markAsRead: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playNotificationSound = () => {
    try {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioContextRef.current;
        if (ctx && ctx.state === 'suspended') ctx.resume();

        if (ctx) {
          const oscillator = ctx.createOscillator();
          const gainNode = ctx.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(ctx.destination);

          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
          oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1); // A4
          
          gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

          oscillator.start();
          oscillator.stop(ctx.currentTime + 0.5);
        }
    } catch (e) {
        console.error("Audio play failed", e);
    }
  };

  useEffect(() => {
    if (!user) return;

    const pollUnread = async () => {
        try {
            const count = await Api.chat.getUnreadCount(user.id);
            setUnreadCount(prev => {
                if (count > prev) {
                    playNotificationSound();
                }
                return count;
            });
        } catch (e) {
            console.error("Failed to fetch unread count", e);
        }
    };

    // Initial fetch
    pollUnread();

    // Poll every 5 seconds
    const interval = setInterval(pollUnread, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const toggleChat = () => {
    setIsOpen(prev => !prev);
  };

  const openChatWith = (targetUser: User) => {
    setActiveUser(targetUser);
    setIsOpen(true);
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  const markAsRead = () => {
      // Optimistically clear count when opening/viewing
      setUnreadCount(0);
      // In a real app, we'd call Api.chat.markAllRead(user.id) here
  };

  return (
    <ChatContext.Provider value={{ isOpen, activeUser, unreadCount, toggleChat, openChatWith, closeChat, markAsRead }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
};
