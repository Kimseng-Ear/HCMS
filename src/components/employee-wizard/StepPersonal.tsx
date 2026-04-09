
import React from 'react';
import { Camera, Upload, Globe, Shield, User } from 'lucide-react';
import { InputField, SelectField } from '../ui/FormFields';
import { useLanguage } from '../../context/LanguageContext';

export const StepPersonal: React.FC<{
    register: any;
    errors: any;
    avatarPreview: string | null;
    fileInputRef: React.RefObject<HTMLInputElement>;
    handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ register, errors, avatarPreview, fileInputRef, handleImageChange }) => {
    const { t } = useLanguage();

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row gap-8 items-start">
                
                {/* Left Column: Avatar Uploader */}
                <div className="w-full md:w-1/3 flex flex-col">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">{t('onboarding.personal.profilePhoto')}</h3>
                        
                        <div 
                            onClick={() => fileInputRef.current?.click()} 
                            className="relative group cursor-pointer mx-auto w-40 h-40 rounded-full border-4 border-slate-100 dark:border-slate-700 overflow-hidden transition-all hover:border-primary-100 dark:hover:border-primary-900"
                        >
                            <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                            {avatarPreview ? (
                                <>
                                    <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-sm">
                                        <Camera className="w-8 h-8 mb-1" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">{t('onboarding.personal.change')}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full h-full bg-slate-50 dark:bg-slate-800 flex flex-col items-center justify-center text-slate-400 group-hover:text-primary-500 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors">
                                    <User className="w-12 h-12 mb-2 opacity-50" />
                                    <span className="text-xs font-medium">{t('onboarding.personal.upload')}</span>
                                </div>
                            )}
                        </div>

                        <p className="text-xs text-slate-400 mt-4 px-4 whitespace-pre-line">
                            {t('onboarding.personal.photoRequirements')}
                        </p>
                    </div>
                </div>

                {/* Right Column: Details Form */}
                <div className="flex-1 w-full bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('onboarding.personal.title')}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t('onboarding.personal.desc')}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <SelectField 
                            label={t('onboarding.personal.gender')}
                            registration={register('gender')} 
                            options={[{value: 'Male', label: 'Male'}, {value: 'Female', label: 'Female'}]} 
                            required 
                        />
                        <InputField 
                            label={t('onboarding.personal.dob')}
                            type="date" 
                            registration={register('birthDate')} 
                            error={errors.birthDate?.message} 
                            required 
                        />
                        
                        <div className="sm:col-span-2">
                            <InputField 
                                label={t('onboarding.personal.nationality')}
                                registration={register('nationality')} 
                                required 
                                icon={Globe} 
                                placeholder="e.g. Cambodian"
                            />
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl sm:col-span-2 border border-slate-100 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <InputField 
                                label={t('onboarding.personal.nationalId')}
                                registration={register('nationalId')} 
                                icon={Shield} 
                                placeholder="9-digit ID"
                                className="bg-white dark:bg-slate-800"
                            />
                            <InputField 
                                label={t('onboarding.personal.passport')}
                                registration={register('passport')} 
                                icon={Shield} 
                                placeholder="Travel Document"
                                className="bg-white dark:bg-slate-800"
                            />
                        </div>

                        <InputField label={t('onboarding.personal.ethnicity')} registration={register('ethnicity')} placeholder={t('onboarding.personal.optional')} />
                        <InputField label={t('onboarding.personal.religion')} registration={register('religion')} placeholder={t('onboarding.personal.optional')} />
                    </div>
                </div>
            </div>
        </div>
    );
};
