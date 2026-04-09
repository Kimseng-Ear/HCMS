import React from 'react';
import { useNotification } from '../../context/NotificationContext';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { formatTime } from '../../utils';

interface NotificationDropdownProps {
    isOpen: boolean;
    onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
    const { notifications, markAsRead, markAllAsRead } = useNotification();

    if (!isOpen) return null;

    return (
        <div className="absolute top-16 right-4 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-[1050] animate-in fade-in zoom-in-95 duration-200 origin-top-right overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary-500" />
                    Notifications
                </h3>
                <div className="flex items-center gap-2">
                    {notifications.some(n => !n.isRead) && (
                        <button 
                            onClick={() => markAllAsRead()}
                            className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 px-2 py-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                        >
                            Mark all read
                        </button>
                    )}
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                        <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">No notifications yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {notifications.map(notification => (
                            <div 
                                key={notification.id} 
                                className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group relative ${!notification.isRead ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''}`}
                            >
                                <div className="flex gap-3">
                                    <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${!notification.isRead ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                                    <div className="flex-1">
                                        <p className={`text-sm ${!notification.isRead ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-2 font-medium">
                                            {formatTime(notification.createdAt)}
                                        </p>
                                    </div>
                                    {!notification.isRead && (
                                        <button 
                                            onClick={() => markAsRead(notification.id)}
                                            className="opacity-0 group-hover:opacity-100 absolute top-4 right-4 p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
                                            title="Mark as read"
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm text-center">
                <button className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                    View all notifications
                </button>
            </div>
        </div>
    );
};
