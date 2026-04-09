import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/FormFields';
import { permissionService } from '../../services/permissionService';
import { 
  Users, Plus, X, Search, Filter, Calendar, AlertTriangle, 
  CheckCircle2, XCircle, Clock, UserCheck, UserX, Shield,
  Eye, EyeOff, Lock, Unlock, Edit2, Trash2, Save, Settings
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Permission {
  id: string;
  name: string;
  key: string;
  module: string;
  description: string;
}

interface UserOverride {
  id: string;
  userId: string;
  permissionId: string;
  overrideType: string;
  reason: string;
  grantedBy: string;
  createdAt: string;
  expiresAt: string | null;
  status: string;
  granted?: boolean;
  permission?: Permission;
}

const normalizeOverride = (raw: any): UserOverride => ({
  id: String(raw.id),
  userId: String(raw.userId ?? raw.user_id ?? ''),
  permissionId: String(raw.permissionId ?? raw.permission_id ?? ''),
  overrideType: String(raw.overrideType ?? raw.override_type ?? 'GRANT'),
  reason: String(raw.reason ?? ''),
  grantedBy: String(raw.grantedBy ?? raw.granted_by ?? ''),
  createdAt: String(raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
  expiresAt: raw.expiresAt ?? raw.expires_at ?? null,
  status: String(raw.status ?? 'ACTIVE'),
  granted: raw.granted,
  permission: raw.permission
    ? {
        id: String(raw.permission.id),
        name: raw.permission.name,
        key: raw.permission.key,
        module: raw.permission.module,
        description: raw.permission.description
      }
    : undefined
});

export const UserOverrideManager: React.FC<{ users: User[]; permissions: Permission[] }> = ({ users, permissions }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userOverrides, setUserOverrides] = useState<UserOverride[]>([]);
  const [effectivePermissions, setEffectivePermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingOverride, setEditingOverride] = useState<UserOverride | null>(null);
  const [newOverride, setNewOverride] = useState({
    permissionId: '',
    overrideType: 'GRANT',
    reason: '',
    expiresAt: '',
    granted: true
  });

  useEffect(() => {
    if (selectedUser) {
      fetchUserOverrides();
      fetchEffectivePermissions();
    }
  }, [selectedUser]);

  const fetchUserOverrides = async () => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      // Local-first: Fetch from permissionService instead of API
      const data = permissionService.getUserOverrides(selectedUser.id);
      
      // Enrich with permission metadata
      const enriched = data.map(o => {
        const perm = permissions.find(p => p.id === o.permissionId);
        return { ...o, permission: perm };
      });
      
      setUserOverrides(enriched as any);
    } catch (error) {
      console.error('Error fetching user overrides:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEffectivePermissions = async () => {
    if (!selectedUser) return;

    try {
      // Local-first calculation: Role Permissions + User Overrides
      const rolePerms = permissionService.getRolePermissions(selectedUser.role);
      const overrides = permissionService.getUserOverrides(selectedUser.id);
      
      const effective: Record<string, { granted: boolean; source: string }> = {};
      
      // 1. Initial role perms
      rolePerms.forEach(rp => {
        effective[rp.permission_key] = { granted: rp.granted, source: 'ROLE' };
      });
      
      // 2. Apply overrides
      overrides.forEach(o => {
        const perm = permissions.find(p => p.id === o.permissionId);
        if (perm) {
          // Check if expired
          const isExpired = o.expiresAt && new Date(o.expiresAt) <= new Date();
          if (!isExpired) {
            effective[perm.key] = { 
              granted: o.overrideType === 'GRANT', 
              source: `OVERRIDE (${o.overrideType})` 
            };
          }
        }
      });

      setEffectivePermissions(Object.entries(effective).map(([key, val]) => ({
        permissionKey: key,
        ...val
      })));
    } catch (error) {
      console.error('Error fetching effective permissions:', error);
    }
  };

  const createOverride = async () => {
    if (!selectedUser || !newOverride.permissionId || !newOverride.reason) return;

    try {
      permissionService.addUserOverride(
        selectedUser.id,
        newOverride.permissionId,
        newOverride.granted ? 'GRANT' : 'REVOKE',
        newOverride.reason,
        newOverride.expiresAt || null
      );
      
      setShowAddModal(false);
      setNewOverride({ permissionId: '', overrideType: 'GRANT', granted: true, reason: '', expiresAt: '' });
      fetchUserOverrides();
      fetchEffectivePermissions();
    } catch (error) {
      console.error('Error creating override:', error);
    }
  };

  const removeOverride = async (overrideId: string) => {
    try {
      permissionService.removeUserOverride(overrideId);
      fetchUserOverrides();
      fetchEffectivePermissions();
    } catch (error) {
      console.error('Error removing override:', error);
    }
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      {/* User Selection */}
      <div className="glass-card shadow-soft bg-white/70 dark:bg-slate-800/70 rounded-2xl border border-white/60 dark:border-slate-700/60 p-6 sm:p-8 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div>
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-primary-500" /> Specify Target Profile
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Choose an employee to view and manage granular permission overrides.
            </p>
          </div>
          
          <div className="w-full lg:w-1/3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Find employees..."
                className="pl-12 w-full shadow-sm bg-white border-slate-200 focus:ring-primary-400"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {users.slice(0, 12).map((user) => (
            <button
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className={`p-5 rounded-2xl border text-left transition-all duration-300 group hover:-translate-y-1 ${
                selectedUser?.id === user.id
                  ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-indigo-50/50 dark:from-primary-900/30 dark:to-indigo-900/10 shadow-md ring-1 ring-primary-500/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800 hover:shadow-soft'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm transition-transform group-hover:scale-105 ${selectedUser?.id === user.id ? 'bg-gradient-to-br from-primary-500 to-indigo-600' : 'bg-gradient-to-br from-slate-400 to-slate-500 dark:from-slate-600 dark:to-slate-700'}`}>
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className={`font-semibold truncate transition-colors ${selectedUser?.id === user.id ? 'text-primary-800 dark:text-primary-300' : 'text-slate-800 dark:text-slate-200 group-hover:text-primary-600'}`}>
                    {user.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 mb-1.5">
                    {user.email}
                  </div>
                  <span className={`inline-block text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md ${selectedUser?.id === user.id ? 'bg-primary-100 text-primary-700 dark:bg-primary-800/40' : 'bg-slate-100 text-slate-500 dark:bg-slate-700/50'}`}>
                    {user.role}
                  </span>
                </div>
                {selectedUser?.id === user.id && (
                  <CheckCircle2 className="w-5 h-5 text-primary-500 absolute top-4 right-4 animate-in zoom-in" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedUser && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
          {/* User Overview Quick Stats */}
          <div className="glass-card bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-white/60 dark:border-slate-700/50 shadow-soft p-6 sm:p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 border-b border-slate-100 dark:border-slate-700/50 pb-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-primary-500/30 ring-4 ring-white dark:ring-slate-800">
                  {selectedUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                    {selectedUser.name}
                  </h3>
                  <div className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 mt-1 -ml-1">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-sm">{selectedUser.role}</span>
                    <span>•</span>
                    <span className="text-sm">{selectedUser.email}</span>
                  </div>
                </div>
              </div>
              
              <Button onClick={() => setShowAddModal(true)} size="lg" className="shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all outline-none border-none bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 rounded-xl w-full md:w-auto">
                <Plus className="w-5 h-5 mr-2" />
                Grant Exception
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50 flex flex-col justify-center relative overflow-hidden group">
                <Shield className="w-20 h-20 text-amber-500/10 absolute -right-2 -bottom-2 group-hover:scale-110 transition-transform duration-500" />
                <p className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-1 relative z-10">Active Overrides</p>
                <div className="flex items-end gap-3 relative z-10">
                  <p className="text-4xl font-extrabold text-amber-600 dark:text-amber-400">
                    {userOverrides.filter(o => !o.expiresAt || new Date(o.expiresAt) > new Date()).length}
                  </p>
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50 flex flex-col justify-center relative overflow-hidden group">
                <Clock className="w-20 h-20 text-slate-400/10 absolute -right-2 -bottom-2 group-hover:scale-110 transition-transform duration-500" />
                <p className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-1 relative z-10">Expired Rules</p>
                <div className="flex items-end gap-3 relative z-10">
                  <p className="text-4xl font-extrabold text-slate-700 dark:text-slate-300">
                    {userOverrides.filter(o => o.expiresAt && new Date(o.expiresAt) <= new Date()).length}
                  </p>
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50 flex flex-col justify-center relative overflow-hidden group">
                <Eye className="w-20 h-20 text-blue-500/10 absolute -right-2 -bottom-2 group-hover:scale-110 transition-transform duration-500" />
                <p className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-1 relative z-10">Total Permissions (Effective)</p>
                <div className="flex items-end gap-3 relative z-10">
                  <p className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">
                    {effectivePermissions.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Current Overrides List */}
          <div className="glass-card shadow-soft bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-white/60 dark:border-slate-700/60 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center">
                <Settings className="w-5 h-5 mr-2 text-primary-500" /> Applied Custom Exceptions
              </h3>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-primary-500 rounded-full animate-spin mb-4"></div>
                <p>Loading user constraints...</p>
              </div>
            ) : userOverrides.length === 0 ? (
              <div className="text-center py-20 px-4">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-700">
                  <Shield className="w-10 h-10 text-slate-300 dark:text-slate-500" />
                </div>
                <h4 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">Standard Security Access</h4>
                <p className="text-slate-500 max-w-sm mx-auto">This employee relies entirely on standard role permissions without any specific overrides.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {userOverrides.map((override) => (
                  <div key={override.id} className="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors group">
                    {editingOverride?.id === override.id ? (
                      <div className="space-y-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg inline-flex">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editingOverride.granted}
                              onChange={(e) => setEditingOverride({ ...editingOverride, granted: e.target.checked })}
                              className="w-5 h-5 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                            />
                            <span className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mr-2">
                              {editingOverride.granted ? 'Granting' : 'Revoking'}
                            </span>
                          </label>
                        </div>
                        <Input
                          label="Exception Rationale"
                          value={editingOverride.reason}
                          onChange={(e) => setEditingOverride({ ...editingOverride, reason: e.target.value })}
                        />
                        <Input
                          type="datetime-local"
                          label="Auto-Expire Time (optional)"
                          value={editingOverride.expiresAt ? new Date(editingOverride.expiresAt).toISOString().slice(0, 16) : ''}
                          onChange={(e) => setEditingOverride({ ...editingOverride, expiresAt: e.target.value })}
                        />
                        <div className="flex items-center gap-3 pt-2">
                          <Button size="sm" onClick={() => setEditingOverride(null)} className="px-6 rounded-lg shadow-sm">
                            <Save className="w-4 h-4 mr-1.5" /> Save Edits
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingOverride(null)} className="px-4 rounded-lg bg-white dark:bg-slate-800">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex gap-4">
                          <div className={`mt-0.5 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm shrink-0 ${
                            override.overrideType === 'GRANT'
                              ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 text-white' 
                              : 'bg-gradient-to-br from-rose-400 to-rose-500 text-white'
                          }`}>
                            {override.overrideType === 'GRANT' ? <Unlock className="w-5 h-5 drop-shadow" /> : <Lock className="w-5 h-5 drop-shadow" />}
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                                {override.permission?.name || override.permissionId}
                              </h4>
                              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                                override.overrideType === 'GRANT' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-rose-100 text-rose-700 border border-rose-200'
                              }`}>
                                {override.overrideType}
                              </span>
                            </div>
                            
                            <p className="text-slate-600 dark:text-slate-400 mb-3 font-medium">
                              {override.reason}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg inline-flex">
                              <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-slate-300" /> By {override.grantedBy}</span>
                              <span className="text-slate-300">•</span>
                              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-300" /> {new Date(override.createdAt).toLocaleDateString()}</span>
                              {override.expiresAt && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className={`flex items-center gap-1 ${new Date(override.expiresAt) <= new Date() ? 'text-red-500 bg-red-50 px-2 py-0.5 rounded-md' : 'text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md'}`}>
                                    <Clock className="w-3.5 h-3.5" /> 
                                    {new Date(override.expiresAt) <= new Date() ? 'Expired' : 'Expires'} {new Date(override.expiresAt).toLocaleDateString()}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-all ml-16 md:ml-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-white/80 hover:bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 shadow-sm border-slate-200 dark:border-slate-700"
                            onClick={() => setEditingOverride(override)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-white/80 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:bg-slate-800 dark:border-rose-900/50 shadow-sm"
                            onClick={() => removeOverride(override.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Exception Modal */}
      {showAddModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 max-w-lg w-full shadow-2xl shadow-slate-900/20 transform animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              New Permission Set
            </h3>
            <p className="text-slate-500 mb-6 font-medium text-sm">Force authorization bounds specific to {selectedUser.name}</p>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  System Permission
                </label>
                <div className="relative">
                  <select
                    value={newOverride.permissionId}
                    onChange={(e) => setNewOverride({ ...newOverride, permissionId: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-primary-500/50 appearance-none shadow-inner"
                  >
                    <option value="">-- Choose permission --</option>
                    {Object.entries(groupedPermissions).map(([module, perms]) => (
                      <optgroup key={module} label={`${module} Commands`} className="font-bold text-primary-700">
                        {perms.map((perm) => (
                          <option key={perm.id} value={perm.id} className="text-slate-700 font-medium">
                            {perm.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <label className={`flex-1 flex justify-center items-center gap-2 cursor-pointer py-2.5 px-4 rounded-lg font-bold transition-all ${newOverride.granted ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>
                  <input
                    type="radio"
                    name="overrideAction"
                    checked={newOverride.granted}
                    onChange={() => setNewOverride({ ...newOverride, granted: true })}
                    className="hidden"
                  />
                  <Unlock className="w-4 h-4" /> Grant Action
                </label>
                <label className={`flex-1 flex justify-center items-center gap-2 cursor-pointer py-2.5 px-4 rounded-lg font-bold transition-all ${!newOverride.granted ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>
                  <input
                    type="radio"
                    name="overrideAction"
                    checked={!newOverride.granted}
                    onChange={() => setNewOverride({ ...newOverride, granted: false })}
                    className="hidden"
                  />
                  <Lock className="w-4 h-4" /> Revoke Action
                </label>
              </div>

              <Input
                label="Required Validation Reason"
                placeholder="Why is this override needed?"
                value={newOverride.reason}
                onChange={(e) => setNewOverride({ ...newOverride, reason: e.target.value })}
              />

              <Input
                type="datetime-local"
                label="Self-Destruct Date (Optional)"
                value={newOverride.expiresAt}
                onChange={(e) => setNewOverride({ ...newOverride, expiresAt: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setNewOverride({ permissionId: '', overrideType: 'GRANT', granted: true, reason: '', expiresAt: '' });
                }}
                className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
              >
                Go Back
              </Button>
              <Button
                onClick={createOverride}
                disabled={!newOverride.permissionId || !newOverride.reason}
                className="flex-1 shadow-lg bg-primary-600 hover:bg-primary-700 border-none"
              >
                Apply Setting
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
