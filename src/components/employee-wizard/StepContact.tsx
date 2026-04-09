import React from 'react';
import { Phone, Mail, MapPin, Globe } from 'lucide-react';
import { InputField } from '../ui/FormFields';
import { useLanguage } from '../../context/LanguageContext';

export const StepContact: React.FC<{
    register: any;
    errors: any;
}> = ({ register, errors }) => {
    const { t } = useLanguage();

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="sm:col-span-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t('onboarding.contact.title')}</h3>
            </div>
            <InputField label={t('onboarding.contact.phone')} type="tel" registration={register('phone')} error={errors.phone?.message} required icon={Phone} />
            <InputField label={t('onboarding.contact.email')} type="email" registration={register('email')} icon={Mail} helper={t('onboarding.contact.emailHelper')} />
            <div className="sm:col-span-2">
                <InputField label={t('onboarding.contact.address')} registration={register('address')} icon={MapPin} placeholder="Street Address, Apt, Suite" />
            </div>
            <InputField label={t('onboarding.contact.city')} registration={register('city')} />
            <InputField label={t('onboarding.contact.website')} registration={register('website')} icon={Globe} />
        </div>
    );
};