
import React from 'react';
import { Zap, Mail, RefreshCw, Lock, Check, ShieldCheck, HeartHandshake, UserCog, User, AlertCircle } from 'lucide-react';
import { InputField } from '../ui/FormFields';
import { Role } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

export const StepBasics: React.FC<{ 
    register: any; 
    errors: any; 
    setValue: any; 
    watchRole: Role; 
    isManager: boolean;
    generateId: () => void;
}> = ({ register, errors, setValue, watchRole, isManager, generateId }) => {
    const { t } = useLanguage();

    const ROLE_INFO = {
      [Role.ADMIN]: { 
          label: t('onboarding.roles.admin.label'),
          desc: t('onboarding.roles.admin.desc'),
          icon: ShieldCheck,
          color: "border-red-200 bg-red-50 text-red-700 dark:bg-red-900/10 dark:border-red-900/50 dark:text-red-400",
          activeBorder: "ring-2 ring-red-500 border-transparent"
      },
      [Role.HR]: { 
          label: t('onboarding.roles.hr.label'),
          desc: t('onboarding.roles.hr.desc'),
          icon: HeartHandshake,
          color: "border-pink-200 bg-pink-50 text-pink-700 dark:bg-pink-900/10 dark:border-pink-900/50 dark:text-pink-400",
          activeBorder: "ring-2 ring-pink-500 border-transparent"
      },
      [Role.MANAGER]: { 
          label: t('onboarding.roles.manager.label'),
          desc: t('onboarding.roles.manager.desc'),
          icon: UserCog,
          color: "border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-900/10 dark:border-orange-900/50 dark:text-orange-400",
          activeBorder: "ring-2 ring-orange-500 border-transparent"
      },
      [Role.EMPLOYEE]: { 
          label: t('onboarding.roles.employee.label'),
          desc: t('onboarding.roles.employee.desc'),
          icon: User,
          color: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/10 dark:border-emerald-900/50 dark:text-emerald-400",
          activeBorder: "ring-2 ring-emerald-500 border-transparent"
      }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Section Header */}
            <div className="flex items-start gap-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/50 rounded-lg text-primary-600 dark:text-primary-400 mt-1">
                    <Zap className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('onboarding.basics.title')}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {t('onboarding.basics.desc')}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField 
                  label={t('onboarding.basics.employeeId')}
                  registration={register('id')} 
                  error={errors.id?.message} 
                  required 
                  placeholder="EMP00001" 
                  className="font-mono tracking-wide"
                  rightElement={
                      <button type="button" onClick={generateId} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-400 hover:text-primary-600 transition-colors" title={t('onboarding.basics.autoGenerate')}>
                          <RefreshCw className="w-4 h-4" />
                      </button>
                  } 
                />
                <InputField label={t('onboarding.basics.email')} type="email" registration={register('email')} error={errors.email?.message} icon={Mail} placeholder="employee@company.com" />
                
                <div className="md:col-span-2 grid grid-cols-2 gap-6">
                    <InputField label={t('onboarding.basics.firstName')} registration={register('firstName')} error={errors.firstName?.message} required placeholder="e.g. Sothea" />
                    <InputField label={t('onboarding.basics.lastName')} registration={register('lastName')} error={errors.lastName?.message} required placeholder="e.g. Chan" />
                </div>
            </div>
            
            {/* Role Selection */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {t('onboarding.basics.accessLevel')} <span className="text-red-500">*</span>
                    </label>
                    {isManager && (
                        <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full border border-amber-100 dark:border-amber-800 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> {t('onboarding.basics.managerRestricted')}
                        </span>
                    )}
                </div>

                {isManager ? (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4 text-slate-500">
                        <div className="bg-white dark:bg-slate-700 p-2 rounded-lg shadow-sm">
                            <User className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{t('onboarding.basics.standardEmployee')}</p>
                            <p className="text-xs mt-0.5">{t('onboarding.basics.managerRestrictionMsg')}</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(Object.values(Role) as Role[]).map((r) => {
                            const Info = ROLE_INFO[r];
                            const isSelected = watchRole === r;
                            return (
                                <div 
                                    key={r}
                                    onClick={() => setValue('role', r)}
                                    className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 relative flex flex-col gap-3 group
                                        ${isSelected 
                                            ? `bg-white dark:bg-slate-800 shadow-md transform scale-[1.02] ${Info.activeBorder}` 
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                        }
                                    `}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${Info.color} border`}>
                                            <Info.icon className="w-5 h-5" />
                                        </div>
                                        {isSelected ? (
                                            <div className="text-primary-600 bg-primary-50 dark:bg-primary-900/30 p-1 rounded-full">
                                                <Check className="w-4 h-4" />
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-600 group-hover:border-slate-300"></div>
                                        )}
                                    </div>
                                    <div>
                                        <p className={`font-bold text-sm ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-200'}`}>{Info.label}</p>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-1.5">{Info.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Portal Access Toggle */}
            <label className="flex items-center gap-4 cursor-pointer group bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all shadow-sm">
                <div className="relative flex items-center">
                    <input type="checkbox" {...register('allowLogin')} className="peer sr-only" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </div>
                <div className="flex-1">
                    <span className="block text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">{t('onboarding.basics.enablePortal')}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('onboarding.basics.portalDesc')}</span>
                </div>
            </label>
        </div>
    );
};
