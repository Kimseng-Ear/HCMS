import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Globe, Check } from 'lucide-react';

export const LanguageSelector: React.FC = () => {
    const { language, setLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);

    const languages = [
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'km', name: 'ភាសាខ្មែរ', flag: '🇰🇭' }
    ];

    const currentLanguage = languages.find(lang => lang.code === language);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2.5 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-110 active:scale-95 flex items-center gap-2 group"
            >
                <Globe className="w-5 h-5 group-hover:text-primary-500 transition-colors" />
                <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {currentLanguage?.flag}
                </span>
            </button>

            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                        <div className="p-2">
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        setLanguage(lang.code as 'en' | 'km');
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                                        language === lang.code
                                            ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <span className="text-lg">{lang.flag}</span>
                                    <span className="flex-1 text-left text-sm font-medium">
                                        {lang.name}
                                    </span>
                                    {language === lang.code && (
                                        <Check className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
