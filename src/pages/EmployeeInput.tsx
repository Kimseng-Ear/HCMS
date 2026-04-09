
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  ArrowLeft, Check, Zap, User, Phone, Briefcase, DollarSign, Users, 
  FileText, ChevronRight, ChevronLeft, Download, CheckCircle2, Save, AlertCircle, Loader2, Sparkles
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { Api } from '../services/api';
import { Role } from '../types';
import { Button } from '../components/ui/Button';
import { calculatePayrollForUser } from '../services/cambodiaTax';
import { EmployeeWizardStepper, WizardStep } from '../components/EmployeeWizardStepper';
import { useAuth } from '../context/AuthContext';

// Import sub-components
import { StepBasics } from '../components/employee-wizard/StepBasics';
import { StepPersonal } from '../components/employee-wizard/StepPersonal';
import { StepJob } from '../components/employee-wizard/StepJob';
import { StepContact } from '../components/employee-wizard/StepContact';
import { StepSalary } from '../components/employee-wizard/StepSalary';
import { StepFamily } from '../components/employee-wizard/StepFamily';
import { StepReview } from '../components/employee-wizard/StepReview';

// --- ZOD SCHEMA ---
const employeeSchema = z.object({
  id: z.string().min(1, "ID is required"),
  firstName: z.string().min(1, "First Name is required"),
  lastName: z.string().min(1, "Last Name is required"),
  role: z.nativeEnum(Role).default(Role.EMPLOYEE),
  allowLogin: z.boolean().default(false),
  email: z.string().email("Invalid email").optional().or(z.literal('')), 
  gender: z.string().min(1, "Gender is required"),
  birthDate: z.string().min(1, "Birth Date is required"),
  nationality: z.string().default('Cambodia'),
  ethnicity: z.string().optional(),
  religion: z.string().optional(),
  nationalId: z.string().optional(),
  passport: z.string().optional(),
  departmentId: z.string().min(1, "Department required"),
  position: z.string().min(1, "Position required"),
  managerId: z.string().optional(),
  employmentType: z.string().default('Full-Time'),
  joinDate: z.string().min(1, "Join Date required"),
  probationEnd: z.string().optional(),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  website: z.string().optional(),
  basicSalary: z.number().min(0),
  currency: z.string().default('USD'),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyRelation: z.string().optional(),
  emergencyPhone: z.string().optional(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

const STEP_FIELDS_MAP = [
    ['id', 'firstName', 'lastName', 'role', 'email', 'allowLogin'],
    ['gender', 'birthDate', 'nationality', 'ethnicity', 'religion', 'nationalId', 'passport'],
    ['departmentId', 'position', 'managerId', 'employmentType', 'joinDate', 'probationEnd'],
    ['phone', 'address', 'city', 'website'],
    ['basicSalary', 'currency', 'bankName', 'bankAccount'],
    ['emergencyName', 'emergencyRelation', 'emergencyPhone'],
    []
];

const FormSkeleton = () => (
    <div className="space-y-8 animate-pulse p-4">
        <div className="grid grid-cols-2 gap-6">
            <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl col-span-2"></div>
            <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg col-span-2"></div>
        </div>
        <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
    </div>
);

export const EmployeeInput: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]); 
  const [managers, setManagers] = useState<any[]>([]);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- STEP DEFINITION ---
  const WIZARD_STEPS: WizardStep[] = useMemo(() => [
      { id: 'basics', label: t('onboarding.steps.identity'), icon: Zap },
      { id: 'personal', label: t('onboarding.steps.personal'), icon: User },
      { id: 'job', label: t('onboarding.steps.placement'), icon: Briefcase },
      { id: 'contact', label: t('onboarding.steps.contact'), icon: Phone },
      { id: 'salary', label: t('onboarding.steps.pay'), icon: DollarSign },
      { id: 'family', label: t('onboarding.steps.family'), icon: Users },
      { id: 'review', label: t('onboarding.steps.review'), icon: FileText }
  ], [t]);

  const { register, handleSubmit, setValue, trigger, watch, formState: { errors, isSubmitting, isDirty } } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema) as any,
    mode: 'onChange',
    defaultValues: {
      currency: 'USD',
      nationality: 'Cambodia',
      gender: 'Male',
      allowLogin: true,
      role: Role.EMPLOYEE,
      joinDate: new Date().toISOString().split('T')[0],
      employmentType: 'Full-Time'
    }
  });

  const watchAll = watch();
  const isManager = currentUser?.role === Role.MANAGER;

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const [depts, users] = await Promise.all([
            Api.departments.getAll(),
            Api.users.getAll()
        ]);
        setDepartments(depts);
        setManagers(users.filter(u => u.role === Role.MANAGER || u.role === Role.ADMIN));
        
        setPositions([
            {id: '1', title: 'CEO'}, {id: '2', title: 'HR Manager'}, {id: '3', title: 'Engineering Manager'},
            {id: '4', title: 'Senior Developer'}, {id: '5', title: 'Junior Developer'}, {id: '6', title: 'Sales Executive'}, {id: '7', title: 'Accountant'}
        ]);

        if (id) {
          const userData = await Api.users.getById(id);
          if (userData) {
            const nameParts = userData.name.split(' ');
            setValue('id', userData.id);
            setValue('firstName', nameParts[0]);
            setValue('lastName', nameParts.slice(1).join(' ') || '');
            setValue('email', userData.email);
            setValue('phone', userData.phone || '');
            setValue('address', userData.address || '');
            setValue('position', userData.position);
            setValue('departmentId', userData.departmentId);
            setValue('joinDate', userData.joinDate);
            setValue('basicSalary', userData.salary || 0);
            setValue('role', userData.role);
            setValue('managerId', userData.managerId || ''); 
            setValue('allowLogin', true); 
            if(userData.avatarUrl) setAvatarPreview(userData.avatarUrl);
            if(userData.birthDate) setValue('birthDate', userData.birthDate);
            if(userData.emergencyContact) {
                setValue('emergencyName', userData.emergencyContact.name);
                setValue('emergencyRelation', userData.emergencyContact.relation);
                setValue('emergencyPhone', userData.emergencyContact.phone);
            }
          }
        } else {
          generateId();
          if (isManager && currentUser) {
              setValue('role', Role.EMPLOYEE);
              setValue('departmentId', currentUser.departmentId);
              setValue('managerId', currentUser.id);
          }
        }
      } catch (e) {
        showToast(t('messages.loadError'), "error");
      } finally {
        setTimeout(() => setIsLoadingData(false), 500);
      }
    };
    loadData();
  }, [id, setValue, showToast, isManager, currentUser, t]);

  useEffect(() => {
      if (isDirty) {
          const timer = setTimeout(() => {
              setLastSaved(new Date());
          }, 3000);
          return () => clearTimeout(timer);
      }
  }, [watchAll, isDirty]);

  const generateId = async () => {
      try {
          const nextId = await Api.users.getNextId();
          setValue('id', nextId);
      } catch (e) {
          const randomNum = Math.floor(10000 + Math.random() * 90000);
          setValue('id', `EMP${randomNum}`);
      }
  };

  const handleNext = async () => {
      const fieldsToValidate = STEP_FIELDS_MAP[currentStep];
      const isValid = await trigger(fieldsToValidate as any);
      if (isValid) {
          setCurrentStep(prev => Math.min(prev + 1, WIZARD_STEPS.length - 1));
          window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
          showToast(t('onboarding.messages.fixErrors'), "error");
      }
  };

  const handlePrev = () => {
      setCurrentStep(prev => Math.max(prev - 1, 0));
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const jumpToStep = async (index: number) => {
      if (index < currentStep) {
          setCurrentStep(index);
      } else {
          const fieldsToValidate = STEP_FIELDS_MAP[currentStep];
          const isValid = await trigger(fieldsToValidate as any);
          if (isValid) setCurrentStep(index);
          else showToast(t('onboarding.messages.fixErrors'), "error");
      }
  };

  const handleSaveDraft = () => {
      showToast(t('onboarding.messages.draftSaved'), "success");
      setLastSaved(new Date());
  };

  const onSubmit: SubmitHandler<EmployeeFormValues> = async (data) => {
    try {
      const payload = {
        ...data,
        name: `${data.firstName} ${data.lastName}`,
        avatarUrl: avatarPreview,
        emergencyContact: {
            name: data.emergencyName,
            relation: data.emergencyRelation,
            phone: data.emergencyPhone
        }
      };

      if (id) {
        await Api.users.update(payload as any);
        showToast(t('onboarding.messages.success'), "success");
      } else {
        await Api.users.create(payload as any);
        showToast(t('onboarding.messages.success'), "success");
      }
      navigate('/employees');
    } catch (e: any) {
      console.error(e);
      showToast(e.message || t('messages.opFailed'), "error");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast(t('messages.imageSize'), "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQuickAdd = (type: string) => {
    const val = prompt(`${t('messages.enterNew')} ${type}:`);
    if(val) {
        if(type === 'Position') {
            const newId = `pos-${Date.now()}`;
            setPositions(prev => [...prev, { id: newId, title: val }]);
            setValue('position', val);
        }
        showToast(`${type} ${t('messages.added')}`, "success");
    }
  };

  const filteredManagers = useMemo(() => {
      if (!watchAll.departmentId) return managers.map(m => ({ value: m.id, label: m.name }));
      const deptManagers = managers.filter(m => m.departmentId === watchAll.departmentId);
      const otherManagers = managers.filter(m => m.departmentId !== watchAll.departmentId);
      return [
          ...deptManagers.map(m => ({ value: m.id, label: m.name, group: 'Department Lead' })),
          ...otherManagers.map(m => ({ value: m.id, label: m.name, group: 'Other Depts' }))
      ];
  }, [managers, watchAll.departmentId]);

  const estimatedPay = useMemo(() => {
      const basic = watchAll.basicSalary || 0;
      const mockUser = {
          salary: basic,
          joinDate: watchAll.joinDate,
          dependents: 0,
      } as any;
      return calculatePayrollForUser(mockUser);
  }, [watchAll.basicSalary, watchAll.joinDate]);

  const renderStepContent = () => {
      switch (currentStep) {
          case 0: return <StepBasics register={register} errors={errors} setValue={setValue} watchRole={watchAll.role} isManager={isManager} generateId={generateId} />;
          case 1: return <StepPersonal register={register} errors={errors} avatarPreview={avatarPreview} fileInputRef={fileInputRef} handleImageChange={handleImageChange} />;
          case 2: return <StepJob register={register} errors={errors} departments={departments} positions={positions} filteredManagers={filteredManagers} isManager={isManager} handleQuickAdd={handleQuickAdd} />;
          case 3: return <StepContact register={register} errors={errors} />;
          case 4: return <StepSalary register={register} estimatedPay={estimatedPay} />;
          case 5: return <StepFamily register={register} />;
          case 6: return <StepReview watchAll={watchAll} avatarPreview={avatarPreview} departments={departments} managers={managers} jumpToStep={jumpToStep} />;
          default: return null;
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col font-sans transition-colors duration-300">
      
      {/* 1. HEADER AREA */}
      <div className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 shadow-sm transition-colors">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/employees')} className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-all">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                                {id ? t('onboarding.editTitle') : t('onboarding.title')}
                            </h1>
                            {id && <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase rounded-full">{t('common.active')}</span>}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {id ? `${t('onboarding.editSubtitle')} ${watchAll.firstName}` : t('onboarding.subtitle')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {lastSaved && (
                        <span className="hidden sm:flex text-[10px] uppercase font-bold tracking-wider text-slate-400 items-center animate-in fade-in">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                            {t('onboarding.messages.saved')} {lastSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    )}
                    <Button variant="ghost" size="sm" onClick={handleSaveDraft} className="hidden md:flex text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                        <Save className="w-4 h-4 mr-2" /> {t('onboarding.buttons.saveDraft')}
                    </Button>
                </div>
            </div>
          </div>
      </div>

      {/* 2. STEPPER */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm sticky top-[61px] z-20">
          <div className="max-w-6xl mx-auto">
             <EmployeeWizardStepper steps={WIZARD_STEPS} currentStep={currentStep} onStepChange={jumpToStep} />
          </div>
      </div>

      {/* 3. MAIN CONTENT */}
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-24">
          {isLoadingData ? (
              <FormSkeleton />
          ) : (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8 transition-all">
                  <form className="space-y-6">
                      {/* Validation Error Banner */}
                      {Object.keys(errors).length > 0 && (
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl flex items-start gap-3 mb-6 animate-in slide-in-from-top-2">
                              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                              <div>
                                  <h4 className="text-sm font-bold text-red-800 dark:text-red-300">{t('onboarding.messages.attention')}</h4>
                                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{t('onboarding.messages.fixErrors')}</p>
                              </div>
                          </div>
                      )}
                      
                      {renderStepContent()}
                  </form>
              </div>
          )}
      </div>

      {/* 4. FOOTER CONTROLS */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-700 p-4 z-40 transition-colors">
          <div className="max-w-5xl mx-auto flex justify-between items-center w-full px-2 sm:px-6">
              <div>
                  {currentStep > 0 ? (
                      <Button variant="ghost" onClick={handlePrev} className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                          <ChevronLeft className="w-4 h-4 mr-2" /> {t('onboarding.buttons.back')}
                      </Button>
                  ) : (
                      !id && (
                          <button type="button" className="hidden sm:inline-flex items-center text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors px-3 py-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20">
                              <Download className="w-3.5 h-3.5 mr-2" /> {t('onboarding.buttons.importCsv')}
                          </button>
                      )
                  )}
              </div>
              <div className="flex gap-3">
                  {currentStep < WIZARD_STEPS.length - 1 ? (
                      <Button onClick={handleNext} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 px-6 shadow-lg shadow-slate-200 dark:shadow-none">
                          {t('onboarding.buttons.next')} <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                  ) : (
                      <Button onClick={handleSubmit(onSubmit)} isLoading={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30 px-8">
                          {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />} 
                          {id ? t('onboarding.buttons.saveProfile') : t('onboarding.buttons.finish')}
                      </Button>
                  )}
              </div>
          </div>
      </div>

    </div>
  );
};
