import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Api } from '../services/api';
import { Task, TaskStatus, User, Role } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Plus, Calendar, Edit2, Trash2, ArrowRight, CheckCircle, Clock, Circle } from 'lucide-react';
import { Input, Select, Textarea } from '../components/ui/FormFields';

export const Tasks: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { t } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
      title: '',
      description: '',
      assigneeId: '',
      dueDate: '',
      status: TaskStatus.TODO
  });

  const loadData = async () => {
    setLoading(true);
    try {
        const [tasksData, usersData] = await Promise.all([
            Api.tasks.getAll(),
            Api.users.getAll()
        ]);

        // Filter Tasks logic (simulating backend filtering)
        let filteredTasks = tasksData;
        if (user && !hasRole([Role.ADMIN])) {
            if (hasRole([Role.MANAGER])) {
                // Managers see their own tasks + tasks assigned to their department members
                filteredTasks = tasksData.filter(task => {
                   const assignee = usersData.find(u => u.id === task.assigneeId);
                   return task.assigneeId === user.id || (assignee && assignee.departmentId === user.departmentId);
                });
            } else {
                // Employees only see assigned tasks
                filteredTasks = tasksData.filter(task => task.assigneeId === user.id);
            }
        }
        setTasks(filteredTasks);
        setUsers(usersData);
    } catch (err) {
        console.error("Failed to load tasks", err);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const openCreateModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
        title: '',
        description: '',
        assigneeId: user?.id || '',
        dueDate: new Date().toISOString().split('T')[0],
        status: TaskStatus.TODO
    });
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setIsEditMode(true);
    setEditingId(task.id);
    setFormData({
        title: task.title,
        description: task.description,
        assigneeId: task.assigneeId,
        dueDate: task.dueDate,
        status: task.status
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!user) return;

    if (isEditMode && editingId) {
        const existing = tasks.find(t => t.id === editingId);
        if(existing) {
            await Api.tasks.update({
                ...existing,
                ...formData
            });
        }
    } else {
        await Api.tasks.create({
            ...formData,
            creatorId: user.id
        });
    }
    setIsModalOpen(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
      if(confirm("Are you sure?")) {
          await Api.tasks.delete(id);
          loadData();
      }
  };

  const advanceStatus = async (task: Task) => {
      let nextStatus = TaskStatus.TODO;
      if(task.status === TaskStatus.TODO) nextStatus = TaskStatus.IN_PROGRESS;
      else if(task.status === TaskStatus.IN_PROGRESS) nextStatus = TaskStatus.DONE;
      else return;

      await Api.tasks.update({ ...task, status: nextStatus });
      loadData();
  };

  const getAssignee = (id: string) => users.find(u => u.id === id);

  const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
      const assignee = getAssignee(task.assigneeId);
      const isOverdue = new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE;

      return (
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative">
              <div className="flex justify-between items-start mb-3">
                 <h4 className="font-bold text-slate-800 dark:text-white line-clamp-1 pr-8 text-base">{task.title}</h4>
                 <button onClick={() => openEditModal(task)} className="opacity-0 group-hover:opacity-100 absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-primary-600 transition-all">
                     <Edit2 className="w-4 h-4" />
                 </button>
              </div>
              
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 h-10 leading-relaxed">{task.description}</p>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-700/50">
                  <div className="flex items-center gap-3">
                      {assignee ? (
                          <img src={assignee.avatarUrl} title={assignee.name} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white dark:border-slate-700 shadow-sm" />
                      ) : <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white dark:border-slate-700 shadow-sm" />}
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 ${isOverdue ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-50 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300 border border-slate-100 dark:border-slate-700'}`}>
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                  </div>

                  {task.status !== TaskStatus.DONE && (
                      <button onClick={() => advanceStatus(task)} className="p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full text-primary-600 dark:text-primary-400 transition-colors" title="Move to next stage">
                          <ArrowRight className="w-4 h-4" />
                      </button>
                  )}
                  {task.status === TaskStatus.DONE && (
                      <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-full">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      </div>
                  )}
              </div>
          </div>
      );
  };

  const Column = ({ title, status, icon: Icon, color }: any) => {
      const colTasks = tasks.filter(t => t.status === status);
      return (
          <div className="flex flex-col lg:h-full bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 w-full lg:min-w-[320px] backdrop-blur-sm">
              <div className={`p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center ${color} bg-opacity-10 rounded-t-2xl`}>
                  <div className="flex items-center gap-2.5 font-bold text-slate-700 dark:text-slate-200">
                      <div className={`p-1.5 rounded-lg ${color} bg-opacity-20`}>
                        <Icon className={`w-4 h-4 ${color.replace('bg-', 'text-')}`} />
                      </div>
                      {title}
                  </div>
                  <span className="bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400">{colTasks.length}</span>
              </div>
              <div className="p-4 space-y-4 lg:overflow-y-auto lg:flex-1 lg:max-h-[calc(100vh-240px)] scrollbar-thin custom-scrollbar">
                  {colTasks.map(task => <TaskCard key={task.id} task={task} />)}
                  {colTasks.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-sm italic border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                          <p>No tasks</p>
                      </div>
                  )}
              </div>
          </div>
      );
  };

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in duration-500 lg:h-[calc(100vh-140px)]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{t('tasks.title')}</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Track and manage team assignments</p>
            </div>
            <Button onClick={openCreateModal} className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/30 rounded-xl py-2.5">
                <Plus className="w-4 h-4 mr-2" /> {t('tasks.create')}
            </Button>
        </div>

        <div className="flex-1 lg:overflow-x-auto pb-4">
            <div className="flex flex-col lg:flex-row gap-6 lg:h-full lg:min-w-[1000px] px-1">
                <Column title={t('tasks.todo')} status={TaskStatus.TODO} icon={Circle} color="bg-slate-500" />
                <Column title={t('tasks.inProgress')} status={TaskStatus.IN_PROGRESS} icon={Clock} color="bg-primary-500" />
                <Column title={t('tasks.done')} status={TaskStatus.DONE} icon={CheckCircle} color="bg-emerald-500" />
            </div>
        </div>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? "Edit Task" : "Create New Task"}>
            <form onSubmit={handleSubmit} className="space-y-5">
                <Input label="Title" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Task title" />
                
                <div className="grid grid-cols-2 gap-5">
                    <Select 
                        label="Assign To"
                        required
                        value={formData.assigneeId}
                        onChange={e => setFormData({...formData, assigneeId: e.target.value})}
                        options={users.map(u => ({ value: u.id, label: u.name }))}
                    />
                    <Input label="Due Date" type="date" required value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                </div>

                {isEditMode && (
                    <Select 
                        label="Status"
                        value={formData.status}
                        onChange={e => setFormData({...formData, status: e.target.value as TaskStatus})}
                        options={[
                            { value: TaskStatus.TODO, label: 'To Do' },
                            { value: TaskStatus.IN_PROGRESS, label: 'In Progress' },
                            { value: TaskStatus.DONE, label: 'Done' }
                        ]}
                    />
                )}

                <Textarea label="Description" required rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Task details..." />

                <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-700">
                    {isEditMode && (
                        <Button type="button" variant="danger" size="sm" onClick={() => { setIsModalOpen(false); handleDelete(editingId!); }} className="rounded-xl">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </Button>
                    )}
                    <div className="flex gap-3 ml-auto">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/30 rounded-xl">{isEditMode ? 'Save Changes' : 'Create Task'}</Button>
                    </div>
                </div>
            </form>
        </Modal>
    </div>
  );
};