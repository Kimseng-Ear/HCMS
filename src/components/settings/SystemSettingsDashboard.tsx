import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/FormFields';
import { 
  Building2, Clock, Calendar, DollarSign, Shield, Bell, 
  Settings, Edit2, Save, X, History, Search, Filter,
  ChevronDown, ChevronRight, Eye, EyeOff, Plus, AlertTriangle,
  CheckCircle2, Info, ArrowUpDown, Download, RefreshCw
} from 'lucide-react';

interface Setting {
  setting_key: string;
  setting_value: string;
  data_type: string;
  description: string;
  category: string;
  level: 'global' | 'department' | 'position' | 'employee';
  level_id?: string;
  source?: string;
}

interface AuditLog {
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
  'Payroll Policies': DollarSign,
  'Security': Shield,
  'Notification': Bell,
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

export const SystemSettingsDashboard: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('Company Profile');
  const [settings, setSettings] = useState<Record<string, Setting[]>>({});
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingSetting, setEditingSetting] = useState<Setting | null>(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<Setting | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAuditPanel, setShowAuditPanel] = useState(true);

  const categories = [
    'Company Profile',
    'Working Hours',
    'Attendance Policies',
    'Leave Policies',
    'Payroll Policies',
    'Security',
    'Notification'
  ];

  useEffect(() => {
    fetchSettings();
    fetchAuditLogs();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings/global');
      if (response.ok) {
        const data = await response.json();
        const groupedSettings = data.data.reduce((acc: Record<string, Setting[]>, setting: Setting) => {
          if (!acc[setting.category]) {
            acc[setting.category] = [];
          }
          acc[setting.category].push(setting);
          return acc;
        }, {});
        setSettings(groupedSettings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch('/api/audit/settings?limit=50');
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.data);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  const updateSetting = async (setting: Setting, newValue: any) => {
    try {
      const response = await fetch('/api/settings/global', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: setting.setting_key,
          value: newValue,
          reason: 'Updated via system settings dashboard'
        }),
      });

      if (response.ok) {
        fetchSettings();
        fetchAuditLogs();
        setEditingSetting(null);
      }
    } catch (error) {
      console.error('Error updating setting:', error);
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

  const renderSettingValue = (setting: Setting, isEditing: boolean) => {
    if (isEditing) {
      switch (setting.data_type) {
        case 'boolean':
          return (
            <select
              defaultValue={setting.setting_value}
              onChange={(e) => updateSetting(setting, e.target.value === 'true')}
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
              onChange={(e) => updateSetting(setting, parseFloat(e.target.value))}
              className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-sm w-24"
            />
          );
        case 'json':
          return (
            <textarea
              defaultValue={setting.setting_value}
              onChange={(e) => updateSetting(setting, e.target.value)}
              className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-sm w-48 h-16 resize-none"
            />
          );
        default:
          return (
            <input
              type="text"
              defaultValue={setting.setting_value}
              onChange={(e) => updateSetting(setting, e.target.value)}
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
            setting.setting_value === 'true' 
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' 
              : 'bg-red-100 dark:bg-red-900/30 text-red-600'
          }`}>
            {setting.setting_value === 'true' ? 'Enabled' : 'Disabled'}
          </span>
        );
      case 'number':
        return <span className="font-medium">{parseFloat(setting.setting_value).toLocaleString()}</span>;
      case 'json':
        try {
          const parsed = JSON.parse(setting.setting_value);
          return (
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {Array.isArray(parsed) ? `${parsed.length} items` : typeof parsed === 'object' ? 'Object' : parsed}
            </span>
          );
        } catch {
          return <span className="text-sm text-slate-600 dark:text-slate-400">{setting.setting_value}</span>;
        }
      default:
        return <span className="font-medium">{setting.setting_value}</span>;
    }
  };

  const filteredCategories = categories.filter(category =>
    category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (settings[category]?.some(setting => 
      setting.setting_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      setting.description.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

  return (
    <div className="flex h-full bg-slate-50 dark:bg-slate-900">
      {/* Main Content */}
      <div className={`flex-1 p-6 transition-all duration-300 ${showAuditPanel ? 'mr-80' : ''}`}>
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
              System Settings
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Manage organization-wide configuration and policies
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search settings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
                label="Search"
              />
            </div>
            <Button variant="outline" onClick={fetchSettings}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => setShowAuditPanel(!showAuditPanel)}>
              <History className="w-4 h-4 mr-2" />
              {showAuditPanel ? 'Hide' : 'Show'} Audit
            </Button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1 mb-6">
          <div className="flex flex-wrap gap-1">
            {filteredCategories.map((category) => {
              const Icon = categoryIcons[category as keyof typeof categoryIcons] || Settings;
              const isExpanded = expandedCategories.has(category);
              const settingCount = settings[category]?.length || 0;
              
              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all ${
                    activeCategory === category
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    activeCategory === category
                      ? 'bg-white/20 text-white'
                      : categoryColors[category as keyof typeof categoryColors]
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{category}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    activeCategory === category
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {settingCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Settings Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {settings[activeCategory]?.map((setting) => (
              <Card key={setting.setting_key} className="border-slate-200 dark:border-slate-700">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {setting.setting_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h3>
                        {setting.source && setting.source !== 'Global Default' && (
                          <span className="px-2 py-1 text-xs rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600">
                            {setting.source}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 mb-4">
                        {setting.description}
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          <span className="font-medium">Type:</span> {setting.data_type}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          <span className="font-medium">Category:</span> {setting.category}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 ml-4">
                      {renderSettingValue(setting, editingSetting?.setting_key === setting.setting_key)}
                      
                      <div className="flex items-center gap-2">
                        {editingSetting?.setting_key === setting.setting_key ? (
                          <Button size="sm" onClick={() => setEditingSetting(null)}>
                            <X className="w-4 h-4" />
                          </Button>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" onClick={() => setEditingSetting(setting)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              setSelectedSetting(setting);
                              setShowOverrideModal(true);
                            }}>
                              <Plus className="w-4 h-4" />
                              Override
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Audit History Sidebar */}
      {showAuditPanel && (
        <div className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Recent Changes
              </h3>
              <Button size="sm" variant="outline" onClick={() => setShowAuditPanel(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="p-4 overflow-y-auto h-full">
            {auditLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <History className="w-8 h-8 mx-auto mb-4 opacity-50" />
                <p>No recent changes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-slate-900 dark:text-white text-sm">
                          {log.setting_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {log.level} • {new Date(log.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        log.old_value === null ? 'bg-green-500' : 'bg-blue-500'
                      }`} />
                    </div>
                    
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      {log.old_value !== null && (
                        <div className="flex items-center gap-2">
                          <span className="line-through text-red-500">{log.old_value}</span>
                          <span>→</span>
                          <span className="text-green-600">{log.new_value}</span>
                        </div>
                      )}
                      {log.old_value === null && (
                        <div className="text-green-600">Set to {log.new_value}</div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>By {log.changed_by_name}</span>
                      {log.change_reason && (
                        <span className="truncate ml-2" title={log.change_reason}>
                          {log.change_reason}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Override Modal */}
      {showOverrideModal && selectedSetting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Create Override
            </h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Setting
                </label>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <div className="font-medium text-slate-900 dark:text-white">
                    {selectedSetting.setting_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {selectedSetting.description}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Override Level
                </label>
                <select className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                  <option value="department">Department</option>
                  <option value="position">Position</option>
                  <option value="employee">Employee</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  New Value
                </label>
                {renderSettingValue(selectedSetting, true)}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Reason
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                  rows={3}
                  placeholder="Enter reason for override..."
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button className="flex-1" onClick={() => setShowOverrideModal(false)}>
                Cancel
              </Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                Create Override
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
