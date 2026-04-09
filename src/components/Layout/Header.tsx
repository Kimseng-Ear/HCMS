import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useChat } from '../../context/ChatContext';
import { useLanguage } from '../../context/LanguageContext';
import { Sun, Moon, Bell, MessageSquare, Menu, User } from 'lucide-react';
import { NotificationDropdown } from '../ui/NotificationDropdown';
import { LanguageSelector } from '../ui/LanguageSelector';

interface HeaderProps {
    toggleSidebar: () => void;
    isSidebarOpen?: boolean;
    isMobile?: boolean;
    isTablet?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ toggleSidebar, isSidebarOpen = false, isMobile = false, isTablet = false }) => {
    const { theme, toggleTheme } = useTheme();
    const { user } = useAuth();
    const { unreadCount: notifCount } = useNotification();
    const { unreadCount: chatCount, toggleChat } = useChat();
    const { t } = useLanguage();
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    return (
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between px-3 sm:px-4 md:px-6 lg:px-8 transition-all duration-300 shadow-sm relative">
            <div className="flex items-center gap-2 sm:gap-4">
                <button 
                    onClick={toggleSidebar}
                    className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <div className="hidden xs:block sm:block">
                    <h1 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                        <span className="block xs:hidden">
                            {user?.name.split(' ')[0]}
                        </span>
                        <span className="hidden xs:block">
                            {t('dashboard.welcomeBack')}, <span className="text-primary-600 dark:text-primary-400">{user?.name.split(' ')[0]}</span>
                        </span>
                    </h1>
                    {!isMobile && (
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden lg:block">
                            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
                {/* Language Selector - hide on mobile */}
                <div className="hidden sm:block">
                    <LanguageSelector />
                </div>
                
                <button 
                    onClick={toggleTheme}
                    className="p-2 sm:p-2.5 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-110 active:scale-95"
                >
                    {theme === 'dark' ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />}
                </button>

                <button 
                    onClick={toggleChat}
                    className="p-2 sm:p-2.5 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-110 active:scale-95 relative group hidden sm:block"
                >
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 group-hover:text-primary-500 transition-colors" />
                    {chatCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                    )}
                </button>

                <div className="relative">
                    <button 
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        className={`p-2 sm:p-2.5 rounded-full transition-all hover:scale-110 active:scale-95 relative group ${isNotifOpen ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                        <Bell className={`w-4 h-4 sm:w-5 sm:h-5 group-hover:text-primary-500 transition-colors ${isNotifOpen ? 'fill-current' : ''}`} />
                        {notifCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                        )}
                    </button>
                </div>

                {/* User Profile - Enhanced for mobile */}
                <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1.5 pr-2 sm:pr-3 rounded-full transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 p-[1.5px] sm:p-[2px] shadow-md">
                        <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-3 h-3 sm:w-5 sm:h-5 text-primary-500" />
                            )}
                        </div>
                    </div>
                    <div className="text-left hidden sm:block">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">{user?.name}</p>
                        <p className="text-[8px] sm:text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{user?.role}</p>
                    </div>
                </div>
            </div>
            
            {/* Notification Dropdown - positioned relative to header */}
            {isNotifOpen && (
                <div className={`absolute top-full right-4 mt-2 ${isMobile ? 'w-72' : 'w-80 md:w-96'} bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-[1050] animate-in fade-in zoom-in-95 duration-200 origin-top-right overflow-hidden`}>
                    <NotificationDropdown isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
                </div>
            )}
        </header>
    );
};
