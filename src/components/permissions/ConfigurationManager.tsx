import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/FormFields';
import { 
  Settings, Building2, Clock, Calendar, DollarSign, Shield, Bell, 
  Save, X, Upload, Download, Eye, EyeOff, Search, Filter, RefreshCw,
  CheckCircle2, AlertTriangle, Info, Edit2, Trash2, Plus, Copy
} from 'lucide-react';
import { http } from '../../services/http';

interface ConfigurationCategory {
  category: string;
  settings: ConfigurationSetting[];
  description: string;
}

interface ConfigurationSetting {
  setting_key: string;
  setting_value: string;
  data_type: string;
  description: string;
  category: string;
  level: 'global' | 'department' | 'position' | 'employee';
  level_id?: number;
  source?: string;
}

interface PermissionMatrix {
  category: string;
  permissions: PermissionAction[];
}

interface PermissionAction {
  name: string;
  description: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
  export: boolean;
  manage: boolean;
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

export const ConfigurationManager: React.FC = () => {
  const [activeView, setActiveView] = useState<'categories' | 'matrix' | 'audit'>('categories');
  const [categories, setCategories] = useState<ConfigurationCategory[]>([]);
  const [permissionMatrix, setPermissionMatrix] = useState<PermissionMatrix[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingSetting, setEditingSetting] = useState<ConfigurationSetting | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const views = [
    { id: 'categories', label: 'Configuration', icon: Settings, description: 'System settings and policies' },
    { id: 'matrix', label: 'Permission Matrix', icon: Shield, description: 'Role-based permission overview' },
    { id: 'audit', label: 'Audit Trail', icon: Clock, description: 'Configuration change history' },
  ];

  useEffect(() => {
    fetchCategories();
    fetchPermissionMatrix();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await http.get('/settings/global');
      const grouped = (data || []).reduce((acc: any, setting: any) => {
        const category = setting.category || 'General';
        if (!acc[category]) {
          acc[category] = { category, settings: [], description: `${category} settings` };
        }
        acc[category].settings.push({
          setting_key: setting.key,
          setting_value: typeof setting.value === 'string' ? setting.value : JSON.stringify(setting.value),
          data_type: typeof setting.value,
          description: setting.description || '',
          category: category,
          level: 'global',
          source: 'Global Default'
        });
        return acc;
      }, {});
      setCategories(Object.values(grouped));
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissionMatrix = async () => {
    try {
      const { data } = await http.get('/permissions');
      const perms = data.permissions || [];
      const grouped = perms.reduce((acc: any, p: any) => {
        if (!acc[p.module]) acc[p.module] = [];
        acc[p.module].push({
          name: p.key,
          description: p.description || '',
          view: true,
          create: p.key.includes('.create'),
          edit: p.key.includes('.edit'),
          delete: p.key.includes('.delete'),
          approve: p.key.includes('.approve'),
          export: p.key.includes('.export'),
          manage: p.key.includes('.manage')
        });
        return acc;
      }, {});
      setPermissionMatrix(Object.keys(grouped).map((k) => ({ category: k, permissions: grouped[k] })));
    } catch (error) {
      console.error('Error fetching permission matrix:', error);
    }
  };

  const updateSetting = async (setting: ConfigurationSetting, newValue: any) => {
    try {
      await http.put(`/settings/global/${setting.setting_key}`, {
        value: newValue,
        reason: 'Updated via configuration manager'
      });
      fetchCategories();
      setEditingSetting(null);
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  };

  const exportConfiguration = async (category?: string) => {
    try {
      const url = category 
        ? `/configuration/export?category=${category}`
        : '/configuration/export';
      
      const response = await fetch(`/api${url}`, {
        headers: (() => {
          const raw = localStorage.getItem('hcms_user');
          const token = raw ? JSON.parse(raw).token : '';
          return token ? { Authorization: `Bearer ${token}` } : {};
        })()
      });
      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `configuration-${category || 'all'}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
      }
    } catch (error) {
      console.error('Error exporting configuration:', error);
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

  const renderSettingValue = (setting: ConfigurationSetting, isEditing: boolean) => {
    if (isEditing) {
      switch (setting.data_type) {
        case 'boolean':
          return (
            <select
              defaultValue={setting.setting_value}
              onChange={(e) => updateSetting(setting, e.target.value === 'true')}
              className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-sm"
            >
              <option value="true">True</option>
              <option value="false">False</option>
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
    category.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.settings.some(setting => 
      setting.setting_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      setting.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (activeView === 'categories') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
              System Configuration
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Manage organization-wide settings and policies
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
            <Button variant="outline" onClick={() => exportConfiguration()}>
              <Download className="w-4 h-4 mr-2" />
              Export All
            </Button>
            <Button variant="outline" onClick={fetchCategories}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Configuration Categories */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCategories.map((category) => {
              const Icon = categoryIcons[category.category as keyof typeof categoryIcons] || Settings;
              const isExpanded = expandedCategories.has(category.category);
              
              return (
                <Card key={category.category} className="border-slate-200 dark:border-slate-700">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleExpanded(category.category)}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <div className={`p-2 rounded-lg border ${categoryColors[category.category as keyof typeof categoryColors]}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                        </button>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {category.category}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {category.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {category.settings.length} settings
                        </span>
                        <Button size="sm" variant="outline" onClick={() => exportConfiguration(category.category)}>
                          <Download className="w-4 h-4" />
                        </Button>
                        <button
                          onClick={() => toggleExpanded(category.category)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                        >
                          {isExpanded ? (
                            <EyeOff className="w-4 h-4 text-slate-400" />
                          ) : (
                            <Eye className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="space-y-3 border-t border-slate-200 dark:border-slate-700 pt-4">
                        {category.settings.map((setting) => (
                          <div key={setting.setting_key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-medium text-slate-900 dark:text-white">
                                  {setting.setting_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </h4>
                                <span className={`px-2 py-1 text-xs rounded-full ${categoryColors[setting.category as keyof typeof categoryColors]}`}>
                                  {setting.data_type}
                                </span>
                                {setting.source && setting.source !== 'Global Default' && (
                                  <span className="px-2 py-1 text-xs rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600">
                                    {setting.source}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                                {setting.description}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              {renderSettingValue(setting, editingSetting?.setting_key === setting.setting_key)}
                              
                              <div className="flex items-center gap-1">
                                {editingSetting?.setting_key === setting.setting_key ? (
                                  <Button size="sm" onClick={() => setEditingSetting(null)}>
                                    <X className="w-4 h-4" />
                                  </Button>
                                ) : (
                                  <Button size="sm" variant="outline" onClick={() => setEditingSetting(setting)}>
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (activeView === 'matrix') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              Permission Matrix
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Role-based permission overview across all modules
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {permissionMatrix.map((module) => (
            <Card key={module.category} title={module.category} className="border-slate-200 dark:border-slate-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="text-left p-3 font-medium text-slate-700 dark:text-slate-300">Permission</th>
                      <th className="text-center p-3 font-medium text-slate-700 dark:text-slate-300">View</th>
                      <th className="text-center p-3 font-medium text-slate-700 dark:text-slate-300">Create</th>
                      <th className="text-center p-3 font-medium text-slate-700 dark:text-slate-300">Edit</th>
                      <th className="text-center p-3 font-medium text-slate-700 dark:text-slate-300">Delete</th>
                      <th className="text-center p-3 font-medium text-slate-700 dark:text-slate-300">Approve</th>
                      <th className="text-center p-3 font-medium text-slate-700 dark:text-slate-300">Export</th>
                      <th className="text-center p-3 font-medium text-slate-700 dark:text-slate-300">Manage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {module.permissions.map((permission) => (
                      <tr key={permission.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3">
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white">
                              {permission.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              {permission.description}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center ${
                            permission.view ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-slate-100 dark:bg-slate-700'
                          }`}>
                            {permission.view && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center ${
                            permission.create ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-slate-100 dark:bg-slate-700'
                          }`}>
                            {permission.create && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center ${
                            permission.edit ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-slate-100 dark:bg-slate-700'
                          }`}>
                            {permission.edit && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center ${
                            permission.delete ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-slate-100 dark:bg-slate-700'
                          }`}>
                            {permission.delete && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center ${
                            permission.approve ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-slate-100 dark:bg-slate-700'
                          }`}>
                            {permission.approve && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center ${
                            permission.export ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-slate-100 dark:bg-slate-700'
                          }`}>
                            {permission.export && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center ${
                            permission.manage ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-slate-100 dark:bg-slate-700'
                          }`}>
                            {permission.manage && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Audit Trail - Placeholder */}
      <Card title="Configuration Audit Trail" className="border-slate-200 dark:border-slate-700">
        <div className="text-center py-16 text-slate-500 dark:text-slate-400">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Configuration audit trail coming soon</p>
        </div>
      </Card>
    </div>
  );
};
