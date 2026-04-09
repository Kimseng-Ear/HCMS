import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Role } from '../../types';
import { Logo } from '../ui/Logo';
import { 
    LayoutDashboard, Users, Calendar, FolderKanban,
    MessageSquare, User, Settings, LogOut, ChevronLeft, ChevronRight,
    PieChart, Briefcase, DollarSign, Building, UserPlus, Home, Shield
} from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    toggleSidebar: () => void;
    isMobile?: boolean;
    isTablet?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, isMobile = false, isTablet = false }) => {
    const { logout, hasPermission } = useAuth();
    const { t } = useLanguage();

    const navItems = [
        { path: '/', icon: Home, label: t('nav.main'), permission: '' },
        { path: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard'), permission: '' },
        { path: '/employees', icon: Users, label: t('nav.employees'), permission: 'hr.employee.view' },
        { path: '/recruitment', icon: UserPlus, label: t('nav.recruitment') || 'Recruitment', permission: 'recruitment.view' },
        { path: '/attendance', icon: Calendar, label: t('nav.attendance'), permission: '' },
        { path: '/leaves', icon: Briefcase, label: t('nav.leaves'), permission: '' },
        { path: '/projects', icon: FolderKanban, label: t('nav.projects'), permission: '' },
        { path: '/chat', icon: MessageSquare, label: t('nav.chat'), permission: '' },
        { path: '/payroll', icon: DollarSign, label: t('nav.payroll'), permission: 'payroll.view' },
        { path: '/departments', icon: Building, label: t('nav.departments'), permission: 'hr.departments.view' },
        { path: '/reports', icon: PieChart, label: t('nav.reports'), permission: 'system.settings.view' },
        { path: '/users', icon: User, label: t('nav.employees'), permission: 'system.users.view' },
        { path: '/permissions', icon: Shield, label: 'Permissions', permission: 'system.roles.edit' },
        { path: '/settings', icon: Settings, label: t('nav.settings') || 'Settings', permission: 'system.settings.edit' },
    ];

    const filteredNavItems = navItems.filter(item => 
        !item.permission || hasPermission(item.permission)
    );

    return (
        <aside 
            className={`fixed left-0 top-0 z-50 h-screen bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50 transition-all duration-300 shadow-xl flex flex-col ${
                isMobile 
                    ? `${isOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72'}`
                    : `${isOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 w-64 md:w-20'}`
            }`}
        >
            <div className="flex items-center justify-between p-3 sm:p-4 h-14 sm:h-16 border-b border-slate-200/50 dark:border-slate-800/50 shrink-0">
                <div className={`flex items-center gap-2 sm:gap-3 overflow-hidden transition-all ${isOpen ? 'opacity-100' : 'opacity-0 w-0 md:opacity-0 md:w-0'}`}>
                    <Logo size="sm" showSubtitle={false} align="start" />
                </div>
                <button 
                    onClick={toggleSidebar}
                    className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors shrink-0"
                >
                    {isOpen ? <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" /> : <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
            </div>

            <div className="flex flex-col flex-1 overflow-hidden p-2 sm:p-3">
                <nav className="space-y-1 sm:space-y-1.5 overflow-y-auto custom-scrollbar flex-1">
                    {filteredNavItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            onClick={() => isMobile && toggleSidebar()}
                            className={({ isActive }) => `
                                flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl transition-all duration-300 group relative
                                ${isActive 
                                    ? 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400 font-semibold shadow-sm' 
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                                }
                            `}
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-all duration-300 ${isActive ? 'text-cyan-600 dark:text-cyan-400 scale-110' : 'group-hover:text-slate-900 dark:group-hover:text-white group-hover:scale-105'} ${!isOpen && 'md:mx-auto'}`} />
                                    <span className={`whitespace-nowrap text-xs sm:text-sm transition-all duration-300 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 w-0 -translate-x-4 overflow-hidden md:opacity-0 md:w-0'}`}>
                                        {item.label}
                                    </span>
                                    {!isOpen && !isMobile && (
                                        <div className="hidden md:block absolute left-full ml-2 sm:ml-4 px-2 sm:px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 whitespace-nowrap shadow-xl translate-x-2 group-hover:translate-x-0">
                                            {item.label}
                                            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                                        </div>
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="pt-3 sm:pt-4 mt-2 border-t border-slate-200 dark:border-slate-800 shrink-0">
                    <button 
                        onClick={logout}
                        className={`w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 group relative ${!isOpen && !isMobile ? 'md:justify-center' : ''}`}
                    >
                        <LogOut className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                        <span className={`whitespace-nowrap text-xs sm:text-sm font-medium transition-all duration-300 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 w-0 -translate-x-4 overflow-hidden md:opacity-0 md:w-0'}`}>
                            {t('nav.logout')}
                        </span>
                        {!isOpen && !isMobile && (
                            <div className="hidden md:block absolute left-full ml-2 sm:ml-4 px-2 sm:px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 whitespace-nowrap shadow-xl translate-x-2 group-hover:translate-x-0">
                                {t('nav.logout')}
                                <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                            </div>
                        )}
                    </button>
                </div>
            </div>
        </aside>
    );
};
