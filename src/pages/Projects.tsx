import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input, Select, Textarea } from '../components/ui/FormFields';
import { Api } from '../services/api';
import { Task, TaskStatus, User, Role } from '../types';
import { 
  Calendar, CheckCircle2, Clock, Grid, LineChart, ListChecks, 
  Pencil, Plus, Settings, Trash2, Users, Zap, Search, ChevronLeft, ChevronRight, BarChart2, Edit2,
  AlertCircle, Flag, Tag, X, Target, UserCheck, Lock, Layout
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';
import { projectService } from '../services/projectService';
import { userService } from '../services/userService';

type ProjectStatusFilter = 'ALL' | 'ACTIVE' | 'PLANNING' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
type DetailTab = 'tasks' | 'gantt' | 'team' | 'settings';
type MainTab = 'overview' | 'list' | 'timeline';

interface ProjectDetailsPayload {
  project: any;
  tasks: Task[];
  members: Array<{ userId: string; role: string; allocation: number; user?: User | null }>;
  milestones: Array<{ id: string; title: string; dueDate: string; completed: boolean }>;
}

export const Projects: React.FC = () => {
  const { showToast } = useToast();
  const { user: currentUser, hasPermission } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>('ALL');
  const [mainTab, setMainTab] = useState<MainTab>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [ganttMode, setGanttMode] = useState<'week' | 'month' | 'quarter'>('month');
  const [detailsTab, setDetailsTab] = useState<DetailTab>('tasks');
  const [details, setDetails] = useState<ProjectDetailsPayload | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigneeId: '',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    estimatedHours: 0,
    status: TaskStatus.TODO,
    progress: 0,
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
  });
  const [taskErrors, setTaskErrors] = useState<Record<string, string>>({});
  const [newMember, setNewMember] = useState({ userId: '', role: '', allocation: 100 });
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    status: 'PLANNING',
    startDate: new Date().toISOString().split('T')[0],
    deadline: '',
    departmentId: '',
    leadId: '',
    priority: 'MEDIUM'
  });

  const loadProjects = async () => {
    const data = projectService.getAll(statusFilter === 'ALL' ? undefined : statusFilter);
    setProjects(data || []);
  };

  useEffect(() => {
    loadProjects();
  }, [statusFilter]);

  useEffect(() => {
    const data = userService.getAll();
    setEmployees(data || []);
  }, []);

  const openDetails = async (projectId: string) => {
    try {
      const project = await projectService.getById(projectId);
      if (!project) throw new Error('Project not found');
      
      const payload = { project };
      const tasks = taskService.getByProject(projectId);
      
      setDetails({ 
        ...project,
        project: project,
        tasks: tasks,
        members: (project as any).members || [],
        milestones: (project as any).milestones || [] 
      } as any);
      setDetailsTab('tasks');
      setSelectedProjectId(projectId);
    } catch (err) {
      showToast('Failed to load project details', 'error');
    }
  };

  const handleCreateProject = async () => {
    await projectService.create(createForm as any);
    setIsCreateOpen(false);
    setCreateForm({
      title: '',
      description: '',
      status: 'PLANNING',
      startDate: new Date().toISOString().split('T')[0],
      deadline: '',
      departmentId: '',
      leadId: '',
      priority: 'MEDIUM'
    });
    showToast('Project created successfully', 'success');
    await loadProjects();
  };

  const validateTask = () => {
    const errs: Record<string, string> = {};
    if (!newTask.title.trim()) errs.title = 'Task title is required';
    if (!newTask.dueDate) errs.dueDate = 'Due date is required';
    if (newTask.startDate && newTask.dueDate && newTask.startDate > newTask.dueDate)
      errs.dueDate = 'Due date must be after start date';
    if (newTask.estimatedHours < 0) errs.estimatedHours = 'Cannot be negative';
    setTaskErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const resetTaskForm = () => {
    setNewTask({
      title: '',
      description: '',
      assigneeId: '',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      estimatedHours: 0,
      status: TaskStatus.TODO,
      progress: 0,
      priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    });
    setTaskErrors({});
  };

  const addTask = async () => {
    if (!details?.project?.id) {
      showToast('No project selected', 'error');
      return;
    }
    if (!validateTask()) return;

    setIsTaskSubmitting(true);
    try {
      await taskService.create({
        ...newTask,
        projectId: details.project.id,
        creatorId: currentUser?.id || 'u-1',
        loggedHours: 0,
        dependencies: [],
        subtasks: [],
        comments: []
      } as any);

      await openDetails(details.project.id);
      resetTaskForm();
      setIsTaskModalOpen(false);
      showToast('Task created successfully!', 'success');
      await loadProjects();
    } catch (err: any) {
      showToast(err?.message || 'Failed to create task. Please try again.', 'error');
    } finally {
      setIsTaskSubmitting(false);
    }
  };

  const updateTaskStatus = async (task: Task, status: TaskStatus) => {
    await taskService.update({ ...task, status });
    if (!details?.project?.id) return;
    await openDetails(details.project.id);
    await loadProjects();
  };

  const handleEditTask = (task: Task) => {
    setEditingTask({ ...task });
    setIsEditTaskModalOpen(true);
  };

  const updateTask = async () => {
    if (!details?.project?.id || !editingTask) return;
    if (!editingTask.title.trim()) {
      showToast('Task title is required', 'error');
      return;
    }

    setIsTaskSubmitting(true);
    try {
      await taskService.update(editingTask);
      await openDetails(details.project.id);
      setIsEditTaskModalOpen(false);
      setEditingTask(null);
      showToast('Task updated successfully!', 'success');
      await loadProjects();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update task.', 'error');
    } finally {
      setIsTaskSubmitting(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('⚠️ WARNING: This will permanently delete the task and all associated data. This action cannot be undone.\n\nAre you sure you want to proceed?')) return;
    try {
      await taskService.delete(taskId);
      if (details?.project?.id) {
        await openDetails(details.project.id);
        await loadProjects();
      }
      showToast('Task deleted successfully', 'success');
    } catch (err) {
      showToast('Failed to delete task', 'error');
    }
  };

  const addTeamMember = async () => {
    if (!details?.project?.id || !newMember.userId || !newMember.role) return;
    const updatedProject = {
      ...details.project,
      members: [...( (details.project as any).members || []), newMember]
    };
    await projectService.update(updatedProject);
    await openDetails(details.project.id);
    setNewMember({ userId: '', role: '', allocation: 100 });
  };

  const deleteProject = async (id: string) => {
    if (!confirm('🔴 CRITICAL WARNING: You are about to delete an entire project. This will permanently remove all tasks, timeline data, and team assignments associated with this project.\n\nThis action is irreversible. Type "OK" to confirm deletion.')) return;
    await projectService.delete(id);
    await loadProjects();
    if (selectedProjectId === id) {
      setSelectedProjectId(null);
      setDetails(null);
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const statusOk = statusFilter === 'ALL' ? true : p.status === statusFilter;
      const q = searchTerm.trim().toLowerCase();
      const searchOk = !q || String(p.title || '').toLowerCase().includes(q) || String(p.description || '').toLowerCase().includes(q);
      return statusOk && searchOk;
    });
  }, [projects, statusFilter, searchTerm]);

  const enrichedProjects = useMemo(() => {
    const allTasks = taskService.getAll();
    return filteredProjects.map(p => {
      const pTasks = allTasks.filter(t => t.projectId === p.id);
      const total = pTasks.length;
      
      const sumProgress = pTasks.reduce((acc, t) => acc + (t.progress || 0), 0);
      const progress = total > 0 ? Math.round(sumProgress / total) : 0;
      const doneCount = pTasks.filter(t => t.status === TaskStatus.DONE || (t.progress === 100)).length;

      return { 
        ...p, 
        totalTasks: total, 
        progressValue: sumProgress / (total || 1), // Exact for formula
        progress: progress,
        completedTasks: doneCount
      };
    });
  }, [filteredProjects, details, isTaskModalOpen, isEditTaskModalOpen]);

  const counts = useMemo(() => {
    const pList = enrichedProjects || [];
    const all = pList.length;
    const active = pList.filter((p) => p.status === 'ACTIVE').length;
    const planning = pList.filter((p) => p.status === 'PLANNING').length;
    const completed = pList.filter((p) => p.status === 'COMPLETED').length;
    const onHold = pList.filter((p) => p.status === 'ON_HOLD').length;
    const cancelled = pList.filter((p) => p.status === 'CANCELLED').length;
    const overallProgress = all === 0 ? 0 : Math.round(pList.reduce((acc, p) => acc + (p.progress || 0), 0) / all);
    return { all, active, planning, completed, onHold, cancelled, overallProgress };
  }, [enrichedProjects]);

  const timelineMonths = useMemo(() => {
    let minDate = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    let maxDate = new Date(new Date().getFullYear(), new Date().getMonth() + 4, 1);
    
    if (filteredProjects.length) {
      filteredProjects.forEach((p) => {
        const start = p.startDate ? new Date(p.startDate) : new Date();
        const end = p.deadline ? new Date(p.deadline) : new Date();
        if (start < minDate) minDate = start;
        if (end > maxDate) maxDate = end;
      });
    }
    const months: Date[] = [];
    const cursor = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const endCursor = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
    while (cursor <= endCursor) {
      months.push(new Date(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return months.slice(0, Math.max(6, months.length));
  }, [filteredProjects]);

  const teamStats = useMemo(() => {
    const tasks = details?.tasks || [];
    const grouped: Record<string, { total: number; sumProgress: number; done: number; user?: User | null }> = {};
    
    tasks.forEach((t: any) => {
      if (!t.assigneeId) return;
      if (!grouped[t.assigneeId]) {
        grouped[t.assigneeId] = { total: 0, sumProgress: 0, done: 0, user: employees.find((e) => e.id === t.assigneeId) || null };
      }
      
      grouped[t.assigneeId].total += 1;
      grouped[t.assigneeId].sumProgress += (t.progress || 0);
      if (t.status === TaskStatus.DONE || t.progress === 100) {
        grouped[t.assigneeId].done += 1;
      }
    });

    return Object.entries(grouped).map(([userId, s]) => ({
      userId,
      name: s.user?.name || userId,
      progress: s.total === 0 ? 0 : Math.round(s.sumProgress / s.total),
      total: s.total,
      done: s.done
    }));
  }, [details, employees]);

  if (selectedProjectId && details) {
    const visibleTasks = currentUser?.role === 'EMPLOYEE' 
      ? details.tasks.filter((t: any) => t.assigneeId === currentUser.id)
      : details.tasks;

    const totalTasks = visibleTasks.length;
    const sumTaskProgress = visibleTasks.reduce((acc, t) => acc + (t.progress || 0), 0);
    const detailProgress = totalTasks > 0 ? Math.round(sumTaskProgress / totalTasks) : 0;
    const doneCount = visibleTasks.filter((t: any) => t.status === TaskStatus.DONE || t.progress === 100).length;
    const teamProgressTotal = teamStats.length ? Math.round(teamStats.reduce((a, b) => a + b.progress, 0) / teamStats.length) : 0;
    
    return (
      <>
        <div className="max-w-[1240px] mx-auto pb-12 font-sans">
        <button 
          className="text-[13px] font-semibold text-blue-600 hover:text-blue-700 flex items-center mb-6"
          onClick={() => setSelectedProjectId(null)}
        >
          &larr; Back to Projects
        </button>

        {/* Project Header Banner */}
        <div className="bg-white border text-sm border-slate-200 rounded shadow-sm mb-6 flex flex-col">
          <div className="bg-[#1d4ed8] text-white p-6 sm:p-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-extrabold mb-1">{details.project.title || 'Project Name'}</h1>
              <p className="text-blue-100 font-medium text-[15px]">{details.project.description || 'Project Description'}</p>
            </div>
            <div className="bg-white text-blue-600 px-4 py-1.5 rounded-full text-[13px] font-bold shadow-sm">
              {details.project.status === 'ACTIVE' ? 'Active' : details.project.status.replace('_', ' ')}
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-4 gap-8">
            <div>
              <p className="text-[11px] font-bold text-slate-500 mb-1.5 tracking-wider uppercase">PROGRESS</p>
              <p className="text-[28px] font-extrabold text-slate-900 mb-2 leading-none">
                {detailProgress}%
              </p>
              <div className="w-full bg-slate-100 h-[6px] rounded-full overflow-hidden mt-1 text-sm border-slate-50">
                <div className="bg-blue-600 h-full rounded-full transition-all duration-700" style={{ width: `${detailProgress}%` }} />
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 mb-1.5 tracking-wider uppercase">START DATE</p>
              <p className="text-[17px] font-bold text-slate-900 leading-tight">
                {details.project.startDate ? new Date(details.project.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 mb-1.5 tracking-wider uppercase">END DATE</p>
              <p className="text-[17px] font-bold text-slate-900 leading-tight">
                {details.project.deadline ? new Date(details.project.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 mb-1.5 tracking-wider uppercase">MY TASKS</p>
              <p className="text-[17px] font-bold text-slate-900 leading-tight">
                {doneCount}/{visibleTasks.length} Completed
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation & Content */}
        <div className="bg-white border text-sm border-slate-200 rounded shadow-sm min-h-[500px]">
          <div className="flex border-b border-slate-200">
            {([
              ['tasks', 'Tasks', ListChecks],
              ['gantt', 'Gantt Chart', Calendar],
              ['team', 'Team Progress', Users],
              ['settings', 'Settings', Settings]
            ] as Array<[DetailTab, string, any]>).filter(([id]) => id !== 'settings' || (hasPermission('projects.edit.info') || hasPermission('projects.edit.lead') || hasPermission('projects.edit.status'))).map(([id, label, Icon]) => (
              <button 
                key={id} 
                onClick={() => setDetailsTab(id)} 
                className={`flex-1 sm:flex-none px-6 py-4 text-[14px] font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                  detailsTab === id 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Icon className="w-[18px] h-[18px]" />
                {label}
              </button>
            ))}
          </div>

          <div className="p-8">
            {detailsTab === 'tasks' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-[22px] font-extrabold text-slate-900 leading-tight">
                      {currentUser?.role === 'EMPLOYEE' ? 'My Assignments' : 'Project Tasks'}
                    </h3>
                    <p className="text-[13px] text-slate-500 font-medium mt-1">
                      {visibleTasks.length} {visibleTasks.length === 1 ? 'task' : 'tasks'} {currentUser?.role === 'EMPLOYEE' ? 'assigned to you' : 'total in project'}
                    </p>
                  </div>
                  {hasPermission('tasks.create') && (
                    <Button onClick={() => setIsTaskModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm">
                      + Add Task
                    </Button>
                  )}
                </div>

                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200">
                        <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Task Detail</th>
                        <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Assignee</th>
                        <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Priority</th>
                        <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Timeline</th>
                        <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                        <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Progress</th>
                        <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {visibleTasks.length === 0 && (
                        <tr><td colSpan={7} className="p-16 text-center text-slate-400 font-medium text-[15px]">No tasks found</td></tr>
                      )}
                      {visibleTasks.map((t: any) => {
                        const rowProgress = t.progress || 0;
                        const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== TaskStatus.DONE;
                        const p = (t.priority || 'MEDIUM').toUpperCase();
                        const pCfg = {
                          LOW:      { dot: 'bg-emerald-500', pill: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                          MEDIUM:   { dot: 'bg-amber-500',   pill: 'text-amber-700 bg-amber-50 border-amber-200' },
                          HIGH:     { dot: 'bg-orange-500',  pill: 'text-orange-700 bg-orange-50 border-orange-200' },
                          CRITICAL: { dot: 'bg-red-500',     pill: 'text-red-700 bg-red-50 border-red-200' }
                        }[p] || { dot: 'bg-slate-300', pill: 'text-slate-700 bg-slate-50 border-slate-200' };

                        return (
                          <tr key={t.id} className="group hover:bg-blue-50/30 transition-all">
                            <td className="py-5 px-6 relative">
                              <div className={`absolute left-0 top-0 bottom-0 w-1 ${pCfg.dot}`} />
                              <p className="font-bold text-slate-900 text-[14px] leading-tight group-hover:text-blue-700 transition-colors uppercase tracking-tight">{t.title}</p>
                              <p className="text-[12px] text-slate-500 mt-1.5 line-clamp-1 max-w-[220px] font-medium">{t.description || 'No description'}</p>
                            </td>
                            <td className="py-5 px-6">
                              {t.assigneeId ? (
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-[12px] font-bold border border-slate-200">
                                    {employees.find(e => e.id === t.assigneeId)?.name?.charAt(0) || 'U'}
                                  </div>
                                  <span className="text-[13px] font-bold text-slate-800">{employees.find(e => e.id === t.assigneeId)?.name}</span>
                                </div>
                              ) : <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Waitlist</span>}
                            </td>
                            <td className="py-5 px-6 text-center">
                              <span className={`px-2 py-0.5 border rounded text-[10px] font-extrabold tracking-widest uppercase ${pCfg.pill}`}>{p}</span>
                            </td>
                            <td className="py-5 px-6">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 text-slate-600 text-[12px] font-bold">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> 
                                  {t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No set'}
                                </div>
                                {isOverdue && <span className="text-[9px] font-black text-red-500 bg-red-50 px-1.5 py-0.5 rounded uppercase tracking-widest w-fit">Overdue</span>}
                              </div>
                            </td>
                            <td className="py-5 px-6 text-center">
                              {(() => {
                                const st = t.status || TaskStatus.TODO;
                                const cfg = {
                                  [TaskStatus.TODO]:        { label: 'Todo',        color: 'bg-slate-100 text-slate-600 border-slate-200', icon: ListChecks },
                                  [TaskStatus.IN_PROGRESS]: { label: 'Working',     color: 'bg-blue-50 text-blue-600 border-blue-200',    icon: Clock },
                                  [TaskStatus.REVIEW]:      { label: 'Review',      color: 'bg-indigo-50 text-indigo-600 border-indigo-200', icon: Search },
                                  [TaskStatus.DONE]:        { label: 'Completed',   color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: CheckCircle2 },
                                  [TaskStatus.BLOCKED]:     { label: 'Blocked',     color: 'bg-red-50 text-red-600 border-red-200',       icon: AlertCircle },
                                }[st];
                                return (
                                  <span className={`inline-flex items-center gap-1.5 border ${cfg.color} px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap shadow-sm`}>
                                    <cfg.icon className="w-3.5 h-3.5" /> {cfg.label}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="py-5 px-6">
                              <div className="w-[100px]">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-[10px] font-black text-slate-800">{rowProgress}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-[4px] rounded-full overflow-hidden border border-slate-200/50">
                                  <div className={`h-full rounded-full transition-all duration-700 ${rowProgress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${rowProgress}%` }} />
                                </div>
                              </div>
                            </td>
                            <td className="py-5 px-6 text-right">
                              <div className="flex justify-end gap-2 text-slate-400">
                                {currentUser?.role === Role.EMPLOYEE ? (
                                  <button 
                                    onClick={() => handleEditTask(t)} 
                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg text-[12px] font-black transition-all border border-blue-200 shadow-sm"
                                  >
                                    <Target className="w-4 h-4" />
                                    UPDATE PROGRESS
                                  </button>
                                ) : (
                                  <>
                                    {(hasPermission('tasks.assign') || hasPermission('tasks.edit.info') || hasPermission('tasks.edit.dates') || hasPermission('tasks.progress')) && (
                                      <button onClick={() => handleEditTask(t)} className="w-7 h-7 rounded-lg hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all bg-slate-50 border border-slate-200">
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                    )}
                                    {hasPermission('tasks.delete') && (
                                      <button onClick={() => deleteTask(t.id)} className="w-7 h-7 rounded-lg hover:bg-red-600 hover:text-white flex items-center justify-center transition-all bg-slate-50 border border-slate-200">
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {detailsTab === 'gantt' && (
              <div className="space-y-6">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h3 className="text-[22px] font-extrabold text-slate-900 leading-tight">Timeline View</h3>
                    <p className="text-[13px] text-slate-500 font-medium mt-1">
                      {(hasPermission('tasks.assign') || hasPermission('tasks.edit.info') || hasPermission('tasks.edit.dates')) 
                        ? 'Visualize and manage project timeline with drag-and-drop' 
                        : 'View project schedule and task dependencies'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-[13px] font-semibold text-slate-600">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> In Progress</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Completed</span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <div className="min-w-[900px] border-b border-slate-200 p-4 flex justify-between items-center bg-[#f8fafc]">
                    <div className="flex items-center gap-4 text-sm font-semibold text-slate-700">
                      Gantt Chart 
                      <div className="flex gap-1 text-slate-400">
                         <ChevronLeft className="w-4 h-4 cursor-pointer hover:text-slate-800"/>
                         <ChevronRight className="w-4 h-4 cursor-pointer hover:text-slate-800"/>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex bg-slate-200/60 rounded-md p-1">
                        <button 
                          onClick={() => setGanttMode('week')}
                          className={`px-3 py-1 text-[13px] transition-all font-semibold ${ganttMode === 'week' ? 'text-slate-900 bg-white shadow-sm' : 'text-slate-600 hover:text-slate-800'} rounded`}
                        >
                          Week
                        </button>
                        <button 
                          onClick={() => setGanttMode('month')}
                          className={`px-3 py-1 text-[13px] transition-all font-bold ${ganttMode === 'month' ? 'text-slate-900 bg-white shadow-sm' : 'text-slate-600 hover:text-slate-800'} rounded`}
                        >
                          Month
                        </button>
                        <button 
                          onClick={() => setGanttMode('quarter')}
                          className={`px-3 py-1 text-[13px] transition-all font-semibold ${ganttMode === 'quarter' ? 'text-slate-900 bg-white shadow-sm' : 'text-slate-600 hover:text-slate-800'} rounded`}
                        >
                          Quarter
                        </button>
                      </div>
                      <div className="flex gap-2 text-slate-500">
                         <div className="w-7 h-7 rounded border border-slate-300 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => showToast('Gantt search feature coming soon!', 'info')}><Search className="w-4 h-4"/></div>
                         {hasPermission('tasks.create') && (
                           <div className="w-7 h-7 rounded border border-slate-300 flex items-center justify-center cursor-pointer hover:bg-blue-600 hover:text-white transition-colors" onClick={() => setIsTaskModalOpen(true)}><span className="font-bold font-mono text-sm leading-none mt-1">+</span></div>
                         )}
                      </div>
                    </div>
                  </div>

                  <div className="min-w-[900px] grid" style={{ gridTemplateColumns: '250px 1fr' }}>
                    <div className="border-r border-slate-200 bg-white">
                      <div className="h-12 border-b border-slate-200 flex items-center px-4">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">TASKS ({visibleTasks.length})</span>
                      </div>
                      {visibleTasks.length === 0 && <div className="p-4 text-sm text-slate-500">No tasks</div>}
                      {visibleTasks.map((t: any) => (
                        <div key={t.id} className="h-24 border-b border-slate-200 py-3 px-4 flex flex-col justify-center">
                           <div className="text-[13px] font-bold text-slate-800 truncate">{t.title}</div>
                           <div className="text-[12px] text-slate-500 mt-0.5 truncate">
                             {employees.find(e => e.id === t.assigneeId)?.name || 'Unassigned'}
                           </div>
                        </div>
                      ))}
                    </div>

                    <div className="overflow-x-auto relative bg-white pb-6 pt-1 custom-scrollbar">
                      {/* Grid overlay */}
                      <div className="absolute inset-0 grid" style={{ 
                        gridTemplateColumns: `repeat(${ganttMode === 'week' ? 7 : ganttMode === 'month' ? 21 : 12}, ${ganttMode === 'week' ? '300px' : ganttMode === 'month' ? '150px' : '350px'})`, 
                        minWidth: ganttMode === 'week' ? '2100px' : ganttMode === 'month' ? '3150px' : '4200px' 
                      }}>
                        {Array.from({length: ganttMode === 'week' ? 7 : ganttMode === 'month' ? 21 : 12}).map((_, i) => {
                          const pStart = details.project.startDate ? new Date(details.project.startDate) : new Date();
                          const date = new Date(pStart);
                          if (ganttMode === 'quarter') {
                            date.setDate(date.getDate() + (i * 7));
                          } else {
                            date.setDate(date.getDate() + i);
                          }
                          
                          return (
                            <div key={i} className={`border-r ${i===0?'border-l':''} border-slate-100 h-full flex flex-col items-center pt-2 relative`}>
                              {i % 7 === 0 && (
                                <span className="text-[10px] font-bold text-slate-400 -mt-6 uppercase absolute bg-white px-2 tracking-wider whitespace-nowrap">
                                  {date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                                </span>
                              )}
                              <span className="text-[12px] font-medium text-slate-600 leading-none">{date.getDate()}</span>
                              <span className="text-[10px] text-slate-400 uppercase mt-1">
                                {date.toLocaleDateString('en-US', { weekday: 'narrow' })}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Gantt bars container */}
                      <div className="relative" style={{ minWidth: ganttMode === 'week' ? '2100px' : ganttMode === 'month' ? '3150px' : '4200px' }}>
                        <div className="h-12 border-b border-slate-200 relative z-10 w-full bg-slate-50/50"></div>
                        
                        {/* Gantt bars */}
                      {visibleTasks.map((t: any, idx: number) => {
                        const progress = t.progress || 0;
                        const isDone = t.status === TaskStatus.DONE || progress === 100;
                        
                        // Dynamic Gradient Logic
                        let barGradient = 'linear-gradient(to right, #3b82f6, #2563eb)'; // Blue
                        if (isDone) barGradient = 'linear-gradient(to right, #10b981, #059669)'; // Green
                        else if (progress >= 70) barGradient = 'linear-gradient(to right, #8b5cf6, #6d28d9)'; // Purple
                        else if (progress < 30) barGradient = 'linear-gradient(to right, #f97316, #ea580c)'; // Orange
                        
                        
                        // Pixel-based positioning logic
                        const pStart = details.project.startDate ? new Date(details.project.startDate) : new Date();
                        const tStart = t.startDate ? new Date(t.startDate) : pStart;
                        const tEnd = t.dueDate ? new Date(t.dueDate) : new Date();
                        
                        const unitPx = ganttMode === 'week' ? 300 : ganttMode === 'month' ? 150 : 350;
                        const msPerUnit = ganttMode === 'quarter' ? (3600000 * 24 * 7) : (3600000 * 24);
                        
                        const startOffsetMs = Math.max(0, tStart.getTime() - pStart.getTime());
                        const durationMs = Math.max(3600000 * 24, tEnd.getTime() - tStart.getTime());
                        
                        const leftPx = (startOffsetMs / msPerUnit) * unitPx;
                        const widthPx = (durationMs / msPerUnit) * unitPx;
                        
                        return (
                          <div key={t.id} className="h-24 border-b border-slate-200 relative z-10 flex items-center w-full group">
                            <div 
                              className={`h-11 rounded-lg absolute flex flex-col justify-center px-4 shadow-lg border-b-2 border-black/10 transition-all hover:scale-[1.01] cursor-pointer`}
                              style={{ 
                                left: `${leftPx}px`, 
                                width: `${widthPx}px`, 
                                minWidth: '60px',
                                background: barGradient
                              }}
                            >
                              <span className="text-[10px] font-bold text-white mb-0.5 leading-none truncate">{t.title}</span>
                              <span className="text-[9px] text-white/90 font-black leading-none">{t.progress || 0}%</span>
                              
                              {/* Hover Tooltip */}
                              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl font-bold uppercase tracking-tighter">
                                {new Date(tStart).toLocaleDateString()} - {new Date(tEnd).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {detailsTab === 'team' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-[22px] font-extrabold text-slate-900 leading-tight">Team Progress</h3>
                  <p className="text-[13px] text-slate-500 font-medium mt-1 mb-8">Team members and their task progress</p>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <div className="p-4 border-b border-slate-200 font-bold text-slate-800 text-[14px] flex items-center gap-2">
                    <Users className="w-[18px] h-[18px]" strokeWidth={2.5}/> Team Overview
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-4 gap-8 mb-6">
                      <div className="text-center border-r border-slate-200 last:border-0 pl-0">
                         <span className="block text-3xl font-extrabold text-[#3b82f6] leading-none mb-2">{teamStats.length || 5}</span>
                         <span className="text-[12px] font-medium text-slate-600">Team Members</span>
                      </div>
                      <div className="text-center border-r border-slate-200">
                         <span className="block text-3xl font-extrabold text-[#a855f7] leading-none mb-2">{visibleTasks.length}</span>
                         <span className="text-[12px] font-medium text-slate-600">{currentUser?.role === 'EMPLOYEE' ? 'My Tasks' : 'Total Tasks'}</span>
                      </div>
                      <div className="text-center border-r border-slate-200">
                         <span className="block text-3xl font-extrabold text-[#22c55e] leading-none mb-2">{doneCount}</span>
                         <span className="text-[12px] font-medium text-slate-600">Completed</span>
                      </div>
                      <div className="text-center">
                         <span className="block text-3xl font-extrabold text-[#f97316] leading-none mb-2">{teamProgressTotal}%</span>
                         <span className="text-[12px] font-medium text-slate-600">Team Progress</span>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t mt-8 border-transparent">
                       <div className="flex justify-between text-[12px] font-semibold text-slate-500 mb-2">
                          <span className="text-slate-700">Project Progress</span>
                          <span className="text-slate-700">{detailProgress}%</span>
                       </div>
                       <div className="w-full bg-white/20 h-[8px] rounded-full overflow-hidden border border-white/10 mt-3 shadow-inner">
                    <div 
                      className="h-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,255,255,0.3)]" 
                      style={{ 
                        width: `${detailProgress}%`,
                        background: detailProgress >= 100 ? 'linear-gradient(to right, #10b981, #34d399)' :
                                   detailProgress >= 70 ? 'linear-gradient(to right, #a855f7, #c084fc)' :
                                   detailProgress >= 30 ? 'linear-gradient(to right, #3b82f6, #60a5fa)' :
                                   'linear-gradient(to right, #fb923c, #fdba74)'
                      }} 
                    />
                  </div>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white mt-6">
                  <div className="p-4 border-b border-slate-200 font-bold text-slate-800 text-[14px] flex items-center gap-2 flex-row">
                    <LineChart className="w-[18px] h-[18px]" strokeWidth={2.5}/> Individual Progress
                  </div>
                  
                  <div className="p-0">
                    {teamStats.length === 0 ? (
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-500 text-white font-bold text-[17px] flex items-center justify-center rounded-full shadow-sm">
                              JS
                            </div>
                            <div>
                               <div className="font-bold text-[15px] text-slate-900 leading-tight">John Smith</div>
                               <div className="text-[12px] text-slate-500">0 tasks assigned</div>
                            </div>
                          </div>
                          <div className="text-right">
                             <div className="font-bold text-[15px] text-slate-900 leading-tight">0%</div>
                             <div className="text-[12px] text-slate-500">Progress</div>
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 h-[6px] rounded-full mb-4"></div>
                        <div className="flex justify-between items-center text-[12px] font-medium text-slate-600">
                           <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> 0 completed</span>
                           <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-blue-500"/> 0 pending</span>
                           <span className="flex items-center gap-1.5"><LineChart className="w-4 h-4 text-orange-500"/> 0% rate</span>
                        </div>
                      </div>
                    ) : (
                      teamStats.map((u, i) => (
                        <div key={u.userId} className={`p-6 ${i !== teamStats.length-1 ? 'border-b border-slate-200' : ''}`}>
                          <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-blue-500 text-white font-bold text-[17px] flex items-center justify-center rounded-full shadow-sm">
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                 <div className="font-bold text-[15px] text-slate-900 leading-tight">{u.name}</div>
                                 <div className="text-[12px] text-slate-500">{u.total} tasks assigned</div>
                              </div>
                            </div>
                            <div className="text-right">
                               <div className="font-bold text-[15px] text-slate-900 leading-tight">{u.progress}%</div>
                               <div className="text-[12px] text-slate-500">Progress</div>
                            </div>
                          </div>
                          <div className="w-full bg-slate-200 h-[6px] rounded-full mb-4 overflow-hidden">
                            <div className="bg-emerald-500 h-[6px] rounded-full" style={{ width: `${u.progress}%` }} />
                          </div>
                          <div className="flex justify-between items-center text-[12px] font-medium text-slate-600">
                             <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> {u.done} completed</span>
                             <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-blue-500"/> {u.total - u.done} pending</span>
                             <span className="flex items-center gap-1.5"><LineChart className="w-4 h-4 text-orange-500"/> {u.progress}% rate</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {(detailsTab === 'settings' && (hasPermission('projects.edit.info') || hasPermission('projects.edit.lead') || hasPermission('projects.edit.status') || (details.project.leadId === currentUser?.id))) && (
              <div className="max-w-2xl">
                <div className="mb-6">
                  <h3 className="text-[22px] font-extrabold text-slate-900 leading-tight">Project Settings</h3>
                  <p className="text-[13px] text-slate-500 font-medium mt-1">Manage core project configurations</p>
                </div>
                <div className="space-y-5">
                  <Input 
                    label="Project Title" 
                    value={details.project.title || ''} 
                    disabled={!(hasPermission('projects.edit.info') || (details.project.leadId === currentUser?.id))}
                    onChange={(e) => setDetails((prev) => prev ? ({ ...prev, project: { ...prev.project, title: e.target.value } }) : prev)} 
                  />
                  <div className="grid grid-cols-2 gap-5">
                    <Select 
                      label="Status" 
                      value={details.project.status || 'PLANNING'} 
                      disabled={!(hasPermission('projects.edit.status') || (details.project.leadId === currentUser?.id))}
                      onChange={(e) => setDetails((prev) => prev ? ({ ...prev, project: { ...prev.project, status: e.target.value } }) : prev)} 
                      options={['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'].map((v) => ({ value: v, label: v }))} 
                    />
                    <Select 
                      label="Project Lead" 
                      value={details.project.leadId || ''} 
                      disabled={!hasPermission('projects.edit.lead')}
                      onChange={(e) => setDetails((prev) => prev ? ({ ...prev, project: { ...prev.project, leadId: e.target.value } }) : prev)} 
                      options={employees.map(e => ({ value: e.id, label: e.name }))}
                    />
                    <Input 
                      label="Start Date" 
                      type="date" 
                      value={details.project.startDate || ''} 
                      disabled={!(hasPermission('projects.edit.info') || (details.project.leadId === currentUser?.id))}
                      onChange={(e) => setDetails((prev) => prev ? ({ ...prev, project: { ...prev.project, startDate: e.target.value } }) : prev)} 
                    />
                    <Input 
                      label="Deadline" 
                      type="date" 
                      value={details.project.deadline || ''} 
                      disabled={!(hasPermission('projects.edit.info') || (details.project.leadId === currentUser?.id))}
                      onChange={(e) => setDetails((prev) => prev ? ({ ...prev, project: { ...prev.project, deadline: e.target.value } }) : prev)} 
                    />
                  </div>
                  <Textarea 
                    label="Project Description" 
                    rows={3} 
                    value={details.project.description || ''} 
                    disabled={!(hasPermission('projects.edit.info') || (details.project.leadId === currentUser?.id))}
                    onChange={(e) => setDetails((prev) => prev ? ({ ...prev, project: { ...prev.project, description: e.target.value } }) : prev)} 
                  />
                  <div className="pt-6">
                    <Button onClick={async () => {
                      if (!details?.project) return;
                      await projectService.update(details.project);
                      showToast('Project updated successfully', 'success');
                      await openDetails(details.project.id);
                      await loadProjects();
                    }} className="bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide">Save Changes</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== ADD TASK MODAL ===== */}
      <Modal 
        isOpen={isTaskModalOpen} 
        onClose={() => { if (!isTaskSubmitting) { setIsTaskModalOpen(false); resetTaskForm(); } }} 
        title="Initialize New Task" 
        size="lg"
      >
        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-[0.1em]">Target Project</label>
              <span className="bg-blue-50 text-blue-600 text-[10px] font-extrabold px-3 py-1 rounded-full border border-blue-100 uppercase tracking-widest">
                {details?.project?.title || 'Main Workspace'}
              </span>
            </div>
            <div className="text-right">
              <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-[0.1em]">Status</label>
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-100 rounded-full">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Active Creation</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Title & Description Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4 transition-all focus-within:ring-4 focus-within:ring-blue-50 focus-within:border-blue-500">
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Task Definition <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="What needs to be accomplished?"
                  value={newTask.title}
                  onChange={(e) => { setNewTask(v => ({ ...v, title: e.target.value })); if (taskErrors.title) setTaskErrors(p => ({ ...p, title: '' })); }}
                  className="w-full text-lg font-bold text-slate-900 placeholder:text-slate-300 bg-transparent outline-none"
                />
              </div>
              <div className="pt-4 border-t border-slate-50">
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Strategic Context</label>
                <textarea
                  rows={2}
                  placeholder="Provide details, context, or acceptance criteria..."
                  value={newTask.description}
                  onChange={(e) => setNewTask(v => ({ ...v, description: e.target.value }))}
                  className="w-full text-sm font-medium text-slate-600 placeholder:text-slate-300 bg-transparent outline-none resize-none"
                />
              </div>
            </div>

            {/* Assignment & Status Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-blue-100 transition-colors group">
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                  <UserCheck className="w-3 h-3 group-hover:text-blue-500" /> Primary Assignee
                </label>
                <select
                  value={newTask.assigneeId}
                  onChange={(e) => setNewTask(v => ({ ...v, assigneeId: e.target.value }))}
                  className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="">— Unassigned —</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-indigo-100 transition-colors group">
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                  <Target className="w-3 h-3 group-hover:text-indigo-500" /> Initial State
                </label>
                <select
                  value={newTask.status}
                  onChange={(e) => setNewTask(v => ({ ...v, status: e.target.value as TaskStatus }))}
                  className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
                >
                  <option value={TaskStatus.TODO}>📋 Ready for execution</option>
                  <option value={TaskStatus.IN_PROGRESS}>🔄 Active development</option>
                  <option value={TaskStatus.REVIEW}>👁 Quality assurance</option>
                  <option value={TaskStatus.DONE}>✅ Mission complete</option>
                  <option value={TaskStatus.BLOCKED}>🚫 Blocked / Impeded</option>
                </select>
              </div>
            </div>

            {/* Priority Selector */}
            <div className="py-2">
              <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">Operational Priority</label>
              <div className="flex gap-2">
                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setNewTask(v => ({ ...v, priority: p }))}
                    className={`flex-1 py-3 text-[10px] font-black rounded-xl border-2 transition-all ${
                      newTask.priority === p 
                        ? {
                            LOW: 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200',
                            MEDIUM: 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-200',
                            HIGH: 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-200',
                            CRITICAL: 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-200'
                          }[p]
                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300 hover:text-slate-600'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50 space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Start Date
                </label>
                <input
                  type="date"
                  value={newTask.startDate}
                  onChange={(e) => setNewTask(v => ({ ...v, startDate: e.target.value }))}
                  className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none"
                />
              </div>
              <div className={`p-4 rounded-2xl border space-y-2 transition-all ${taskErrors.dueDate ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-red-400" /> Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => { setNewTask(v => ({ ...v, dueDate: e.target.value })); if (taskErrors.dueDate) setTaskErrors(p => ({ ...p, dueDate: '' })); }}
                  className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none"
                />
              </div>
              <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50 space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Clock className="w-3 h-3" /> Budget (Hrs)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={newTask.estimatedHours || ''}
                  onChange={(e) => setNewTask(v => ({ ...v, estimatedHours: Math.max(0, Number(e.target.value)) }))}
                  className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none"
                />
              </div>
            </div>

            {/* Creator Attribution */}
            <div className="mt-2 bg-slate-900 rounded-[1.5rem] p-4 flex items-center gap-4 text-white">
              <div className="w-10 h-10 rounded-full bg-blue-500 border-2 border-slate-800 flex items-center justify-center text-sm font-black text-white shadow-xl">
                {currentUser?.name?.charAt(0) || 'A'}
              </div>
              <div>
                <p className="text-xs font-black tracking-tight">{currentUser?.name || 'System User'}</p>
                <p className="text-[10px] text-slate-400 font-medium">Drafting task as <span className="text-blue-400 font-bold">{currentUser?.position || 'Project Resource'}</span></p>
              </div>
              <Lock className="w-4 h-4 ml-auto text-slate-700" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-slate-100">
            <Button 
              onClick={() => { setIsTaskModalOpen(false); resetTaskForm(); }} 
              variant="outline" 
              className="flex-1 py-4 text-sm font-bold rounded-[1.25rem] border-slate-200 text-slate-500 hover:bg-slate-50 transition-all"
            >
              Discard
            </Button>
            <Button 
              onClick={addTask} 
              disabled={isTaskSubmitting}
              className="flex-[2] py-4 text-sm font-black rounded-[1.25rem] bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
            >
              {isTaskSubmitting ? 'Initializing...' : 'Confirm & Create Task'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ===== EDIT TASK MODAL ===== */}
      <Modal 
        isOpen={isEditTaskModalOpen} 
        onClose={() => { if (!isTaskSubmitting) { setIsEditTaskModalOpen(false); setEditingTask(null); } }} 
        title={hasPermission('tasks.edit.info') ? "Edit Task" : "Update Task Progress"} 
        size="lg"
      >
        <div className="space-y-0">
          {editingTask && (
            <div className="flex flex-col gap-6">
              {/* Header Section: Title & Description */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 mr-4">
                    <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-[0.1em]">Project / Task</label>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-blue-50/50 text-blue-600 text-[10px] font-extrabold px-2 py-0.5 rounded border border-blue-100 uppercase tracking-wider">
                        {details?.project?.title || 'Project'}
                      </span>
                      <h3 className={`text-xl font-black text-slate-900 leading-tight uppercase tracking-tight ${!hasPermission('tasks.edit.info') ? 'opacity-90' : ''}`}>
                        {editingTask.title}
                      </h3>
                    </div>
                  </div>
                  {(editingTask.priority || 'MEDIUM') && (
                    <div className={`px-3 py-1.5 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest ${
                      {
                        LOW: 'bg-emerald-50 border-emerald-100 text-emerald-600',
                        MEDIUM: 'bg-amber-50 border-amber-100 text-amber-600',
                        HIGH: 'bg-orange-50 border-orange-100 text-orange-600',
                        CRITICAL: 'bg-red-50 border-red-100 text-red-600'
                      }[editingTask.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL']
                    }`}>
                      {editingTask.priority}
                    </div>
                  )}
                </div>

                <div className={`p-4 rounded-2xl border transition-all ${!hasPermission('tasks.edit.info') ? 'bg-slate-50/50 border-slate-100' : 'bg-white border-slate-200 shadow-sm focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50'}`}>
                  <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-[0.1em]">Task Objective</label>
                  <textarea
                    rows={2}
                    placeholder="No description provided..."
                    disabled={!hasPermission('tasks.edit.info')}
                    value={editingTask.description}
                    onChange={(e) => setEditingTask(v => v ? ({ ...v, description: e.target.value }) : null)}
                    className="w-full bg-transparent text-sm text-slate-600 font-medium placeholder:text-slate-300 focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Progress & Status: The Action Area */}
              <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl shadow-slate-200 transition-all transform hover:scale-[1.01]">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-5 h-5 text-blue-400" />
                      <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400">Current Progress</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium italic">Update your task completion percentage</p>
                  </div>
                  <div className="text-right">
                    <span className="text-4xl font-black tabular-nums tracking-tighter">
                      {editingTask.progress}<span className="text-xl text-blue-400 opacity-80">%</span>
                    </span>
                  </div>
                </div>

                <div className="px-2 mb-8">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={editingTask.progress}
                    disabled={!(hasPermission('tasks.progress') || (editingTask.assigneeId === currentUser?.id))}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      let newStatus = editingTask.status;
                      if (val === 100) newStatus = TaskStatus.DONE;
                      else if (val > 0 && editingTask.status === TaskStatus.TODO) newStatus = TaskStatus.IN_PROGRESS;
                      else if (val === 0) newStatus = TaskStatus.TODO;
                      setEditingTask(v => v ? ({...v, progress: val, status: newStatus}) : null);
                    }}
                    className="w-full accent-blue-500 h-2 rounded-full cursor-pointer hover:accent-blue-400 transition-all disabled:opacity-30"
                  />
                  <div className="flex justify-between mt-3 text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
                    <span>Not Started</span>
                    <span>Operational</span>
                    <span className="text-emerald-400">Deployed</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Workflow State</label>
                    <select
                      value={editingTask.status}
                      disabled={!(hasPermission('tasks.progress') || (editingTask.assigneeId === currentUser?.id))}
                      onChange={(e) => setEditingTask(v => v ? ({ ...v, status: e.target.value as TaskStatus }) : null)}
                      className="bg-transparent w-full text-sm font-bold text-white focus:outline-none appearance-none cursor-pointer disabled:opacity-50"
                    >
                      <option value={TaskStatus.TODO} className="bg-slate-800">📋 Backlog</option>
                      <option value={TaskStatus.IN_PROGRESS} className="bg-slate-800">🔄 Active</option>
                      <option value={TaskStatus.REVIEW} className="bg-slate-800">👁 Quality Check</option>
                      <option value={TaskStatus.DONE} className="bg-slate-800">✅ Completed</option>
                      <option value={TaskStatus.BLOCKED} className="bg-slate-800">🚫 Impeded</option>
                    </select>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Ownership</label>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-black">
                        {employees.find(e => e.id === editingTask.assigneeId)?.name.charAt(0) || '?'}
                      </div>
                      <span className="text-sm font-bold truncate">
                        {employees.find(e => e.id === editingTask.assigneeId)?.name || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Auxiliary Grid: Dates & Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-1 items-center justify-center text-center group transition-colors hover:bg-white hover:border-blue-100">
                  <Calendar className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Start</span>
                  <span className="text-xs font-bold text-slate-700">{editingTask.startDate ? new Date(editingTask.startDate).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-1 items-center justify-center text-center group transition-colors hover:bg-white hover:border-red-100">
                  <span className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 group-hover:text-red-500 transition-colors" />
                    {editingTask.dueDate && new Date(editingTask.dueDate) < new Date() && editingTask.status !== TaskStatus.DONE && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
                    )}
                  </span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Due</span>
                  <span className="text-xs font-bold text-slate-700">{editingTask.dueDate ? new Date(editingTask.dueDate).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-1 items-center justify-center text-center group transition-colors hover:bg-white hover:border-indigo-100">
                  <Clock className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Budget</span>
                  <span className="text-xs font-bold text-slate-700">{editingTask.estimatedHours || 0} hrs</span>
                </div>
              </div>

              {/* Admin-only Area: Assignee & Priority (if permission allows) */}
              {hasPermission('tasks.assign') && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-6">
                     <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-[0.1em]">Reassign Agent</label>
                        <select
                          value={editingTask.assigneeId}
                          onChange={(e) => setEditingTask(v => v ? ({ ...v, assigneeId: e.target.value }) : null)}
                          className="w-full text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all"
                        >
                          <option value="">— Unassigned —</option>
                          {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-[0.1em]">Severity Level</label>
                        <div className="flex gap-2">
                          {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map(p => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setEditingTask(v => v ? ({ ...v, priority: p }) : null)}
                              className={`flex-1 py-2 text-[10px] font-black rounded-lg border-2 transition-all ${
                                editingTask.priority === p 
                                  ? {
                                      LOW: 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200',
                                      MEDIUM: 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-200',
                                      HIGH: 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-200',
                                      CRITICAL: 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-200'
                                    }[p]
                                  : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                              }`}
                            >
                              {p.charAt(0)}
                            </button>
                          ))}
                        </div>
                     </div>
                  </div>
                </div>
              )}

              {/* Action Buttons Footer */}
              <div className="mt-4 flex gap-3 pt-6 border-t border-slate-100">
                <Button 
                  onClick={() => setIsEditTaskModalOpen(false)} 
                  variant="outline" 
                  className="flex-1 py-4 text-sm font-bold rounded-[1.25rem] border-slate-200 text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
                >
                  Dismiss
                </Button>
                <Button 
                  onClick={updateTask} 
                  disabled={isTaskSubmitting}
                  className="flex-[2] py-4 text-sm font-black rounded-[1.25rem] bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isTaskSubmitting ? 'Syncing...' : 'Confirm Update'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
    );
  }

  return (
    <div className="max-w-[1240px] mx-auto pb-12 font-sans">
      <div className="bg-white rounded border border-slate-200 p-6 flex justify-between items-center mb-6 shadow-sm">
        <div>
          <h1 className="text-[28px] font-extrabold text-slate-800 leading-tight">Projects</h1>
          <p className="text-[13px] font-medium text-slate-500 mt-0.5">{filteredProjects.length} of {counts.all} projects</p>
        </div>
        {hasPermission('projects.create') && (
          <Button className="bg-[#2563eb] hover:bg-blue-700 text-white rounded text-[13px] font-bold px-4 py-2" onClick={() => setIsCreateOpen(true)}>
            + New Project
          </Button>
        )}
      </div>

      <h3 className="font-bold text-[15px] text-slate-800 mb-4 px-1">Project Overview</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded shadow-sm border border-slate-200 flex justify-between items-center">
          <div>
            <p className="text-[12px] font-medium text-slate-500 mb-1">Total Projects</p>
            <p className="text-[28px] font-extrabold text-slate-900 leading-none">{counts.all}</p>
          </div>
          <div className="bg-[#3b82f6] text-white p-2.5 rounded-lg"><LineChart className="w-5 h-5" strokeWidth={2.5}/></div>
        </div>
        <div className="bg-white p-6 rounded shadow-sm border border-slate-200 flex justify-between items-center">
          <div>
            <p className="text-[12px] font-medium text-slate-500 mb-1">Active Projects</p>
            <p className="text-[28px] font-extrabold text-slate-900 leading-none">{counts.active}</p>
          </div>
          <div className="bg-[#f97316] text-white p-2.5 rounded-lg"><Zap className="w-5 h-5" strokeWidth={2.5}/></div>
        </div>
        <div className="bg-white p-6 rounded shadow-sm border border-slate-200 flex justify-between items-center">
          <div>
            <p className="text-[12px] font-medium text-slate-500 mb-1">Completed Projects</p>
            <p className="text-[28px] font-extrabold text-slate-900 leading-none">{counts.completed}</p>
          </div>
          <div className="bg-[#22c55e] text-white p-2.5 rounded-lg"><CheckCircle2 className="w-5 h-5" strokeWidth={2.5}/></div>
        </div>
        <div className="bg-white p-6 rounded shadow-sm border border-slate-200 flex justify-between items-center">
          <div>
            <p className="text-[12px] font-medium text-slate-500 mb-1">Overall Progress</p>
            <p className="text-[28px] font-extrabold text-slate-900 leading-none">{counts.overallProgress}%</p>
          </div>
          <div className="bg-[#a855f7] text-white p-2.5 rounded-lg"><Clock className="w-5 h-5" strokeWidth={2.5}/></div>
        </div>
      </div>

      <div className="flex gap-8 border-b border-slate-200 mb-6 px-2">
        <button 
           onClick={() => setMainTab('overview')}
           className={`pb-3 text-[14px] font-semibold border-b-2 flex items-center gap-2 transition-colors ${mainTab==='overview'?'border-[#2563eb] text-[#2563eb]':'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <BarChart2 className="w-[18px] h-[18px]"/> Overview
        </button>
        <button 
           onClick={() => setMainTab('timeline')}
           className={`pb-3 text-[14px] font-semibold border-b-2 flex items-center gap-2 transition-colors ${mainTab==='timeline'?'border-[#2563eb] text-[#2563eb]':'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Calendar className="w-[18px] h-[18px]"/> Timeline
        </button>
      </div>

      {mainTab === 'overview' && (
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-[500px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2"/>
              <input 
                type="text" 
                placeholder="Search projects..." 
                className="w-full bg-slate-50 border border-slate-200 rounded px-4 py-2 pl-10 text-sm focus:outline-none focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="bg-white border border-slate-200 rounded px-4 py-2 text-sm focus:outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProjectStatusFilter)}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PLANNING">Planning</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
          
          <h3 className="font-bold text-[16px] text-slate-800 mb-4 px-1 mt-8">All Projects</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrichedProjects.map((p) => (
              <div key={p.id} className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col hover:border-blue-300 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-800 text-[15px] max-w-[200px] truncate">{p.title}</h4>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                    p.status === 'ACTIVE' ? 'bg-blue-50 border border-blue-200 text-[#2563eb]' : 
                    p.status === 'PLANNING' ? 'bg-amber-50 border border-amber-200 text-[#f59e0b]' : 
                    p.status === 'COMPLETED' ? 'bg-green-50 border border-green-200 text-green-600' : 'bg-slate-50 border border-slate-200 text-slate-600'
                  }`}>
                    {p.status === 'ACTIVE' ? 'Active' : p.status === 'PLANNING' ? 'Planning' : p.status}
                  </span>
                </div>
                <p className="text-[13px] text-slate-500 mb-6 flex-1 line-clamp-2 leading-relaxed">
                  {p.description || 'No description available for this project.'}
                </p>
                
                <div className="mb-6">
                  <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-2">
                    <span>Overall Progress</span>
                    <span>{(() => {
                      const pTasks = taskService.getByProject(p.id);
                      if (pTasks.length === 0) return p.progress || 0;
                      return Math.round(pTasks.reduce((acc, t) => acc + (t.progress || 0), 0) / pTasks.length);
                    })()}%</span>
                  </div>
                  <div className="w-full h-[6px] bg-slate-100 border border-slate-200/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000" 
                      style={{ 
                        width: `${(() => {
                          const pTasks = taskService.getByProject(p.id);
                          if (pTasks.length === 0) return p.progress || 0;
                          return Math.round(pTasks.reduce((acc, t) => acc + (t.progress || 0), 0) / pTasks.length);
                        })()}%`,
                        background: (p.progress || 0) >= 100 ? 'linear-gradient(to right, #10b981, #059669)' :
                                   (p.progress || 0) >= 70 ? 'linear-gradient(to right, #8b5cf6, #6d28d9)' :
                                   (p.progress || 0) >= 30 ? 'linear-gradient(to right, #3b82f6, #2563eb)' :
                                   'linear-gradient(to right, #f97316, #ea580c)'
                      }}
                    ></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-6 border-t border-slate-100 pt-3">
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 mb-1">Start: {p.startDate ? new Date(p.startDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) : 'N/A'}</p>
                      <p className="text-[11px] font-bold text-slate-500">Tasks: {p.totalTasks || 0}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 mb-1">End: {p.deadline ? new Date(p.deadline).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) : 'N/A'}</p>
                      <p className="text-[11px] font-bold text-slate-500 truncate">
                        Lead: {employees.find(e => e.id === p.leadId)?.name || 'Unassigned'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-[1fr,auto] gap-3 pt-6 border-t border-slate-100">
                  <Button className="w-full bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-[13px] py-1.5 rounded" onClick={() => openDetails(p.id)}>
                    View Details
                  </Button>
                  {hasPermission('projects.delete') && (
                    <Button className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[13px] py-1.5 px-4 rounded" 
                            onClick={() => deleteProject(p.id)}>
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
          </div>
        </div>
      )}

      {mainTab === 'timeline' && (
        <div className="bg-white border text-sm border-slate-200 rounded shadow-sm overflow-hidden mb-12">
          <div className="p-4 border-b border-slate-200 flex items-center gap-2 font-bold text-[15px] text-slate-800 bg-[#f8fafc]">
            <Calendar className="w-5 h-5 text-blue-600"/> Project Timeline
          </div>
          <div className="px-4 py-2 border-b border-slate-200 text-[12px] text-slate-500 font-medium">
             Jan 1, 2026 — Jul 1, 2026 (6 months)
          </div>
          <div className="w-full overflow-x-auto min-h-[400px]">
            <div className="grid border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-tighter bg-white sticky top-0 z-30" style={{ gridTemplateColumns: `250px repeat(26, 60px)` }}>
              <div className="p-4 border-r border-slate-200 bg-[#f8fafc] sticky left-0 z-40">PROJECTS</div>
              {Array.from({ length: 26 }).map((_, i) => {
                const date = new Date('2026-01-01');
                date.setDate(date.getDate() + (i * 7));
                return (
                  <div key={i} className="p-4 border-r border-slate-100 text-center whitespace-nowrap bg-white">
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                );
              })}
            </div>
            
            <div className="relative" style={{ width: `${250 + (26 * 60)}px` }}>
              {/* Vertical Grid Lines for Weeks */}
              <div className="absolute inset-0 flex pointer-events-none" style={{ left: '250px' }}>
                {Array.from({ length: 26 }).map((_, i) => (
                  <div key={i} className="flex-1 border-r border-slate-50 h-full" style={{ width: '60px' }}></div>
                ))}
              </div>
              {/* The vertical red line indicating today roughly (April 9 is ~55% through Jan-July) */}
              <div className="absolute top-0 bottom-0 border-l-2 border-red-500 z-20 pointer-events-none" style={{ left: `calc(250px + 55%)` }}>
                <div className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-b-sm absolute top-0 -left-[1px] whitespace-nowrap">TODAY</div>
              </div>
              
              {/* List items */}
              {filteredProjects.length === 0 ? (
                 <div className="p-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                      <Layout className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-slate-900 font-bold mb-1">No Active Projects</h3>
                    <p className="text-slate-500 text-[13px]">Create a new project to start tracking your roadmap.</p>
                 </div>
              ) : (
                filteredProjects.map((p, idx) => {
                  const colors = ['bg-[#2563eb]', 'bg-[#a855f7]', 'bg-[#2563eb]'];
                  
                  // Calculate dynamic position
                  const timelineStart = new Date('2026-01-01').getTime();
                  const timelineEnd = new Date('2026-07-01').getTime();
                  const totalDuration = timelineEnd - timelineStart;
                  
                  const pStart = new Date(p.startDate || '2026-01-01').getTime();
                  const pEnd = new Date(p.deadline || (p.endDate) || '2026-06-30').getTime();
                  
                  const leftPercentage = Math.max(0, Math.min(100, ((pStart - timelineStart) / totalDuration) * 100));
                  const widthPercentage = Math.max(2, Math.min(100 - leftPercentage, ((pEnd - pStart) / totalDuration) * 100));

                  return (
                    <div key={p.id} className="grid hover:bg-slate-50 transition-all border-b border-slate-100" style={{ gridTemplateColumns: `250px 1fr` }}>
                      <div className="p-5 border-r border-slate-200 cursor-pointer sticky left-0 bg-white shadow-[2px_0_5px_rgba(0,0,0,0.02)] z-10" onClick={() => openDetails(p.id)}>
                          <div className="font-bold text-[13px] text-slate-900 flex justify-between items-center">{p.title} <ChevronRight className="w-3 h-3 text-slate-400"/></div>
                          <div className="text-[12px] text-slate-500 mt-1 mb-2">/ {p.totalTasks || details?.tasks?.length || 3} Tasks</div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${p.status === 'PLANNING' ? 'text-purple-600 bg-purple-50 border border-purple-200' : 'text-blue-600 bg-blue-50 border border-blue-200'}`}>
                            {p.status.replace('_', ' ')}
                          </span>
                      </div>
                      <div className="relative pt-6 px-0 cursor-pointer h-full" onClick={() => openDetails(p.id)}>
                          <div className={`h-[28px] rounded-sm text-[11px] font-bold text-white ${colors[idx % 3]} flex items-center px-4 relative transition-all duration-500 shadow-sm`} 
                               style={{ width: `${widthPercentage}%`, left: `${leftPercentage}%`}}>
                             {p.title} ({Math.round(taskService.getByProject(p.id).length > 0 
                                ? taskService.getByProject(p.id).reduce((acc, t) => acc + (t.progress || 0), 0) / taskService.getByProject(p.id).length 
                                : p.progress || 0)}%)
                          </div>
                      </div>
                    </div>
                  )
                })
              )}

               {/* Mock items removed */}
              
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Initialize New Project">
        <div className="space-y-4">
          <Input label="Project Title" placeholder="Enter title..." value={createForm.title} onChange={(e) => setCreateForm((v) => ({ ...v, title: e.target.value }))} />
          <Textarea label="Project Description" placeholder="Briefly define objectives..." value={createForm.description} onChange={(e) => setCreateForm((v) => ({ ...v, description: e.target.value }))} rows={3} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" value={createForm.startDate} onChange={(e) => setCreateForm((v) => ({ ...v, startDate: e.target.value }))} />
            <Input label="Deadline" type="date" value={createForm.deadline} onChange={(e) => setCreateForm((v) => ({ ...v, deadline: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 mt-4">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateProject} className="px-6 bg-blue-600 text-white font-bold">Create Project</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
