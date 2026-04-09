import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  Shield, Check, X, AlertTriangle, Lock, Unlock, Eye, EyeOff,
  Users, Settings, Briefcase, MessageSquare, Database, CheckSquare
} from 'lucide-react';
import { permissionService } from '../../services/permissionService';
import { Role as UserRole } from '../../types';

interface Permission {
  id: string;
  name: string;
  category?: string;
  module?: string;
  key?: string;
  description: string;
}

interface RolePermission {
  permission_id: string;
  permission_key?: string;
  permission_name: string;
  category: string;
  granted: boolean | null;
}

interface Role {
  id: string;
  name: string;
  description: string;
}

const DEFAULT_ROLES: Role[] = [
  { id: 'ADMIN', name: 'Administrator', description: 'Full system access' },
  { id: 'HR', name: 'HR Manager', description: 'Employee and payroll management' },
  { id: 'MANAGER', name: 'Department Manager', description: 'Team and project oversight' },
  { id: 'EMPLOYEE', name: 'Regular Employee', description: 'Basic self-service access' },
];

const categoryIcons = {
  'System': Settings,
  'HR': Users,
  'Projects': Briefcase,
  'Tasks': CheckSquare,
  'Communication': MessageSquare,
};

const categoryColors = {
  'System': 'bg-blue-100/80 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 ring-1 ring-blue-500/20',
  'HR': 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 ring-1 ring-emerald-500/20',
  'Projects': 'bg-purple-100/80 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 ring-1 ring-purple-500/20',
  'Tasks': 'bg-indigo-100/80 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 ring-1 ring-indigo-500/20',
  'Communication': 'bg-amber-100/80 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 ring-1 ring-amber-500/20',
};

export const PermissionMatrix: React.FC<{ permissions: Permission[] }> = ({ permissions }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolePermissions, setRolePermissions] = useState<{ [roleId: string]: RolePermission[] }>({});
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkUpdatingCategory, setBulkUpdatingCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      fetchRolePermissions(selectedRole);
    }
  }, [selectedRole]);

  const fetchRoles = async () => {
    try {
      setRoles(DEFAULT_ROLES);
      if (DEFAULT_ROLES.length > 0) setSelectedRole(DEFAULT_ROLES[0].id);
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRolePermissions = async (roleId: string) => {
    try {
      const data = permissionService.getRolePermissions(roleId);
      const mapped = data.map(rp => ({
        permission_id: rp.permission_id,
        permission_key: rp.permission_key,
        permission_name: rp.permission_key,
        category: '', // Handled by matrix
        granted: rp.granted
      }));
      setRolePermissions(prev => ({ ...prev, [roleId]: mapped }));
    } catch (error) {
      console.error('Error fetching role permissions:', error);
    }
  };

  const updatePermission = async (permissionId: string, granted: boolean) => {
    if (!selectedRole) return;

    try {
      permissionService.updateRolePermission(selectedRole, permissionId, granted);
      setRolePermissions(prev => ({
        ...prev,
        [selectedRole]: (prev[selectedRole] || []).map(p =>
          String(p.permission_id) === String(permissionId) ? { ...p, granted } : p
        )
      }));
    } catch (error) {
      console.error('Error updating permission:', error);
    }
  };

  const bulkUpdatePermissions = async (granted: boolean, category?: string) => {
    if (!selectedRole) return;
    const permissionsToUpdate = normalizedPermissions.filter(
      (p) => !category || p.category === category
    );
    if (permissionsToUpdate.length === 0) return;

    try {
      setBulkUpdatingCategory(category || '__all__');
      
      // Update local storage for each permission
      permissionsToUpdate.forEach(p => {
        permissionService.updateRolePermission(selectedRole, p.id, granted);
      });
      
      await fetchRolePermissions(selectedRole);
    } catch (error) {
      console.error('Error bulk updating permissions:', error);
    } finally {
      setBulkUpdatingCategory(null);
    }
  };

  const normalizedPermissions = permissions.map((perm: any) => ({
    ...perm,
    id: String(perm.id),
    category: perm.category || perm.module || 'System',
    key: perm.key || perm.name
  }));

  const groupedPermissions = normalizedPermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const currentRolePermissions = selectedRole ? rolePermissions[selectedRole] || [] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-primary-600 rounded-full animate-spin"></div>
          <p className="mt-4 font-medium text-slate-500">Loading Configuration Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Configuration Header Area */}
      <div className="glass-card shadow-sm p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-white/60 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 transition-all">
        <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <label className="text-sm font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400 whitespace-nowrap">
            Operating Role
          </label>
          <div className="flex gap-2 bg-slate-100/80 dark:bg-slate-900/60 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 whitespace-nowrap ${
                  selectedRole === role.id
                    ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-md transform scale-105'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800 hover:text-slate-800'
                }`}
              >
                {role.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setBulkMode(!bulkMode)}
            className={`shadow-sm transition-all duration-300 ${bulkMode ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-300 hover:bg-amber-100' : 'bg-white/80 dark:bg-slate-800/80'}`}
          >
            <Settings className={`w-4 h-4 mr-2 ${bulkMode ? 'animate-spin-slow' : ''}`} />
            {bulkMode ? 'Exit Bulk Mode' : 'Bulk Admin Edit'}
          </Button>
        </div>
      </div>

      {/* Matrix Data Area */}
      <div className="glass-card bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-white/60 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 backdrop-blur-md sticky top-0 z-10">
              <tr>
                <th className="text-left p-5 font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase text-xs w-[60%]">
                  Permission Context
                </th>
                <th className="text-center p-5 font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase text-xs w-32">
                  Status State
                </th>
                <th className="text-right p-5 font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase text-xs w-48">
                  Security Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {(Object.entries(groupedPermissions) as [string, Permission[]][]).map(([category, categoryPermissions]) => (
                <React.Fragment key={category}>
                  {/* Category Header Row */}
                  <tr className="bg-slate-50/40 dark:bg-slate-800/40 backdrop-blur-sm group hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td colSpan={3} className="p-4 py-5 font-medium">
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl shadow-sm ${categoryColors[category as keyof typeof categoryColors] || categoryColors['System']}`}>
                          {React.createElement(categoryIcons[category as keyof typeof categoryIcons] || Settings, { className: 'w-5 h-5' })}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">{category} Controls</h3>
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-0.5">
                            {categoryPermissions.length} Active Rules
                          </p>
                        </div>
                        
                        {bulkMode && (
                          <div className="ml-auto flex items-center gap-3 pr-2 animate-in slide-in-from-right-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => bulkUpdatePermissions(true, category)}
                              disabled={bulkUpdatingCategory !== null}
                              className="text-emerald-600 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 hover:bg-emerald-100 dark:bg-emerald-900/30 flex shadow-sm"
                            >
                              <Unlock className="w-3.5 h-3.5 mr-1.5" /> Grant Bundle
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => bulkUpdatePermissions(false, category)}
                              disabled={bulkUpdatingCategory !== null}
                              className="text-rose-600 border-rose-200 dark:border-rose-800 bg-rose-50/50 hover:bg-rose-100 dark:bg-rose-900/30 flex shadow-sm"
                            >
                              <Lock className="w-3.5 h-3.5 mr-1.5" /> Deny Bundle
                            </Button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Individual Permission Nodes */}
                  {categoryPermissions.map((permission) => {
                    const rolePerm = currentRolePermissions.find(p =>
                      String(p.permission_id) === String(permission.id) ||
                      p.permission_key === permission.key ||
                      p.permission_name === permission.key
                    );
                    const isGranted = rolePerm?.granted === true;
                    const isDenied = rolePerm?.granted === false;
                    const isUndefined = rolePerm?.granted === null;

                    return (
                      <tr key={permission.id} className="hover:bg-white dark:hover:bg-slate-700/50 transition-colors group">
                        <td className="p-5 pl-8">
                          <div className="flex items-start">
                            <div className="mt-1 w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 mr-4 opacity-50"></div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                                {permission.name}
                              </div>
                              <div className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                                {permission.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-5 text-center">
                          <div className="inline-flex items-center justify-center">
                            {isGranted && (
                              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-800">
                                <div className="w-5 h-5 bg-emerald-100 dark:bg-emerald-800 rounded-full flex justify-center items-center"><Check className="w-3 h-3" /></div>
                                <span className="text-xs font-bold uppercase tracking-wider">Granted</span>
                              </div>
                            )}
                            {isDenied && (
                              <div className="flex items-center gap-2 text-rose-600 bg-rose-50/50 dark:bg-rose-900/20 px-3 py-1.5 rounded-full border border-rose-100 dark:border-rose-800">
                                <div className="w-5 h-5 bg-rose-100 dark:bg-rose-800 rounded-full flex justify-center items-center"><X className="w-3 h-3" /></div>
                                <span className="text-xs font-bold uppercase tracking-wider">Denied</span>
                              </div>
                            )}
                            {isUndefined && (
                              <div className="flex items-center gap-2 text-slate-500 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
                                <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded-full flex justify-center items-center"><AlertTriangle className="w-3 h-3 text-slate-500" /></div>
                                <span className="text-xs font-bold uppercase tracking-wider">Default</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-5 text-right pr-6">
                          <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => updatePermission(permission.id, true)}
                              className={`p-2.5 rounded-xl border transition-all shadow-sm ${
                                isGranted
                                  ? 'bg-emerald-500 border-emerald-600 text-white shadow-emerald-500/20 cursor-default'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 hover:border-emerald-200 hover:-translate-y-0.5'
                              }`}
                              title="Turn On Authorization"
                            >
                              <Unlock className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => updatePermission(permission.id, false)}
                              className={`p-2.5 rounded-xl border transition-all shadow-sm ${
                                isDenied
                                  ? 'bg-rose-500 border-rose-600 text-white shadow-rose-500/20 cursor-default'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-600 hover:border-rose-200 hover:-translate-y-0.5'
                              }`}
                              title="Revoke Authorization"
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend Area */}
      <div className="glass-card shadow-soft bg-white/40 dark:bg-slate-800/40 rounded-2xl border border-white/60 dark:border-slate-700 p-5 mt-6 flex flex-col md:flex-row items-center gap-6">
        <h4 className="font-bold uppercase tracking-wider text-slate-400 text-xs text-center md:text-left">Status Legend</h4>
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center ring-4 ring-emerald-50 dark:ring-emerald-900/20">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-slate-700 dark:text-slate-300">Active Access</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-rose-100 dark:bg-rose-900/40 rounded-full flex items-center justify-center ring-4 ring-rose-50 dark:ring-rose-900/20">
              <X className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <span className="text-slate-700 dark:text-slate-300">Access Denied</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center ring-4 ring-slate-100 dark:ring-slate-800">
              <AlertTriangle className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </div>
            <span className="text-slate-700 dark:text-slate-300">Inherits Global Setting</span>
          </div>
        </div>
      </div>

    </div>
  );
};
