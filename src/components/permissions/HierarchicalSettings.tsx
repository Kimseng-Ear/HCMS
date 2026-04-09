import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/FormFields';
import { 
  Settings, Globe, Building2, Briefcase, User, Plus, Edit2, Trash2,
  Save, X, ChevronDown, ChevronRight, Search, Filter, Eye, EyeOff,
  Clock, AlertTriangle, CheckCircle2, Info, ArrowUpDown
} from 'lucide-react';
import { http } from '../../services/http';

interface Setting {
  id: number;
  setting_key: string;
  setting_value: string;
  data_type: string;
  description: string;
  category: string;
  level: 'global' | 'department' | 'position' | 'employee';
  level_id?: number;
}

interface Department {
  id: number;
  name: string;
  description: string;
  head_name?: string;
}

interface Position {
  id: number;
  title: string;
  description: string;
  department_name: string;
  level: number;
  base_salary: number;
}

interface EmployeePosition {
  id: number;
  employee_id: number;
  position_title: string;
  department_name: string;
  is_primary: boolean;
  start_date: string;
  end_date: string | null;
}

const levelIcons = {
  global: Globe,
  department: Building2,
  position: Briefcase,
  employee: User,
};

const levelColors = {
  global: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-200 dark:border-blue-800',
  department: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-200 dark:border-emerald-800',
  position: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 border-purple-200 dark:border-purple-800',
  employee: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-200 dark:border-amber-800',
};

export const HierarchicalSettings: React.FC = () => {
  const [activeView, setActiveView] = useState<'hierarchy' | 'settings' | 'audit'>('hierarchy');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [employeePositions, setEmployeePositions] = useState<EmployeePosition[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editingSetting, setEditingSetting] = useState<Setting | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const views = [
    { id: 'hierarchy', label: 'Organization Hierarchy', icon: Building2, description: 'Departments & positions' },
    { id: 'settings', label: 'Settings Hierarchy', icon: Settings, description: 'Global to employee settings' },
    { id: 'audit', label: 'Settings Audit', icon: Clock, description: 'Change history' },
  ];

  useEffect(() => {
    fetchDepartments();
    fetchPositions();
    fetchEmployeePositions();
    fetchSettings();
  }, []);

  const fetchDepartments = async () => {
    try {
      const { data } = await http.get('/departments');
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchPositions = async () => {
    try {
      const { data } = await http.get('/positions');
      setPositions(data);
    } catch (error) {
      setPositions([]);
    }
  };

  const fetchEmployeePositions = async () => {
    try {
      const { data } = await http.get('/users');
      setEmployeePositions((data || []).slice(0, 10).map((u: any, idx: number) => ({
        id: idx + 1,
        employee_id: idx + 1,
        position_title: u.position || 'N/A',
        department_name: u.departmentId || 'N/A',
        is_primary: true,
        start_date: u.joinDate || new Date().toISOString(),
        end_date: null
      })));
    } catch (error) {
      console.error('Error fetching employee positions:', error);
    }
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data } = await http.get('/settings/global');
      setSettings((data || []).map((s: any, idx: number) => ({
        id: idx + 1,
        setting_key: s.key,
        setting_value: typeof s.value === 'string' ? s.value : JSON.stringify(s.value),
        data_type: typeof s.value === 'number' ? 'number' : typeof s.value === 'boolean' ? 'boolean' : 'string',
        description: s.description || '',
        category: s.category || 'general',
        level: 'global',
        level_id: undefined
      })));
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (key: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedItems(newExpanded);
  };

  const updateSetting = async (setting: Setting, newValue: any) => {
    try {
      await http.put(`/settings/global/${setting.setting_key}`, {
        value: newValue,
        reason: 'Updated via settings hierarchy interface'
      });
      fetchSettings();
      setEditingSetting(null);
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  };

  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, Setting[]>);

  const filteredSettings = Object.entries(groupedSettings).reduce((acc, [category, categorySettings]) => {
    const filtered = categorySettings.filter(setting =>
      setting.setting_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      setting.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as Record<string, Setting[]>);

  if (activeView === 'hierarchy') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <Building2 className="w-6 h-6 text-emerald-600" />
              </div>
              Organization Hierarchy
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Manage departments, positions, and employee assignments
            </p>
          </div>
        </div>

        {/* Departments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Departments" className="border-slate-200 dark:border-slate-700">
            <div className="space-y-3">
              {departments.map((dept) => (
                <div key={dept.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {dept.name}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {dept.description}
                      </div>
                      {dept.head_name && (
                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          Head: {dept.head_name}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Positions" className="border-slate-200 dark:border-slate-700">
            <div className="space-y-3">
              {positions.slice(0, 8).map((position) => (
                <div key={position.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {position.title}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {position.department_name} • Level {position.level}
                      </div>
                      {position.base_salary && (
                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          ${position.base_salary.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Employee Positions */}
        <Card title="Current Employee Positions" className="border-slate-200 dark:border-slate-700">
          <div className="space-y-3">
            {employeePositions.map((empPos) => (
              <div key={empPos.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">
                      {empPos.position_title}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {empPos.department_name}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {empPos.is_primary && (
                        <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-xs rounded-full">
                          Primary
                        </span>
                      )}
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        Since {new Date(empPos.start_date).toLocaleDateString()}
                      </span>
                      {empPos.end_date && (
                        <span className="text-xs text-red-500">
                          Ends {new Date(empPos.end_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (activeView === 'settings') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
              Settings Hierarchy
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              View and manage settings across all hierarchy levels
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
          </div>
        </div>

        {/* Hierarchy Legend */}
        <Card className="border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-white">Hierarchy Priority</h3>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Higher levels override lower levels
            </span>
          </div>
          <div className="flex items-center gap-4">
            {(['employee', 'position', 'department', 'global'] as const).map((level) => {
              const Icon = levelIcons[level];
              return (
                <div key={level} className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg border ${levelColors[level]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium capitalize text-slate-700 dark:text-slate-300">
                    {level}
                  </span>
                  {level !== 'global' && (
                    <ArrowUpDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Settings by Category */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(filteredSettings).map(([category, categorySettings]) => (
              <Card key={category} title={category} className="border-slate-200 dark:border-slate-700">
                <div className="space-y-3">
                  {categorySettings.map((setting) => (
                    <div key={`${setting.level}-${setting.setting_key}`} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg border ${levelColors[setting.level]}`}>
                              {React.createElement(levelIcons[setting.level], { className: 'w-4 h-4' })}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900 dark:text-white">
                                {setting.setting_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </div>
                              <div className="text-sm text-slate-500 dark:text-slate-400">
                                {setting.description}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-1 text-xs rounded-full ${levelColors[setting.level]}`}>
                                  {setting.level}
                                </span>
                                <span className="text-xs text-slate-400">
                                  {setting.data_type}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {editingSetting?.id === setting.id ? (
                              <div className="flex items-center gap-2">
                                {setting.data_type === 'boolean' ? (
                                  <select
                                    value={setting.setting_value}
                                    onChange={(e) => updateSetting(setting, e.target.value === 'true')}
                                    className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-sm"
                                  >
                                    <option value="true">True</option>
                                    <option value="false">False</option>
                                  </select>
                                ) : setting.data_type === 'number' ? (
                                  <input
                                    type="number"
                                    value={setting.setting_value}
                                    onChange={(e) => updateSetting(setting, parseFloat(e.target.value))}
                                    className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-sm w-24"
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    value={setting.setting_value}
                                    onChange={(e) => updateSetting(setting, e.target.value)}
                                    className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-sm w-48"
                                  />
                                )}
                                <Button size="sm" onClick={() => setEditingSetting(null)}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-medium text-slate-900 dark:text-white">
                                  {setting.data_type === 'boolean' 
                                    ? setting.setting_value === 'true' ? 'Yes' : 'No'
                                    : setting.data_type === 'number'
                                    ? parseFloat(setting.setting_value).toLocaleString()
                                    : setting.setting_value
                                  }
                                </div>
                                <Button size="sm" variant="outline" onClick={() => setEditingSetting(setting)}>
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Audit View - Placeholder for now */}
      <Card title="Settings Audit Trail" className="border-slate-200 dark:border-slate-700">
        <div className="text-center py-16 text-slate-500 dark:text-slate-400">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Settings audit trail coming soon</p>
        </div>
      </Card>
    </div>
  );
};
