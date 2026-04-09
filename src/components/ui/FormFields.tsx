import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ElementType;
  rightElement?: React.ReactNode;
  helper?: string;
  registration?: any;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ label, error, registration, icon: Icon, rightElement, helper, className = '', ...props }, ref) => (
    <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</label>
        <div className="relative group">
            {Icon && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon className="h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                </div>
            )}
            <input 
                ref={ref}
                className={`w-full ${Icon ? 'pl-10' : 'px-4'} py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:focus:border-primary-500 dark:text-white text-sm transition-all shadow-sm placeholder:text-slate-400 ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'hover:border-slate-400 dark:hover:border-slate-500'} ${className}`}
                {...registration}
                {...props}
            />
            {rightElement && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {rightElement}
                </div>
            )}
        </div>
        {helper && <p className="text-xs text-slate-500">{helper}</p>}
        {error && <p className="text-xs text-red-500 font-medium animate-in slide-in-from-left-1">{error}</p>}
    </div>
));

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    error?: string;
    options: { value: string; label: string }[];
    registration?: any;
    helper?: string;
    onAdd?: () => void;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ label, error, options, registration, helper, onAdd, className = '', ...props }, ref) => (
    <div className="space-y-1.5">
        <div className="flex justify-between items-center">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</label>
            {onAdd && (
                <button type="button" onClick={onAdd} className="text-xs text-primary-600 hover:text-primary-700 font-medium hover:underline transition-all">
                    + Add New
                </button>
            )}
        </div>
        <div className="relative">
            <select 
                ref={ref}
                className={`w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:focus:border-primary-500 dark:text-white text-sm transition-all shadow-sm appearance-none ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'hover:border-slate-400 dark:hover:border-slate-500'} ${className}`}
                {...registration}
                {...props}
            >
                <option value="">Select...</option>
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
        </div>
        {helper && <p className="text-xs text-slate-500">{helper}</p>}
        {error && <p className="text-xs text-red-500 font-medium animate-in slide-in-from-left-1">{error}</p>}
    </div>
));

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    error?: string;
    registration?: any;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, error, registration, className = '', ...props }, ref) => (
    <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</label>
        <textarea 
            ref={ref}
            className={`w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:focus:border-primary-500 dark:text-white text-sm transition-all shadow-sm placeholder:text-slate-400 ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'hover:border-slate-400 dark:hover:border-slate-500'} ${className}`}
            {...registration}
            {...props}
        />
        {error && <p className="text-xs text-red-500 font-medium animate-in slide-in-from-left-1">{error}</p>}
    </div>
));

export const InputField = Input;
export const SelectField = Select;
export const TextareaField = Textarea;
