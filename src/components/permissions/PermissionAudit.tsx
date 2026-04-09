import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/FormFields';
import { 
  Clock, Search, Filter, Download, RefreshCw, Eye, User, Shield,
  Calendar, ChevronDown, CheckCircle2, XCircle, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import { http } from '../../services/http';

interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  oldValue: any;
  newValue: any;
  performedBy: string;
  reason: string;
  createdAt: string;
  permission_name?: string;
  target_user_name?: string;
  created_by_name?: string;
  created_by?: string;
  created_at?: string;
}

const actionIcons = {
  'GRANT': { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  'REVOKE': { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
  'APPROVE': { icon: ArrowUpRight, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  'REJECT': { icon: ArrowDownRight, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  'UPDATE': { icon: Minus, color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-700' },
  'EXPIRE': { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
};

const actionLabels = {
  'GRANT': 'Granted',
  'REVOKE': 'Revoked',
  'APPROVE': 'Approved',
  'REJECT': 'Rejected',
  'UPDATE': 'Updated',
  'EXPIRE': 'Expired',
};

export const PermissionAudit: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('');
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    fetchAuditLogs();
  }, [filterAction, filterUser, limit]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterAction !== 'all') params.append('entityType', filterAction);
      if (filterUser) params.append('performedBy', filterUser);
      params.append('limit', limit.toString());

      const { data } = await http.get(`/audit/all?${params}`);
      const normalized = (data || []).map((log: any) => ({
        ...log,
        created_at: log.createdAt,
        permission_name: log.entityId || log.entityType,
        target_user_name: log.metadata?.userName || '',
        created_by_name: log.performedBy,
        created_by: log.performedBy
      }));
      setAuditLogs(normalized);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportAuditLogs = () => {
    const csv = [
      ['Date', 'Action', 'Permission', 'Target User', 'Changed By', 'Reason'].join(','),
      ...auditLogs.map(log => [
        new Date(log.created_at || log.createdAt).toLocaleString(),
        actionLabels[log.action as keyof typeof actionLabels] || log.action,
        log.permission_name,
        log.target_user_name || 'System',
        log.created_by_name,
        `"${(log.reason || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `permission-audit-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredLogs = auditLogs.filter(log => 
    (log.permission_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.target_user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.created_by_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.reason || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Audit Trail</h3>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={exportAuditLogs}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={fetchAuditLogs}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              label="Search"
            />
          </div>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="all">All Actions</option>
            <option value="grant">Granted</option>
            <option value="revoke">Revoked</option>
            <option value="override_grant">Override Granted</option>
            <option value="override_revoke">Override Denied</option>
            <option value="override_removed">Override Removed</option>
          </select>

          <Input
            placeholder="User ID"
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            label="Target User ID"
          />

          <select
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="25">Last 25</option>
            <option value="50">Last 50</option>
            <option value="100">Last 100</option>
            <option value="500">Last 500</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Changes</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{auditLogs.length}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Grants</p>
              <p className="text-2xl font-bold text-emerald-600">
                {auditLogs.filter(log => log.action.includes('grant')).length}
              </p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Revokes</p>
              <p className="text-2xl font-bold text-red-600">
                {auditLogs.filter(log => log.action.includes('revoke')).length}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Overrides</p>
              <p className="text-2xl font-bold text-amber-600">
                {auditLogs.filter(log => log.action.startsWith('override')).length}
              </p>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs */}
      <Card className="border-slate-200 dark:border-slate-700">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-16 text-slate-500 dark:text-slate-400">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No audit logs found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left p-4 font-medium text-slate-700 dark:text-slate-300">Date & Time</th>
                  <th className="text-left p-4 font-medium text-slate-700 dark:text-slate-300">Action</th>
                  <th className="text-left p-4 font-medium text-slate-700 dark:text-slate-300">Permission</th>
                  <th className="text-left p-4 font-medium text-slate-700 dark:text-slate-300">Target User</th>
                  <th className="text-left p-4 font-medium text-slate-700 dark:text-slate-300">Changed By</th>
                  <th className="text-left p-4 font-medium text-slate-700 dark:text-slate-300">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredLogs.map((log) => {
                  const actionConfig = actionIcons[log.action as keyof typeof actionIcons] || 
                    { icon: Clock, color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-700' };
                  const ActionIcon = actionConfig.icon;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4">
                        <div className="text-sm text-slate-900 dark:text-white">
                          {new Date(log.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${actionConfig.bg} ${actionConfig.color}`}>
                          <ActionIcon className="w-4 h-4" />
                          {actionLabels[log.action as keyof typeof actionLabels] || log.action}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {log.permission_name.split('.').pop()?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {log.permission_name.split('.')[0]}
                        </div>
                      </td>
                      <td className="p-4">
                        {log.target_user_name ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                              {log.target_user_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-slate-900 dark:text-white">
                                {log.target_user_name}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                ID: {log.target_user_id}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-500 dark:text-slate-400">System</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                            {log.created_by_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900 dark:text-white">
                              {log.created_by_name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {log.created_by}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="max-w-xs">
                          <p className="text-sm text-slate-600 dark:text-slate-400 truncate" title={log.reason}>
                            {log.reason}
                          </p>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};
