import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, User, Briefcase, Phone, DollarSign, Users, FileText, ArrowRight, ArrowLeft, Save } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

// Step Components
const StepIdentity: React.FC<{ data: any; onChange: (data: any) => void }> = ({ data, onChange }) => {
  const { hasPermission } = useAuth();
  const canEditJob = hasPermission('hr.employee.edit.job');
  const canEditPersonal = hasPermission('hr.employee.edit.personal');
  
  return (
  <div className="space-y-6">
    <div className="text-center">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Core Identification</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        These details establish the employee's unique identity in the system. The Employee ID is used for login.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          EMPLOYEE ID *
        </label>
        <input
          type="text"
          disabled={!canEditJob}
          value={data.employee_id || ''}
          onChange={(e) => onChange({ ...data, employee_id: e.target.value })}
          className={`w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!canEditJob ? 'bg-slate-100' : 'bg-white'} dark:bg-slate-700 text-slate-900 dark:text-white`}
          placeholder="e.g., EMPL00001"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          FIRST NAME *
        </label>
        <input
          type="text"
          disabled={!canEditPersonal}
          value={data.first_name || ''}
          onChange={(e) => onChange({ ...data, first_name: e.target.value })}
          className={`w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!canEditPersonal ? 'bg-slate-100' : 'bg-white'} dark:bg-slate-700 text-slate-900 dark:text-white`}
          placeholder="e.g. Sothea"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          EMAIL ADDRESS
        </label>
        <input
          type="email"
          disabled={!canEditPersonal}
          value={data.email || ''}
          onChange={(e) => onChange({ ...data, email: e.target.value })}
          className={`w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!canEditPersonal ? 'bg-slate-100' : 'bg-white'} dark:bg-slate-700 text-slate-900 dark:text-white`}
          placeholder="employee@company.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          LAST NAME *
        </label>
        <input
          type="text"
          disabled={!canEditPersonal}
          value={data.last_name || ''}
          onChange={(e) => onChange({ ...data, last_name: e.target.value })}
          className={`w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!canEditPersonal ? 'bg-slate-100' : 'bg-white'} dark:bg-slate-700 text-slate-900 dark:text-white`}
          placeholder="e.g. Chan"
        />
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
        SYSTEM ACCESS LEVEL *
      </label>
      <div className="space-y-3">
        {[
          { value: 'admin', label: 'Administrator', desc: 'Full system control.' },
          { value: 'hr_manager', label: 'HR Manager', desc: 'Manage recruitment, payroll, and records.' },
          { value: 'manager', label: 'Department Head', desc: 'Manage team members and approval workflows.' },
          { value: 'employee', label: 'Employee', desc: 'Standard self-service access.' }
        ].map((role) => (
          <label key={role.value} className={`flex items-start space-x-3 p-4 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 ${!canEditJob ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
            <input
              type="radio"
              disabled={!canEditJob}
              name="role"
              value={role.value}
              checked={data.role === role.value}
              onChange={(e) => onChange({ ...data, role: e.target.value })}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium text-slate-900 dark:text-white">{role.label}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">{role.desc}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  </div>
);};

const StepPersonal: React.FC<{ data: any; onChange: (data: any) => void }> = ({ data, onChange }) => {
  const { hasPermission } = useAuth();
  const canEditPersonal = hasPermission('hr.employee.edit.personal');

  return (
  <div className="space-y-6">
    <div className="text-center">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Personal Information</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Collect personal details for employee records.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          GENDER *
        </label>
        <select
          disabled={!canEditPersonal}
          value={data.gender || ''}
          onChange={(e) => onChange({ ...data, gender: e.target.value })}
          className={`w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!canEditPersonal ? 'bg-slate-100 opacity-60' : 'bg-white'} dark:bg-slate-700 text-slate-900 dark:text-white`}
        >
          <option value="">Select gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          DATE OF BIRTH *
        </label>
        <input
          type="date"
          disabled={!canEditPersonal}
          value={data.birth_date || ''}
          onChange={(e) => onChange({ ...data, birth_date: e.target.value })}
          className={`w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!canEditPersonal ? 'bg-slate-100' : 'bg-white'} dark:bg-slate-700 text-slate-900 dark:text-white`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          NATIONALITY
        </label>
        <input
          type="text"
          disabled={!canEditPersonal}
          value={data.nationality || 'Cambodia'}
          onChange={(e) => onChange({ ...data, nationality: e.target.value })}
          className={`w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!canEditPersonal ? 'bg-slate-100' : 'bg-white'} dark:bg-slate-700 text-slate-900 dark:text-white`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          NATIONAL ID
        </label>
        <input
          type="text"
          disabled={!canEditPersonal}
          value={data.national_id || ''}
          onChange={(e) => onChange({ ...data, national_id: e.target.value })}
          className={`w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!canEditPersonal ? 'bg-slate-100' : 'bg-white'} dark:bg-slate-700 text-slate-900 dark:text-white`}
        />
      </div>
    </div>
  </div>
);};

const StepPlacement: React.FC<{ data: any; onChange: (data: any) => void }> = ({ data, onChange }) => {
  const { hasPermission } = useAuth();
  const canEditJob = hasPermission('hr.employee.edit.job');

  return (
  <div className="space-y-6">
    <div className="text-center">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Organizational Placement</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Define where this employee fits in the organization structure.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          DEPARTMENT *
        </label>
        <select
          disabled={!canEditJob}
          value={data.department_id || ''}
          onChange={(e) => onChange({ ...data, department_id: e.target.value })}
          className={`w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!canEditJob ? 'bg-slate-100 opacity-60' : 'bg-white'} dark:bg-slate-700 text-slate-900 dark:text-white`}
        >
          <option value="">Select department</option>
          <option value="1">Information Technology</option>
          <option value="2">Human Resources</option>
          <option value="3">Finance</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          POSITION *
        </label>
        <select
          disabled={!canEditJob}
          value={data.position_id || ''}
          onChange={(e) => onChange({ ...data, position_id: e.target.value })}
          className={`w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!canEditJob ? 'bg-slate-100 opacity-60' : 'bg-white'} dark:bg-slate-700 text-slate-900 dark:text-white`}
        >
          <option value="">Select position</option>
          <option value="1">Software Engineer</option>
          <option value="2">HR Manager</option>
          <option value="3">Accountant</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          JOIN DATE *
        </label>
        <input
          type="date"
          disabled={!canEditJob}
          value={data.join_date || ''}
          onChange={(e) => onChange({ ...data, join_date: e.target.value })}
          className={`w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!canEditJob ? 'bg-slate-100' : 'bg-white'} dark:bg-slate-700 text-slate-900 dark:text-white`}
        />
      </div>
    </div>
  </div>
);};

const StepContact: React.FC<{ data: any; onChange: (data: any) => void }> = ({ data, onChange }) => {
  const { hasPermission } = useAuth();
  const canEditPersonal = hasPermission('hr.employee.edit.personal');

  return (
  <div className="space-y-6">
    <div className="text-center">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Contact Information</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Capture contact details for organization use.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          PHONE NUMBER *
        </label>
        <input
          type="tel"
          disabled={!canEditPersonal}
          value={data.phone || ''}
          onChange={(e) => onChange({ ...data, phone: e.target.value })}
          className={`w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!canEditPersonal ? 'bg-slate-100' : 'bg-white'} dark:bg-slate-700 text-slate-900 dark:text-white`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          PERSONAL EMAIL *
        </label>
        <input
          type="email"
          disabled={!canEditPersonal}
          value={data.personal_email || ''}
          onChange={(e) => onChange({ ...data, personal_email: e.target.value })}
          className={`w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!canEditPersonal ? 'bg-slate-100' : 'bg-white'} dark:bg-slate-700 text-slate-900 dark:text-white`}
        />
      </div>
    </div>
  </div>
);};

const StepPay: React.FC<{ data: any; onChange: (data: any) => void }> = ({ data, onChange }) => {
  const { hasPermission } = useAuth();
  const canEditPayroll = hasPermission('hr.employee.edit.payroll');

  return (
  <div className="space-y-6">
    <div className="text-center">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Payroll Configuration</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Set up salary structure and payment details.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          BASE SALARY *
        </label>
        <input
          type="number"
          disabled={!canEditPayroll}
          value={data.base_salary || ''}
          onChange={(e) => onChange({ ...data, base_salary: parseFloat(e.target.value) || 0 })}
          className={`w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!canEditPayroll ? 'bg-slate-100' : 'bg-white'} dark:bg-slate-700 text-slate-900 dark:text-white`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          TAX IDENTIFICATION NUMBER *
        </label>
        <input
          type="text"
          disabled={!canEditPayroll}
          value={data.tax_id || ''}
          onChange={(e) => onChange({ ...data, tax_id: e.target.value })}
          className={`w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!canEditPayroll ? 'bg-slate-100' : 'bg-white'} dark:bg-slate-700 text-slate-900 dark:text-white`}
        />
      </div>
    </div>
  </div>
);};

const StepFamily: React.FC<{ data: any; onChange: (data: any) => void }> = ({ data, onChange }) => {
  const { hasPermission } = useAuth();
  const canEditPersonal = hasPermission('hr.employee.edit.personal');

  return (
  <div className="space-y-6">
    <div className="text-center">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Family & Dependents</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Register family members for records.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          MARITAL STATUS
        </label>
        <select
          disabled={!canEditPersonal}
          value={data.marital_status || ''}
          onChange={(e) => onChange({ ...data, marital_status: e.target.value })}
          className={`w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!canEditPersonal ? 'bg-slate-100 opacity-60' : 'bg-white'} dark:bg-slate-700 text-slate-900 dark:text-white`}
        >
          <option value="">Select status</option>
          <option value="Single">Single</option>
          <option value="Married">Married</option>
        </select>
      </div>
    </div>
  </div>
);};

const StepReview: React.FC<{ data: any }> = ({ data }) => (
  <div className="space-y-6">
    <div className="text-center">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Review Summary</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Verify the information below before saving.
      </p>
    </div>

    <div className="space-y-4">
      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Identification</h4>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          <p>ID: {data.employee_id}</p>
          <p>Name: {data.first_name} {data.last_name}</p>
          <p>Role: {data.role}</p>
        </div>
      </div>
    </div>
  </div>
);

export const EmployeeOnboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { id: 'identity', label: 'Identity', icon: Zap },
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'placement', label: 'Placement', icon: Briefcase },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'pay', label: 'Pay', icon: DollarSign },
    { id: 'family', label: 'Family', icon: Users },
    { id: 'review', label: 'Review', icon: FileText }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      showToast('Employee process completed!', 'success');
      navigate('/employees');
    } catch (error) {
      showToast('Failed to complete process', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return <StepIdentity data={formData} onChange={setFormData} />;
      case 1: return <StepPersonal data={formData} onChange={setFormData} />;
      case 2: return <StepPlacement data={formData} onChange={setFormData} />;
      case 3: return <StepContact data={formData} onChange={setFormData} />;
      case 4: return <StepPay data={formData} onChange={setFormData} />;
      case 5: return <StepFamily data={formData} onChange={setFormData} />;
      case 6: return <StepReview data={formData} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Employee Wizard</h1>
            <div className="text-right">
              <div className="text-sm text-slate-500">Progress: {Math.round(progress)}%</div>
            </div>
          </div>
          <div className="flex justify-between mt-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${index <= currentStep ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-8">
          {renderStepContent()}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border-t p-6">
        <div className="max-w-4xl mx-auto flex justify-between">
          <Button variant="ghost" onClick={handlePrev} disabled={currentStep === 0}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Previous
          </Button>
          <div className="flex space-x-4">
            {currentStep === steps.length - 1 ? (
              <Button onClick={handleSubmit} isLoading={isSubmitting}>Submit</Button>
            ) : (
              <Button onClick={handleNext}>Next <ArrowRight className="w-4 h-4 ml-2" /></Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};