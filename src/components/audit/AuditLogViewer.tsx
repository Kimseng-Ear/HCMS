import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/FormFields';
import { 
  FileText, Calendar, Filter, Search, Download, RefreshCw,
  Clock, Users, Settings, Shield, AlertTriangle, CheckCircle2,
  XCircle, ChevronDown, ChevronRight, Eye, EyeOff, FilterX,
  BarChart3, TrendingUp, FileSpreadsheet, Printer, Share2,
  Info, ArrowUp, ArrowDown, ArrowUpDown, Upload
} from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  user_email: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_value?: string;
  new_value?: string;
  reason?: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface ComplianceReport {
  period: {
    from: string;
    to: string;
  };
  summary: {
    total_changes: number;
    setting_changes: number;
    permission_changes: number;
    system_activities: number;
    unique_users_active: number;
    sensitive_permission_changes: number;
  };
  by_category: Array<{
    category: string;
    count: number;
  }>;
  by_action: Array<{
    action: string;
    count: number;
  }>;
  top_users: Array<{
    user_name: string;
    user_email: string;
    change_count: number;
  }>;
  security_alerts: Array<{
    type: string;
    count: number;
    details: any;
  }>;
  recommendations: Array<{
    type: 'info' | 'warning' | 'alert';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
  }>;
}

const actionColors = {
  'CREATE': 'bg-green-100 dark:bg-green-900/30 text-green-600 border-green-200 dark:border-green-800',
  'UPDATE': 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 border-blue-200 dark:border-blue-800',
  'DELETE': 'bg-red-100 dark:bg-red-900/30 text-red-600 border-red-200 dark:border-red-800',
  'LOGIN_SUCCESS': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 border-emerald-200 dark:border-emerald-800',
  'LOGIN_FAILED': 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 border-amber-200 dark:border-amber-800',
  'GRANT': 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 border-purple-200 dark:border-purple-800',
  'REVOKE': 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 border-orange-200 dark:border-orange-800',
  'EXPORT': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 border-indigo-200 dark:border-indigo-800',
  'IMPORT': 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 border-pink-200 dark:border-pink-800',
};

const actionIcons = {
  'CREATE': CheckCircle2,
  'UPDATE': Settings,
  'DELETE': XCircle,
  'LOGIN_SUCCESS': CheckCircle2,
  'LOGIN_FAILED': AlertTriangle,
  'GRANT': Shield,
  'REVOKE': Shield,
  'EXPORT': Download,
  'IMPORT': Upload,
};

const resourceColors = {
  'user': 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-200 dark:border-blue-800',
  'permission': 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 border-purple-200 dark:border-purple-800',
  'setting': 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-200 dark:border-emerald-800',
  'department': 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-200 dark:border-amber-800',
  'position': 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 border-orange-200 dark:border-orange-800',
  'role': 'bg-slate-50 dark:bg-slate-900/20 text-slate-600 border-slate-200 dark:border-slate-800',
  'template': 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-indigo-200 dark:border-indigo-800',
  'system': 'bg-red-50 dark:bg-red-900/20 text-red-600 border-red-200 dark:border-red-800',
};

export const AuditLogViewer: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf' | 'csv'>('excel');
  
  // Sorting
  const [sortBy, setSortBy] = useState<'timestamp' | 'user' | 'action'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('search', searchTerm);
      if (actionFilter) params.append('action', actionFilter);
      if (resourceFilter) params.append('resource_type', resourceFilter);
      if (userFilter) params.append('user', userFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (sortBy) params.append('sort_by', sortBy);
      if (sortOrder) params.append('sort_order', sortOrder);
      
      const response = await fetch(`/api/audit/logs?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.data);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateComplianceReport = async () => {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('from', dateFrom);
      if (dateTo) params.append('to', dateTo);
      
      const response = await fetch(`/api/audit/compliance-report?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setComplianceReport(data.data);
        setShowComplianceModal(true);
      }
    } catch (error) {
      console.error('Error generating compliance report:', error);
    }
  };

  const exportAuditLogs = async () => {
    try {
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('search', searchTerm);
      if (actionFilter) params.append('action', actionFilter);
      if (resourceFilter) params.append('resource_type', resourceFilter);
      if (userFilter) params.append('user', userFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      
      const response = await fetch(`/api/audit/export?${params.toString()}&format=${exportFormat}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        setShowExportModal(false);
      }
    } catch (error) {
      console.error('Error exporting audit logs:', error);
    }
  };

  const handleSort = (field: 'timestamp' | 'user' | 'action') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setActionFilter('');
    setResourceFilter('');
    setUserFilter('');
    setDateFrom('');
    setDateTo('');
    setSortBy('timestamp');
    setSortOrder('desc');
  };

  const getFilteredLogs = () => {
    let filtered = [...auditLogs];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.old_value?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.new_value?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply action filter
    if (actionFilter) {
      filtered = filtered.filter(log => log.action === actionFilter);
    }
    
    // Apply resource filter
    if (resourceFilter) {
      filtered = filtered.filter(log => log.resource_type === resourceFilter);
    }
    
    // Apply user filter
    if (userFilter) {
      filtered = filtered.filter(log => 
        log.user_name.toLowerCase().includes(userFilter.toLowerCase()) ||
        log.user_email.toLowerCase().includes(userFilter.toLowerCase())
      );
    }
    
    // Apply date range filter
    if (dateFrom) {
      filtered = filtered.filter(log => new Date(log.created_at) >= new Date(dateFrom));
    }
    
    if (dateTo) {
      filtered = filtered.filter(log => new Date(log.created_at) <= new Date(dateTo));
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'timestamp':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'user':
          comparison = a.user_name.localeCompare(b.user_name);
          break;
        case 'action':
          comparison = a.action.localeCompare(b.action);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  };

  const uniqueUsers = Array.from(new Set(auditLogs.map(log => log.user_name)));
  const uniqueActions = Array.from(new Set(auditLogs.map(log => log.action)));
  const uniqueResources = Array.from(new Set(auditLogs.map(log => log.resource_type).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <FileText className="w-6 h-6 text-amber-600" />
            </div>
            Audit Log Viewer
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Comprehensive audit trail and compliance reporting
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={generateComplianceReport}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Compliance Report
          </Button>
          <Button variant="outline" onClick={() => setShowExportModal(true)}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={fetchAuditLogs}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 dark:border-slate-700">
        <div className="p-4">
          <div className="flex flex-wrap gap-3 mb-4">
            {/* Date Range */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Date Range:
              </label>
              <Input
                type="date"
                placeholder="From"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-32"
                label="From"
              />
              <Input
                type="date"
                placeholder="To"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-32"
                label="To"
              />
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
                label="Search"
              />
            </div>
            
            {/* Action Filter */}
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>
                  {action.charAt(0).toUpperCase() + action.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
            
            {/* Resource Filter */}
            <select
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">All Resources</option>
              {uniqueResources.map(resource => (
                <option key={resource} value={resource}>
                  {resource.charAt(0).toUpperCase() + resource.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
            
            {/* User Filter */}
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">All Users</option>
              {uniqueUsers.map(user => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
            
            {/* Clear Filters */}
            <Button variant="outline" onClick={clearFilters}>
              <FilterX className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
          
          {/* Statistics */}
          <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
            <span>Total Logs: {getFilteredLogs().length}</span>
            <span>•</span>
            <span>Users: {uniqueUsers.length}</span>
            <span>•</span>
            <span>Actions: {uniqueActions.length}</span>
            <span>•</span>
            <span>Resources: {uniqueResources.length}</span>
          </div>
        </div>
      </Card>

      {/* Audit Logs Table */}
      <Card className="border-slate-200 dark:border-slate-700">
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left p-3 font-medium text-slate-700 dark:text-slate-300">
                    <button
                      onClick={() => handleSort('timestamp')}
                      className="flex items-center gap-2 hover:text-slate-900 dark:hover:text-white"
                    >
                      Timestamp
                      {sortBy === 'timestamp' && (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-4 h-4" />
                        ) : (
                          <ArrowDown className="w-4 h-4" />
                        )
                      )}
                    </button>
                  </th>
                  <th className="text-left p-3 font-medium text-slate-700 dark:text-slate-300">
                    <button
                      onClick={() => handleSort('user')}
                      className="flex items-center gap-2 hover:text-slate-900 dark:hover:text-white"
                    >
                      User
                      {sortBy === 'user' && (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-4 h-4" />
                        ) : (
                          <ArrowDown className="w-4 h-4" />
                        )
                      )}
                    </button>
                  </th>
                  <th className="text-left p-3 font-medium text-slate-700 dark:text-slate-300">
                    <button
                      onClick={() => handleSort('action')}
                      className="flex items-center gap-2 hover:text-slate-900 dark:hover:text-white"
                    >
                      Action
                      {sortBy === 'action' && (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-4 h-4" />
                        ) : (
                          <ArrowDown className="w-4 h-4" />
                        )
                      )}
                    </button>
                  </th>
                  <th className="text-left p-3 font-medium text-slate-700 dark:text-slate-300">
                    Resource
                  </th>
                  <th className="text-left p-3 font-medium text-slate-700 dark:text-slate-300">
                    Old Value
                  </th>
                  <th className="text-left p-3 font-medium text-slate-700 dark:text-slate-300">
                    New Value
                  </th>
                  <th className="text-left p-3 font-medium text-slate-700 dark:text-slate-300">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
                    </td>
                  </tr>
                ) : (
                  getFilteredLogs().map((log, index) => {
                    const Icon = actionIcons[log.action as keyof typeof actionIcons] || Settings;
                    const ActionColor = actionColors[log.action as keyof typeof actionColors] || actionColors['CREATE'];
                    const ResourceColor = resourceColors[log.resource_type as keyof typeof resourceColors] || resourceColors['user'];
                    
                    return (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${ActionColor}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-slate-900 dark:text-white">
                                {new Date(log.created_at).toLocaleString()}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {new Date(log.created_at).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                              <Users className="w-3 h-3 text-slate-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-slate-900 dark:text-white">
                                {log.user_name}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {log.user_email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className={`inline-flex items-center gap-2 px-2 py-1 text-xs rounded-full ${ActionColor}`}>
                            {log.action.charAt(0).toUpperCase() + log.action.slice(1).toLowerCase()}
                          </div>
                        </td>
                        <td className="p-3">
                          {log.resource_type ? (
                            <div className={`inline-flex items-center gap-2 px-2 py-1 text-xs rounded-full ${ResourceColor}`}>
                              {log.resource_type.charAt(0).toUpperCase() + log.resource_type.slice(1).toLowerCase()}
                            </div>
                          ) : (
                            <span className="text-slate-500 dark:text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          {log.old_value ? (
                            <div className="text-sm text-slate-900 dark:text-white max-w-xs truncate">
                              {log.old_value}
                            </div>
                          ) : (
                            <span className="text-slate-500 dark:text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          {log.new_value ? (
                            <div className="text-sm text-slate-900 dark:text-white max-w-xs truncate">
                              {log.new_value}
                            </div>
                          ) : (
                            <span className="text-slate-500 dark:text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          {log.reason ? (
                            <div className="text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate" title={log.reason}>
                              {log.reason}
                            </div>
                          ) : (
                            <span className="text-slate-500 dark:text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Compliance Report Modal */}
      {showComplianceModal && complianceReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Compliance Report
            </h3>
            
            <div className="space-y-6">
              {/* Period */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                <h4 className="font-medium text-slate-900 dark:text-white mb-2">
                  Report Period
                </h4>
                <div className="flex items-center gap-4 text-sm">
                  <span>From: {new Date(complianceReport.period.from).toLocaleDateString()}</span>
                  <span>To: {new Date(complianceReport.period.to).toLocaleDateString()}</span>
                  <span>Days: {Math.ceil((new Date(complianceReport.period.to).getTime() - new Date(complianceReport.period.from).getTime()) / (1000 * 60 * 60 * 24))}</span>
                </div>
              </div>
              
              {/* Executive Summary */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                <h4 className="font-medium text-slate-900 dark:text-white mb-4">
                  Executive Summary
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {complianceReport.summary.total_changes}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Total Changes
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {complianceReport.summary.setting_changes}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Setting Changes
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {complianceReport.summary.permission_changes}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Permission Changes
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {complianceReport.summary.system_activities}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      System Activities
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* By Category */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                  <h4 className="font-medium text-slate-900 dark:text-white mb-4">
                    Changes by Category
                  </h4>
                  <div className="space-y-2">
                    {complianceReport.by_category.map((category, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {category.category}
                        </span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {category.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* By Action */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                  <h4 className="font-medium text-slate-900 dark:text-white mb-4">
                    Changes by Action
                  </h4>
                  <div className="space-y-2">
                    {complianceReport.by_action.map((action, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-2 px-2 py-1 text-xs rounded-full ${actionColors[action.action as keyof typeof actionColors] || actionColors['CREATE']}`}>
                          {action.action.charAt(0).toUpperCase() + action.action.slice(1).toLowerCase()}
                        </span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {action.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Top Users */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                <h4 className="font-medium text-slate-900 dark:text-white mb-4">
                  Top Active Users
                </h4>
                <div className="space-y-2">
                  {complianceReport.top_users.map((user, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                          <Users className="w-3 h-3 text-slate-600" />
                        </div>
                        <span className="text-sm text-slate-900 dark:text-white">
                          {user.user_name}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {user.change_count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Security Alerts */}
              {complianceReport.security_alerts.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 dark:text-red-200 mb-4">
                    Security Alerts
                  </h4>
                  <div className="space-y-2">
                    {complianceReport.security_alerts.map((alert, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">
                            {alert.type}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {alert.count} occurrences
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Recommendations */}
              {complianceReport.recommendations.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-4">
                    Recommendations
                  </h4>
                  <div className="space-y-2">
                    {complianceReport.recommendations.map((rec, index) => (
                      <div key={index} className={`p-3 rounded-lg ${
                        rec.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800' :
                        rec.priority === 'medium' ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800' :
                        'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800'
                      }`}>
                        <div className="flex items-center gap-2">
                          {rec.priority === 'high' && <AlertTriangle className="w-5 h-5 text-red-600" />}
                          {rec.priority === 'medium' && <Info className="w-5 h-5 text-amber-600" />}
                          {rec.priority === 'low' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">
                            {rec.title}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {rec.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowComplianceModal(false)}
                className="flex-1"
              >
                Close
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
              Export Audit Logs
            </h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Export Format
                </label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as 'excel' | 'pdf' | 'csv')}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="excel">Excel</option>
                  <option value="pdf">PDF</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Include
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-amber-600 rounded" />
                    <span className="text-sm">Current filters</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-amber-600 rounded" />
                    <span className="text-sm">All columns</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-amber-600 rounded" />
                    <span className="text-sm">Timestamp</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-amber-600 rounded" />
                    <span className="text-sm">User details</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-amber-600 rounded" />
                    <span className="text-sm">Change details</span>
                  </label>
                </div>
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
      )}
    </div>
  );
};
