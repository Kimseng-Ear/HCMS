import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/FormFields';
import { 
  Shield, Users, Settings, Eye, EyeOff, Plus, Edit2, Save, X,
  CheckCircle2, XCircle, AlertTriangle, Download, RefreshCw,
  Search, Filter, Info, ChevronDown, ChevronRight, Grid,
  Copy, Printer, FileText, CheckSquare, Square
} from 'lucide-react';
import { http } from '../../services/http';

interface Permission {
  id: string;
  name: string;
  category: string;
  description: string;
  is_sensitive: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string;
  level: number;
}

interface RolePermission {
  role_id: string;
  permission_id: string;
  granted: boolean;
}

interface PermissionMatrix {
  category: string;
  permissions: Permission[];
  rolePermissions: Record<string, boolean>;
}

const permissionColors = {
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

const roleColors = {
  'Admin': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 border-purple-300 dark:border-purple-700',
  'HR Manager': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 border-blue-300 dark:border-blue-700',
  'Department Head': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 border-emerald-300 dark:border-emerald-700',
  'Employee': 'bg-slate-100 dark:bg-slate-700 text-slate-700 border-slate-300 dark:border-slate-500',
};

export const PermissionMatrixNew: React.FC = () => {
  const [permissionMatrix, setPermissionMatrix] = useState<PermissionMatrix[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  useEffect(() => {
    fetchPermissionMatrix();
    fetchRoles();
  }, []);

  const fetchPermissionMatrix = async () => {
    setLoading(true);
    try {
      const { data } = await http.get('/permissions');
      const permissions = data.permissions || [];
      const matrix = permissions.reduce((acc: any, p: any) => {
        const category = p.module;
        if (!acc[category]) {
          acc[category] = { category, permissions: [], rolePermissions: {} };
        }
        acc[category].permissions.push({
          id: p.id,
          name: p.key,
          category: p.module,
          description: p.description || '',
          is_sensitive: !!p.isSensitive
        });
        return acc;
      }, {});
      setPermissionMatrix(Object.values(matrix));
    } catch (error) {
      console.error('Error fetching permission matrix:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const { data } = await http.get('/roles');
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
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

  const updatePermission = async (permission: Permission, roleId: string, granted: boolean) => {
    try {
      await http.put(`/permissions/role/${roleId}/${permission.id}`, { granted });
      fetchPermissionMatrix();
      setEditingPermission(null);
    } catch (error) {
      console.error('Error updating permission:', error);
    }
  };

  const bulkUpdatePermissions = async (roleId: string, granted: boolean) => {
    try {
      const response = await fetch(`/api/permissions/roles/${roleId}/permissions/bulk`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permission_ids: selectedPermissions,
          granted
        }),
      });

      if (response.ok) {
        fetchPermissionMatrix();
        setShowBulkEdit(false);
        setSelectedPermissions([]);
      }
    } catch (error) {
      console.error('Error bulk updating permissions:', error);
    }
  };

  const exportToPDF = async () => {
    try {
      const response = await fetch('/api/permissions/export/pdf');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'permission-matrix.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting to PDF:', error);
    }
  };

  const exportToCSV = async () => {
    try {
      const csvContent = generateCSV();
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'permission-matrix.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
    }
  };

  const generateCSV = () => {
    const headers = ['Permission', 'Category', 'Admin', 'HR Manager', 'Department Head', 'Employee'];
    const rows = [headers.join(',')];

    permissionMatrix.forEach((category) => {
      category.permissions.forEach((permission) => {
        const row = [
          permission.name,
          permission.category,
          category.rolePermissions['Admin'] ? '✓' : '✗',
          category.rolePermissions['HR Manager'] ? '✓' : '✗',
          category.rolePermissions['Department Head'] ? '✓' : '✗',
          category.rolePermissions['Employee'] ? '✓' : '✗'
        ];
        rows.push(row.join(','));
      });
    });

    return rows.join('\n');
  };

  const filteredMatrix = permissionMatrix.filter(category => {
    const matchesSearch = searchTerm === '' || 
      category.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.permissions.some(permission => 
        permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesCategory = filterCategory === '' || category.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const togglePermissionSelection = (permissionId: string) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedPermissions(Array.from(newSelected));
  };

  const selectAllPermissions = (category: PermissionMatrix) => {
    const categoryPermissionIds = category.permissions.map(p => p.id);
    const allSelected = categoryPermissionIds.every(id => selectedPermissions.includes(id));
    
    if (allSelected) {
      setSelectedPermissions(selectedPermissions.filter(id => !categoryPermissionIds.includes(id)));
    } else {
      setSelectedPermissions([...selectedPermissions, ...categoryPermissionIds]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            Permission Matrix
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Role-based permission overview and management
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search permissions..."
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
            {permissionMatrix.map(category => (
              <option key={category.category} value={category.category}>
                {category.category}
              </option>
            ))}
          </select>
          <Button variant="outline" onClick={exportToPDF}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={exportToCSV}>
            <FileText className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={fetchPermissionMatrix}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Role Headers */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left p-4 font-medium text-slate-700 dark:text-slate-300 sticky left-0 bg-slate-50 dark:bg-slate-900/50">
                  Permission
                </th>
                {roles.map((role) => (
                  <th key={role.id} className="text-center p-4 font-medium text-slate-700 dark:text-slate-300 min-w-32">
                    <div className="flex items-center justify-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${roleColors[role.name as keyof typeof roleColors]}`}>
                        <Users className="w-4 h-4" />
                      </div>
                      <span className="text-xs">{role.name}</span>
                    </div>
                  </th>
                ))}
                <th className="text-center p-4 font-medium text-slate-700 dark:text-slate-300 min-w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={roles.length + 3} className="text-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  </td>
                </tr>
              ) : (
                filteredMatrix.map((category, categoryIndex) => (
                  <React.Fragment key={category.category}>
                    {/* Category Header */}
                    <tr className="bg-slate-100 dark:bg-slate-800/50">
                      <td colSpan={roles.length + 3} className="p-4">
                        <button
                          onClick={() => toggleExpanded(category.category)}
                          className="flex items-center gap-3 text-left w-full"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${permissionColors[category.category as keyof typeof permissionColors]}`}>
                            {expandedCategories.has(category.category) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {category.category}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              {category.permissions.length} permissions
                            </div>
                          </div>
                        </button>
                      </td>
                    </tr>
                    
                    {/* Permissions */}
                    {expandedCategories.has(category.category) && category.permissions.map((permission, permissionIndex) => (
                      <tr key={permission.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700">
                        <td className="p-4 sticky left-0 bg-white dark:bg-slate-800">
                          <div className="group">
                            <div className="font-medium text-slate-900 dark:text-white">
                              {permission.name.split('.').pop()?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              {permission.description}
                            </div>
                            {permission.is_sensitive && (
                              <div className="flex items-center gap-1 mt-1">
                                <AlertTriangle className="w-3 h-3 text-amber-500" />
                                <span className="text-xs text-amber-600">Sensitive</span>
                              </div>
                            )}
                            <div
                              className="absolute left-0 top-0 bg-slate-900 text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 max-w-xs"
                              onMouseEnter={() => setShowTooltip(permission.id)}
                              onMouseLeave={() => setShowTooltip(null)}
                            >
                              {permission.description}
                            </div>
                          </div>
                        </td>
                        
                        {roles.map((role) => (
                          <td key={role.id} className="p-4 text-center">
                            <div className="flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={category.rolePermissions[role.name]}
                                onChange={(e) => updatePermission(permission, role.id, e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 focus:ring-offset-2"
                              />
                            </div>
                          </td>
                        ))}
                        
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingPermission(permission)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedPermissions([permission.id]);
                                setShowBulkEdit(true);
                              }}
                              className="text-purple-600 hover:text-purple-700"
                            >
                              <CheckSquare className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Edit Modal */}
      {showBulkEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Bulk Edit Permissions
            </h3>
            
            <div className="space-y-4 mb-6">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {selectedPermissions.length} permissions selected
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredMatrix.map((category) => (
                  <div key={category.category} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-slate-900 dark:text-white">
                        {category.category}
                      </h4>
                      <button
                        onClick={() => selectAllPermissions(category)}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        {category.permissions.every(p => selectedPermissions.includes(p.id)) ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    <div className="space-y-2">
                      {category.permissions.map((permission) => (
                        <div key={permission.id} className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(permission.id)}
                            onChange={() => togglePermissionSelection(permission.id)}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-slate-900 dark:text-white">
                              {permission.name.split('.').pop()?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              {permission.description}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Select Role
                </label>
                <select className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                  <option value="">Select role...</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Action
                </label>
                <div className="flex gap-3">
                  <Button
                    onClick={() => bulkUpdatePermissions('role-id', true)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    Grant All
                  </Button>
                  <Button
                    onClick={() => bulkUpdatePermissions('role-id', false)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    Revoke All
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  setShowBulkEdit(false);
                  setSelectedPermissions([]);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Permission Modal */}
      {editingPermission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Edit Permission
            </h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Permission Name
                </label>
                <input
                  type="text"
                  value={editingPermission.name}
                  readOnly
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={editingPermission.description}
                  readOnly
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={editingPermission.category}
                  readOnly
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingPermission.is_sensitive}
                  readOnly
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Sensitive Permission
                </label>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setEditingPermission(null)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="fixed bg-slate-900 text-white text-xs rounded p-2 z-50 max-w-xs"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          {showTooltip}
        </div>
      )}
    </div>
  );
};
