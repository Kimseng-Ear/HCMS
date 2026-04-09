import React, { useEffect, useState, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Api } from '../services/api';
import { User, Role, Department } from '../types';
import { Plus, Search, Pencil, Trash2, Mail, Phone, Briefcase, ArrowUpDown, ArrowUp, ArrowDown, Copy, ChevronUp, ChevronDown, CreditCard, MapPin, User as UserIcon, Calendar, Building2 } from 'lucide-react';
import { formatCurrency } from '../utils';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

// 1. PERFORMANCE: Memoized Row Component (Desktop)
const EmployeeRow = React.memo(({ emp, expandedId, toggleRow, getDepartmentName, openEditPage, handleDelete, hasRole, showToast, t }: any) => {
    const isExpanded = expandedId === emp.id;

    const handleCopyId = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(emp.id);
        showToast(`${t('employees.details.copyId')}: ${emp.id}`, 'success');
    };

    return (
        <>
            <tr className={`transition-all cursor-pointer border-b border-slate-100 dark:border-slate-800 group ${isExpanded ? 'bg-primary-50/50 dark:bg-primary-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`} onClick={() => toggleRow(emp.id)}>
                <td className="px-6 py-4">
                    <div 
                        onClick={handleCopyId}
                        className="group/id flex items-center w-fit gap-2 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-mono text-xs cursor-pointer hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 dark:hover:border-primary-800 transition-all shadow-sm"
                        title="Click to copy ID"
                    >
                        <span className="truncate max-w-[80px] font-bold">{emp.id}</span>
                        <Copy className="w-3 h-3 opacity-0 group-hover/id:opacity-100 transition-opacity" />
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <img src={emp.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-800 shadow-sm group-hover:scale-105 transition-transform" />
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${emp.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{emp.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{emp.email}</p>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4"><span className="text-slate-700 dark:text-slate-300 capitalize font-medium bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-xs border border-slate-200 dark:border-slate-700">{emp.position}</span></td>
                <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                        {getDepartmentName(emp.departmentId)}
                    </span>
                </td>
                <td className="px-6 py-4"><Badge variant="success" className="shadow-sm">{t('common.active')}</Badge></td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-xs font-medium">{new Date(emp.joinDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                    <div className={`p-2 rounded-full transition-colors inline-block ${isExpanded ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'text-slate-400 group-hover:bg-slate-100 dark:group-hover:bg-slate-700'}`}>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                </td>
            </tr>
            {isExpanded && (
                <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                    <td colSpan={7} className="px-6 py-6 border-b border-slate-100 dark:border-slate-700 shadow-inner whitespace-normal">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <img src={emp.avatarUrl} alt="" className="w-20 h-20 rounded-full border-4 border-white dark:border-slate-700 shadow-md object-cover" />
                                    <div>
                                        <h3 className="font-bold text-xl text-slate-900 dark:text-white">{emp.name}</h3>
                                        <div className="flex gap-2 mt-2"><Badge variant="info" className="shadow-sm">{emp.role}</Badge></div>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                                        <UserIcon className="w-3.5 h-3.5" /> {t('employees.details.contact')}
                                    </h4>
                                    <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 group p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                                        <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <span className="font-medium">{emp.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 group p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                                        <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <span className="font-medium">{emp.phone || t('common.noPhone')}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm h-full flex flex-col">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-2 shadow-sm">
                                        <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    {t('employees.details.jobInfo')}
                                </h4>
                                <div className="space-y-6 flex-1">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 uppercase font-bold tracking-wider">{t('employees.table.id')}</p>
                                            <p className="font-bold font-mono text-sm text-slate-900 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg inline-block border border-slate-200 dark:border-slate-600">{emp.id}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 uppercase font-bold tracking-wider">{t('employees.table.joined')}</p>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                <p className="font-bold text-sm text-slate-900 dark:text-slate-200">{new Date(emp.joinDate).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 uppercase font-bold tracking-wider">{t('employees.table.department')}</p>
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                                <p className="font-bold text-sm text-slate-900 dark:text-slate-200">{getDepartmentName(emp.departmentId)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-4">
                                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                                        <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg mr-2 shadow-sm">
                                            <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        {t('employees.details.compensation')}
                                    </h4>
                                    <div className="flex justify-between items-center mb-2 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700">
                                        <span className="text-sm text-slate-600 dark:text-slate-400 font-bold">{t('employees.details.basicSalary')}</span>
                                        <span className="font-bold text-xl text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(emp.salary || 0)}</span>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-auto pt-4 border-t border-slate-100 dark:border-slate-700">
                                    <Button size="sm" variant="outline" onClick={(e) => openEditPage(emp.id, e)} className="hover:bg-slate-100 dark:hover:bg-slate-700 font-medium">
                                        <Pencil className="w-4 h-4 mr-2" /> {t('common.edit')}
                                    </Button>
                                    {hasRole([Role.ADMIN, Role.HR]) && (
                                        <Button size="sm" variant="danger" onClick={(e) => handleDelete(emp.id, e)} className="shadow-red-500/20">
                                            <Trash2 className="w-4 h-4 mr-2" /> {t('common.delete')}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
});

// Mobile Card Component
const MobileEmployeeCard = React.memo(({ emp, getDepartmentName, openEditPage, handleDelete, hasRole, t }: any) => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                    <img src={emp.avatarUrl} alt="" className="w-14 h-14 rounded-full object-cover bg-slate-100 dark:bg-slate-700 border-2 border-white dark:border-slate-600 shadow-sm" />
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-lg">{emp.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md inline-block mt-1">{emp.position}</p>
                    </div>
                </div>
                <Badge variant="success" className="shadow-sm">{t('common.active')}</Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-xs text-slate-500 mb-1 uppercase font-bold tracking-wider">{t('employees.table.id')}</p>
                    <p className="font-mono font-bold text-slate-700 dark:text-slate-300">{emp.id}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-xs text-slate-500 mb-1 uppercase font-bold tracking-wider">{t('employees.table.department')}</p>
                    <p className="font-bold truncate text-slate-700 dark:text-slate-300">{getDepartmentName(emp.departmentId)}</p>
                </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-5 px-1 font-medium">
                <Mail className="w-3.5 h-3.5 text-primary-500" /> {emp.email}
            </div>

            <div className="flex gap-3 border-t border-slate-100 dark:border-slate-700 pt-4">
                <Button size="sm" variant="outline" onClick={(e) => openEditPage(emp.id, e)} className="flex-1 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold">
                    <Pencil className="w-3.5 h-3.5 mr-2" /> {t('common.edit')}
                </Button>
                {hasRole([Role.ADMIN, Role.HR]) && (
                    <button 
                        onClick={(e) => handleDelete(emp.id, e)}
                        className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-xl transition-colors border border-red-100 dark:border-red-900/30 shadow-sm"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
});

export const Employees: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // PERFORMANCE: Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  useEffect(() => {
      const handler = setTimeout(() => {
          setDebouncedSearch(searchQuery);
      }, 300);
      return () => clearTimeout(handler);
  }, [searchQuery]);
  
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersData, deptData] = await Promise.all([Api.users.getAll(), Api.departments.getAll()]);
            setEmployees(usersData);
            setDepartments(deptData);
        } catch (e) {
            showToast("Failed to fetch employees", "error");
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  const openAddPage = React.useCallback(() => navigate('/employees/new'), [navigate]);
  const openEditPage = React.useCallback((id: string, e?: React.MouseEvent) => { 
      e?.stopPropagation(); 
      navigate(`/employees/edit/${id}`); 
  }, [navigate]);
  
  const handleDelete = React.useCallback(async (id: string, e?: React.MouseEvent) => { 
      e?.stopPropagation(); 
      if (window.confirm(t('employees.confirmDelete'))) { 
          setLoading(true); 
          await Api.users.delete(id); 
          if (expandedId === id) setExpandedId(null); 
          const d = await Api.users.getAll(); 
          setEmployees(d); 
          setLoading(false); 
      } 
  }, [expandedId, t]);

  const getDepartmentName = React.useCallback((id: string) => departments.find(d => d.id === id)?.name || t('common.unknown'), [departments, t]);
  const handleSort = React.useCallback((key: string) => { setSortConfig(prev => ({ key, direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc' })); }, []);
  const getSortIcon = React.useCallback((key: string) => (!sortConfig || sortConfig.key !== key) ? <ArrowUpDown className="w-3 h-3 text-slate-400 ml-1" /> : sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-primary-600 ml-1" /> : <ArrowDown className="w-3 h-3 text-primary-600 ml-1" />, [sortConfig]);
  const toggleRow = React.useCallback((id: string) => setExpandedId(prev => prev === id ? null : id), []);

  const processedEmployees = useMemo(() => {
    let result = [...employees];
    // Filtering uses DEBOUNCED query for performance
    result = result.filter(emp => {
        const search = debouncedSearch.toLowerCase();
        const matchesSearch = emp.name.toLowerCase().includes(search) || 
                              emp.email.toLowerCase().includes(search) ||
                              emp.id.toString().toLowerCase().includes(search);
        const matchesRole = user?.role === Role.MANAGER ? emp.departmentId === user.departmentId : true;
        return matchesSearch && matchesRole;
    });
    if (sortConfig) {
        result.sort((a, b) => {
            let aValue: any = a[sortConfig.key as keyof User];
            let bValue: any = b[sortConfig.key as keyof User];

            if (sortConfig.key === 'departmentId') {
                aValue = getDepartmentName(a.departmentId).toLowerCase();
                bValue = getDepartmentName(b.departmentId).toLowerCase();
            } else if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }
    return result;
  }, [employees, debouncedSearch, sortConfig, user, getDepartmentName]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="relative z-10">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{t('employees.title')}</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-lg">{t('employees.subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center relative z-10">
            <div className="relative w-full sm:w-72 group">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                <input 
                    type="text" 
                    placeholder={t('employees.searchPlaceholder')} 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all shadow-sm focus:bg-white dark:focus:bg-slate-800" 
                />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                {hasRole([Role.ADMIN, Role.HR]) && (
                    <Button onClick={openAddPage} className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/30 rounded-xl py-2.5 font-bold">
                        <Plus className="w-4 h-4 mr-2" /> {t('employees.newEmployee')}
                    </Button>
                )}
            </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">{t('common.loading')}</p>
        </div>
      ) : (
          <>
            {/* Desktop View: Table */}
            <div className="hidden md:block bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs cursor-pointer hover:text-primary-600 transition-colors" onClick={() => handleSort('id')}>
                                    <div className="flex items-center gap-2">{t('employees.table.id')} {getSortIcon('id')}</div>
                                </th>
                                <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs cursor-pointer hover:text-primary-600 transition-colors" onClick={() => handleSort('name')}>
                                    <div className="flex items-center gap-2">{t('employees.table.employee')} {getSortIcon('name')}</div>
                                </th>
                                <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs cursor-pointer hover:text-primary-600 transition-colors" onClick={() => handleSort('position')}>
                                    <div className="flex items-center gap-2">{t('employees.table.role')} {getSortIcon('position')}</div>
                                </th>
                                <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs cursor-pointer hover:text-primary-600 transition-colors" onClick={() => handleSort('departmentId')}>
                                    <div className="flex items-center gap-2">{t('employees.table.department')} {getSortIcon('departmentId')}</div>
                                </th>
                                <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs">{t('employees.table.status')}</th>
                                <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs cursor-pointer hover:text-primary-600 transition-colors" onClick={() => handleSort('joinDate')}>
                                    <div className="flex items-center gap-2">{t('employees.table.joined')} {getSortIcon('joinDate')}</div>
                                </th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {processedEmployees.map(emp => (
                                <EmployeeRow key={emp.id} emp={emp} expandedId={expandedId} toggleRow={toggleRow} getDepartmentName={getDepartmentName} openEditPage={openEditPage} handleDelete={handleDelete} hasRole={hasRole} showToast={showToast} t={t} />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile View: Cards */}
            <div className="grid grid-cols-1 gap-5 md:hidden">
                {processedEmployees.map(emp => (
                    <MobileEmployeeCard key={emp.id} emp={emp} getDepartmentName={getDepartmentName} openEditPage={openEditPage} handleDelete={handleDelete} hasRole={hasRole} t={t} />
                ))}
            </div>
          </>
      )}
    </div>
  );
};