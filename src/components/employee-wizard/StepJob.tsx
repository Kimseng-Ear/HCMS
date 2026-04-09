import React from 'react';
import { Briefcase } from 'lucide-react';
import { InputField, SelectField } from '../ui/FormFields';
import { useLanguage } from '../../context/LanguageContext';

export const StepJob: React.FC<{
    register: any;
    errors: any;
    departments: any[];
    positions: any[];
    filteredManagers: any[];
    isManager: boolean;
    handleQuickAdd: (type: string) => void;
}> = ({ register, errors, departments, positions, filteredManagers, isManager, handleQuickAdd }) => {
    const { t } = useLanguage();

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="sm:col-span-2 mb-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg text-emerald-600 dark:text-emerald-400">
                        <Briefcase className="w-5 h-5" />
                    </div>
                    {t('onboarding.job.title')}
                </h3>
            </div>
            <SelectField 
              label={t('onboarding.job.department')}
              registration={register('departmentId')} 
              options={[{value: '', label: 'Select...'}, ...departments.map(d => ({ value: d.id, label: d.name }))]} 
              required 
              onAdd={!isManager ? () => handleQuickAdd('Department') : undefined}
              disabled={isManager} 
              helper={isManager ? t('onboarding.job.lockedDept') : undefined}
            />
            <SelectField label={t('onboarding.job.position')} registration={register('position')} options={[{value: '', label: 'Select...'}, ...positions.map(p => ({ value: p.title, label: p.title }))]} required onAdd={() => handleQuickAdd('Position')} />
            <SelectField 
              label={t('onboarding.job.reportsTo')}
              registration={register('managerId')} 
              options={[{value: '', label: 'None'}, ...filteredManagers]} 
              helper={t('onboarding.job.managerHelper')}
              disabled={isManager} 
            />
            <SelectField label={t('onboarding.job.employmentType')} registration={register('employmentType')} options={['Full-Time', 'Part-Time', 'Contract', 'Intern'].map(t => ({ value: t, label: t }))} />
            <div className="sm:col-span-2 h-px bg-slate-100 dark:bg-slate-700 my-2"></div>
            <InputField label={t('onboarding.job.joinDate')} type="date" registration={register('joinDate')} error={errors.joinDate?.message} required />
            <InputField label={t('onboarding.job.probationEnd')} type="date" registration={register('probationEnd')} />
        </div>
    );
};