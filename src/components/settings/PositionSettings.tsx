import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/FormFields';
import { 
  Briefcase, Settings, Eye, EyeOff, Edit2, Save, X, RefreshCw,
  Search, Filter, ChevronDown, ChevronRight, ArrowUp, ArrowDown,
  Info, AlertTriangle, CheckCircle2, Undo, Globe, Building2, Users,
  Calendar, Clock, DollarSign, Shield, Bell, Download, Upload
} from 'lucide-react';

interface Position {
  id: string;
  name: string;
  description: string;
  department_id: string;
  created_at: string;
}

interface Department {
  id: string;
  name: string;
  description: string;
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

const sourceColors = {
  'global': 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
  'department': 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
  'position': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600',
  'employee': 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
};

const hierarchyColors = {
  'global': 'border-slate-300 dark:border-slate-600',
  'department': 'border-blue-300 dark:border-blue-600',
  'position': 'border-emerald-300 dark:border-emerald-600',
  'employee': 'border-purple-300 dark:border-purple-600',
};

export const PositionSettings: React.FC = () => {
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [globalSettings, setGlobalSettings] = useState<Setting[]>([]);
  const [positionSettings, setPositionSettings] = useState<Setting[]>([]);
  const [departmentSettings, setDepartmentSettings] = useState<Setting[]>([]);
  const [settingHierarchies, setSettingHierarchies] = useState<Record<string, SettingHierarchy[]>>({});
  const [loading, setLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingSetting, setEditingSetting] = useState<Setting | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    fetchPositions();
    fetchDepartments();
    fetchGlobalSettings();
  }, []);

  useEffect(() => {
    if (selectedPosition) {
      fetchPositionSettings(selectedPosition.id);
      fetchDepartmentSettings(selectedPosition.department_id);
      fetchSettingHierarchies(selectedPosition.id);
    }
  }, [selectedPosition]);

  const fetchPositions = async () => {
    try {
      const response = await fetch('/api/positions');
      if (response.ok) {
        const data = await response.json();
        setPositions(data);
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
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

  const fetchPositionSettings = async (positionId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/settings/positions/${positionId}`);
      if (response.ok) {
        const data = await response.json();
        setPositionSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching position settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentSettings = async (departmentId: string) => {
    try {
      const response = await fetch(`/api/settings/departments/${departmentId}`);
      if (response.ok) {
        const data = await response.json();
        setDepartmentSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching department settings:', error);
    }
  };

  const fetchSettingHierarchies = async (positionId: string) => {
    try {
      const hierarchies: Record<string, SettingHierarchy[]> = {};
      
      // Get all setting keys from global settings
      for (const globalSetting of globalSettings) {
        const response = await fetch(`/api/settings/effective/${positionId}/${globalSetting.setting_key}`);
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

  const updatePositionSetting = async (settingKey: string, value: any) => {
    try {
      const response = await fetch(`/api/settings/positions/${selectedPosition?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: settingKey,
          value: value,
          reason: 'Updated via position settings dashboard'
        }),
      });

      if (response.ok) {
        fetchPositionSettings(selectedPosition!.id);
        fetchSettingHierarchies(selectedPosition!.id);
        setEditingSetting(null);
      }
    } catch (error) {
      console.error('Error updating position setting:', error);
    }
  };

  const revertToGlobal = async (settingKey: string) => {
    try {
      const globalSetting = globalSettings.find(s => s.setting_key === settingKey);
      if (globalSetting) {
        await updatePositionSetting(settingKey, globalSetting.setting_value);
      }
    } catch (error) {
      console.error('Error reverting to global:', error);
    }
  };

  const revertToDepartment = async (settingKey: string) => {
    try {
      const departmentSetting = departmentSettings.find(s => s.setting_key === settingKey);
      if (departmentSetting) {
        await updatePositionSetting(settingKey, departmentSetting.setting_value);
      }
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
              onChange={(e) => updatePositionSetting(setting.setting_key, e.target.value === 'true')}
              className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-sm"
              disabled={effectiveSetting?.level === 'global'}
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
              onChange={(e) => updatePositionSetting(setting.setting_key, parseFloat(e.target.value))}
              className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-sm w-24"
              disabled={effectiveSetting?.level === 'global'}
            />
          );
        case 'json':
          return (
            <textarea
              defaultValue={setting.setting_value}
              onChange={(e) => updatePositionSetting(setting.setting_key, e.target.value)}
              className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-sm w-48 h-16 resize-none"
              disabled={effectiveSetting?.level === 'global'}
            />
          );
        default:
          return (
            <input
              type="text"
              defaultValue={setting.setting_value}
              onChange={(e) => updatePositionSetting(setting.setting_key, e.target.value)}
              className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-sm w-48"
              disabled={effectiveSetting?.level === 'global'}
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
          } ${effectiveSetting?.level === 'global' ? 'opacity-60' : ''}`}>
            {effectiveSetting?.value === 'true' ? 'Enabled' : 'Disabled'}
          </span>
        );
      case 'number':
        return (
          <span className={`font-medium ${effectiveSetting?.level === 'global' ? 'opacity-60' : ''}`}>
            {parseFloat(effectiveSetting?.value || '0').toLocaleString()}
          </span>
        );
      case 'json':
        try {
          const parsed = JSON.parse(effectiveSetting?.value || '{}');
          return (
            <span className={`text-sm text-slate-600 dark:text-slate-400 ${effectiveSetting?.level === 'global' ? 'opacity-60' : ''}`}>
              {Array.isArray(parsed) ? `${parsed.length} items` : typeof parsed === 'object' ? 'Object' : parsed}
            </span>
          );
        } catch {
          return (
            <span className={`text-sm text-slate-600 dark:text-slate-400 ${effectiveSetting?.level === 'global' ? 'opacity-60' : ''}`}>
              {effectiveSetting?.value}
            </span>
          );
        }
      default:
        return (
          <span className={`font-medium ${effectiveSetting?.level === 'global' ? 'opacity-60' : ''}`}>
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
          <Info className="w-4 h-4 text-slate-400" />
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
              <div className={`px-2 py-1 rounded border ${sourceColors[item.level]} ${hierarchyColors[item.level]}`}>
                {item.level.charAt(0).toUpperCase()}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const getInheritancePath = (settingKey: string) => {
    const hierarchy = settingHierarchies[settingKey] || [];
    const effectiveSetting = hierarchy.find(h => h.is_effective);
    
    if (!effectiveSetting) return 'No inheritance path';
    
    const path = hierarchy
      .filter(h => h.level !== 'global') // Only show overrides
      .map(h => {
        const labels = {
          'department': 'Department',
          'position': 'Position',
          'employee': 'Employee'
        };
        return labels[h.level];
      })
      .join(' → ');
    
    return path || 'Inherited from Global';
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
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Briefcase className="w-6 h-6 text-emerald-600" />
            </div>
            Position Settings
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage position-specific configuration and overrides
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
            Import
          </Button>
          <Button variant="outline" onClick={() => setShowExportModal(true)}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => {
            if (selectedPosition) {
              fetchPositionSettings(selectedPosition.id);
              fetchSettingHierarchies(selectedPosition.id);
            }
          }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Position Selection */}
      <Card className="border-slate-200 dark:border-slate-700">
        <div className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Select Position
              </label>
              <select
                value={selectedPosition?.id || ''}
                onChange={(e) => {
                  const position = positions.find(p => p.id === e.target.value);
                  setSelectedPosition(position || null);
                }}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white appearance-none"
              >
                <option value="">Select a position...</option>
                {positions.map((position) => {
                  const department = departments.find(d => d.id === position.department_id);
                  return (
                    <option key={position.id} value={position.id}>
                      {position.name} - {department?.name || 'Unknown Department'}
                    </option>
                  );
                })}
              </select>
            </div>
            
            {selectedPosition && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/30">
                  <Briefcase className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">
                    {selectedPosition.name}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {selectedPosition.description}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Settings Content */}
      {selectedPosition ? (
        <div className="space-y-6">
          {/* Hierarchy Overview */}
          <Card className="border-slate-200 dark:border-slate-700">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Setting Hierarchy: Global → Department → Position
              </h3>
              <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span>Global Settings</span>
                </div>
                <span>→</span>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>
                    {departments.find(d => d.id === selectedPosition.department_id)?.name || 'Unknown Department'}
                  </span>
                </div>
                <span>→</span>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  <span>{selectedPosition.name}</span>
                </div>
              </div>
            </div>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
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
                          const positionSetting = positionSettings.find(s => s.setting_key === setting.setting_key);
                          const departmentSetting = departmentSettings.find(s => s.setting_key === setting.setting_key);
                          const isGlobalOnly = effectiveSetting?.level === 'global';
                          const hasPositionOverride = positionSetting !== undefined;
                          
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
                                    {departmentSetting && (
                                      <div className="text-sm text-slate-500 dark:text-slate-400">
                                        <span className="font-medium">Department:</span> {departmentSetting.setting_value}
                                      </div>
                                    )}
                                    {hasPositionOverride && (
                                      <div className="text-sm text-slate-500 dark:text-slate-400">
                                        <span className="font-medium">Position:</span> {positionSetting?.setting_value}
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-2 mb-3">
                                    {getHierarchyVisual(setting.setting_key)}
                                  </div>
                                  
                                  <div className="text-xs text-slate-500 dark:text-slate-400">
                                    <span className="font-medium">Inheritance:</span> {getInheritancePath(setting.setting_key)}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3 ml-4">
                                  {renderSettingValue(
                                    positionSetting || setting,
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
                                        {!isGlobalOnly && (
                                          <Button size="sm" variant="outline" onClick={() => setEditingSetting(positionSetting || setting)}>
                                            <Edit2 className="w-4 h-4" />
                                          </Button>
                                        )}
                                        {hasPositionOverride && (
                                          <div className="flex items-center gap-1">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => revertToDepartment(setting.setting_key)}
                                              className="text-blue-600 hover:text-blue-700"
                                              title="Revert to Department"
                                            >
                                              <ArrowUp className="w-4 h-4" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => revertToGlobal(setting.setting_key)}
                                              className="text-amber-600 hover:text-amber-700"
                                              title="Revert to Global"
                                            >
                                              <ArrowDown className="w-4 h-4" />
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
                                      (Inherited from global - create position override to modify)
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
      ) : (
        <Card className="border-slate-200 dark:border-slate-700">
          <div className="p-8 text-center">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              Select a Position
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Choose a position to view and manage its settings
            </p>
          </div>
        </Card>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Import Position Settings
            </h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Upload a CSV file with setting_key and value columns to import position settings.
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button
                onClick={() => setShowImportModal(false)}
                variant="outline"
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
              Export Position Settings
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
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-emerald-600 rounded" />
                    <span className="text-sm">Current position settings</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-emerald-600 rounded" />
                    <span className="text-sm">Department settings for comparison</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-emerald-600 rounded" />
                    <span className="text-sm">Global settings for comparison</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4 text-emerald-600 rounded" />
                    <span className="text-sm">Setting hierarchy information</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
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
    </div>
  );
};
