import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/FormFields';
import { 
  CheckCircle2, XCircle, Clock, AlertTriangle, User, Shield, Eye,
  Search, Filter, Calendar, RefreshCw, Send, Check, X, Info,
  TrendingUp, Users, Settings, Lock, Unlock
} from 'lucide-react';
import { http } from '../../services/http';

interface PermissionRequest {
  id: number;
  user_id: number;
  permission_id: number;
  action: 'grant' | 'revoke';
  reason: string;
  requested_by: number;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  approved_by: number | null;
  approved_at: string | null;
  rejection_reason: string | null;
  expires_at: string | null;
  is_sensitive: boolean;
  created_at: string;
  target_user_name: string;
  permission_name: string;
  requested_by_name: string;
  approved_by_name?: string;
  approval_level?: number;
}

interface ApprovalStatistics {
  totalPending: number;
  approvedToday: number;
  rejectedToday: number;
  averageApprovalTime: number;
  sensitiveRequests: number;
}

interface SensitivePermission {
  id: number;
  permission_id: number;
  permission_name: string;
  category: string;
  approval_level: number;
  auto_approve_for_roles: string[];
}

export const ApprovalWorkflow: React.FC = () => {
  const [activeView, setActiveView] = useState<'pending' | 'history' | 'sensitive' | 'stats'>('pending');
  const [pendingRequests, setPendingRequests] = useState<PermissionRequest[]>([]);
  const [userRequests, setUserRequests] = useState<PermissionRequest[]>([]);
  const [sensitivePermissions, setSensitivePermissions] = useState<SensitivePermission[]>([]);
  const [statistics, setStatistics] = useState<ApprovalStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PermissionRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const views = [
    { id: 'pending', label: 'Pending Approvals', icon: Clock, description: 'Requests awaiting approval' },
    { id: 'history', label: 'Request History', icon: Eye, description: 'All approval requests' },
    { id: 'sensitive', label: 'Sensitive Permissions', icon: Shield, description: 'Configure approval requirements' },
    { id: 'stats', label: 'Statistics', icon: TrendingUp, description: 'Approval workflow analytics' },
  ];

  useEffect(() => {
    fetchPendingRequests();
    fetchUserRequests();
    fetchSensitivePermissions();
    fetchStatistics();
  }, []);

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const { data } = await http.get('/permissions/requests/pending');
      setPendingRequests(data.data || []);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRequests = async () => {
    try {
      const { data } = await http.get('/permissions/requests/my');
      setUserRequests(data.data || []);
    } catch (error) {
      console.error('Error fetching user requests:', error);
    }
  };

  const fetchSensitivePermissions = async () => {
    try {
      const { data } = await http.get('/permissions');
      const perms = (data.permissions || []).filter((p: any) => p.isSensitive);
      setSensitivePermissions(perms.map((p: any, i: number) => ({
        id: i + 1,
        permission_id: i + 1,
        permission_name: p.key,
        category: p.module,
        approval_level: 1,
        auto_approve_for_roles: []
      })));
    } catch (error) {
      console.error('Error fetching sensitive permissions:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const pending = pendingRequests || [];
      const my = userRequests || [];
      setStatistics({
        totalPending: pending.length,
        approvedToday: my.filter(r => r.status === 'APPROVED').length,
        rejectedToday: my.filter(r => r.status === 'REJECTED').length,
        averageApprovalTime: 0,
        sensitiveRequests: pending.filter(r => r.is_sensitive).length
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const approveRequest = async (requestId: number, reason?: string) => {
    try {
      await http.put(`/permissions/requests/${requestId}/approve`, { comments: reason });
      fetchPendingRequests();
      fetchUserRequests();
      fetchStatistics();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const rejectRequest = async (requestId: number, reason: string) => {
    try {
      await http.put(`/permissions/requests/${requestId}/reject`, { comments: reason });
      fetchPendingRequests();
      fetchUserRequests();
      fetchStatistics();
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 border-amber-200 dark:border-amber-800';
      case 'approved':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 border-emerald-200 dark:border-emerald-800';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/30 text-red-600 border-red-200 dark:border-red-800';
      case 'expired':
        return 'bg-slate-100 dark:bg-slate-700 text-slate-600 border-slate-200 dark:border-slate-600';
      default:
        return 'bg-slate-100 dark:bg-slate-700 text-slate-600 border-slate-200 dark:border-slate-600';
    }
  };

  const getActionIcon = (action: string) => {
    return action === 'grant' ? Unlock : Lock;
  };

  if (activeView === 'pending') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              Pending Approvals
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Review and act on permission override requests
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={fetchPendingRequests}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Pending</p>
                  <p className="text-2xl font-bold text-amber-600">{statistics.totalPending}</p>
                </div>
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Approved Today</p>
                  <p className="text-2xl font-bold text-emerald-600">{statistics.approvedToday}</p>
                </div>
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Rejected Today</p>
                  <p className="text-2xl font-bold text-red-600">{statistics.rejectedToday}</p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Avg. Time</p>
                  <p className="text-2xl font-bold text-blue-600">{statistics.averageApprovalTime}m</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pending Requests */}
        <Card className="border-slate-200 dark:border-slate-700">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-center py-16 text-slate-500 dark:text-slate-400">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No pending approval requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => {
                const ActionIcon = getActionIcon(request.action);
                return (
                  <div key={request.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          request.is_sensitive 
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600' 
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                        }`}>
                          <ActionIcon className="w-6 h-6" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                              {request.action === 'grant' ? 'Grant' : 'Revoke'} Permission
                            </h3>
                            {request.is_sensitive && (
                              <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 text-xs rounded-full">
                                Sensitive
                              </span>
                            )}
                            <span className={`px-3 py-1 text-xs rounded-full border ${getStatusColor(request.status)}`}>
                              {request.status}
                            </span>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium text-slate-700 dark:text-slate-300">Permission:</span>
                              <span className="text-slate-600 dark:text-slate-400">
                                {request.permission_name.split('.').pop()?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium text-slate-700 dark:text-slate-300">Target User:</span>
                              <span className="text-slate-600 dark:text-slate-400">{request.target_user_name}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium text-slate-700 dark:text-slate-300">Requested by:</span>
                              <span className="text-slate-600 dark:text-slate-400">{request.requested_by_name}</span>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-400">
                                {new Date(request.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <div className="text-sm">
                              <span className="font-medium text-slate-700 dark:text-slate-300">Reason:</span>
                              <p className="text-slate-600 dark:text-slate-400 mt-1">{request.reason}</p>
                            </div>
                            
                            {request.expires_at && (
                              <div className="flex items-center gap-2 text-sm text-amber-600">
                                <AlertTriangle className="w-4 h-4" />
                                <span>Expires: {new Date(request.expires_at).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => approveRequest(request.id)}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowRejectModal(true);
                          }}
                          className="text-red-600 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Reject Modal */}
        {showRejectModal && selectedRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Reject Permission Request
              </h3>
              
              <div className="space-y-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    {selectedRequest.action === 'grant' ? 'Grant' : 'Revoke'} permission for {selectedRequest.target_user_name}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                    placeholder="Provide a reason for rejection..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <Button
                  onClick={() => rejectRequest(selectedRequest.id, rejectionReason)}
                  disabled={!rejectionReason.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Reject Request
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedRequest(null);
                    setRejectionReason('');
                  }}
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
  }

  if (activeView === 'history') {
    return (
      <div className="space-y-6">
        <Card title="Request History" className="border-slate-200 dark:border-slate-700">
          <div className="space-y-3">
            {userRequests.map((request) => {
              const ActionIcon = getActionIcon(request.action);
              return (
                <div key={request.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(request.status)}`}>
                      <ActionIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {request.action === 'grant' ? 'Grant' : 'Revoke'} {request.permission_name.split('.').pop()?.replace(/_/g, ' ')}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {request.status} • {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(request.status)}`}>
                      {request.status}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    );
  }

  if (activeView === 'sensitive') {
    return (
      <div className="space-y-6">
        <Card title="Sensitive Permissions Configuration" className="border-slate-200 dark:border-slate-700">
          <div className="space-y-4">
            {sensitivePermissions.map((perm) => (
              <div key={perm.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">
                    {perm.permission_name.split('.').pop()?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {perm.category} • Approval Level: {perm.approval_level}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Auto-approve: {perm.auto_approve_for_roles.join(', ') || 'None'}
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (activeView === 'stats') {
    return (
      <div className="space-y-6">
        {statistics && (
          <>
            <Card title="Approval Workflow Statistics" className="border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Total Pending</p>
                      <p className="text-2xl font-bold text-amber-600">{statistics.totalPending}</p>
                    </div>
                    <Clock className="w-8 h-8 text-amber-500" />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Approved Today</p>
                      <p className="text-2xl font-bold text-emerald-600">{statistics.approvedToday}</p>
                    </div>
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Rejected Today</p>
                      <p className="text-2xl font-bold text-red-600">{statistics.rejectedToday}</p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-500" />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Avg. Approval Time</p>
                      <p className="text-2xl font-bold text-blue-600">{statistics.averageApprovalTime} min</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            Approval Workflow
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage permission override requests and approvals
          </p>
        </div>
      </div>

      {/* View Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1">
        <div className="flex flex-wrap gap-1">
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                activeView === view.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <view.icon className="w-4 h-4" />
              <span>{view.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
