import React, { useEffect, useState, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Api } from '../services/api';
import { formatCurrency } from '../utils';
import { useTheme } from '../context/ThemeContext';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';

export const Reports: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { theme, colorTheme } = useTheme();

  useEffect(() => {
    Api.reports.getStats().then(data => {
        setStats(data);
        setLoading(false);
    });
  }, []);

  const chartColors = useMemo(() => ({
      text: theme === 'dark' ? '#94a3b8' : '#64748b',
      grid: theme === 'dark' ? '#334155' : '#e2e8f0',
      tooltipBg: theme === 'dark' ? '#1e293b' : '#ffffff',
      tooltipBorder: theme === 'dark' ? '#475569' : '#e2e8f0',
      tooltipText: theme === 'dark' ? '#f8fafc' : '#0f172a',
      primary: {
          blue: '#3b82f6',
          violet: '#8b5cf6',
          emerald: '#10b981',
          rose: '#f43f5e',
          amber: '#f59e0b'
      }[colorTheme] || '#3b82f6'
  }), [theme, colorTheme]);

  const COLORS = [chartColors.primary, '#10b981', '#f59e0b', '#ef4444'];

  if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading analytics...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics & Reports</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Key metrics and performance indicators</p>
        </div>
        <div className="flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
            <button className="px-3 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-200">6 Months</button>
            <button className="px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">Yearly</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center transition-colors">
            <div className="p-3 rounded-full bg-primary-50 dark:bg-primary-900/30 mr-4">
                <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Headcount</p>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">32</h3>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" /> +12% Growth
                </p>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center transition-colors">
            <div className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-900/30 mr-4">
                <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Monthly Payroll</p>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">$55,000</h3>
                <p className="text-xs text-slate-400 mt-1">Last run: June 2023</p>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center transition-colors">
            <div className="p-3 rounded-full bg-amber-50 dark:bg-amber-900/30 mr-4">
                <Calendar className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Avg. Leave Balance</p>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">14 Days</h3>
                <p className="text-xs text-slate-400 mt-1">Per employee</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Headcount Growth">
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.headcountHistory}>
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.1}/>
                                <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: chartColors.text}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: chartColors.text}} />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: chartColors.tooltipBg, 
                                borderColor: chartColors.tooltipBorder, 
                                color: chartColors.tooltipText,
                                borderRadius: '8px' 
                            }} 
                        />
                        <Area type="monotone" dataKey="count" stroke={chartColors.primary} strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>

        <Card title="Payroll History">
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.payrollHistory}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: chartColors.text}} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} tick={{fill: chartColors.text}} />
                        <Tooltip 
                            formatter={(value) => formatCurrency(value as number)} 
                            contentStyle={{ 
                                backgroundColor: chartColors.tooltipBg, 
                                borderColor: chartColors.tooltipBorder, 
                                color: chartColors.tooltipText,
                                borderRadius: '8px' 
                            }} 
                        />
                        <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>

        <Card title="Leave Distribution by Type">
            <div className="h-80 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={stats.leaveDistribution}
                            innerRadius={80}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {stats.leaveDistribution.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={theme === 'dark' ? '#1e293b' : '#fff'} strokeWidth={2} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: chartColors.tooltipBg, 
                                borderColor: chartColors.tooltipBorder, 
                                color: chartColors.tooltipText,
                                borderRadius: '8px' 
                            }} 
                        />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </Card>

        <Card title="Cost Center Allocation">
             <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={stats.departmentCosts}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartColors.grid} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{fill: chartColors.text}} />
                        <Tooltip 
                            formatter={(value) => formatCurrency(value as number)} 
                            contentStyle={{ 
                                backgroundColor: chartColors.tooltipBg, 
                                borderColor: chartColors.tooltipBorder, 
                                color: chartColors.tooltipText,
                                borderRadius: '8px' 
                            }} 
                        />
                        <Bar dataKey="value" fill={chartColors.primary} radius={[0, 4, 4, 0]} barSize={30} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
      </div>
    </div>
  );
};