import React, { useState, useEffect } from 'react';
import { Settings, Building2, User, Clock, Shield, Bell, FileText, Save, X, Eye, Edit3, RotateCcw, History } from 'lucide-react';
import { http } from '../services/http';

interface SystemSettingsData {
  [key: string]: any;
}

interface SettingCategory {
  key: string;
  name: string;
  icon: React.ElementType;
  description: string;
}

const SystemSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('company');
  const [settings, setSettings] = useState<SystemSettingsData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAuditHistory, setShowAuditHistory] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const categories: SettingCategory[] = [
    { key: 'company', name: 'Company Profile', icon: Building2, description: 'Organization information and branding' },
    { key: 'working_hours', name: 'Working Hours', icon: Clock, description: 'Default work schedules and timing' },
    { key: 'attendance', name: 'Attendance Policies', icon: User, description: 'Grace periods and overtime rules' },
    { key: 'leave', name: 'Leave Policies', icon: FileText, description: 'Leave entitlement and approval rules' },
    { key: 'payroll', name: 'Payroll Policies', icon: Shield, description: 'Payroll cycles and tax settings' },
    { key: 'security', name: 'Security', icon: Shield, description: 'Password policies and session settings' },
    { key: 'notifications', name: 'Notifications', icon: Bell, description: 'Email templates and alerts' }
  ];

  const settingFields = {
    company: [
      { key: 'company.name', label: 'Company Name', type: 'text', required: true },
      { key: 'company.address', label: 'Address', type: 'textarea', required: false },
      { key: 'company.phone', label: 'Phone', type: 'tel', required: false },
      { key: 'company.email', label: 'Email', type: 'email', required: false },
      { key: 'company.tax_id', label: 'Tax ID', type: 'text', required: false },
      { key: 'company.fiscal_year', label: 'Fiscal Year', type: 'select', options: ['January-December', 'April-March', 'July-June', 'October-September'], required: true },
      { key: 'company.timezone', label: 'Timezone', type: 'select', options: ['Asia/Phnom_Penh', 'UTC', 'America/New_York'], required: true },
      { key: 'company.currency', label: 'Currency', type: 'select', options: ['USD', 'KHR', 'EUR'], required: true }
    ],
    working_hours: [
      { key: 'working_hours.start', label: 'Start Time', type: 'time', required: true },
      { key: 'working_hours.end', label: 'End Time', type: 'time', required: true },
      { key: 'working_hours.break_duration', label: 'Break Duration (minutes)', type: 'number', required: true },
      { key: 'working_hours.working_days', label: 'Working Days', type: 'multiselect', options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], required: true },
      { key: 'working_hours.overtime_rate', label: 'Overtime Rate', type: 'number', step: 0.1, required: true }
    ],
    attendance: [
      { key: 'attendance.grace_period', label: 'Grace Period (minutes)', type: 'number', required: true },
      { key: 'attendance.late_penalty', label: 'Late Penalty Policy', type: 'select', options: ['Warning', 'Deduction', 'None'], required: true },
      { key: 'attendance.overtime_method', label: 'Overtime Calculation', type: 'select', options: ['Daily', 'Weekly', 'Monthly'], required: true },
      { key: 'attendance.half_day_threshold', label: 'Half-day Threshold (hours)', type: 'number', step: 0.5, required: true }
    ],
    leave: [
      { key: 'leave.annual_days', label: 'Annual Leave Days', type: 'number', required: true },
      { key: 'leave.carryover_limit', label: 'Carryover Limit', type: 'number', required: true },
      { key: 'leave.probation_restriction', label: 'Probation Period Restriction', type: 'checkbox', required: false },
      { key: 'leave.approval_chain', label: 'Approval Chain', type: 'select', options: ['Direct Manager', 'Department Head', 'HR Manager'], required: true }
    ],
    payroll: [
      { key: 'payroll.cycle', label: 'Payroll Cycle', type: 'select', options: ['Monthly', 'Bi-weekly', 'Weekly'], required: true },
      { key: 'payroll.tax_method', label: 'Tax Calculation Method', type: 'select', options: ['Progressive', 'Flat Rate'], required: true },
      { key: 'payroll.nssf_rate', label: 'NSSF Rate (%)', type: 'number', step: 0.1, required: true },
      { key: 'payroll.payment_day', label: 'Payment Day', type: 'number', min: 1, max: 31, required: true }
    ],
    security: [
      { key: 'security.session_timeout', label: 'Session Timeout (minutes)', type: 'number', required: true },
      { key: 'security.password_min_length', label: 'Minimum Password Length', type: 'number', required: true },
      { key: 'security.password_complexity', label: 'Password Complexity', type: 'multiselect', options: ['Uppercase', 'Lowercase', 'Numbers', 'Special Characters'], required: true },
      { key: 'security.mfa_required', label: 'MFA Required', type: 'checkbox', required: false },
      { key: 'security.login_attempts', label: 'Max Login Attempts', type: 'number', required: true }
    ],
    notifications: [
      { key: 'notifications.email_enabled', label: 'Enable Email Notifications', type: 'checkbox', required: false },
      { key: 'notifications.leave_reminder', label: 'Leave Balance Reminder', type: 'checkbox', required: false },
      { key: 'notifications.payroll_alert', label: 'Payroll Processing Alert', type: 'checkbox', required: false },
      { key: 'notifications.birthday_wishes', label: 'Birthday Wishes', type: 'checkbox', required: false }
    ]
  };

  useEffect(() => {
    loadSettings();
  }, [activeTab]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data } = await http.get(`/settings/global${activeTab !== 'all' ? `?category=${activeTab}` : ''}`);
      
      if (data.success) {
        const formattedSettings: SystemSettingsData = {};
        data.data.forEach((setting: any) => {
          formattedSettings[setting.key] = setting.value;
        });
        setSettings(formattedSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key: string, value: any) => {
    try {
      setSaving(true);
      const { data } = await http.put(`/settings/global/${key}`, {
        value,
        reason: `Updated ${key} via system settings`
      });
      if (data.success) {
        setSettings(prev => ({ ...prev, [key]: value }));
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error saving setting:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const loadAuditHistory = async () => {
    try {
      const activeCategoryFields = settingFields[activeTab as keyof typeof settingFields] || [];
      const responses = await Promise.all(
        activeCategoryFields.map(field => http.get(`/settings/audit/${field.key}`))
      );
      const allLogs: any[] = [];
      
      for (const response of responses) {
        const data = response.data;
        if (data.success) {
          allLogs.push(...data.data);
        }
      }

      setAuditLogs(allLogs.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()));
    } catch (error) {
      console.error('Error loading audit history:', error);
    }
  };

  const renderField = (field: any) => {
    const value = settings[field.key] || '';
    const setValue = (newValue: any) => saveSetting(field.key, newValue);

    switch (field.type) {
      case 'text':
      case 'tel':
      case 'email':
        return (
          <input
            type={field.type}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required={field.required}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required={field.required}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(field.step ? parseFloat(e.target.value) : parseInt(e.target.value))}
            step={field.step}
            min={field.min}
            max={field.max}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required={field.required}
          />
        );

      case 'time':
        return (
          <input
            type="time"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required={field.required}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required={field.required}
          >
            <option value="">Select...</option>
            {field.options?.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div className="space-y-2">
            {field.options?.map((option: string) => (
              <label key={option} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) ? value.includes(option) : false}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    const newValues = e.target.checked
                      ? [...currentValues, option]
                      : currentValues.filter((v: string) => v !== option);
                    setValue(newValues);
                  }}
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => setValue(e.target.checked)}
              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <span>Enable</span>
          </label>
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required={field.required}
          />
        );
    }
  };

  const currentCategory = categories.find(cat => cat.key === activeTab);
  const currentFields = settingFields[activeTab as keyof typeof settingFields] || [];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">System Settings</h1>
        <p className="text-slate-600 dark:text-slate-400">Configure organization-wide settings and policies</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700 mb-8">
        <nav className="flex space-x-8 overflow-x-auto">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.key}
                onClick={() => setActiveTab(category.key)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === category.key
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{category.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            {/* Category Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
                    {currentCategory && <currentCategory.icon className="w-5 h-5" />}
                    <span>{currentCategory?.name}</span>
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{currentCategory?.description}</p>
                </div>
                <button
                  onClick={() => {
                    setShowAuditHistory(true);
                    loadAuditHistory();
                  }}
                  className="flex items-center space-x-2 px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
                >
                  <History className="w-4 h-4" />
                  <span>Audit History</span>
                </button>
              </div>
            </div>

            {/* Settings Form */}
            <div className="p-6 space-y-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="text-slate-600 dark:text-slate-400 mt-2">Loading settings...</p>
                </div>
              ) : (
                currentFields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderField(field)}
                  </div>
                ))
              )}
            </div>

            {/* Save Button */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-700">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={loadSettings}
                  className="px-4 py-2 text-slate-700 bg-slate-100 dark:bg-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
                >
                  Reset
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Total Settings</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">{currentFields.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Last Updated</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">2 mins ago</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Status</span>
                <span className="text-sm font-medium text-green-600">Active</span>
              </div>
            </div>
          </div>

          {/* Help */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Need Help?</h3>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
              Configure your organization settings carefully. Changes affect all users and departments.
            </p>
            <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              View Documentation →
            </button>
          </div>
        </div>
      </div>

      {/* Audit History Modal */}
      {showAuditHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Audit History</h3>
                <button
                  onClick={() => setShowAuditHistory(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {auditLogs.length === 0 ? (
                <p className="text-center text-slate-600 dark:text-slate-400">No audit history available</p>
              ) : (
                <div className="space-y-4">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{log.settingKey}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Changed from {JSON.stringify(log.oldValue)} to {JSON.stringify(log.newValue)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                            By {log.changedBy} on {new Date(log.changedAt).toLocaleString()}
                          </p>
                        </div>
                        <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">
                          {log.settingLevel}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemSettings;
