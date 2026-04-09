import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/FormFields';
import { 
  Shield, Users, Plus, Edit2, Save, X, RefreshCw, Search, Filter,
  Download, Upload, Copy, Trash2, Eye, EyeOff, CheckCircle2,
  AlertTriangle, Info, Users2, Settings, FileText, Clock, Calendar,
  BarChart3, TrendingUp, CheckSquare, Square, Share2
} from 'lucide-react';

interface PermissionTemplate {
  id: string;
  name: string;
  description: string;
  permissions: Record<string, boolean>;
  created_by: string;
  created_by_name: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

interface Permission {
  id: string;
  name: string;
  category: permission_category;
  description: string;
  is_sensitive: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  is_active: boolean;
}

interface TemplateUsage {
  template_id: string;
  template_name: string;
  user_id: string;
  user_name: string;
  applied_at: string;
  applied_by: string;
  applied_by_name: string;
}

interface TemplateStatistics {
  total_templates: number;
  active_templates: number;
  inactive_templates: number;
  total_permissions_in_templates: number;
  average_permissions_per_template: number;
  most_used_templates: Array<{
    template_id: string;
    template_name: string;
    usage_count: number;
  }>;
  recently_created: Array<PermissionTemplate>;
}

const categoryColors = {
  'Employee': 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-200 dark:border-blue-800',
  'Attendance': 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-200 dark:border-emerald-800',
  'Leave': 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 border-purple-200 dark:border-purple-800',
  'Payroll': 'bg-green-50 dark:bg-green-900/20 text-green-600 border-green-200 dark:border-green-800',
  'Department': 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-200 dark:border-amber-800',
  'Position': 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 border-orange-200 dark:border-orange-800',
  'Project': 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 border-pink-200 dark:border-pink-800',
  'Report': 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-indigo-200 dark:border-indigo-800',
  'User Account': 'bg-red-50 dark:bg-red-900/20 text-red-600 border-red-200 dark:border-red-800',
  'System Settings': 'bg-slate-50 dark:bg-slate-900/20 text-slate-600 border-slate-200 dark:border-slate-800',
};

const templateColors = {
  'active': 'bg-green-100 dark:bg-green-900/30 text-green-600 border-green-200 dark:border-green-800',
  'inactive': 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
};

const predefinedTemplates = [
  {
    name: 'Temporary Admin',
    description: 'Temporary administrator access for specific tasks',
    permissions: {
      'users.view': true,
      'users.create': true,
      'users.edit': true,
      'users.delete': true,
      'settings.view': true,
      'settings.edit': true,
      'audit.view': true
    },
    category: 'User Account'
  },
  {
    name: 'Auditor Access',
    description: 'Audit and compliance access permissions',
    permissions: {
      'audit.view': true,
      'audit.export': true,
      'compliance.view': true,
      'reports.view': true,
      'permissions.view': true,
      'settings.view': true
    },
    category: 'System Settings'
  },
  {
    name: 'Project Lead',
    description: 'Project management permissions',
    permissions: {
      'projects.view': true,
      'projects.create': true,
      'projects.edit': true,
      'projects.delete': true,
      'team.manage': true,
      'reports.project': true
    },
    category: 'Project'
  },
  {
    name: 'Sales Representative',
    description: 'Sales and customer management',
    permissions: {
      'customers.view': true,
      'customers.create': true,
      'customers.edit': true,
      'sales.view': true,
      'reports.sales': true,
      'compliance.view': true
    },
    category: 'Department'
  },
  {
    name: 'IT Support',
    description: 'IT support and system administration',
    permissions: {
      'system.admin': true,
      'system.maintenance': true,
      'users.reset_password': true,
      'settings.system': true,
      'logs.view': true,
      'security.view': true
    },
    category: 'System Settings'
  }
];

export const PermissionTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<PermissionTemplate[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [templateStats, setTemplateStats] = useState<TemplateStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  [showEditModal, setShowEditModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showStatisticsModal, setShowStatisticsModal] = useState(false);
  
  // Form states
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  [selectedPermissions, setSelectedPermissions] = useState<Record<string, boolean>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<PermissionTemplate | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [applyReason, setApplyReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'apply' | 'statistics'>('list');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchTemplates();
    fetchPermissions();
    fetchUsers();
    fetchTemplateStatistics();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/permissions/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/permissions');
      if (response.ok) {
        const data = await response.json();
        setPermissions(data.data.flatMap((category: any) => category.permissions));
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTemplateStatistics = async () => {
    try {
      const response = await fetch('/api/permissions/templates/statistics');
      if (response.ok) {
        const data = await response.json();
        setTemplateStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching template statistics:', error);
    }
  };

  const createTemplate = async () => {
    if (!templateName.trim()) {
      alert('Template name is required');
      return;
    }

    if (Object.keys(selectedPermissions).length === 0) {
      alert('Please select at least one permission');
      return;
    }

    try {
      const response = await fetch('/api/permissions/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: templateName,
          description: templateDescription,
          permissions: selectedPermissions,
          created_by: 'current_user_id' // This would come from auth context
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates([...templates, data.data]);
        setShowCreateModal(false);
        resetCreateForm();
        fetchTemplateStatistics();
      }
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Error creating template: ' + error.message);
    }
  };

  const updateTemplate = async () => {
    if (!selectedTemplate || !templateName.trim()) {
      alert('Template name is required');
      return;
    }

    try {
      const response = await fetch(`/api/permissions/templates/${selectedTemplate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: templateName,
          description: templateDescription,
          permissions: selectedPermissions
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(templates.map(t => 
          t.id === selectedTemplate.id ? data.data : t
        ));
        setShowEditModal(false);
        resetCreateForm();
        fetchTemplateStatistics();
      }
    } catch (error) {
      console.error('Error updating template:', error);
      alert('Error updating template: ' + error.message);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const response = await fetch(`/api/permissions/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTemplates(templates.filter(t => t.id !== templateId));
        setShowDeleteModal(false);
        fetchTemplateStatistics();
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Error deleting template: ' + error.message);
    }
  };

  const applyTemplate = async () => {
    if (!selectedTemplate || selectedUsers.length === 0) {
      alert('Please select a template and at least one user');
      return;
    }

    if (!applyReason.trim()) {
      alert('Please provide a reason for applying this template');
      return;
    }

    try {
      const response = await fetch(`/api/permissions/templates/${selectedTemplate.id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'import/json',
        },
        body: JSON.stringify({
          user_ids: selectedUsers,
          reason: applyReason
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Template applied to ${data.applied_count} users`);
        setShowApplyModal(false);
        setSelectedTemplate(null);
        setSelectedUsers([]);
        setApplyReason('');
      }
    } catch (error) {
      console.error('Error applying template:', error);
      alert('Error applying template: ' + error.message);
    }
  };

  const toggleTemplateStatus = async (templateId: string) => {
    try {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        const response = await fetch(`/api/permissions/templates/${templateId}/toggle-status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setTemplates(templates.map(t => 
            t.id === templateId ? data.data : t
          ));
        }
      }
    } catch (error) {
      console.error('Error toggling template status:', error);
    }
  };

  const exportTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/permissions/templates/${templateId}/export`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `template-${templateId}-${new Date().toISOString()}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting template:', error);
      alert('Error exporting template: ' + error.message);
    }
  };

  const importTemplate = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate template structure
      if (!data.name || !data.permissions) {
        throw new Error('Invalid template format. Required fields: name, permissions');
      }

      const response = await fetch('/api/permissions/templates/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const imported = response.data.imported;
        alert(`Imported ${imported} templates successfully`);
        setShowImportModal(false);
        fetchTemplates();
        fetchTemplateStatistics();
      }
    } catch (error) {
      console.error('Error importing template:', error);
      alert('Error importing template: ' + error.message);
    }
  };

  const exportAllTemplates = async () => {
    try {
      const response = await fetch('/api/permissions/templates/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `all-templates-${new Date().toISOString()}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting templates:', error);
      alert('Error exporting templates: ' + error.message);
    }
  };

  const resetCreateForm = () => {
    setTemplateName('');
    setTemplateDescription('');
    setSelectedPermissions({});
  };

  const resetEditForm = () => {
    setTemplateName('');
    setTemplateDescription('');
    setSelectedPermissions(selectedTemplate ? selectedTemplate.permissions : {});
  };

  const getFilteredTemplates = () => {
    let filtered = [...templates];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    if (filterCategory) {
      const categoryPermissions = permissions.filter(p => p.category === filterCategory);
      filtered = filtered.filter(template => {
        return Object.keys(template.permissions).some(key => 
          categoryPermissions.some(p => p.name === key)
        );
      });
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(template => 
        filterStatus === 'active' ? template.is_active : !template.is_active
      );
    }
    
    return filtered;
  };

  const getPermissionCategory = (permissionId: string): string => {
    const permission = permissions.find(p => p.id === permissionId);
    return permission ? permission.category : 'Unknown';
  };

  const getPermissionsByCategory = () => {
    const categories = Array.from(new Set(permissions.map(p => p.category)));
    return categories.map(category => ({
      category,
      permissions: permissions.filter(p => p.category === category)
    }));
  };

  const getUsageStatistics = () => {
    return templateStats || {
      total_templates: 0,
      active_templates: 0,
      inactive_templates: 0,
      total_permissions_in_templates: 0,
      average_permissions_per_template: 0,
      most_used_templates: [],
      recently_created: []
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Shield className="w-6 h-6 text-indigo-600" />
            </div>
            Permission Templates
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Create and manage permission templates for bulk user assignment
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
          <Button variant="outline" onClick={() => setShowImportModal(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={exportAllTemplates}>
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
          <Button variant="outline" onClick={() => setShowStatisticsModal(true)}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Statistics
          </Button>
          <Button variant="outline" onClick={() => {
              fetchTemplates();
              fetchTemplateStatistics();
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
            { id: 'list', label: 'Templates', icon: Shield },
            { id: 'create', label: 'Create', icon: Plus },
            { id: 'apply', label: 'Apply', icon: Users },
            { id: 'statistics', label: 'Statistics', icon: BarChart3 }
          ].map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveTab(view.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                activeTab === view.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <view.icon className="w-4 h-4" />
              <span>{view.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Templates List View */}
      {activeTab === 'list' && (
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="border-slate-200 dark:border-slate-700">
            <div className="p-4">
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
                <Button variant="outline" onClick={() => setShowImportModal(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
                <Button variant="outline" onClick={exportAllTemplates}>
                  <Download className="w-4 h-4 mr-2" />
                  Export All
                </Button>
              </div>
              
              {/* Statistics Summary */}
              <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
                <span>Total: {getUsageStatistics().total_templates}</span>
                <span>•</span>
                <span>Active: {getUsageStatistics().active_templates}</span>
                <span>•</span>
                <span>Inactive: {getUsageStatistics().inactive_templates}</span>
              </div>
            </div>
          </Card>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredTemplates().map((template) => {
              const categoryKey = template.permissions && Object.keys(template.permissions).length > 0 ?
                getPermissionCategory(Object.keys(template.permissions)[0]) : 'Employee';
              const categoryColor = categoryColors[categoryKey as keyof typeof categoryColors] || categoryColors.Employee;
              
              return (
                <Card key={template.id} className="border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${templateColors[template.is_active ? 'active' : 'inactive']}`}>
                            <Shield className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                              {template.name}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {template.description}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${templateColors[template.is_active ? 'active' : 'inactive']}`}>
                            {template.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {Object.keys(template.permissions).length} permissions
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Created: {new Date(template.created_at).toLocaleDateString()}
                        </div>
                        {template.updated_at && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Updated: {new Date(template.updated_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          By {template.created_by_name}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowEditModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleTemplateStatus(template.id)}
                        className={template.is_active ? 'text-amber-600 hover:text-amber-700' : 'text-slate-600 hover:text-slate-700'}
                      >
                        {template.is_active ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => exportTemplate(template.id)}
                        className="text-slate-600 hover:text-slate-700"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Create Permission Template
            </h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Template Name
                </label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Enter template name"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Enter template description"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Select Permissions
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {getPermissionsByCategory().map((category) => (
                    <div key={category.category} className="mb-2">
                      <div className="font-medium text-slate-900 dark:text-white mb-2">
                        {category}
                      </div>
                      <div className="space-y-2">
                        {category.permissions.map((permission) => (
                          <label key={permission.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedPermissions[permission.id] || false}
                              onChange={(e) => {
                                const newSelected = { ...selectedPermissions };
                                newSelected[permission.id] = e.target.checked;
                                setSelectedPermissions(newSelected);
                              }}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                              {permission.name.split('.').pop()?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${categoryColors[permission.category]}`}>
                              {permission.category}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  onClick={createTemplate}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={!templateName.trim() || Object.keys(selectedPermissions).length === 0}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
                <Button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetCreateForm();
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {showEditModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Edit Permission Template
            </h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Template Name
                </label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Permissions
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {getPermissionsByCategory().map((category) => (
                    <div key={category.category} className="mb-2">
                      <div className="font-medium text-slate-900 dark:text-white mb-2">
                        {category}
                      </div>
                      <div className="space-y-2">
                        {category.permissions.map((permission) => (
                          <label key={permission.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedPermissions[permission.id] || false}
                              onChange={(e) => {
                                const newSelected = { ...selectedPermissions };
                                newSelected[permission.id] = e.target.checked;
                                setSelectedPermissions(newSelected);
                              }}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                              {permission.name.split('.').pop()?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  onClick={updateTemplate}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={!templateName.trim()}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Update Template
                </Button>
                <Button
                  onClick={() => {
                    setShowEditModal(false);
                    resetEditForm();
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Apply Template Modal */}
      {showApplyModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Apply Template: {selectedTemplate.name}
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                This will apply the template permissions to selected users. Existing overrides will be updated.
              </p>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Select Users
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    multiple
                    value={selectedUsers}
                    onChange={(e) => {
                      const newSelected = Array.from(e.target.selectedOptions).map(option => option.value);
                      setSelectedUsers(newSelected);
                    }}
                    className="w-full pl-10 pr-8 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white appearance-none"
                  >
                    <option value="">Select users to apply template...</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Reason
                </label>
                <textarea
                  value={applyReason}
                  onChange={(e) => setApplyReason(e.target.value)}
                  placeholder="Enter reason for template application"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  onClick={applyTemplate}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={selectedUsers.length === 0 || !applyReason.trim()}
                >
                  <Users2 className="w-4 h-4 mr-2" />
                  Apply to {selectedUsers.length} Users
                </Button>
                <Button
                  onClick={() => {
                    setShowApplyModal(false);
                    setSelectedTemplate(null);
                    setSelectedUsers([]);
                    setApplyReason('');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Modal */}
      {showStatisticsModal && templateStats && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Template Statistics
            </h3>
            
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                <h4 className="font-medium text-slate-900 dark:text-white mb-4">
                  Summary
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {templateStats.total_templates}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Total Templates
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {templateStats.active_templates}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Active Templates
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {templateStats.inactive_templates}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Inactive Templates
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {templateStats.total_permissions_in_templates}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Total Permissions
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {templateStats.average_permissions_per_template}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Avg Permissions/Template
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Most Used Templates */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                <h4 className="font-medium text-slate-900 dark:text-white mb-4">
                  Most Used Templates
                </h4>
                <div className="space-y-2">
                  {templateStats.most_used_templates.map((template, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="text-sm text-slate-900 dark:text-white">
                        {template.template_name}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {template.usage_count} uses
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Recently Created */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                <h4 className="font-medium text-slate-900 dark:text-white mb-4">
                  Recently Created
                </h4>
                <div className="space-y-2">
                  {templateStats.recently_created.map((template, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="text-sm text-slate-900 dark:text-white">
                        {template.name}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date(template.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowStatisticsModal(false)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Import Permission Templates
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
                      importTemplate(file);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Upload a CSV file with columns: name, description, permissions (JSON format)
              </div>
              
              <div className="text-xs text-slate-400 dark:text-slate-400">
                Example format:<br />
                name,description,permissions<br />
                Temporary Admin,Admin access for specific tasks,"{{"users.view":true,"users.create":true}}"
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

      {/* Delete Modal */}
      {showDeleteModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Delete Template
            </h3>
            
            <div className="space-y-4 mb-6">
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-12 h-12 text-red-600" />
                  <div>
                    <div className="font-medium text-red-800 dark:text-red-200">
                      Are you sure?
                    </div>
                    <div>
                      <div className="text-sm text-red-600 dark:text-red-400">
                        This will permanently delete the template "{selectedTemplate.name}" and all associated permissions.
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  Template: {selectedTemplate.name}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Permissions: {Object.keys(selectedTemplate.permissions).length} permissions
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => deleteTemplate(selectedTemplate.id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Template
                </Button>
                <Button
                  onClick={() => setShowDeleteModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 max-w-md w-full">
            <h3 className="export_format: 'excel' | 'pdf' | 'csv' | 'json'}">
              Export Audit Logs
            </h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Export Format
                </label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as 'excel' | 'pdf' | 'csv' | 'json')}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="excel">Excel</option>
                  <option value="pdf">PDF</option>
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Include
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 text-amber-600 rounded"
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Current filters
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 text-amber-600 rounded"
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      All columns
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 text-amber-600 rounded"
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Timestamp
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 text-amber-600 rounded"
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      User details
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 text-amber-600 rounded"
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Change details
                    </span>
                  </label>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  onClick={exportAuditLogs}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                >
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
        </div>
      )}

      {/* No Templates */}
      {!loading && templates.length === 0 && activeTab === 'list' && (
        <Card className="border-slate-200 dark:border-slate-700">
          <div className="p-8 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No Permission Templates Found
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Create permission templates for bulk user assignment
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
