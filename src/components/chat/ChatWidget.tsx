
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Minus, Send, Search, ChevronLeft, MessageCircle, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { Api } from '../../services/api';
import { User, Message } from '../../types';
import { formatTime } from '../../utils';

export const ChatWidget: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { isOpen, activeUser, toggleChat, openChatWith, unreadCount, markAsRead } = useChat();
  const [recentContacts, setRecentContacts] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const canChat = useMemo(() => hasPermission('chat.access'), [hasPermission]);

  // Load Contacts
  useEffect(() => {
    if (user && canChat) {
      // Fetch recent contacts
      Api.chat.getRecentContacts(user.id)
        .then(recent => setRecentContacts(recent))
        .catch(() => {}); // Silent fail for recent

      // Fetch all users for search ONLY if authorized to avoid 403 console errors
      if (hasPermission('hr.employee.view')) {
        Api.users.getAll()
          .then(all => setAllUsers(all.filter(u => u.id !== user.id)))
          .catch(() => setAllUsers([]));
      } else {
        setAllUsers([]);
      }
    }
  }, [user, canChat, hasPermission]);

  // Mark read when opening
  useEffect(() => {
      if (isOpen) {
          markAsRead();
      }
  }, [isOpen]);

  // Load Messages loop
  useEffect(() => {
    if (!user || !activeUser || !isOpen) return;
    
    setLoading(true);
    const fetchMsgs = () => {
        Api.chat.getMessages(user.id, activeUser.id).then(msgs => {
            setMessages(msgs);
            setLoading(false);
        });
    };

    fetchMsgs();
    const interval = setInterval(fetchMsgs, 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, [user, activeUser, isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, activeUser, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeUser || !user) return;

    const content = inputText;
    setInputText(''); 
    
    // Optimistic UI: Add message immediately
    const tempMsg: Message = {
        id: `temp-${Date.now()}`,
        senderId: user.id,
        receiverId: activeUser.id,
        content,
        createdAt: new Date().toISOString(),
        isRead: false
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
        await Api.chat.sendMessage(activeUser.id, content);
        
        // Add to recent contacts if not already there
        setRecentContacts(prev => {
            if (prev.some(u => u.id === activeUser.id)) return prev;
            return [activeUser, ...prev];
        });

        // Simulate a "typing" delay from the other user for realism in mock
        if (process.env.NODE_ENV !== 'production') {
            setIsTyping(true);
            setTimeout(() => setIsTyping(false), 2000);
        }
    } catch (error) {
        console.error("Failed to send", error);
    }
  };

  const filteredContacts = useMemo(() => {
      if (!searchQuery.trim()) return recentContacts;
      return allUsers.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [recentContacts, allUsers, searchQuery]);

  if (!user || !canChat) return null;

  return (
    <>
      {/* Floating Toggle Button (Visible when closed) */}
      <div className={`fixed bottom-6 right-6 z-50 transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${isOpen ? 'scale-0 opacity-0 translate-y-10' : 'scale-100 opacity-100 translate-y-0'}`}>
        <button 
            onClick={toggleChat}
            className="w-16 h-16 bg-slate-900 hover:bg-slate-800 dark:bg-slate-50 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 group relative"
        >
            <MessageCircle className="w-8 h-8" />
            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold border-2 border-white dark:border-slate-900 animate-bounce">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
            {unreadCount === 0 && (
                <span className="absolute top-1 right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-900 dark:border-slate-50"></span>
                </span>
            )}
        </button>
      </div>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-6 right-4 sm:right-6 w-[90vw] sm:w-[380px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 flex flex-col transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) origin-bottom-right ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95 pointer-events-none'}`}
        style={{ height: 'min(600px, 80vh)' }}
      >
        {/* Header */}
        <div className="h-16 bg-white dark:bg-slate-900 px-4 flex items-center justify-between shrink-0 border-b border-slate-100 dark:border-slate-800 z-10">
            <div className="flex items-center gap-3">
                {activeUser ? (
                    <>
                        <button onClick={() => openChatWith(null as any)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="relative">
                            <img src={activeUser.avatarUrl} className="w-10 h-10 rounded-full border border-slate-100 dark:border-slate-700" />
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                        </div>
                        <div>
                            <h3 className="text-slate-900 dark:text-white font-bold text-base leading-tight">{activeUser.name}</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Active now</p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl text-primary-600 dark:text-primary-400">
                            <MessageCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-slate-900 dark:text-white font-bold text-lg">Messages</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Team Communication</p>
                        </div>
                    </>
                )}
            </div>
            <div className="flex items-center gap-1">
                <button onClick={toggleChat} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <Minus className="w-6 h-6" />
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative bg-slate-50 dark:bg-slate-950">
            {activeUser ? (
                // --- CONVERSATION VIEW ---
                <div className="absolute inset-0 flex flex-col">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                        {messages.length === 0 && !loading && (
                            <div className="text-center mt-10 opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-forwards">
                                <img src={activeUser.avatarUrl} className="w-16 h-16 rounded-full mx-auto mb-3 opacity-50 grayscale border border-slate-200 dark:border-slate-700" />
                                <p className="text-sm text-slate-500 font-medium">Say hello to {activeUser.name.split(' ')[0]} 👋</p>
                            </div>
                        )}
                        
                        {messages.map((msg, index) => {
                            const isMe = msg.senderId === user.id;
                            const isLast = index === messages.length - 1 || messages[index + 1].senderId !== msg.senderId;
                            
                            return (
                                <div key={msg.id} className={`flex gap-3 ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-1 duration-200`}>
                                    {!isMe && (
                                        <div className="w-8 flex-shrink-0 flex flex-col justify-end">
                                            {isLast && <img src={activeUser.avatarUrl} className="w-8 h-8 rounded-full object-cover shadow-sm" />}
                                        </div>
                                    )}
                                    
                                    <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm shadow-sm leading-relaxed 
                                        ${isMe 
                                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-br-sm' 
                                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-sm border border-slate-100 dark:border-slate-700'
                                        }
                                    `}>
                                        <p>{msg.content}</p>
                                        <p className={`text-[10px] mt-1 text-right opacity-70`}>
                                            {formatTime(msg.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        {isTyping && (
                            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 ml-11">
                                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                        <form onSubmit={handleSend} className="flex gap-3 items-center">
                            <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center border border-transparent focus-within:border-slate-300 dark:focus-within:border-slate-600 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all shadow-inner">
                                <input 
                                    type="text" 
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Type a message..."
                                    className="w-full bg-transparent border-none rounded-2xl px-4 py-3 focus:ring-0 dark:text-white text-sm placeholder-slate-400"
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={!inputText.trim()}
                                className="p-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-white dark:text-slate-900 rounded-2xl transition-all shadow-md hover:shadow-lg flex-shrink-0 active:scale-95"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                // --- CONTACT LIST VIEW ---
                <div className="absolute inset-0 flex flex-col">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
                        <div className="relative group">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-slate-800 dark:group-focus-within:text-slate-200 transition-colors" />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search colleagues..." 
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 transition-all dark:text-white placeholder-slate-400 font-medium"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {filteredContacts.map(contact => (
                            <div 
                                key={contact.id}
                                onClick={() => openChatWith(contact)}
                                className="flex items-center gap-4 p-3 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-all rounded-xl group"
                            >
                                <div className="relative">
                                    <img src={contact.avatarUrl} className="w-12 h-12 rounded-full object-cover bg-slate-200 dark:bg-slate-700 shadow-sm group-hover:scale-105 transition-transform" />
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{contact.name}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{contact.position}</p>
                                </div>
                                <div className="p-2 text-slate-300 group-hover:text-primary-500 transition-colors">
                                    <MessageCircle className="w-5 h-5" />
                                </div>
                            </div>
                        ))}
                        {filteredContacts.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm p-8 text-center">
                                <p>No colleagues found</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>
    </>
  );
};
