
import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LeaveRequest, LeaveStatus, Role, User, LeaveType } from '../types';
import { Plus, Check, X, Settings, Calendar as CalendarIcon, Clock, User as UserIcon, FileText, ChevronDown, Filter, Search, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// --- NEW: Leave Type Configuration ---
const LeaveConfig: React.FC = () => {
    const { t } = useLanguage();
    const [types, setTypes] = useState<LeaveType[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newType, setNewType] = useState({ name: '', isPaid: true, daysAllowed: 0 });

    useEffect(() => { Api.leaves.getTypes().then(setTypes); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        await Api.leaves.createType(newType);
        setIsModalOpen(false);
        setTypes(await Api.leaves.getTypes());
    };

    return (
        <Card title={t('leaves.config')} icon={<Settings className="w-5 h-5 text-slate-500" />} className="border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="mb-6 flex justify-end">
                <Button onClick={() => setIsModalOpen(true)} size="sm" className="bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-500/20 rounded-xl px-4"><Plus className="w-4 h-4 mr-2" /> {t('common.add')}</Button>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-xs border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-4">{t('leaves.type')}</th>
                            <th className="px-6 py-4">{t('leaves.paid')}?</th>
                            <th className="px-6 py-4">{t('leaves.daysAllowed')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-800">
                        {types.map(lt => (
                            <tr key={lt.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                                <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{lt.name}</td>
                                <td className="px-6 py-4">{lt.isPaid ? <Badge variant="success" className="px-3 py-1">{t('leaves.paid')}</Badge> : <Badge variant="warning" className="px-3 py-1">{t('leaves.unpaid')}</Badge>}</td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-mono font-medium bg-slate-50 dark:bg-slate-700/30 px-3 py-1 rounded-lg w-fit">{lt.daysAllowed} days</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('leaves.config')}>
                <form onSubmit={handleCreate} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t('leaves.type')}</label>
                        <input required className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all" value={newType.name} onChange={e => setNewType({...newType, name: e.target.value})} placeholder="e.g. Annual Leave" />
                    </div>
                    <div className="flex items-center p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-200 dark:border-slate-600">
                        <input type="checkbox" id="isPaid" className="w-5 h-5 text-primary-600 border-slate-300 rounded focus:ring-primary-500 transition-all cursor-pointer" checked={newType.isPaid} onChange={e => setNewType({...newType, isPaid: e.target.checked})} />
                        <label htmlFor="isPaid" className="ml-3 block text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">{t('leaves.paid')}?</label>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t('leaves.daysAllowed')}</label>
                        <input type="number" required className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all" value={newType.daysAllowed} onChange={e => setNewType({...newType, daysAllowed: Number(e.target.value)})} />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700">{t('common.cancel')}</Button>
                        <Button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-lg shadow-primary-500/30">{t('common.save')}</Button>
                    </div>
                </form>
            </Modal>
        </Card>
    );
};

// --- NEW: Planning / Roster ---
const Planning: React.FC = () => {
    const { t } = useLanguage();
    // Simple mock roster
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const [users, setUsers] = useState<User[]>([]);
    
    useEffect(() => { Api.users.getAll().then(setUsers); }, []);

    return (
        <Card title={t('leaves.roster')} icon={<CalendarIcon className="w-5 h-5 text-purple-500" />} className="border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <table className="w-full text-sm text-center border-collapse">
                    <thead>
                        <tr>
                            <th className="text-left p-4 border-b border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-xs sticky left-0 z-10">{t('leaves.employee')}</th>
                            {days.map(d => <th key={d} className="p-4 border-b border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-xs last:border-r-0">{d}</th>)}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800">
                        {users.slice(0, 5).map(u => (
                            <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                                <td className="text-left p-4 border-b border-r border-slate-100 dark:border-slate-700 font-bold text-slate-900 dark:text-white sticky left-0 bg-white dark:bg-slate-800 group-hover:bg-slate-50 dark:group-hover:bg-slate-700/50 transition-colors flex items-center gap-3">
                                    <img src={u.avatarUrl} className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                                    {u.name}
                                </td>
                                {days.map((d, i) => (
                                    <td key={d} className="p-4 border-b border-r border-slate-100 dark:border-slate-700 last:border-r-0 relative">
                                        {i >= 5 ? 
                                            <span className="inline-flex items-center justify-center w-full h-full absolute inset-0 bg-slate-50/50 dark:bg-slate-900/30">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-md bg-white dark:bg-slate-800">OFF</span>
                                            </span> 
                                            : 
                                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-800/30 shadow-sm">Shift</span>
                                        }
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export const Leaves: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('my_leaves');
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, User>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  
  // Form Data
  const [formData, setFormData] = useState({ type: 'Annual', startDate: '', endDate: '', reason: '' });

  useEffect(() => {
      Api.leaves.getTypes().then(setLeaveTypes);
      const fetchLeaves = async () => {
        const [allLeaves, allUsers] = await Promise.all([Api.leaves.getAll(), Api.users.getAll()]);
        const uMap: any = {};
        allUsers.forEach(u => uMap[u.id] = u);
        setUsersMap(uMap);

        if(activeTab === 'my_leaves') {
            setLeaves(allLeaves.filter(l => l.userId === user?.id));
        } else if (activeTab === 'approval') {
            // Manager sees only dept, Admin/HR see all
            let filtered = allLeaves.filter(l => l.status === LeaveStatus.PENDING);
            if(user?.role === Role.MANAGER) {
                // Keep the manager logic for dept filtering, but access is granted via permission
                filtered = filtered.filter(l => uMap[l.userId]?.departmentId === user.departmentId);
            }
            setLeaves(filtered);
        }
      };
      fetchLeaves();
  }, [user, activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      await Api.leaves.create({ ...formData, userId: user?.id } as any);
      setIsModalOpen(false);
      // reload logic...
      const allLeaves = await Api.leaves.getAll();
      if(activeTab === 'my_leaves') {
          setLeaves(allLeaves.filter(l => l.userId === user?.id));
      }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <div className="relative z-10">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    <div className="p-2 bg-primary-500 rounded-xl text-white shadow-lg shadow-primary-500/30">
                        <FileText className="w-6 h-6" />
                    </div>
                    {t('leaves.title')}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg max-w-2xl">{t('leaves.subtitle')}</p>
            </div>
            <Button onClick={() => setIsModalOpen(true)} className="relative z-10 w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/30 rounded-xl py-3 px-6 font-bold transition-all hover:scale-105 active:scale-95">
                <Plus className="w-5 h-5 mr-2" /> {t('leaves.requestLeave')}
            </Button>
        </div>

        <div className="flex flex-wrap gap-1 bg-white dark:bg-slate-800 p-1.5 rounded-2xl w-full sm:w-fit border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto">
            <button onClick={() => setActiveTab('my_leaves')} className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeTab === 'my_leaves' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-primary-200 dark:ring-primary-800' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                {t('leaves.myLeaves')}
            </button>
            {hasPermission('leave.process') && 
                <button onClick={() => setActiveTab('approval')} className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeTab === 'approval' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-primary-200 dark:ring-primary-800' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                    {t('leaves.approvals')}
                </button>
            }
            {hasPermission('system.settings.view') && (
                <>
                    <button onClick={() => setActiveTab('planning')} className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeTab === 'planning' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-primary-200 dark:ring-primary-800' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                        {t('leaves.planning')}
                    </button>
                    <button onClick={() => setActiveTab('config')} className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeTab === 'config' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-primary-200 dark:ring-primary-800' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                        {t('leaves.config')}
                    </button>
                </>
            )}
        </div>

        {activeTab === 'config' && <LeaveConfig />}
        {activeTab === 'planning' && <Planning />}
        {(activeTab === 'my_leaves' || activeTab === 'approval') && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                {activeTab === 'approval' && <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs">{t('leaves.employee')}</th>}
                                <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs">{t('leaves.type')}</th>
                                <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs hidden sm:table-cell">{t('leaves.dates')}</th>
                                <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs hidden md:table-cell">{t('leaves.reason')}</th>
                                <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs">{t('leaves.status')}</th>
                                {activeTab === 'approval' && <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs text-right">{t('leaves.actions')}</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {leaves.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500 dark:text-slate-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                                <FileText className="w-8 h-8 text-slate-400" />
                                            </div>
                                            <p className="text-lg font-medium text-slate-900 dark:text-white">{t('leaves.noRequests')}</p>
                                            <p className="text-sm mt-1">No leave requests found for this category.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                leaves.map(l => (
                                    <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        {activeTab === 'approval' && (
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm">
                                                        {usersMap[l.userId]?.avatarUrl ? (
                                                            <img src={usersMap[l.userId]?.avatarUrl} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <UserIcon className="w-5 h-5" />
                                                        )}
                                                    </div>
                                                    <span className="font-bold text-slate-900 dark:text-white">{usersMap[l.userId]?.name}</span>
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border ${
                                                l.type === 'Annual' ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' :
                                                l.type === 'Sick' ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' :
                                                'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                            }`}>
                                                {l.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 hidden sm:table-cell">
                                            <div className="flex items-center text-slate-700 dark:text-slate-300 font-medium bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg w-fit border border-slate-100 dark:border-slate-700">
                                                <CalendarIcon className="w-3.5 h-3.5 mr-2 text-slate-400" />
                                                {l.startDate} <ArrowRight className="w-3 h-3 mx-2 text-slate-300" /> {l.endDate}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 max-w-xs truncate font-medium hidden md:table-cell" title={l.reason}>
                                            {l.reason}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={l.status === 'APPROVED' ? 'success' : l.status === 'REJECTED' ? 'danger' : 'warning'} className="px-3 py-1 shadow-sm">
                                                {l.status}
                                            </Badge>
                                        </td>
                                        {activeTab === 'approval' && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button size="sm" onClick={() => Api.leaves.updateStatus(l.id, LeaveStatus.APPROVED)} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-9 px-4 rounded-lg">
                                                        <Check className="w-4 h-4 mr-1.5" /> Approve
                                                    </Button>
                                                    <Button size="sm" variant="danger" onClick={() => Api.leaves.updateStatus(l.id, LeaveStatus.REJECTED)} className="shadow-sm h-9 px-4 rounded-lg">
                                                        <X className="w-4 h-4 mr-1.5" /> Reject
                                                    </Button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('leaves.requestLeave')}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t('leaves.type')}</label>
                    <div className="relative">
                        <select 
                            className="w-full pl-4 pr-10 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none appearance-none transition-all shadow-sm" 
                            onChange={e => setFormData({...formData, type: e.target.value})}
                        >
                            {leaveTypes.map(lt => <option key={lt.id} value={lt.name}>{lt.name}</option>)}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Start Date</label>
                        <input type="date" required className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all shadow-sm" onChange={e => setFormData({...formData, startDate: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">End Date</label>
                        <input type="date" required className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all shadow-sm" onChange={e => setFormData({...formData, endDate: e.target.value})} />
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t('leaves.reason')}</label>
                    <textarea 
                        placeholder="Please describe the reason for your leave..." 
                        rows={4}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none shadow-sm" 
                        onChange={e => setFormData({...formData, reason: e.target.value})} 
                    />
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700">{t('common.cancel')}</Button>
                    <Button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-lg shadow-primary-500/30 px-6">{t('leaves.submit')}</Button>
                </div>
            </form>
        </Modal>
    </div>
  );
};
