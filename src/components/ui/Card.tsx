import React from 'react';

interface CardProps {
    title?: string;
    children: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
    icon?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children, action, className = '', icon }) => {
    return (
        <div className={`bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-soft border border-slate-200/60 dark:border-slate-700/60 p-4 sm:p-6 transition-all duration-300 hover:shadow-lg ${className}`}>
            {(title || action || icon) && (
                <div className="flex justify-between items-center mb-4 sm:mb-5 pb-3 sm:pb-4 border-b border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-3">
                        {icon && <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">{icon}</div>}
                        {title && <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">{title}</h3>}
                    </div>
                    {action && <div>{action}</div>}
                </div>
            )}
            {children}
        </div>
    );
};
