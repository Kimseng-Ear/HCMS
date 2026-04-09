import React from 'react';
import { DollarSign, CreditCard, Calculator, Plus, ChevronRight, Sparkles, Info } from 'lucide-react';
import { InputField, SelectField } from '../ui/FormFields';
import { formatCurrency } from '../../utils';
import { useLanguage } from '../../context/LanguageContext';

// Helper Icon for Banking
function Building({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
            <path d="M9 22v-4h6v4" />
            <path d="M8 6h.01" />
            <path d="M16 6h.01" />
            <path d="M12 6h.01" />
            <path d="M12 10h.01" />
            <path d="M12 14h.01" />
            <path d="M16 10h.01" />
            <path d="M16 14h.01" />
            <path d="M8 10h.01" />
            <path d="M8 14h.01" />
        </svg>
    )
}

export const StepSalary: React.FC<{
    register: any;
    estimatedPay: any;
}> = ({ register, estimatedPay }) => {
    const { t } = useLanguage();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Area */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <DollarSign className="w-24 h-24" />
                        </div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white mb-6 flex items-center relative z-10">
                            <div className="p-1.5 bg-primary-100 dark:bg-primary-900/50 rounded-md text-primary-600 dark:text-primary-400 mr-3">
                                <CreditCard className="w-4 h-4" />
                            </div>
                            {t('onboarding.salary.baseComp')}
                        </h4>
                        <div className="grid grid-cols-2 gap-5 relative z-10">
                            <div className="col-span-2 sm:col-span-1">
                                <InputField label={t('onboarding.salary.basicSalary')} type="number" registration={register('basicSalary', { valueAsNumber: true })} required className="text-lg font-semibold text-slate-900" />
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <SelectField label={t('onboarding.salary.currency')} registration={register('currency')} options={[{value: 'USD', label: 'USD ($)'}, {value: 'KHR', label: 'KHR (៛)'}]} />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h4 className="text-base font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                            <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 mr-3">
                                <Building className="w-4 h-4" />
                            </div>
                            {t('onboarding.salary.banking')}
                        </h4>
                        <div className="space-y-5">
                            <InputField label={t('onboarding.salary.bankName')} registration={register('bankName')} placeholder="e.g. ABA Bank" />
                            <InputField label={t('onboarding.salary.accountNumber')} registration={register('bankAccount')} placeholder="000 000 000" className="font-mono tracking-wide" />
                        </div>
                    </div>
                </div>

                {/* Premium Estimator Card */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900 text-white p-8 rounded-3xl shadow-2xl flex flex-col justify-between relative overflow-hidden ring-1 ring-white/10">
                    {/* Decor */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                                    <Calculator className="w-6 h-6 text-primary-300" />
                                </div>
                                <div>
                                    <p className="text-xs text-primary-200 font-medium uppercase tracking-wider">{t('onboarding.salary.payrollPreview')}</p>
                                    <p className="text-sm font-bold text-white">{t('onboarding.salary.monthlyBreakdown')}</p>
                                </div>
                            </div>
                            <Sparkles className="w-5 h-5 text-yellow-400 opacity-80" />
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between text-sm py-2 border-b border-white/10">
                                <span className="text-slate-300">{t('onboarding.salary.baseSalary')}</span>
                                <span className="font-medium font-mono">{formatCurrency(estimatedPay.baseSalary)}</span>
                            </div>
                            <div className="flex justify-between text-sm py-2 border-b border-white/10">
                                <span className="text-emerald-300 flex items-center"><Plus className="w-3 h-3 mr-1" /> {t('onboarding.salary.allowances')}</span>
                                <span className="font-medium font-mono text-emerald-300">+{formatCurrency(estimatedPay.allowances.transport + estimatedPay.allowances.attendance + estimatedPay.allowances.meal + estimatedPay.allowances.seniority)}</span>
                            </div>
                            <div className="flex justify-between text-sm py-2 border-b border-white/10">
                                <span className="text-rose-300 flex items-center"><ChevronRight className="w-3 h-3 mr-1" /> {t('onboarding.salary.deductions')}</span>
                                <span className="font-medium font-mono text-rose-300">-{formatCurrency(estimatedPay.deductions.total)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 mt-8 pt-6 border-t border-white/10">
                        <div className="flex justify-between items-end">
                            <div>
                                 <p className="text-xs text-primary-200 mb-1">{t('onboarding.salary.estimatedNet')}</p>
                                 <p className="text-3xl font-bold tracking-tight text-white">{formatCurrency(estimatedPay.netSalary)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-slate-400 mb-1">{t('onboarding.salary.equivalent')}</p>
                                <p className="text-sm font-mono text-slate-300">៛ {estimatedPay.netSalaryKHR.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="mt-4 flex items-start gap-2 bg-white/5 rounded-lg p-3 text-[10px] text-primary-100/80 backdrop-blur-sm border border-white/5">
                            <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                            <p>{t('onboarding.salary.disclaimer')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};