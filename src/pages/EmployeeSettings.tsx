import React, { useState } from 'react';
import { Settings, Save, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useToast } from '../context/ToastContext';

export const EmployeeSettings: React.FC = () => {
  const { showToast } = useToast();
  const [settings, setSettings] = useState({
    autoGenerateEmployeeId: true,
    idPrefix: 'EMP',
    idPadding: 5,
    requireApproval: true,
    defaultRole: 'employee',
    allowSelfOnboarding: false,
    emailNotifications: true,
    smsNotifications: false,
    autoActivateAfterApproval: false,
    probationPeriodMonths: 3,
    workingDaysPerWeek: 5,
    workingHoursPerDay: 8
  });

  const handleSave = () => {
    // TODO: Save settings to backend
    showToast('Employee settings saved successfully!', 'success');
  };

  const handleReset = () => {
    // Reset to defaults
    showToast('Settings reset to defaults', 'info');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Employee Module Settings
        </h2>

        <div className="space-y-8">
          {/* Employee ID Generation */}
          <div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
              Employee ID Generation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Auto-generate IDs
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.autoGenerateEmployeeId}
                    onChange={(e) => setSettings({ ...settings, autoGenerateEmployeeId: e.target.checked })}
                    className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                    Automatically generate employee IDs
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  ID Prefix
                </label>
                <input
                  type="text"
                  value={settings.idPrefix}
                  onChange={(e) => setSettings({ ...settings, idPrefix: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  maxLength={10}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Number Padding
                </label>
                <select
                  value={settings.idPadding}
                  onChange={(e) => setSettings({ ...settings, idPadding: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value={3}>3 digits (001)</option>
                  <option value={4}>4 digits (0001)</option>
                  <option value={5}>5 digits (00001)</option>
                  <option value={6}>6 digits (000001)</option>
                </select>
              </div>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Example: {settings.idPrefix} + {String(1).padStart(settings.idPadding, '0')} = {settings.idPrefix}{String(1).padStart(settings.idPadding, '0')}
            </p>
          </div>

          {/* Approval Workflow */}
          <div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
              Approval Workflow
            </h3>
            <div className="space-y-4">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.requireApproval}
                    onChange={(e) => setSettings({ ...settings, requireApproval: e.target.checked })}
                    className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                    Require approval for new employee onboarding
                  </span>
                </label>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.autoActivateAfterApproval}
                    onChange={(e) => setSettings({ ...settings, autoActivateAfterApproval: e.target.checked })}
                    className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                    Automatically activate employees after approval
                  </span>
                </label>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.allowSelfOnboarding}
                    onChange={(e) => setSettings({ ...settings, allowSelfOnboarding: e.target.checked })}
                    className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                    Allow employees to initiate their own onboarding
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Default Values */}
          <div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
              Default Values
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Default Role
                </label>
                <select
                  value={settings.defaultRole}
                  onChange={(e) => setSettings({ ...settings, defaultRole: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="employee">Employee</option>
                  <option value="hr_manager">HR Manager</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Probation Period (Months)
                </label>
                <select
                  value={settings.probationPeriodMonths}
                  onChange={(e) => setSettings({ ...settings, probationPeriodMonths: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value={1}>1 month</option>
                  <option value={3}>3 months</option>
                  <option value={6}>6 months</option>
                  <option value={12}>12 months</option>
                </select>
              </div>
            </div>
          </div>

          {/* Working Hours */}
          <div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
              Working Hours Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Working Days per Week
                </label>
                <select
                  value={settings.workingDaysPerWeek}
                  onChange={(e) => setSettings({ ...settings, workingDaysPerWeek: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value={5}>5 days</option>
                  <option value={6}>6 days</option>
                  <option value={7}>7 days</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Working Hours per Day
                </label>
                <select
                  value={settings.workingHoursPerDay}
                  onChange={(e) => setSettings({ ...settings, workingHoursPerDay: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value={6}>6 hours</option>
                  <option value={7}>7 hours</option>
                  <option value={8}>8 hours</option>
                  <option value={9}>9 hours</option>
                  <option value={10}>10 hours</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
              Notifications
            </h3>
            <div className="space-y-4">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                    className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                    Send email notifications for onboarding events
                  </span>
                </label>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.smsNotifications}
                    onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
                    className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                    Send SMS notifications for critical events
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};