import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import { Users, FileText, Settings, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { EmployeeList } from './EmployeeList';
import { EmployeeOnboardingWizard } from './EmployeeOnboardingWizard';
import { EmployeeSettings } from './EmployeeSettings';

export const EmployeeModule: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = useAuth();

  // Determine active tab from URL
  const getActiveTab = () => {
    if (location.pathname.includes('/onboarding')) return 'onboarding';
    if (location.pathname.includes('/settings')) return 'settings';
    return 'list';
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());

  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [location.pathname]);

  const tabs = [
    {
      id: 'list',
      label: 'Employee List',
      icon: Users,
      path: '/employees',
      show: hasPermission('hr.employee.view')
    },
    {
      id: 'onboarding',
      label: 'Onboarding',
      icon: FileText,
      path: '/employees/onboarding',
      show: hasPermission('hr.employee.create')
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: '/employees/settings',
      show: hasPermission('hr.departments.view')
    }
  ].filter(tab => tab.show);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const tab = tabs.find(t => t.id === tabId);
    if (tab) navigate(tab.path);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Employee Management
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Manage employees, onboarding, and organizational structure
              </p>
            </div>
            <div className="flex items-center gap-3">
              {activeTab === 'list' && hasPermission('hr.employee.create') && (
                <Button
                  onClick={() => navigate('/employees/onboarding')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Employee
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content with Nested Routing */}
      <Routes>
        <Route path="/" element={<EmployeeList />} />
        <Route path="/onboarding" element={<EmployeeOnboardingWizard />} />
        <Route path="/settings" element={<EmployeeSettings />} />
      </Routes>
    </div>
  );
};