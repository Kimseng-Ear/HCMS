import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { LOGO_PNG_DATA_URI } from './LogoData';

interface LogoProps {
    className?: string;
    showSubtitle?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    variant?: 'light' | 'dark' | 'color';
    align?: 'start' | 'center' | 'end';
}

export const Logo: React.FC<LogoProps> = ({ className = '', showSubtitle = true, size = 'md', variant = 'color', align = 'center' }) => {
    const { t } = useLanguage();
    
    // Size mappings for image
    const sizes = {
        sm: { image: 'h-8 w-8 aspect-square', sub: 'text-[7px]', spacing: 'mb-1' },
        md: { image: 'h-12 w-12 aspect-square', sub: 'text-[10px]', spacing: 'mb-2' },
        lg: { image: 'h-16 w-16 aspect-square', sub: 'text-xs', spacing: 'mb-3' },
        xl: { image: 'h-20 w-20 aspect-square', sub: 'text-sm', spacing: 'mb-4' },
    };

    const s = sizes[size];
    const alignClass = align === 'start' ? 'items-start' : align === 'end' ? 'items-end' : 'items-center';
    const textAlign = align === 'start' ? 'text-left' : align === 'end' ? 'text-right' : 'text-center';

    return (
        <div className={`flex flex-col ${alignClass} justify-center select-none ${className} group`}>
            {/* Logo - PNG as primary */}
            <div className="flex items-center justify-center relative">
                <img 
                    src="/images/iroc-logo.png" 
                    alt="iROC Labour & Human Resource Consulting"
                    className={`${s.image} rounded-full object-cover transition-all duration-300 group-hover:scale-105 drop-shadow-lg`}
                />
            </div>
            
            {/* Subtitle */}
            {showSubtitle && (
                <span className={`${s.sub} font-medium text-[#4A90E2] tracking-wide ${s.spacing} ${textAlign} opacity-90 group-hover:opacity-100 transition-all duration-300 leading-relaxed`}>
                    {t('logo.subtitle')}
                </span>
            )}
        </div>
    );
};
