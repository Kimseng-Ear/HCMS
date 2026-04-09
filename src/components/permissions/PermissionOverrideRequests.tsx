import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/FormFields';
import { 
  Clock, CheckCircle2, XCircle, AlertTriangle, User, Shield, Calendar,
  MessageSquare, Send, Eye, EyeOff, Search, Filter, RefreshCw,
  ChevronDown, ChevronUp, ChevronRight, Info, Check, X, Plus, History,
  Users, Settings, Lock, Unlock, FileText, Download, FilterX
} from 'lucide-react';
import { http } from '../../services/http';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface PermissionOverrideRequest {
  id: string;
  user_id: string;
  permission_id: string;
  override_type: 'GRANT' | 'REVOKE';
  reason: string;
  requested_by: string;
  requested_by_name: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  expires_at?: string;
  target_user_name: string;
  target_user_email: string;
  permission_name: string;
  permission_category: string;
  permission_sensitive: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Permission {
  id: string;
  name: string;
  category: string;
  description: string;
  is_sensitive: boolean;
}

const statusColors = {
  'PENDING': 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 border-amber-200 dark:border-amber-800',
  'APPROVED': 'bg-green-100 dark:bg-green-900/30 text-green-600 border-green-200 dark:border-green-800',
  'REJECTED': 'bg-red-100 dark:bg-red-900/30 text-red-600 border-red-200 dark:border-red-800',
  'EXPIRED': 'bg-slate-100 dark:bg-slate-700 text-slate-600 border-slate-300 dark:border-slate-500',
};

const statusIcons = {
  'PENDING': Clock,
  'APPROVED': CheckCircle2,
  'REJECTED': XCircle,
  'EXPIRED': AlertTriangle,
};

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

export const PermissionOverrideRequests: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'my'>('pending');
  const [pendingRequests, setPendingRequests] = useState<PermissionOverrideRequest[]>([]);
  const [myRequests, setMyRequests] = useState<PermissionOverrideRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PermissionOverrideRequest | null>(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [rejectionComment, setRejectionComment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());

  const newRequestSchema = z.object({
    user_id: z.string().min(1, 'User is required'),
    permission_id: z.string().min(1, 'Permission is required'),
    override_type: z.enum(['GRANT', 'REVOKE']),
    reason: z.string().min(3, 'Reason is required'),
    expires_at: z.string().optional()
  });

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<z.infer<typeof newRequestSchema>>({
    resolver: zodResolver(newRequestSchema),
    defaultValues: { override_type: 'GRANT' }
  });

  useEffect(() => {
    fetchPendingRequests();
    fetchMyRequests();
    fetchUsers();
    fetchPermissions();
  }, []);

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/permissions/requests/pending');
      const data = await response.json();
      setPendingRequests(data.data || []);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const { data } = await http.get('/permissions/requests/my');
      setMyRequests(data.data || []);
    } catch (error) {
      console.error('Error fetching my requests:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await http.get('/users');
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchPermissions = async () => {
    try {
      const { data } = await http.get('/permissions');
      setPermissions(data.permissions || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const approveRequest = async (requestId: string, comment: string) => {
    try {
      await http.put(`/permissions/requests/${requestId}/approve`, { comments: comment });
      fetchPendingRequests();
      fetchMyRequests();
      setShowApprovalModal(false);
      setApprovalComment('');
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const rejectRequest = async (requestId: string, comment: string) => {
    try {
      await http.put(`/permissions/requests/${requestId}/reject`, { comments: comment });
      fetchPendingRequests();
      fetchMyRequests();
      setShowRejectionModal(false);
      setRejectionComment('');
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const submitNewRequest = async (values: z.infer<typeof newRequestSchema>) => {
    try {
      await http.post('/permissions/requests', {
        ...values,
        expires_at: values.expires_at || null
      });
      fetchMyRequests();
      setShowNewRequestModal(false);
      reset();
    } catch (error) {
      console.error('Error submitting request:', error);
    }
  };

  const toggleExpanded = (requestId: string) => {
    const newExpanded = new Set(expandedRequests);
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
    } else {
      newExpanded.add(requestId);
    }
    setExpandedRequests(newExpanded);
  };

  const filteredPendingRequests = pendingRequests.filter(request =>
    request.target_user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.permission_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (filterCategory === '' || request.permission_category === filterCategory)
  );

  const filteredMyRequests = myRequests.filter(request =>
    request.permission_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (filterStatus === '' || request.status === filterStatus) ||
    (filterCategory === '' || request.permission_category === filterCategory)
  );

  const getStatusIcon = (status: string) => {
    const Icon = statusIcons[status as keyof typeof statusIcons] || Clock;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            Permission Override Requests
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage permission override requests and approvals
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search requests..."
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
            {Array.from(new Set([...pendingRequests, ...myRequests].map(r => r.permission_category))).map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <Button variant="outline" onClick={() => {
            fetchPendingRequests();
            fetchMyRequests();
          }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === 'pending'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Pending Requests</span>
            <span className={`px-2 py-1 text-xs rounded-full ${
              activeTab === 'pending'
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              {pendingRequests.length}
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('my')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === 'my'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <User className="w-4 h-4" />
            <span>My Requests</span>
            <span className={`px-2 py-1 text-xs rounded-full ${
              activeTab === 'my'
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              {myRequests.length}
            </span>
          </button>
        </div>
      </div>

      {/* Pending Requests Tab */}
      {activeTab === 'pending' && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          ) : (
            <>
              {filteredPendingRequests.length === 0 ? (
                <Card className="border-slate-200 dark:border-slate-700">
                  <div className="p-8 text-center">
                    <Shield className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                      No Pending Requests
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400">
                      All permission override requests have been processed
                    </p>
                  </div>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredPendingRequests.map((request) => (
                    <Card key={request.id} className="border-slate-200 dark:border-slate-700">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${statusColors[request.status]}`}>
                                {getStatusIcon(request.status)}
                              </div>
                              <div>
                                <div className="font-medium text-slate-900 dark:text-white">
                                  {request.override_type === 'GRANT' ? 'Grant' : 'Revoke'} Permission Request
                                </div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                  {request.target_user_name} ({request.target_user_email})
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 mb-3">
                              <span className={`px-3 py-1 text-xs rounded-full ${categoryColors[request.permission_category as keyof typeof categoryColors]}`}>
                                {request.permission_category}
                              </span>
                              {request.permission_sensitive && (
                                <span className="px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-600">
                                  Sensitive
                                </span>
                              )}
                              {request.expires_at && (
                                <span className="px-2 py-1 text-xs rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600">
                                  Temporary
                                </span>
                              )}
                            </div>
                            
                            <div className="mb-3">
                              <div className="font-medium text-slate-900 dark:text-white mb-1">
                                Permission: {request.permission_name.split('.').pop()?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                {request.reason}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                              <span>Requested by {request.requested_by_name}</span>
                              <span>•</span>
                              <span>{new Date(request.created_at).toLocaleDateString()}</span>
                              {request.expires_at && (
                                <>
                                  <span>•</span>
                                  <span>Expires: {new Date(request.expires_at).toLocaleDateString()}</span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowApprovalModal(true);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowRejectionModal(true);
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleExpanded(request.id)}
                            >
                              {expandedRequests.has(request.id) ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        {expandedRequests.has(request.id) && (
                          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium text-slate-900 dark:text-white mb-2">Request Details</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-slate-500 dark:text-slate-400">Request ID:</span>
                                    <span className="text-slate-900 dark:text-white">{request.id}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500 dark:text-slate-400">Override Type:</span>
                                    <span className="text-slate-900 dark:text-white">{request.override_type}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500 dark:text-slate-400">Permission ID:</span>
                                    <span className="text-slate-900 dark:text-white">{request.permission_id}</span>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium text-slate-900 dark:text-white mb-2">Requester Information</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-slate-500 dark:text-slate-400">Name:</span>
                                    <span className="text-slate-900 dark:text-white">{request.requested_by_name}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500 dark:text-slate-400">User ID:</span>
                                    <span className="text-slate-900 dark:text-white">{request.requested_by}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500 dark:text-slate-400">Created:</span>
                                    <span className="text-slate-900 dark:text-white">{new Date(request.created_at).toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* My Requests Tab */}
      {activeTab === 'my' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                My Permission Requests
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Track the status of your permission override requests
              </p>
            </div>
            <Button
              onClick={() => setShowNewRequestModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filter by status:</span>
            <div className="flex gap-2">
              {['', 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 text-sm rounded-full transition-all ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {status || 'All'}
                </button>
              ))}
            </div>
          </div>

          {filteredMyRequests.length === 0 ? (
            <Card className="border-slate-200 dark:border-slate-700">
              <div className="p-8 text-center">
                <Clock className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  No Requests Found
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-4">
                  {filterStatus ? `No ${filterStatus.toLowerCase()} requests found` : 'You haven\'t submitted any requests yet'}
                </p>
                <Button
                  onClick={() => setShowNewRequestModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Your First Request
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredMyRequests.map((request) => (
                <Card key={request.id} className="border-slate-200 dark:border-slate-700">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${statusColors[request.status]}`}>
                            {getStatusIcon(request.status)}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white">
                              {request.override_type === 'GRANT' ? 'Grant' : 'Revoke'} Permission Request
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              Requested on {new Date(request.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`px-3 py-1 text-xs rounded-full ${statusColors[request.status]}`}>
                            {request.status}
                          </span>
                          <span className={`px-3 py-1 text-xs rounded-full ${categoryColors[request.permission_category as keyof typeof categoryColors]}`}>
                            {request.permission_category}
                          </span>
                          {request.permission_sensitive && (
                            <span className="px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-600">
                              Sensitive
                            </span>
                          )}
                          {request.expires_at && (
                            <span className="px-2 py-1 text-xs rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600">
                              Temporary
                            </span>
                          )}
                        </div>
                        
                        <div className="mb-3">
                          <div className="font-medium text-slate-900 dark:text-white mb-1">
                            Permission: {request.permission_name.split('.').pop()?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {request.reason}
                          </div>
                        </div>
                        
                        {request.status === 'APPROVED' && request.approved_by_name && (
                          <div className="text-sm text-green-600 dark:text-green-400 mb-2">
                            Approved by {request.approved_by_name} on {new Date(request.approved_at!).toLocaleDateString()}
                          </div>
                        )}
                        
                        {request.status === 'REJECTED' && request.rejection_reason && (
                          <div className="text-sm text-red-600 dark:text-red-400 mb-2">
                            Rejected: {request.rejection_reason}
                          </div>
                        )}
                        
                        {request.expires_at && (
                          <div className="text-sm text-amber-600 dark:text-amber-400">
                            Expires: {new Date(request.expires_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleExpanded(request.id)}
                      >
                        {expandedRequests.has(request.id) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    
                    {expandedRequests.has(request.id) && (
                      <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-slate-900 dark:text-white mb-2">Request Details</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Request ID:</span>
                                <span className="text-slate-900 dark:text-white">{request.id}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Override Type:</span>
                                <span className="text-slate-900 dark:text-white">{request.override_type}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Permission ID:</span>
                                <span className="text-slate-900 dark:text-white">{request.permission_id}</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-900 dark:text-white mb-2">Status Information</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Current Status:</span>
                                <span className="text-slate-900 dark:text-white">{request.status}</span>
                              </div>
                              {request.approved_by_name && (
                                <div className="flex justify-between">
                                  <span className="text-slate-500 dark:text-slate-400">Approved By:</span>
                                  <span className="text-slate-900 dark:text-white">{request.approved_by_name}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Created:</span>
                                <span className="text-slate-900 dark:text-white">{new Date(request.created_at).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Approve Request
            </h3>
            
            <div className="space-y-4 mb-6">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="font-medium text-green-800 dark:text-green-200 mb-1">
                  {selectedRequest.override_type === 'GRANT' ? 'Grant' : 'Revoke'} Permission
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  {selectedRequest.permission_name.split('.').pop()?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  For: {selectedRequest.target_user_name}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Approval Comments (Optional)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                  rows={3}
                  placeholder="Enter approval comments..."
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={() => approveRequest(selectedRequest.id, approvalComment)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                onClick={() => {
                  setShowApprovalModal(false);
                  setApprovalComment('');
                  setSelectedRequest(null);
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

      {/* Rejection Modal */}
      {showRejectionModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Reject Request
            </h3>
            
            <div className="space-y-4 mb-6">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="font-medium text-red-800 dark:text-red-200 mb-1">
                  {selectedRequest.override_type === 'GRANT' ? 'Grant' : 'Revoke'} Permission
                </div>
                <div className="text-sm text-red-600 dark:text-red-400">
                  {selectedRequest.permission_name.split('.').pop()?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
                <div className="text-sm text-red-600 dark:text-red-400">
                  For: {selectedRequest.target_user_name}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                  rows={3}
                  placeholder="Enter rejection reason..."
                  value={rejectionComment}
                  onChange={(e) => setRejectionComment(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={() => rejectRequest(selectedRequest.id, rejectionComment)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={!rejectionComment.trim()}
              >
                <XCircle2 className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectionComment('');
                  setSelectedRequest(null);
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

      {/* New Request Modal */}
      {showNewRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Submit Permission Override Request
            </h3>
            
            <form className="space-y-4 mb-6" onSubmit={handleSubmit(submitNewRequest)}>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Select User
                </label>
                <select
                  {...register('user_id')}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">Select a user...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email}) - {user.role}
                    </option>
                  ))}
                </select>
                {errors.user_id && <p className="text-sm text-red-500 mt-1">{errors.user_id.message}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Select Permission
                </label>
                <select
                  {...register('permission_id')}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">Select a permission...</option>
                  {permissions.map((permission) => (
                    <option key={permission.id} value={permission.id}>
                      {permission.name.split('.').pop()?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - {permission.category}
                    </option>
                  ))}
                </select>
                {errors.permission_id && <p className="text-sm text-red-500 mt-1">{errors.permission_id.message}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Override Type
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => reset({ ...watch(), override_type: 'GRANT' })}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                      watch('override_type') === 'GRANT'
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2 inline" />
                    Grant Permission
                  </button>
                  <button
                    onClick={() => reset({ ...watch(), override_type: 'REVOKE' })}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                      watch('override_type') === 'REVOKE'
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <XCircle className="w-4 h-4 mr-2 inline" />
                    Revoke Permission
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('reason')}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                  rows={3}
                  placeholder="Enter reason for this permission override request..."
                />
                {errors.reason && <p className="text-sm text-red-500 mt-1">{errors.reason.message}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Expiration Date (Optional)
                </label>
                <input
                  {...register('expires_at')}
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </form>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSubmit(submitNewRequest)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!!errors.user_id || !!errors.permission_id || !!errors.reason}
              >
                <Send className="w-4 h-4 mr-2" />
                Submit Request
              </Button>
              <Button
                onClick={() => {
                  setShowNewRequestModal(false);
                  reset();
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
    </div>
  );
};
