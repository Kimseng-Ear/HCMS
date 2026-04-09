import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ChatWidget } from '../chat/ChatWidget';

export const Layout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);

    useEffect(() => {
        const checkDevice = () => {
            const width = window.innerWidth;
            const mobile = width < 768;
            const tablet = width >= 768 && width < 1024;
            
            setIsMobile(mobile);
            setIsTablet(tablet);
            
            if (mobile) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };

        checkDevice();
        window.addEventListener('resize', checkDevice);
        return () => window.removeEventListener('resize', checkDevice);
    }, []);

    const toggleSidebar = useCallback(() => {
        setIsSidebarOpen(prev => !prev);
    }, []);

    const handleOverlayClick = useCallback(() => {
        if (isMobile) {
            setIsSidebarOpen(false);
        }
    }, [isMobile]);

    const mainContentClass = useMemo(() => {
        return `flex-1 flex flex-col transition-all duration-300 ease-in-out w-full ${
            isSidebarOpen 
                ? isMobile ? 'ml-0' : isTablet ? 'ml-64' : 'ml-64'
                : isMobile ? 'ml-0' : isTablet ? 'ml-20' : 'ml-20'
        }`;
    }, [isSidebarOpen, isMobile, isTablet]);

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
            {/* Mobile Overlay - only on mobile devices */}
            {isSidebarOpen && isMobile && (
                <div 
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 animate-fade-in"
                    onClick={handleOverlayClick}
                />
            )}

            {/* Sidebar */}
            <Sidebar 
                isOpen={isSidebarOpen} 
                toggleSidebar={toggleSidebar}
                isMobile={isMobile}
                isTablet={isTablet}
            />

            {/* Main Content */}
            <div className={mainContentClass}>
                <Header 
                    toggleSidebar={toggleSidebar} 
                    isSidebarOpen={isSidebarOpen}
                    isMobile={isMobile}
                    isTablet={isTablet}
                />
                
                <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 custom-scrollbar">
                    <div className="max-w-9xl mx-auto w-full animate-slide-up">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Chat Widget - hide on small mobile screens */}
            {!isMobile && <ChatWidget />}
        </div>
    );
};
