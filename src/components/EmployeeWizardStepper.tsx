import React from 'react';
import { Check } from 'lucide-react';

export interface WizardStep {
    id: string;
    label: string;
    description?: string;
    icon: React.ElementType;
}

interface StepperProps {
    steps: WizardStep[];
    currentStep: number;
    onStepChange: (index: number) => void;
}

export const EmployeeWizardStepper: React.FC<StepperProps> = ({ steps, currentStep, onStepChange }) => {
    return (
        <div className="w-full">
            <div className="flex items-center justify-between relative">
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-slate-200 dark:bg-slate-700 -z-10" />
                
                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;
                    const Icon = step.icon;

                    return (
                        <div key={step.id} className="flex flex-col items-center group cursor-pointer" onClick={() => index <= currentStep && onStepChange(index)}>
                            <div 
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-white dark:bg-slate-900 
                                ${isCompleted ? 'border-primary-600 bg-primary-600 text-white' : 
                                  isCurrent ? 'border-primary-600 text-primary-600 ring-4 ring-primary-100 dark:ring-primary-900/30' : 
                                  'border-slate-300 text-slate-400 dark:border-slate-600'}`}
                            >
                                {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                            </div>
                            <div className="mt-2 text-center hidden sm:block">
                                <p className={`text-xs font-semibold ${isCurrent || isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>{step.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
