import React, { useEffect, useState, useRef, useMemo } from 'react';
import { User, Message } from '../types';
import { Api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Send, Search, User as UserIcon, X, CheckCheck, ChevronLeft, MoreVertical, Phone, Video, Paperclip, Smile, MessageCircle } from 'lucide-react';
import { formatTime } from '../utils';

const getSidebarTime = (isoString: string) => {
    const date = new Date(isoString);
    if (date.toDateString() === new Date().toDateString()) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

// 1. PERFORMANCE: Memoized Contact Item
const ContactItem = React.memo(({ contact, isSelected, lastMsg, onClick }: any) => {
    return (
        <div onClick={onClick} className={`group px-4 py-3.5 mx-2 rounded-xl flex items-center gap-3 cursor-pointer transition-all duration-200 ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20 shadow-sm border border-primary-100 dark:border-primary-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'}`}>
            <div className="relative">
                <img src={contact.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover bg-slate-200 dark:bg-slate-700 flex-shrink-0 border-2 border-white dark:border-slate-800 shadow-sm" />
                <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 rounded-full ${isSelected ? 'border-white dark:border-slate-900 bg-emerald-500' : 'border-white dark:border-slate-900 bg-emerald-500'}`}></div>
            </div>
            <div className="flex-1 min-w-0 text-left">
                <div className="flex justify-between items-baseline mb-1">
                    <h4 className={`font-bold text-sm truncate ${isSelected ? 'text-primary-900 dark:text-primary-100' : 'text-slate-900 dark:text-white'}`}>{contact.name}</h4>
                    {lastMsg && <span className={`text-[10px] flex-shrink-0 ml-2 font-medium ${isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'}`}>{getSidebarTime(lastMsg.time)}</span>}
                </div>
                <div className="flex justify-between items-center">
                    <p className={`text-xs truncate pr-2 ${isSelected ? 'text-primary-700 dark:text-primary-300 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>{lastMsg ? lastMsg.content : contact.position}</p>
                    {lastMsg && lastMsg.unread > 0 && <span className="min-w-[1.25rem] h-5 px-1.5 text-[10px] font-bold flex items-center justify-center rounded-full bg-primary-600 text-white shadow-sm shadow-primary-500/30">{lastMsg.unread}</span>}
                </div>
            </div>
        </div>
    );
});

export const Chat: React.FC = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [recentContacts, setRecentContacts] = useState<User[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingContacts, setLoadingContacts] = useState(true);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    // Mock last messages for UI
    const [lastMessages, setLastMessages] = useState<Record<string, {content: string, time: string, unread: number}>>({});

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const [recent, all] = await Promise.all([
                    Api.chat.getRecentContacts(user.id),
                    Api.users.getAll()
                ]);
                setRecentContacts(recent);
                setAllUsers(all.filter(u => u.id !== user.id));
            } finally {
                setLoadingContacts(false);
            }
        };
        fetchData();
    }, [user]);

    useEffect(() => {
        if (!user || !selectedUser) return;
        Api.chat.getMessages(user.id, selectedUser.id).then(setMessages);
        const interval = setInterval(() => {
            if (selectedUser) Api.chat.getMessages(user!.id, selectedUser.id).then(setMessages);
        }, 3000);
        return () => clearInterval(interval);
    }, [selectedUser, user]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if ((!inputText.trim() && !selectedFile) || !selectedUser) return;
        try {
            const tempContent = inputText;
            setInputText(''); setSelectedFile(null);
            await Api.chat.sendMessage(selectedUser.id, tempContent, selectedFile || undefined, selectedFile ? (selectedFile.type.startsWith('image') ? 'image' : 'file') : undefined);
            
            const msgs = await Api.chat.getMessages(user!.id, selectedUser.id);
            setMessages(msgs);

            // Add to recent contacts if not already there
            setRecentContacts(prev => {
                if (prev.some(u => u.id === selectedUser.id)) return prev;
                return [selectedUser, ...prev];
            });
            
            // Clear search query to show the chat list with the new user
            if (searchQuery) {
                setSearchQuery('');
            }
        } catch (err) { alert("Failed to send"); }
    };

    const groupedMessages = useMemo(() => {
        const groups: Record<string, Message[]> = {};
        messages.forEach(msg => {
            const date = new Date(msg.createdAt).toDateString();
            if(!groups[date]) groups[date] = [];
            groups[date].push(msg);
        });
        return groups;
    }, [messages]);

    const filteredContacts = useMemo(() => {
        if (!searchQuery.trim()) return recentContacts;
        return allUsers.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [recentContacts, allUsers, searchQuery]);

    return (
        <div className="flex h-[calc(100dvh-100px)] lg:h-[calc(100vh-140px)] bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in duration-500">
            
            {/* Sidebar List */}
            <div className={`w-full md:w-80 flex-shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 absolute md:relative z-10 h-full ${selectedUser ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}>
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 px-2 tracking-tight">{t('chat.search')}</h2>
                    <div className="relative group">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search colleagues..." 
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 border focus:border-primary-500 rounded-xl text-sm transition-all dark:text-white placeholder-slate-400 shadow-sm" 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
                    {loadingContacts ? <div className="p-8 text-center text-sm text-slate-500 animate-pulse">Loading contacts...</div> : filteredContacts.map(contact => (
                        <ContactItem key={contact.id} contact={contact} isSelected={selectedUser?.id === contact.id} lastMsg={lastMessages[contact.id]} onClick={() => setSelectedUser(contact)} />
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-950/50 transition-all duration-300 absolute md:relative z-20 h-full w-full ${selectedUser ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
                {selectedUser ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-20 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-30">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setSelectedUser(null)} className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center gap-1">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <div className="relative">
                                    <img src={selectedUser.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover bg-slate-200 dark:bg-slate-700 shadow-sm border-2 border-white dark:border-slate-800" />
                                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">{selectedUser.name}</h3>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{selectedUser.position}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2.5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full transition-all">
                                    <Phone className="w-5 h-5" />
                                </button>
                                <button className="p-2.5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full transition-all">
                                    <Video className="w-5 h-5" />
                                </button>
                                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                                <button className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/50 custom-scrollbar">
                            {Object.entries(groupedMessages).map(([date, msgs]: [string, Message[]]) => (
                                <div key={date} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <div className="flex justify-center mb-6 sticky top-0 z-10">
                                        <span className="px-4 py-1.5 bg-slate-200/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-400 text-xs font-bold rounded-full shadow-sm border border-white/20">
                                            {date === new Date().toDateString() ? 'Today' : date}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        {msgs.map((msg, index) => {
                                            const isMe = msg.senderId === user?.id;
                                            const isLast = index === msgs.length - 1 || msgs[index + 1].senderId !== msg.senderId;
                                            const isFirst = index === 0 || msgs[index - 1].senderId !== msg.senderId;
                                            
                                            return (
                                                <div key={msg.id} className={`flex gap-3 ${isMe ? 'justify-end' : 'justify-start'} group ${isFirst ? 'mt-6' : 'mt-1'}`}>
                                                    {!isMe && (
                                                        <div className="w-8 flex-shrink-0 flex flex-col justify-end">
                                                            {isLast && <img src={selectedUser.avatarUrl} className="w-8 h-8 rounded-full object-cover shadow-sm border border-white dark:border-slate-800" />}
                                                        </div>
                                                    )}
                                                    
                                                    <div className={`max-w-[85%] sm:max-w-[65%] px-5 py-3 shadow-sm text-[15px] leading-relaxed transition-all hover:shadow-md
                                                        ${isMe 
                                                            ? 'bg-primary-600 text-white rounded-2xl rounded-tr-sm' 
                                                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl rounded-tl-sm border border-slate-200 dark:border-slate-700'
                                                        }
                                                    `}>
                                                        {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                                                        <div className={`flex items-center justify-end gap-1 mt-1.5 ${isMe ? 'text-primary-200' : 'text-slate-400'}`}>
                                                            <p className="text-[10px] font-medium opacity-80">{formatTime(msg.createdAt)}</p>
                                                            {isMe && <CheckCheck className="w-3 h-3 opacity-80" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                            <form onSubmit={handleSend} className="flex items-end gap-3 max-w-4xl mx-auto">
                                <button type="button" className="p-3 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all">
                                    <Paperclip className="w-5 h-5" />
                                </button>
                                <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center border border-transparent focus-within:border-primary-500/50 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-4 focus-within:ring-primary-500/10 transition-all shadow-inner">
                                    <input 
                                        type="text" 
                                        value={inputText} 
                                        onChange={(e) => setInputText(e.target.value)} 
                                        placeholder={t('chat.typeMessage')} 
                                        className="w-full bg-transparent border-none rounded-2xl px-5 py-3.5 focus:ring-0 dark:text-white text-sm placeholder-slate-400" 
                                    />
                                    <button type="button" className="p-2 mr-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all">
                                        <Smile className="w-5 h-5" />
                                    </button>
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={!inputText.trim()} 
                                    className="p-3.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg shadow-primary-500/30 flex-shrink-0 hover:scale-105 active:scale-95"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-6 text-center bg-slate-50/50 dark:bg-slate-950/50">
                        <div className="w-32 h-32 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 animate-in zoom-in duration-500">
                            <MessageCircle className="w-14 h-14 text-primary-200 dark:text-slate-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">{t('chat.selectUser')}</h3>
                        <p className="max-w-xs text-base text-slate-500 dark:text-slate-400 leading-relaxed">Select a colleague from the sidebar to start a conversation.</p>
                    </div>
                )}
            </div>
        </div>
    );
};