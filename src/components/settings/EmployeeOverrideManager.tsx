import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/FormFields';
import { 
  Users, Settings, Eye, EyeOff, Edit2, Save, X, RefreshCw,
  Search, Filter, ChevronDown, ChevronRight, Upload, Download,
  History, Clock, Calendar, Globe, Building2, Briefcase,
  AlertTriangle, CheckCircle2, Info, FileText, Plus, Trash2,
  ArrowUp, ArrowDown, Undo, FilterX, SearchX
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department_id?: string;
  position_id?: string;
  avatar?: string;
  is_active: boolean;
}

interface Setting {
  setting_key: string;
  setting_value: string;
  data_type: string;
  description: string;
  category: string;
  level: 'global' | 'department' | 'position' | 'employee';
  level_id?: string;
  source?: string;
  global_value?: string;
}

interface SettingHierarchy {
  level: 'global' | 'department' | 'position' | 'employee';
  level_id?: string;
  value: string;
  data_type: string;
  is_effective: boolean;
  updated_at?: string;
}

interface SettingOverride {
  id: string;
  employee_id: string;
  setting_key: string;
  setting_value: string;
  data_type: string;
  reason: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

interface OverrideHistory {
  id: string;
  setting_key: string;
  level: string;
  level_id?: string;
  old_value: string;
  new_value: string;
  changed_by: string;
  changed_by_name: string;
  change_reason: string;
  created_at: string;
}

const categoryIcons = {
  'Company Profile': Building2,
  'Working Hours': Clock,
  'Attendance Policies': Calendar,
  'Leave Policies': Calendar,
  'Payroll Policies': Calendar,
  'Security': Settings,
  'Notification': Settings,
};

const categoryColors = {
  'Company Profile': 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-200 dark:border-blue-800',
  'Working Hours': 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-200 dark:border-emerald-800',
  'Attendance Policies': 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-200 dark:border-amber-800',
  'Leave Policies': 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 border-purple-200 dark:border-purple-800',
  'Payroll Policies': 'bg-green-50 dark:bg-green-900/20 text-green-600 border-green-200 dark:border-green-800',
  'Security': 'bg-red-50 dark:bg-red-900/20 text-red-600 border-red-200 dark:border-red-800',
  'Notification': 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-indigo-200 dark:border-indigo-800',
};

const sourceColors = {
  'global': 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
  'department': 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
  'position': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600',
  'employee': 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
};

export const EmployeeOverrideManager: React.FC = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [employees, setEmployees] = useState<User[]>([]);
  const [globalSettings, setGlobalSettings] = useState<Setting[]>([]);
  const [employeeSettings, setEmployeeSettings] = useState<Setting[]>([]);
  const [settingHierarchies, setSettingHierarchies] = useState<Record<string, SettingHierarchy[]>>({});
  const [overrideHistory, setOverrideHistory] = useState<OverrideHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingSetting, setEditingSetting] = useState<Setting | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [activeView, setActiveView] = useState<'settings' | 'history'>('settings');

  useEffect(() => {
    fetchEmployees();
    fetchGlobalSettings();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchEmployeeSettings(selectedEmployee.id);
      fetchSettingHierarchies(selectedEmployee.id);
      fetchOverrideHistory(selectedEmployee.id);
    }
  }, [selectedEmployee]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchGlobalSettings = async () => {
    try {
      const response = await fetch('/api/settings/global');
      if (response.ok) {
        const data = await response.json();
        setGlobalSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching global settings:', error);
    }
  };

  const fetchEmployeeSettings = async (employeeId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/settings/employees/${employeeId}`);
      if (response.ok) {
        const data = await response.json();
        setEmployeeSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching employee settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettingHierarchies = async (employeeId: string) => {
    try {
      const hierarchies: Record<string, SettingHierarchy[]> = {};
      
      // Get all setting keys from global settings
      for (const globalSetting of globalSettings) {
        const response = await fetch(`/api/settings/effective/${employeeId}/${globalSetting.setting_key}`);
        if (response.ok) {
          const data = await response.json();
          hierarchies[globalSetting.setting_key] = data.data;
        }
      }
      
      setSettingHierarchies(hierarchies);
    } catch (error) {
      console.error('Error fetching setting hierarchies:', error);
    }
  };

  const fetchOverrideHistory = async (employeeId: string) => {
    try {
      const response = await fetch(`/api/audit/settings?user_id=${employeeId}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        setOverrideHistory(data.data);
      }
    } catch (error) {
      console.error('Error fetching override history:', error);
    }
  };

  const updateEmployeeSetting = async (settingKey: string, value: any, reason: string) => {
    try {
      const response = await fetch(`/api/settings/employees/${selectedEmployee?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: settingKey,
          value: value,
          reason: reason
        }),
      });

      if (response.ok) {
        fetchEmployeeSettings(selectedEmployee!.id);
        fetchSettingHierarchies(selectedEmployee!.id);
        fetchOverrideHistory(selectedEmployee!.id);
        setEditingSetting(null);
      }
    } catch (error) {
      console.error('Error updating employee setting:', error);
    }
  };

  const revertToGlobal = async (settingKey: string, reason: string) => {
    try {
      const globalSetting = globalSettings.find(s => s.setting_key === settingKey);
      if (globalSetting) {
        await updateEmployeeSetting(settingKey, globalSetting.setting_value, reason);
      }
    } catch (error) {
      console.error('Error reverting to global:', error);
    }
  };

  const revertToPosition = async (settingKey: string, reason: string) => {
    try {
      // This would need to fetch position settings first
      // For now, we'll just log the action
      console.log('Revert to position:', settingKey, reason);
    } catch (error) {
      console.error('Error reverting to position:', error);
    }
  };

  const revertToDepartment = async (settingKey: string, reason: string) => {
    try {
      // This would need to fetch department settings first
      // For now, we'll just log the action
      console.log('Revert to department:', settingKey, reason);
    } catch (error) {
      console.error('Error reverting to department:', error);
    }
  };

  const toggleExpanded = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const renderSettingValue = (setting: Setting, hierarchy: SettingHierarchy[], isEditing: boolean) => {
    const effectiveSetting = hierarchy.find(h => h.is_effective);
    const globalSetting = globalSettings.find(s => s.setting_key === setting.setting_key);
    
    if (isEditing) {
      switch (setting.data_type) {
        case 'boolean':
          return (
            <select
              defaultValue={setting.setting_value}
              onChange={(e) => updateEmployeeSetting(setting.setting_key, e.target.value === 'true', 'Updated via employee override manager')}
              className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-sm"
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          );
        case 'number':
          return (
            <input
              type="number"
              defaultValue={parseFloat(setting.setting_value)}
              onChange={(e) => updateEmployeeSetting(setting.setting_key, parseFloat(e.target.value), 'Updated via employee override manager')}
              className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-sm w-24"
            />
          );
        case 'json':
          return (
            <textarea
              defaultValue={setting.setting_value}
              onChange={(e) => updateEmployeeSetting(setting.setting_key, e.target.value, 'Updated via employee override manager')}
              className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-sm w-48 h-16 resize-none"
            />
          );
        default:
          return (
            <input
              type="text"
              defaultValue={setting.setting_value}
              onChange={(e) => updateEmployeeSetting(setting.setting_key, e.target.value, 'Updated via employee override manager')}
              className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-sm w-48"
            />
          );
      }
    }

    // Display value
    switch (setting.data_type) {
      case 'boolean':
        return (
          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            effectiveSetting?.value === 'true' 
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' 
              : 'bg-red-100 dark:bg-red-900/30 text-red-600'
          }`}>
            {effectiveSetting?.value === 'true' ? 'Enabled' : 'Disabled'}
          </span>
        );
      case 'number':
        return (
          <span className="font-medium">
            {parseFloat(effectiveSetting?.value || '0').toLocaleString()}
          </span>
        );
      case 'json':
        try {
          const parsed = JSON.parse(effectiveSetting?.value || '{}');
          return (
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {Array.isArray(parsed) ? `${parsed.length} items` : typeof parsed === 'object' ? 'Object' : parsed}
            </span>
          );
        } catch {
          return (
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {effectiveSetting?.value}
            </span>
          );
        }
      default:
        return (
          <span className="font-medium">
            {effectiveSetting?.value}
          </span>
        );
    }
  };

  const getSourceIndicator = (settingKey: string) => {
    const hierarchy = settingHierarchies[settingKey] || [];
    const effectiveSetting = hierarchy.find(h => h.is_effective);
    
    if (!effectiveSetting) return null;
    
    const sourceLabels = {
      'global': 'Global Default',
      'department': 'Department Override',
      'position': 'Position Override',
      'employee': 'Employee Override',
    };

    return (
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 text-xs rounded-full ${sourceColors[effectiveSetting.level]}`}>
          {sourceLabels[effectiveSetting.level]}
        </span>
        {effectiveSetting.level === 'global' && (
          <Info className="w-4 h-4 text-slate-400" title="This is inherited from global settings" />
        )}
      </div>
    );
  };

  const getHierarchyVisual = (settingKey: string) => {
    const hierarchy = settingHierarchies[settingKey] || [];
    
    return (
      <div className="flex items-center gap-2 text-xs">
        <Globe className="w-3 h-3 text-slate-400" />
        <div className="flex items-center gap-1">
          {hierarchy.map((item, index) => (
            <React.Fragment key={item.level}>
              {index > 0 && <span className="text-slate-400">→</span>}
              <div className={`px-2 py-1 rounded ${sourceColors[item.level]}`}>
                {item.level.charAt(0).toUpperCase()}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const handleCSVImport = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      
      // Validate CSV format
      if (headers.length < 2 || !headers[0].includes('setting_key') || !headers[1].includes('value')) {
        throw new Error('Invalid CSV format. Expected: setting_key,value[,reason]');
      }
      
      // Parse CSV and update settings
      let importCount = 0;
      let errorCount = 0;
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',');
        if (values.length >= 2) {
          const settingKey = values[0].trim();
          const settingValue = values[1].trim();
          const reason = values[2] ? values[2].trim() : 'Imported via CSV';
          
          try {
            await updateEmployeeSetting(settingKey, settingValue, reason);
            importCount++;
          } catch (error) {
            errorCount++;
            console.error('Error importing setting:', settingKey, error);
          }
        }
      }
      
      // Show import results
      alert(`Import completed: ${importCount} settings updated, ${errorCount} errors`);
      
    } catch (error) {
      console.error('Error importing CSV:', error);
      alert('Error importing CSV: ' + (error as Error).message);
    }
  };

  const categories = Array.from(new Set(globalSettings.map(s => s.category)));
  const filteredCategories = categories.filter(category =>
    category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    globalSettings.some(s => 
      s.category === category && (
        s.setting_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            Employee Override Manager
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage individual employee settings and overrides
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search employees or settings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
              label="Search"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <Button variant="outline" onClick={() => setShowImportModal(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline" onClick={() => setShowExportModal(true)}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => setShowHistoryModal(true)}>
            <History className="w-4 h-4 mr-2" />
            History
          </Button>
          <Button variant="outline" onClick={() => {
            if (selectedEmployee) {
              fetchEmployeeSettings(selectedEmployee.id);
              fetchSettingHierarchies(selectedEmployee.id);
              fetchOverrideHistory(selectedEmployee.id);
            }
          }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1">
        <div className="flex flex-wrap gap-1">
          {[
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'history', label: 'History', icon: History }
          ].map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                activeView === view.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <view.icon className="w-4 h-4" />
              <span>{view.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Employee Selection */}
      <Card className="border-slate-200 dark:border-slate-700">
        <div className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Search Employee
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={selectedEmployee?.id || ''}
                  onChange={(e) => {
                    const employee = employees.find(emp => emp.id === e.target.value);
                    setSelectedEmployee(employee || null);
                  }}
                  className="w-full pl-10 pr-8 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white appearance-none"
                >
                  <option value="">Select an employee...</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} ({employee.email}) - {employee.role}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {selectedEmployee && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-100 dark:bg-purple-900/30">
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">
                    {selectedEmployee.name}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {selectedEmployee.email} • {selectedEmployee.role}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Settings View */}
      {activeView === 'settings' && selectedEmployee && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            filteredCategories.map((category) => {
              const categorySettings = globalSettings.filter(s => s.category === category);
              const Icon = categoryIcons[category as keyof typeof categoryIcons] || Settings;
              const isExpanded = expandedCategories.has(category);
              
              return (
                <Card key={category} className="border-slate-200 dark:border-slate-700">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => toggleExpanded(category)}
                        className="flex items-center gap-3 text-left"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${categoryColors[category as keyof typeof categoryColors]}`}>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${categoryColors[category as keyof typeof categoryColors]}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                {category}
                              </h3>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                {categorySettings.length} settings
                              </p>
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>
                    
                    {isExpanded && (
                      <div className="space-y-4">
                        {categorySettings.map((setting) => {
                          const hierarchy = settingHierarchies[setting.setting_key] || [];
                          const effectiveSetting = hierarchy.find(h => h.is_effective);
                          const employeeSetting = employeeSettings.find(s => s.setting_key === setting.setting_key);
                          const isGlobalOnly = effectiveSetting?.level === 'global';
                          const hasEmployeeOverride = employeeSetting !== undefined;
                          
                          return (
                            <div key={setting.setting_key} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-medium text-slate-900 dark:text-white">
                                      {setting.setting_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </h4>
                                    {getSourceIndicator(setting.setting_key)}
                                  </div>
                                  
                                  <p className="text-slate-600 dark:text-slate-400 mb-3">
                                    {setting.description}
                                  </p>
                                  
                                  <div className="flex items-center gap-4 mb-3">
                                    <div className="text-sm text-slate-500 dark:text-slate-400">
                                      <span className="font-medium">Type:</span> {setting.data_type}
                                    </div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400">
                                      <span className="font-medium">Global:</span> {setting.setting_value}
                                    </div>
                                    {hasEmployeeOverride && (
                                      <div className="text-sm text-slate-500 dark:text-slate-400">
                                        <span className="font-medium">Employee:</span> {employeeSetting?.setting_value}
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-2 mb-3">
                                    {getHierarchyVisual(setting.setting_key)}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3 ml-4">
                                  {renderSettingValue(
                                    employeeSetting || setting,
                                    hierarchy,
                                    editingSetting?.setting_key === setting.setting_key
                                  )}
                                  
                                  <div className="flex items-center gap-2">
                                    {editingSetting?.setting_key === setting.setting_key ? (
                                      <Button size="sm" onClick={() => setEditingSetting(null)}>
                                        <X className="w-4 h-4" />
                                      </Button>
                                    ) : (
                                      <>
                                        <Button size="sm" variant="outline" onClick={() => setEditingSetting(employeeSetting || setting)}>
                                          <Edit2 className="w-4 h-4" />
                                        </Button>
                                        {hasEmployeeOverride && (
                                          <div className="flex items-center gap-1">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => revertToGlobal(setting.setting_key, 'Reverted to global default')}
                                              className="text-amber-600 hover:text-amber-700"
                                              title="Revert to Global"
                                            >
                                              <ArrowDown className="w-4 h-4" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => revertToPosition(setting.setting_key, 'Reverted to position')}
                                              className="text-emerald-600 hover:text-emerald-700"
                                              title="Revert to Position"
                                            >
                                              <ArrowUp className="w-4 h-4" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => revertToDepartment(setting.setting_key, 'Reverted to department')}
                                              className="text-blue-600 hover:text-blue-700"
                                              title="Revert to Department"
                                            >
                                              <Building2 className="w-4 h-4" />
                                            </Button>
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Visual indicator for setting source */}
                              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                  <Info className="w-3 h-3" />
                                  <span>
                                    Current value provided by: <span className="font-medium">
                                      {effectiveSetting?.level === 'global' ? 'Global Settings' : 
                                       effectiveSetting?.level === 'department' ? 'Department Override' : 
                                       effectiveSetting?.level === 'position' ? 'Position Override' : 
                                       'Employee Override'}
                                    </span>
                                  </span>
                                  {isGlobalOnly && (
                                    <span className="text-amber-600">
                                      (Inherited from global - create employee override to modify)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* History View */}
      {activeView === 'history' && selectedEmployee && (
        <Card className="border-slate-200 dark:border-slate-700">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Override History Timeline
            </h3>
            
            {overrideHistory.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No override history found for this employee</p>
              </div>
            ) : (
              <div className="space-y-3">
                {overrideHistory.map((history) => (
                  <div key={history.id} className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-200 dark:bg-slate-700">
                      <Clock className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {history.setting_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${sourceColors[history.level]}`}>
                          {history.level.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2 text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Changed from:</span>
                        <span className="text-red-600 dark:text-red-400 line-through">{history.old_value}</span>
                        <span className="text-slate-400">→</span>
                        <span className="text-green-600 dark:text-green-400">{history.new_value}</span>
                      </div>
                      
                      <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        {history.change_reason}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span>By {history.changed_by_name}</span>
                        <span>•</span>
                        <span>{new Date(history.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* No Employee Selected */}
      {!selectedEmployee && (
        <Card className="border-slate-200 dark:border-slate-700">
          <div className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              Select an Employee
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Choose an employee to view and manage their settings
            </p>
          </div>
        </Card>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Import Employee Overrides
            </h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleCSVImport(file);
                      setShowImportModal(false);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Upload a CSV file with columns: setting_key, value, reason
              </div>
              
              <div className="text-xs text-slate-400 dark:text-slate-400">
                Example format:<br />
                setting_key,value,reason<br />
                working_hours.default_start,08:30,Adjusted start time
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowImportModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Export Employee Settings
            </h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Export Format
                </label>
                <select className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                  <option value="xlsx">Excel</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Include
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-600 rounded" />
                    <span className="text-sm">Current employee overrides</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-600 rounded" />
                    <span className="text-sm">Global settings for comparison</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-600 rounded" />
                    <span className="text-sm">Setting hierarchy information</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-600 rounded" />
                    <span className="text-sm">Override history</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                onClick={() => setShowExportModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Override History Timeline
            </h3>
            
            <div className="space-y-4">
              {overrideHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No override history found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {overrideHistory.map((history) => (
                    <div key={history.id} className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-200 dark:bg-slate-700">
                        <Clock className="w-4 h-4 text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="font-medium text-slate-900 dark:text-white">
                            {history.setting_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${sourceColors[history.level]}`}>
                            {history.level.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2 text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Changed from:</span>
                          <span className="text-red-600 dark:text-red-400 line-through">{history.old_value}</span>
                          <span className="text-slate-400">→</span>
                          <span className="text-green-600 dark:text-green-400">{history.new_value}</span>
                        </div>
                        
                        <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                          {history.change_reason}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                          <span>By {history.changed_by_name}</span>
                          <span>•</span>
                          <span>{new Date(history.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowHistoryModal(false)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
