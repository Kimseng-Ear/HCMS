import React from 'react';
import { User, BadgeCheck, Mail, Shield, Calendar, Globe, DollarSign, CreditCard, Edit2, Phone, MapPin, FileCheck, AlertTriangle } from 'lucide-react';
import { Card } from '../ui/Card';
import { formatCurrency } from '../../utils';
import { useLanguage } from '../../context/LanguageContext';

const ReviewRow = ({ label, value, icon: Icon, className, fullWidth }: any) => (
    <div className={`flex items-center justify-between py-3 border-b border-slate-50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 px-3 rounded transition-colors ${fullWidth ? 'col-span-full' : ''}`}>
        <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
            {Icon && <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-md"><Icon className="w-3.5 h-3.5 opacity-70" /></div>}
            {label}
        </span>
        <span className={`text-sm font-medium text-slate-900 dark:text-slate-200 text-right ${className}`}>{value || '-'}</span>
    </div>
);

export const StepReview: React.FC<{
    watchAll: any;
    avatarPreview: string | null;
    departments: any[];
    managers: any[];
    jumpToStep: (step: number) => void;
}> = ({ watchAll, avatarPreview, departments, managers, jumpToStep }) => {
    const { t } = useLanguage();

    return (
        <div className="animate-in fade-in zoom-in-95 duration-500 space-y-8 pb-8">
            {/* DIGITAL ID CARD PREVIEW */}
            <div className="flex justify-center">
                <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-700 w-full max-w-sm relative group transform transition-transform hover:scale-[1.01]">
                    <div className="h-32 bg-gradient-to-r from-primary-600 to-purple-600 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider">
                            {t('onboarding.review.officialId')}
                        </div>
                    </div>
                    <div className="px-8 pb-8 text-center -mt-16 relative z-10">
                        <div className="w-32 h-32 mx-auto rounded-full p-1.5 bg-white dark:bg-slate-800 shadow-lg mb-4">
                            <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 relative">
                                {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover" /> : <User className="w-full h-full p-6 text-slate-300" />}
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{watchAll.firstName} {watchAll.lastName}</h2>
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <BadgeCheck className="w-4 h-4 text-primary-500" />
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{watchAll.position}</p>
                        </div>
                        
                        <div className="flex flex-wrap justify-center gap-2 mb-6">
                            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-600 font-mono">
                                {watchAll.id}
                            </span>
                            <span className="px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold border border-primary-100 dark:border-primary-800">
                                {departments.find(d => d.id === watchAll.departmentId)?.name || t('onboarding.job.department')}
                            </span>
                        </div>

                        <div className="pt-6 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-4 text-left">
                            <div>
                                <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-1">{t('onboarding.review.joined')}</p>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{watchAll.joinDate || '-'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-1">{t('onboarding.review.type')}</p>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{watchAll.employmentType || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Warning / Compliance Check (Mock) */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-4 rounded-xl flex items-start gap-4">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-sm font-bold text-amber-800 dark:text-amber-200">{t('onboarding.review.pendingDocs')}</h4>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        {t('onboarding.review.pendingDocsMsg')}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title={t('onboarding.review.identityAccess')} action={<button type="button" onClick={() => jumpToStep(0)} className="text-primary-600 hover:bg-primary-50 p-1.5 rounded-full transition-colors"><Edit2 className="w-4 h-4" /></button>}>
                    <div className="space-y-1">
                      <ReviewRow label="Employee ID" value={watchAll.id} className="font-mono" />
                      <ReviewRow label={t('onboarding.contact.email')} value={watchAll.email} icon={Mail} />
                      <ReviewRow label="Role" value={watchAll.role} />
                      <ReviewRow label={t('onboarding.review.portalAccess')} value={watchAll.allowLogin ? t('onboarding.review.enabled') : t('onboarding.review.disabled')} icon={Shield} className={watchAll.allowLogin ? 'text-emerald-600' : 'text-slate-500'} />
                    </div>
                </Card>

                <Card title={t('onboarding.review.personalDetails')} action={<button type="button" onClick={() => jumpToStep(1)} className="text-primary-600 hover:bg-primary-50 p-1.5 rounded-full transition-colors"><Edit2 className="w-4 h-4" /></button>}>
                   <div className="space-y-1">
                    <ReviewRow label={t('onboarding.personal.gender')} value={watchAll.gender} />
                    <ReviewRow label={t('onboarding.personal.dob')} value={watchAll.birthDate} icon={Calendar} />
                    <ReviewRow label={t('onboarding.personal.nationality')} value={watchAll.nationality} icon={Globe} />
                    <ReviewRow label={t('onboarding.personal.nationalId')} value={watchAll.nationalId} />
                   </div>
                </Card>

                <Card title={t('onboarding.review.placement')} action={<button type="button" onClick={() => jumpToStep(2)} className="text-primary-600 hover:bg-primary-50 p-1.5 rounded-full transition-colors"><Edit2 className="w-4 h-4" /></button>}>
                   <div className="space-y-1">
                    <ReviewRow label="Manager" value={managers.find(m => m.id === watchAll.managerId)?.name} />
                    <ReviewRow label={t('onboarding.job.probationEnd')} value={watchAll.probationEnd} />
                   </div>
                </Card>

                <Card title={t('onboarding.review.compensation')} action={<button type="button" onClick={() => jumpToStep(4)} className="text-primary-600 hover:bg-primary-50 p-1.5 rounded-full transition-colors"><Edit2 className="w-4 h-4" /></button>}>
                   <div className="space-y-1">
                    <ReviewRow label={t('onboarding.salary.baseSalary')} value={`${formatCurrency(watchAll.basicSalary)} ${watchAll.currency}`} icon={DollarSign} className="font-bold text-emerald-600" />
                    <ReviewRow label={t('onboarding.salary.bankName')} value={watchAll.bankName} icon={CreditCard} />
                    <ReviewRow label={t('onboarding.salary.accountNumber')} value={watchAll.bankAccount} className="font-mono" />
                   </div>
                </Card>
                
                <div className="lg:col-span-2">
                    <Card title={t('onboarding.review.contactEmergency')} action={<button type="button" onClick={() => jumpToStep(3)} className="text-primary-600 hover:bg-primary-50 p-1.5 rounded-full transition-colors"><Edit2 className="w-4 h-4" /></button>}>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                          <ReviewRow label={t('onboarding.contact.phone')} value={watchAll.phone} icon={Phone} />
                          <ReviewRow label={t('onboarding.contact.address')} value={watchAll.address} icon={MapPin} />
                          <div className="md:col-span-2 h-px bg-slate-100 dark:bg-slate-700 my-2"></div>
                          <ReviewRow label={t('onboarding.family.emergencyContact')} value={watchAll.emergencyName} icon={Shield} />
                          <ReviewRow label={t('onboarding.family.relationship')} value={watchAll.emergencyRelation} />
                          <ReviewRow label={t('onboarding.family.phone')} value={watchAll.emergencyPhone} icon={Phone} />
                       </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};