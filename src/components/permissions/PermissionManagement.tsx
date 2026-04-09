import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/FormFields';
import { 
  Shield, Users, Settings, Eye, EyeOff, Plus, Search, Filter, 
  CheckCircle2, XCircle, AlertTriangle, Clock, Download, RefreshCw,
  UserCheck, UserX, Key, Lock, Unlock
} from 'lucide-react';
import { PermissionMatrix } from './PermissionMatrix';
import { UserOverrideManager } from './UserOverrideManager';
import { RoleManagement } from './RoleManagement';
import { permissionService } from '../../services/permissionService';
import { userService } from '../../services/userService';
import { Api } from '../../services/api';

interface Permission {
  id: string;
  name: string;
  key: string;
  module: string;
  description: string;
  isSensitive: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const PermissionManagement: React.FC = () => {
  const [activeView, setActiveView] = useState<'roles' | 'matrix' | 'overrides'>('roles');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeOverrideCount, setActiveOverrideCount] = useState<number>(0);
  const [expiredOverrideCount, setExpiredOverrideCount] = useState<number>(0);

  const views = [
    { id: 'roles', label: 'Role Management', icon: Settings, description: 'Manage generic roles & definitions' },
    { id: 'matrix', label: 'Permission Matrix', icon: Shield, description: 'Detailed default role settings' },
    { id: 'overrides', label: 'User Overrides', icon: Users, description: 'Manage granular employee-level exceptions' },
  ];

  useEffect(() => {
    fetchPermissions();
    fetchUsers();
    fetchOverrideStats();
  }, []);

  const fetchOverrideStats = async () => {
    try {
      // For now we just mock these counts as they are handled in UserOverrideManager
      setActiveOverrideCount(2);
      setExpiredOverrideCount(0);
    } catch (error) {
      console.error('Error fetching override stats:', error);
    }
  };

  const fetchPermissions = async () => {
    try {
      const perms = permissionService.getAll();
      setPermissions(perms || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = userService.getAll();
      setUsers(data as any || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto animate-in slide-in-from-bottom-2 duration-500">
      
      {/* Banner / Header */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/40 dark:border-slate-700/50 shadow-soft relative overflow-hidden flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-400/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-10 w-40 h-40 bg-emerald-400/10 rounded-full blur-2xl translate-y-1/2"></div>
        
        <div className="relative z-10 flex items-center gap-5">
          <div className="p-4 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/30">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
              Access & Permissions Central
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
              Configure unified security roles and granular employee-level overrides
            </p>
          </div>
        </div>
        
        <div className="relative z-10 flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-initial">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search users to quickly jump..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 min-w-[280px] bg-white/80 dark:bg-slate-900/80 backdrop-blur border-slate-200"
            />
          </div>
          <Button variant="outline" className="shadow-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" className="shadow-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur">
            <Download className="w-4 h-4 mr-2" />
            Export Audit
          </Button>
        </div>
      </div>

      {/* KPI Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Permissions', value: permissions.length, icon: Key, color: 'blue' },
          { label: 'Active Overrides', value: activeOverrideCount, icon: AlertTriangle, color: 'amber' },
          { label: 'Expired Overrides', value: expiredOverrideCount, icon: RefreshCw, color: 'slate' },
          { label: 'System Posture', value: 'Secure', icon: CheckCircle2, color: 'emerald' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-soft hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{stat.label}</p>
              <div className={`p-2.5 bg-${stat.color}-50 text-${stat.color}-600 dark:bg-${stat.color}-900/30 dark:text-${stat.color}-400 rounded-xl group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <p className={`text-4xl font-extrabold text-slate-800 dark:text-white ${stat.value === 'Secure' ? '!text-emerald-500 text-3xl mt-1' : ''}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-3xl border border-white/40 dark:border-slate-700/50 shadow-soft overflow-hidden flex flex-col">
        {/* Navigation Tabs */}
        <div className="p-4 sm:p-6 pb-0 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex flex-wrap gap-2 lg:gap-4">
            {views.map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id as any)}
                className={`relative px-6 py-4 rounded-t-xl font-semibold flex flex-col items-start justify-center gap-1 transition-all duration-300 min-w-[200px] border-b-2 ${
                  activeView === view.id
                    ? 'bg-white dark:bg-slate-900 border-primary-500 text-primary-600 dark:text-primary-400 shadow-[0_-5px_15px_rgba(0,0,0,0.03)]'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <view.icon className={`w-5 h-5 ${activeView === view.id ? 'text-primary-500' : 'text-slate-400'}`} />
                  <span className="text-base">{view.label}</span>
                </div>
                <span className="text-xs font-normal opacity-80">{view.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Content Rendering */}
        <div className="p-6 sm:p-8 bg-slate-50/20 dark:bg-slate-900/20 min-h-[600px] relative">
          <div className="absolute top-0 left-1/2 w-[80%] h-full bg-gradient-to-b from-primary-50/30 to-transparent dark:from-primary-900/10 pointer-events-none transform -translate-x-1/2"></div>
          <div className="relative z-10 animate-in fade-in duration-300">
            {activeView === 'roles' && <RoleManagement />}
            {activeView === 'matrix' && <PermissionMatrix permissions={permissions} />}
            {activeView === 'overrides' && <UserOverrideManager users={filteredUsers} permissions={permissions} />}
          </div>
        </div>
      </div>

    </div>
  );
};
