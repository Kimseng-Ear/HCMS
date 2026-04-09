import React from 'react';
import { Shield, Phone } from 'lucide-react';
import { InputField, SelectField } from '../ui/FormFields';
import { useLanguage } from '../../context/LanguageContext';

export const StepFamily: React.FC<{
    register: any;
}> = ({ register }) => {
    const { t } = useLanguage();

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-xl mb-8 border border-amber-100 dark:border-amber-800/50 flex items-start gap-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-800/50 rounded-lg text-amber-600 dark:text-amber-400">
                    <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">{t('onboarding.family.emergencyContact')}</h4>
                  <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">{t('onboarding.family.desc')}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <InputField label={t('onboarding.family.contactName')} registration={register('emergencyName')} />
                <SelectField label={t('onboarding.family.relationship')} registration={register('emergencyRelation')} options={['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Other'].map(r => ({value: r, label: r}))} />
                <div className="sm:col-span-2">
                   <InputField label={t('onboarding.family.phone')} type="tel" registration={register('emergencyPhone')} icon={Phone} />
                </div>
            </div>
        </div>
    );
};