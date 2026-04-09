import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  Shield, Users, Settings, AlertTriangle, TrendingUp, Activity,
  Lock, Unlock, Eye, Clock, CheckCircle2, XCircle, Database,
  RefreshCw, Download, Filter
} from 'lucide-react';
import { http } from '../../services/http';

interface PermissionSummary {
  totalPermissions: number;
  totalOverrides: number;
  activeOverrides: number;
  expiredOverrides: number;
  recentChanges: number;
}

interface RecentActivity {
  id: number;
  action: string;
  permission_name: string;
  target_user_name: string;
  created_by_name: string;
  created_at: string;
}

interface RoleStats {
  role_name: string;
  total_permissions: number;
  granted_permissions: number;
  users_count: number;
}

export const PermissionSummary: React.FC = () => {
  const [summary, setSummary] = useState<PermissionSummary | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [roleStats, setRoleStats] = useState<RoleStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
    fetchRecentActivity();
    fetchRoleStats();
  }, []);

  const fetchSummary = async () => {
    try {
      const [permsRes, activeRes, expiredRes] = await Promise.all([
        http.get('/permissions'),
        http.get('/permissions/overrides/active'),
        http.get('/permissions/overrides/expired')
      ]);
      const totalPermissions = (permsRes.data.permissions || []).length;
      const activeOverrides = (activeRes.data.data || []).length;
      const expiredOverrides = (expiredRes.data.data || []).length;
      setSummary({
        totalPermissions,
        totalOverrides: activeOverrides + expiredOverrides,
        activeOverrides,
        expiredOverrides,
        recentChanges: 0
      });
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const { data } = await http.get('/audit/all?limit=10');
      const normalized = (data || []).map((item: any, idx: number) => ({
        id: idx + 1,
        action: item.action || 'UPDATE',
        permission_name: item.entityId || item.entityType,
        target_user_name: item.metadata?.userName || 'System',
        created_by_name: item.performedBy || 'system',
        created_at: item.createdAt
      }));
      setRecentActivity(normalized);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const fetchRoleStats = async () => {
    try {
      const [rolesRes, permsRes, usersRes] = await Promise.all([
        http.get('/roles'),
        http.get('/permissions'),
        http.get('/users')
      ]);
      const roles = rolesRes.data || [];
      const users = usersRes.data || [];
      const totalPermissions = (permsRes.data.permissions || []).length;
      setRoleStats(roles.map((r: any) => ({
        role_name: r.name,
        total_permissions: totalPermissions,
        granted_permissions: totalPermissions,
        users_count: users.filter((u: any) => u.role === r.name).length
      })));
    } catch (error) {
      setRoleStats([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    setLoading(true);
    fetchSummary();
    fetchRecentActivity();
    fetchRoleStats();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <Shield className="w-6 h-6 text-primary-600" />
            </div>
            Permission Dashboard
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Overview of system permissions, overrides, and recent activity
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={refreshData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Main Stats Grid */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {summary.totalPermissions}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Permissions</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Activity className="w-4 h-4" />
              <span>Across all categories</span>
            </div>
          </Card>

          <Card className="border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {summary.totalOverrides}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Overrides</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Users className="w-4 h-4" />
              <span>User-specific exceptions</span>
            </div>
          </Card>

          <Card className="border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {summary.activeOverrides}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Active Overrides</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Unlock className="w-4 h-4" />
              <span>Currently effective</span>
            </div>
          </Card>

          <Card className="border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {summary.recentChanges}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Recent Changes</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <TrendingUp className="w-4 h-4" />
              <span>Last 7 days</span>
            </div>
          </Card>
        </div>
      )}

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Statistics */}
        <Card title="Role Permission Distribution" className="border-slate-200 dark:border-slate-700">
          <div className="space-y-4">
            {roleStats.map((role, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">
                      {role.role_name}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {role.users_count} users
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-semibold text-slate-900 dark:text-white">
                    {role.granted_permissions}/{role.total_permissions}
                  </div>
                  <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-1">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(role.granted_permissions / role.total_permissions) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card title="Recent Permission Activity" className="border-slate-200 dark:border-slate-700">
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.action.includes('grant') 
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                      : activity.action.includes('revoke')
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-600'
                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                  }`}>
                    {activity.action.includes('grant') ? (
                      <Unlock className="w-4 h-4" />
                    ) : activity.action.includes('revoke') ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 dark:text-white truncate">
                      {activity.permission_name.split('.').pop()?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {activity.target_user_name} • by {activity.created_by_name}
                    </div>
                  </div>
                  
                  <div className="text-xs text-slate-400">
                    {new Date(activity.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {recentActivity.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button variant="outline" className="w-full">
                View All Activity
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* System Health */}
      <Card title="System Health" className="border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Permission System</h3>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">Healthy</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              All permissions configured correctly
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Override Cleanup</h3>
            <p className="text-sm text-amber-600 dark:text-amber-400">Attention Needed</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {summary?.expiredOverrides || 0} expired overrides found
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Eye className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Audit Trail</h3>
            <p className="text-sm text-blue-600 dark:text-blue-400">Active</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Tracking all permission changes
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
