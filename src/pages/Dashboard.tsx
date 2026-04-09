

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Card } from '../components/ui/Card';
import { Role, User } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Clock, Calendar, AlertCircle, Briefcase, CreditCard, UserPlus, FileCheck, Send, Smile, Bell, Zap, Gift, PartyPopper, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { Api } from '../services/api';
import { userService } from '../services/userService';
import { useNavigate } from 'react-router-dom';
import { formatTime } from '../utils';

// Isolated Clock Component for Performance
const LiveClock = React.memo(({ className }: { className?: string }) => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    return <span className={className}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>;
});

const QuickActionCard = React.memo(({ icon: Icon, title, desc, onClick, color }: any) => (
    <button 
        onClick={onClick}
        className="flex flex-col items-start p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left group w-full relative overflow-hidden"
    >
        <div className={`absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br ${color.replace('bg-', 'from-')}/10 to-transparent rounded-bl-full -mr-8 sm:-mr-10 -mt-8 sm:-mt-10 transition-transform group-hover:scale-110 duration-500`}></div>
        <div className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 ${color} text-white shadow-lg shadow-primary-500/20 group-hover:scale-110 transition-transform duration-300 relative z-10`}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors text-base sm:text-lg relative z-10">{title}</h4>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium relative z-10">{desc}</p>
        <div className="mt-3 sm:mt-4 p-1.5 sm:p-2 bg-slate-50 dark:bg-slate-700/50 rounded-full group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors">
            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 group-hover:text-primary-500 transition-colors" />
        </div>
    </button>
));

const BirthdayWidget = React.memo(({ users }: { users: User[] }) => {
    const currentMonth = new Date().getMonth();
    const today = new Date().getDate();

    const birthdays = useMemo(() => {
        const bdays = users.filter(u => {
            if(!u.birthDate) return false;
            return new Date(u.birthDate).getMonth() === currentMonth;
        });
        bdays.sort((a,b) => new Date(a.birthDate!).getDate() - new Date(b.birthDate!).getDate());
        return bdays;
    }, [users, currentMonth]);

    return (
        <Card title={`Birthdays - ${new Date().toLocaleDateString('en-US', {month: 'long'})}`} icon={<Gift className="w-5 h-5 text-pink-500" />}>
            {birthdays.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center text-slate-500">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full mb-3">
                        <Gift className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium">No birthdays this month.</p>
                </div>
            ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                    {birthdays.map(u => {
                        const day = new Date(u.birthDate!).getDate();
                        const isToday = day === today;
                        return (
                            <div key={u.id} className={`flex items-center gap-4 p-3 rounded-2xl transition-all ${isToday ? 'bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border border-pink-100 dark:border-pink-800 shadow-sm' : 'hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'}`}>
                                <div className="relative">
                                    <img src={u.avatarUrl} className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-sm" />
                                    {isToday && <div className="absolute -top-1 -right-1 bg-yellow-400 text-white rounded-full p-1 shadow-sm animate-bounce"><PartyPopper className="w-3 h-3" /></div>}
                                </div>
                                <div className="flex-1">
                                    <p className={`text-sm font-bold ${isToday ? 'text-pink-700 dark:text-pink-300' : 'text-slate-800 dark:text-slate-200'}`}>{u.name}</p>
                                    <p className="text-xs text-slate-500 font-medium">{u.position}</p>
                                </div>
                                <div className={`text-xs font-bold px-3 py-1.5 rounded-xl ${isToday ? 'bg-white/80 text-pink-600 shadow-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                                    {isToday ? 'Today!' : `${new Date().toLocaleDateString('en-US', {month:'short'})} ${day}`}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
});

const ManagementDashboard = React.memo(() => {
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [attendanceRange, setAttendanceRange] = useState<'Weekly' | 'Monthly'>('Weekly');
    const { t } = useLanguage();
    const { theme } = useTheme();
    const { user, hasPermission } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [data, allUsers] = await Promise.all([
                    Api.reports.getStats(),
                    userService.getAll()
                ]);
                setStats(data);
                setUsers(allUsers);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const chartColors = useMemo(() => ({
        text: theme === 'dark' ? '#94a3b8' : '#64748b',
        grid: theme === 'dark' ? '#334155' : '#e2e8f0',
        tooltipBg: theme === 'dark' ? '#1e293b' : '#ffffff',
        tooltipBorder: theme === 'dark' ? '#475569' : '#e2e8f0',
        tooltipText: theme === 'dark' ? '#f8fafc' : '#0f172a'
    }), [theme]);

    const weeklyAttendance = useMemo(() => [
        { name: 'Mon', present: 25, absent: 5 },
        { name: 'Tue', present: 28, absent: 2 },
        { name: 'Wed', present: 27, absent: 3 },
        { name: 'Thu', present: 24, absent: 6 },
        { name: 'Fri', present: 29, absent: 1 },
    ], []);

    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

    if (loading || !stats) return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
            {[1,2,3,4].map(i => <div key={i} className="h-40 bg-slate-200 dark:bg-slate-700 rounded-3xl"></div>)}
        </div>
    );

    const { summary, departmentDistribution } = stats;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Quick Actions Row */}
            <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                   <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-600 dark:text-yellow-400">
                        <Zap className="w-4 h-4" />
                   </div>
                   Quick Actions
                </h2>
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {hasPermission('hr.employee.create') && (
                        <QuickActionCard icon={UserPlus} title="Add Employee" desc="Onboard new staff" color="bg-primary-500" onClick={() => navigate('/employees/new')} />
                    )}
                    {hasPermission('leave.process') && (
                        <QuickActionCard icon={FileCheck} title="Review Leaves" desc={`${summary.pendingLeaves} Pending`} color="bg-amber-500" onClick={() => navigate('/leaves')} />
                    )}
                    {hasPermission('payroll.run') && (
                        <QuickActionCard icon={CreditCard} title="Run Payroll" desc="Process salaries" color="bg-emerald-500" onClick={() => navigate('/payroll')} />
                    )}
                    {hasPermission('chat.access') && (
                        <QuickActionCard icon={Send} title="Announcements" desc="Send alerts" color="bg-rose-500" onClick={() => navigate('/chat')} />
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
                {/* Stats Overview */}
                <div className="xl:col-span-2 space-y-4 sm:space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {hasPermission('hr.employee.view') && (
                            <div onClick={() => navigate('/employees')} className="cursor-pointer bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden">
                                <div className="absolute right-0 top-0 w-24 h-24 sm:w-32 sm:h-32 bg-primary-50 dark:bg-primary-900/10 rounded-full -mr-6 sm:-mr-10 -mt-6 sm:-mt-10 transition-transform group-hover:scale-110 duration-500"></div>
                                <div className="flex items-start justify-between relative z-10">
                                    <div>
                                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{t('dashboard.totalEmployees')}</p>
                                        <h3 className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">{summary.totalEmployees}</h3>
                                    </div>
                                    <div className="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-xl text-primary-600 dark:text-primary-400 shadow-sm group-hover:scale-110 transition-transform">
                                        <Users className="w-6 h-6" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 w-fit px-2.5 py-1 rounded-full">
                                    <span className="flex items-center gap-1"><UserPlus className="w-3 h-3" /> +2 this month</span>
                                </div>
                            </div>
                        )}
                        <div onClick={() => navigate('/attendance')} className="cursor-pointer bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden">
                            <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-50 dark:bg-emerald-900/10 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-500"></div>
                            <div className="flex items-start justify-between relative z-10">
                                <div>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{t('dashboard.presentToday')}</p>
                                    <div className="flex items-baseline gap-2">
                                        <h3 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">{summary.presentToday}</h3>
                                        <span className="text-base text-slate-400 font-semibold">/ {summary.totalEmployees}</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400 shadow-sm group-hover:scale-110 transition-transform">
                                    <Clock className="w-6 h-6" />
                                </div>
                            </div>
                             <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 w-fit px-2.5 py-1 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live Updates
                            </div>
                        </div>
                    </div>

                    {/* Attendance Chart */}
                    <Card title={t('dashboard.attendanceTrend')} icon={<Calendar className="w-5 h-5 text-primary-500" />} action={
                            <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
                                <button className={`px-4 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-slate-600 text-primary-600 dark:text-primary-400 shadow-sm transition-all`}>Weekly</button>
                            </div>
                        }>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyAttendance} barSize={40}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: chartColors.text, fontSize: 12, fontWeight: 500}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: chartColors.text, fontSize: 12, fontWeight: 500}} />
                                    <Tooltip 
                                        cursor={{fill: theme === 'dark' ? '#334155' : '#f1f5f9', opacity: 0.4}}
                                        contentStyle={{ 
                                            backgroundColor: chartColors.tooltipBg, 
                                            borderColor: chartColors.tooltipBorder, 
                                            color: chartColors.tooltipText,
                                            borderRadius: '12px',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                            padding: '12px'
                                        }} 
                                    />
                                    <Bar dataKey="present" fill="#4f46e5" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>

                {/* Right Sidebar Widgets */}
                <div className="space-y-6">
                    {hasPermission('hr.departments.view') && (
                        <Card title={t('dashboard.deptDist')} icon={<Briefcase className="w-5 h-5 text-purple-500" />}>
                            <div className="h-56 flex flex-col justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={departmentDistribution} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" cornerRadius={5}>
                                            {departmentDistribution.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={theme === 'dark' ? '#1e293b' : '#fff'} strokeWidth={3} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: chartColors.tooltipBg, 
                                                borderColor: chartColors.tooltipBorder, 
                                                color: chartColors.tooltipText,
                                                borderRadius: '12px',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                            }} 
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex flex-wrap gap-2 justify-center mt-4 px-2">
                                    {departmentDistribution.slice(0,4).map((entry: any, index: number) => (
                                        <div key={entry.name} className="flex items-center text-xs font-medium bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
                                            <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                            <span className="text-slate-600 dark:text-slate-300">{entry.name} <span className="text-slate-400 ml-1">({entry.value})</span></span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    )}
                    
                    <BirthdayWidget users={users} />
                    {hasPermission('hr.employee.view') && <TeamAvailability users={users} />}
                </div>
            </div>
        </div>
    );
});

// Manager Specific Widget: Team Availability
const TeamAvailability = React.memo(({ users }: { users: User[] }) => {
    const { user } = useAuth();

    const team = useMemo(() => {
        if(!user) return [];
        return users.filter(u => u.departmentId === user.departmentId && u.id !== user.id).slice(0, 5);
    }, [users, user]);

    if(!users.length) return <div className="animate-pulse h-40 bg-slate-200 dark:bg-slate-700 rounded-3xl"></div>;

    return (
        <Card title="Team Availability" icon={<Users className="w-5 h-5 text-blue-500" />}>
            <div className="space-y-4">
                {team.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <img src={member.avatarUrl} className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">{member.name}</p>
                                <p className="text-xs text-slate-500 font-medium">{member.position}</p>
                            </div>
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Working
                        </span>
                    </div>
                ))}
                {team.length === 0 && <p className="text-sm text-slate-500 text-center py-6 font-medium">No team members assigned.</p>}
            </div>
        </Card>
    );
});

const EmployeeDashboard = React.memo(() => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [attendance, setAttendance] = useState<any>(null);
    const [users, setUsers] = useState<User[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        if(user) {
            Promise.all([
                Api.attendance.getToday(),
                userService.getAll()
            ]).then(([recs, allUsers]) => {
                const myRec = recs.find(r => r.userId === user.id);
                setAttendance(myRec);
                setUsers(allUsers);
            });
        }
    }, [user]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500"><Smile className="w-48 h-48" /></div>
                        <div className="p-8 bg-gradient-to-r from-primary-600 to-primary-700 text-white relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]"></div>
                            <div className="relative z-10">
                                <h2 className="text-3xl font-bold mb-2">{t('dashboard.welcomeBack')}, {user?.name.split(' ')[0]}!</h2>
                                <p className="text-primary-100 text-lg font-medium">Ready to make today productive?</p>
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-slate-400" /> Today's Status
                                </h3>
                                <div className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-xl">
                                    <LiveClock className="text-sm font-mono font-bold text-slate-600 dark:text-slate-300" />
                                </div>
                            </div>
                            {attendance ? (
                                attendance.clockOut ? (
                                    <div className="flex items-center gap-5 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                                        <div className="p-3 bg-slate-200 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 shadow-sm"><CheckCircle2 className="w-8 h-8" /></div>
                                        <div>
                                            <p className="text-lg font-bold text-slate-800 dark:text-slate-200">Checked Out</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">at {formatTime(attendance.clockOut)}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                                        <div className="flex items-center gap-5">
                                            <div className="p-3 bg-emerald-100 dark:bg-emerald-800 rounded-full text-emerald-600 dark:text-emerald-300 shadow-sm"><CheckCircle2 className="w-8 h-8" /></div>
                                            <div>
                                                <p className="text-lg font-bold text-emerald-800 dark:text-emerald-200">Checked In</p>
                                                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">at {formatTime(attendance.clockIn)}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => navigate('/attendance')}
                                            className="w-full sm:w-auto px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold rounded-xl shadow-sm transition-colors"
                                        >
                                            Clock Out
                                        </button>
                                    </div>
                                )
                            ) : (
                                <div className="flex items-center gap-5 bg-amber-50 dark:bg-amber-900/20 p-6 rounded-2xl border border-amber-100 dark:border-amber-800/50">
                                    <div className="p-3 bg-amber-100 dark:bg-amber-800 rounded-full text-amber-600 dark:text-amber-300 shadow-sm"><AlertCircle className="w-8 h-8" /></div>
                                    <div>
                                        <p className="text-lg font-bold text-amber-800 dark:text-amber-200">Not Checked In</p>
                                        <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Shift starts at {user?.shiftStart}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <Card title="My Tasks" icon={<FileCheck className="w-5 h-5 text-blue-500" />}>
                        <div className="flex flex-col items-center justify-center h-56 text-slate-400 text-sm bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                            <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-sm mb-3">
                                <CheckCircle2 className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="font-medium">All caught up! No pending tasks.</p>
                        </div>
                    </Card>
                </div>

                <div className="space-y-8">
                    <BirthdayWidget users={users} />
                </div>
             </div>
        </div>
    );
});

export const Dashboard: React.FC = () => {
    const { hasPermission } = useAuth();
    if (hasPermission('dashboard.view')) {
        return <ManagementDashboard />;
    }
    return <EmployeeDashboard />;
};

