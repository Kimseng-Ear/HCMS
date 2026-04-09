
import { MOCK_USERS, MOCK_DEPARTMENTS, MOCK_ATTENDANCE, MOCK_LEAVES, MOCK_PROJECTS, MOCK_PAYSLIPS, MOCK_PAYROLL_RUNS, MOCK_NOTIFICATIONS, MOCK_MESSAGES, MOCK_TASKS, MOCK_LEAVE_TYPES, MOCK_PERMISSIONS, MOCK_JOBS, MOCK_CANDIDATES } from './mockData';
import { User, AttendanceRecord, LeaveRequest, AttendanceStatus, LeaveStatus, Project, Payslip, Department, ProjectStatus, PayrollRun, Notification, Message, Task, TaskStatus, Role, LeaveType, FeaturePermission, Job, Candidate, ApplicationStatus } from '../types';
import { calculatePayrollForUser } from './cambodiaTax';
import { keysToCamel, keysToSnake } from '../utils';

// TOGGLE THIS TO TRUE TO USE REAL LARAVEL BACKEND
export const USE_MOCK_ADAPTER = false; 
export const API_BASE_URL = '/api';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const MOCK_DELAY = 10; // Minimal delay for snappy UX

// --- PERSISTENCE LAYER ---
// This mimics a database by saving MOCK data to LocalStorage
const memoryCache: Record<string, any> = {};

const DB = {
    getItem: <T>(key: string, initial: T): T => {
        if (memoryCache[key]) return memoryCache[key];

        const saved = localStorage.getItem(`hcms_db_${key}`);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                memoryCache[key] = parsed;
                return parsed;
            } catch (e) {
                console.error("Failed to parse DB item", key, e);
            }
        }
        localStorage.setItem(`hcms_db_${key}`, JSON.stringify(initial));
        memoryCache[key] = initial;
        return initial;
    },
    setItem: (key: string, data: any) => {
        memoryCache[key] = data;
        localStorage.setItem(`hcms_db_${key}`, JSON.stringify(data));
    },
    // Collections
    get users(): User[] { return this.getItem('users', MOCK_USERS); },
    set users(v: User[]) { this.setItem('users', v); },
    
    get depts(): Department[] { return this.getItem('depts', MOCK_DEPARTMENTS); },
    set depts(v: Department[]) { this.setItem('depts', v); },

    get attendance(): AttendanceRecord[] { return this.getItem('attendance', MOCK_ATTENDANCE); },
    set attendance(v: AttendanceRecord[]) { this.setItem('attendance', v); },

    get leaves(): LeaveRequest[] { return this.getItem('leaves', MOCK_LEAVES); },
    set leaves(v: LeaveRequest[]) { this.setItem('leaves', v); },

    get projects(): Project[] { return this.getItem('projects', MOCK_PROJECTS); },
    set projects(v: Project[]) { this.setItem('projects', v); },

    get tasks(): Task[] { return this.getItem('tasks', MOCK_TASKS); },
    set tasks(v: Task[]) { this.setItem('tasks', v); },

    get payrollRuns(): PayrollRun[] { return this.getItem('payrollRuns', MOCK_PAYROLL_RUNS); },
    set payrollRuns(v: PayrollRun[]) { this.setItem('payrollRuns', v); },

    get payslips(): Payslip[] { return this.getItem('payslips', MOCK_PAYSLIPS); },
    set payslips(v: Payslip[]) { this.setItem('payslips', v); },

    get notifications(): Notification[] { return this.getItem('notifications', MOCK_NOTIFICATIONS); },
    set notifications(v: Notification[]) { this.setItem('notifications', v); },

    get messages(): Message[] { return this.getItem('messages', MOCK_MESSAGES); },
    set messages(v: Message[]) { this.setItem('messages', v); },

    get jobs(): Job[] { return this.getItem('jobs', MOCK_JOBS); },
    set jobs(v: Job[]) { this.setItem('jobs', v); },

    get candidates(): Candidate[] { return this.getItem('candidates', MOCK_CANDIDATES); },
    set candidates(v: Candidate[]) { this.setItem('candidates', v); },
};

class ApiClient {
    private getHeaders(isMultipart = false) {
        const userStr = localStorage.getItem('hcms_user');
        const token = userStr ? JSON.parse(userStr).token : '';
        const headers: any = {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
        };
        if (!isMultipart) {
            headers['Content-Type'] = 'application/json';
        }
        return headers;
    }

    private async handleResponse(response: Response) {
        if (response.status === 401) {
            localStorage.removeItem('hcms_user');
            window.location.href = '/#/login';
            throw new Error('Session expired');
        }
        const isJson = response.headers.get('content-type')?.includes('application/json');
        const data = isJson ? await response.json() : null;
        if (!response.ok) throw new Error(data?.message || `Error ${response.status}`);
        return data;
    }

    async get(endpoint: string) {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, { headers: this.getHeaders() });
        return this.handleResponse(res);
    }
    
    async post(endpoint: string, body: any) { 
        const isFormData = body instanceof FormData;
        const res = await fetch(`${API_BASE_URL}${endpoint}`, { 
            method: 'POST',
            headers: this.getHeaders(isFormData),
            body: isFormData ? body : JSON.stringify(body)
        });
        return this.handleResponse(res);
    }

    async put(endpoint: string, body: any) { 
        const res = await fetch(`${API_BASE_URL}${endpoint}`, { 
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(body)
        });
        return this.handleResponse(res);
    }

    async delete(endpoint: string) { 
        const res = await fetch(`${API_BASE_URL}${endpoint}`, { 
            method: 'DELETE',
            headers: this.getHeaders()
        });
        return this.handleResponse(res);
    }
}

const client = new ApiClient();

// Request deduplication - prevents duplicate concurrent requests
const pendingRequests = new Map<string, Promise<any>>();

function deduplicatedRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;
  }
  const promise = fn().finally(() => pendingRequests.delete(key));
  pendingRequests.set(key, promise);
  return promise;
}

export const Api = {
  auth: {
    login: async (phone: string, password?: string) => {
        if (USE_MOCK_ADAPTER) {
            await delay(MOCK_DELAY);
            let user = DB.users.find(u => u.phone === phone);
            if (!user) {
                const mockUser = MOCK_USERS.find(u => u.phone === phone);
                if (mockUser) {
                    const currentUsers = DB.users;
                    if (!currentUsers.find(u => u.id === mockUser.id)) {
                        DB.users = [...currentUsers, mockUser];
                        user = mockUser;
                    }
                }
            }
            if (!user) throw new Error('User not found');
            if (password && password !== 'password123') throw new Error('Invalid credentials');
            return { user: user, token: 'mock-token-123' };
        }
        return client.post('/auth/login', { phone, password });
    },
    requestOtp: async (phone: string) => {
        if (USE_MOCK_ADAPTER) {
            await delay(MOCK_DELAY);
            let user = DB.users.find(u => u.phone === phone);
            if (!user) {
                const mockUser = MOCK_USERS.find(u => u.phone === phone);
                if (mockUser) {
                    const currentUsers = DB.users;
                    if (!currentUsers.find(u => u.id === mockUser.id)) {
                        DB.users = [...currentUsers, mockUser];
                        user = mockUser;
                    }
                }
            }
            if (!user) throw new Error('User not found');
            return { message: 'OTP sent successfully', devOtp: '123456' };
        }
        return client.post('/auth/request-otp', { phone });
    },
    verifyOtp: async (phone: string, otp: string) => {
        if (USE_MOCK_ADAPTER) {
            await delay(MOCK_DELAY);
            let user = DB.users.find(u => u.phone === phone);
            if (!user) throw new Error('User not found');
            if (otp !== '123456') throw new Error('Invalid OTP');
            return { user: user, token: 'mock-token-123' };
        }
        return client.post('/auth/verify-otp', { phone, otp });
    },
    forgotPassword: async (phone: string) => {
        if (USE_MOCK_ADAPTER) {
            await delay(MOCK_DELAY);
            let user = DB.users.find(u => u.phone === phone);
            if (!user) throw new Error('User not found');
            return { message: 'OTP sent successfully', devOtp: '123456' };
        }
        return client.post('/auth/forgot-password', { phone });
    },
    resetPassword: async (phone: string, otp: string, newPassword: string) => {
        if (USE_MOCK_ADAPTER) {
            await delay(MOCK_DELAY);
            let user = DB.users.find(u => u.phone === phone);
            if (!user) throw new Error('User not found');
            if (otp !== '123456') throw new Error('Invalid OTP');
            return { message: 'Password reset successfully' };
        }
        return client.post('/auth/reset-password', { phone, otp, newPassword });
    },
    me: async () => {
        if (USE_MOCK_ADAPTER) return null;
        return client.get('/user');
    }
  },
  
  users: {
    getAll: async () => {
        if (USE_MOCK_ADAPTER) { await delay(MOCK_DELAY); return [...DB.users]; }
        return client.get('/users');
    },
    getById: async (id: string) => {
        if (USE_MOCK_ADAPTER) { await delay(MOCK_DELAY); return DB.users.find(u => u.id === id); }
        return client.get(`/users/${id}`);
    },
    getNextId: async () => {
        if (USE_MOCK_ADAPTER) {
            await delay(100);
            const ids = DB.users.map(u => {
                const match = u.id.match(/\d+/);
                return match ? parseInt(match[0], 10) : 0;
            });
            const maxId = Math.max(0, ...ids);
            return `EMP${String(maxId + 1).padStart(5, '0')}`;
        }
        return client.get('/users/next-id');
    },
    create: async (user: Omit<User, 'id'>) => {
        if (USE_MOCK_ADAPTER) {
            await delay(MOCK_DELAY);
            const newId = (user as any).id || `EMP${Date.now()}`;
            const newUser = { ...user, id: newId } as User;
            const current = DB.users;
            DB.users = [newUser, ...current];
            return newUser;
        }
        return client.post('/users', user);
    },
    update: async (user: User) => {
        if (USE_MOCK_ADAPTER) { 
            await delay(MOCK_DELAY); 
            const current = DB.users;
            const idx = current.findIndex(u => u.id === user.id);
            if (idx !== -1) {
                current[idx] = user;
                DB.users = current;
            }
            return user; 
        }
        return client.put(`/users/${user.id}`, user);
    },
    delete: async (id: string) => {
        if (USE_MOCK_ADAPTER) { 
            await delay(MOCK_DELAY); 
            const current = DB.users;
            DB.users = current.filter(u => u.id !== id);
            return true; 
        }
        return client.delete(`/users/${id}`);
    }
  },

  departments: {
    getAll: async () => {
        if (USE_MOCK_ADAPTER) { await delay(MOCK_DELAY); return [...DB.depts]; }
        return client.get('/departments');
    },
    update: async (dept: Department) => {
        if (USE_MOCK_ADAPTER) { 
            await delay(MOCK_DELAY); 
            const current = DB.depts;
            const idx = current.findIndex(d => d.id === dept.id);
            if(idx !== -1) {
                current[idx] = dept;
                DB.depts = current;
            }
            return dept; 
        }
        return client.put(`/departments/${dept.id}`, dept);
    },
    create: async (dept: Omit<Department, 'id'>) => {
        if(USE_MOCK_ADAPTER) { 
            await delay(MOCK_DELAY); 
            const newDept = { ...dept, id: `dep-${Date.now()}` } as Department;
            DB.depts = [...DB.depts, newDept];
            return newDept;
        }
        return client.post('/departments', dept);
    }
  },

  attendance: {
    getToday: async () => {
        if (USE_MOCK_ADAPTER) {
            await delay(MOCK_DELAY);
            const today = new Date().toISOString().split('T')[0];
            return DB.attendance.filter(a => a.date === today);
        }
        return client.get('/attendance?date=today');
    },
    getForUser: async (userId: string) => {
        if (USE_MOCK_ADAPTER) {
            await delay(MOCK_DELAY);
            return DB.attendance.filter(a => a.userId === userId);
        }
        return client.get(`/users/${userId}/attendance`);
    },
    getAll: async () => {
        if (USE_MOCK_ADAPTER) { await delay(MOCK_DELAY); return [...DB.attendance]; }
        return client.get('/attendance');
    },
    clockIn: async (userId: string, location: { lat: number, lng: number }) => {
        if (USE_MOCK_ADAPTER) {
            await delay(MOCK_DELAY);
            const newRec = { 
                id: `att-${Date.now()}`, 
                userId, 
                date: new Date().toISOString().split('T')[0], 
                status: AttendanceStatus.PRESENT,
                clockIn: new Date().toISOString(),
                locationIn: location
            } as AttendanceRecord;
            DB.attendance = [newRec, ...DB.attendance];
            return newRec;
        }
        return client.post('/attendance/clock-in', { userId, location });
    },
    clockOut: async (recordId: string, location: { lat: number, lng: number }) => {
        if (USE_MOCK_ADAPTER) { 
            await delay(MOCK_DELAY); 
            const current = DB.attendance;
            const idx = current.findIndex(a => a.id === recordId);
            if(idx !== -1) {
                current[idx].clockOut = new Date().toISOString();
                current[idx].locationOut = location;
                DB.attendance = current;
                return current[idx];
            }
            return {} as AttendanceRecord; 
        }
        return client.post(`/attendance/${recordId}/clock-out`, { location });
    }
  },

  leaves: {
    getAll: async () => {
        if (USE_MOCK_ADAPTER) { await delay(MOCK_DELAY); return [...DB.leaves]; }
        return client.get('/leaves');
    },
    create: async (request: Partial<LeaveRequest>) => {
        if (USE_MOCK_ADAPTER) { 
            await delay(MOCK_DELAY); 
            const newLeave = { ...request, id: `l-${Date.now()}`, status: LeaveStatus.PENDING } as LeaveRequest;
            DB.leaves = [newLeave, ...DB.leaves];
            return newLeave; 
        }
        return client.post('/leaves', request);
    },
    updateStatus: async (id: string, status: LeaveStatus, rejectionReason?: string) => {
        if (USE_MOCK_ADAPTER) { 
            await delay(MOCK_DELAY); 
            const current = DB.leaves;
            const idx = current.findIndex(x => x.id === id);
            if(idx !== -1) {
                current[idx].status = status;
                current[idx].rejectionReason = rejectionReason;
                DB.leaves = current;
            }
            return { id, status }; 
        }
        return client.put(`/leaves/${id}/status`, { status, rejectionReason });
    },
    getTypes: async () => {
        if(USE_MOCK_ADAPTER) { await delay(MOCK_DELAY); return [...MOCK_LEAVE_TYPES]; }
        return client.get('/leaves/types'); 
    },
    createType: async (type: Omit<LeaveType, 'id'>) => {
        // Leave types are static for mock in this demo, but logic would go here
        if(USE_MOCK_ADAPTER) { await delay(MOCK_DELAY); return { ...type, id: `lt-${Date.now()}` }; }
        return client.post('/leaves/types', type); 
    }
  },

  system: {
      getPermissions: async () => {
          if(USE_MOCK_ADAPTER) { await delay(MOCK_DELAY); return [...MOCK_PERMISSIONS]; }
          return MOCK_PERMISSIONS; 
      },
      updatePermissions: async (permissions: FeaturePermission[]) => {
          if(USE_MOCK_ADAPTER) { await delay(MOCK_DELAY); return permissions; }
          return permissions;
      }
  },

  projects: {
    getAll: async (status?: string) => {
        if (USE_MOCK_ADAPTER) { await delay(MOCK_DELAY); return [...DB.projects]; }
        return client.get(status ? `/projects?status=${encodeURIComponent(status)}` : '/projects');
    },
    getTimeline: async () => {
        if (USE_MOCK_ADAPTER) { await delay(MOCK_DELAY); return [...DB.projects]; }
        return client.get('/projects/timeline');
    },
    getDetails: async (id: string) => {
        if (USE_MOCK_ADAPTER) {
            await delay(MOCK_DELAY);
            const project = DB.projects.find(p => p.id === id);
            const tasks = DB.tasks.filter(t => (t as any).projectId === id);
            return { project, tasks, members: [], milestones: [] };
        }
        // Real backend: fetch project info but always show local tasks
        try {
            const data = await client.get(`/projects/${id}`);
            const localTasks = DB.tasks.filter(t => (t as any).projectId === id);
            return { ...data, tasks: localTasks };
        } catch {
            const project = DB.projects.find(p => p.id === id);
            const tasks = DB.tasks.filter(t => (t as any).projectId === id);
            return { project, tasks, members: [], milestones: [] };
        }
    },
    create: async (project: Omit<Project, 'id'>) => {
        if (USE_MOCK_ADAPTER) { 
            await delay(MOCK_DELAY); 
            const newProj = { ...project, id: `p-${Date.now()}` } as Project;
            DB.projects = [newProj, ...DB.projects];
            return newProj; 
        }
        return client.post('/projects', project);
    },
    update: async (project: Project) => {
        if (USE_MOCK_ADAPTER) { 
            await delay(MOCK_DELAY); 
            const current = DB.projects;
            const idx = current.findIndex(p => p.id === project.id);
            if (idx !== -1) {
                current[idx] = project;
                DB.projects = current;
            }
            return project; 
        }
        return client.put(`/projects/${project.id}`, project);
    },
    delete: async (id: string) => {
        if (USE_MOCK_ADAPTER) { 
            await delay(MOCK_DELAY); 
            const current = DB.projects;
            DB.projects = current.filter(p => p.id !== id);
            return true; 
        }
        return client.delete(`/projects/${id}`);
    },
    assignTeam: async (projectId: string, members: Array<{ userId: string; role: string; allocation: number }>) => {
        if (USE_MOCK_ADAPTER) { await delay(MOCK_DELAY); return { success: true, members }; }
        return client.put(`/projects/${projectId}/team`, { members });
    },
    updateMilestones: async (projectId: string, milestones: Array<{ id: string; title: string; dueDate: string; completed: boolean }>) => {
        if (USE_MOCK_ADAPTER) { await delay(MOCK_DELAY); return { success: true, milestones }; }
        return client.put(`/projects/${projectId}/milestones`, { milestones });
    }
  },

  tasks: {
    getAll: async () => {
        // Always use local DB for tasks (may not have a real endpoint)
        await delay(MOCK_DELAY);
        return [...DB.tasks];
    },
    getByProject: async (projectId: string) => {
        await delay(MOCK_DELAY);
        return DB.tasks.filter((t: any) => t.projectId === projectId);
    },
    create: async (task: any) => {
        await delay(MOCK_DELAY);
        const newTask = { ...task, id: `t-${Date.now()}`, createdAt: new Date().toISOString() };
        DB.tasks = [newTask, ...DB.tasks];
        return newTask;
    },
    update: async (task: Task) => {
        await delay(MOCK_DELAY);
        const current = DB.tasks;
        const idx = current.findIndex(t => t.id === task.id);
        if (idx !== -1) {
            current[idx] = task;
            DB.tasks = current;
        }
        return task;
    },
    delete: async (id: string) => {
        await delay(MOCK_DELAY);
        DB.tasks = DB.tasks.filter(t => t.id !== id);
        return true;
    }
  },

  payroll: {
    getRuns: async () => {
        if (USE_MOCK_ADAPTER) { await delay(MOCK_DELAY); return [...DB.payrollRuns]; }
        return client.get('/payroll/runs');
    },
    getRunDetails: async (runId: string) => {
        if (USE_MOCK_ADAPTER) {
            await delay(MOCK_DELAY);
            return DB.payslips.filter(p => p.payrollRunId === runId);
        }
        return client.get(`/payroll/runs/${runId}/details`);
    },
    getPayslipsForUser: async (userId: string) => {
        if (USE_MOCK_ADAPTER) {
            await delay(MOCK_DELAY);
            return DB.payslips.filter(p => p.userId === userId);
        }
        return client.get(`/payroll/payslips/user/${userId}`);
    },
    createRun: async () => {
        if (USE_MOCK_ADAPTER) { 
            await delay(800); 
            const employees = DB.users;
            
            // Calculate Total Estimated Net Pay for the run based on DB users
            let estimatedTotal = 0;
            const tempPayslips: Payslip[] = [];
            
            const newRun = { 
                id: `run-${Date.now()}`, 
                month: new Date().toISOString().slice(0, 7), 
                status: 'DRAFT', 
                totalEmployees: employees.length, 
                totalNetPay: 0, 
                createdAt: new Date().toISOString() 
            } as PayrollRun;

            employees.forEach(u => {
                const breakdown = calculatePayrollForUser(u);
                estimatedTotal += breakdown.netSalary;
                
                tempPayslips.push({
                    id: `ps-${u.id}-${Date.now()}`,
                    payrollRunId: newRun.id,
                    userId: u.id,
                    month: newRun.month,
                    status: 'DRAFT',
                    generatedAt: new Date().toISOString(),
                    breakdown: breakdown
                } as any);
            });

            newRun.totalNetPay = estimatedTotal;
            
            DB.payrollRuns = [newRun, ...DB.payrollRuns];
            DB.payslips = [...DB.payslips, ...tempPayslips];
            
            return newRun; 
        }
        return client.post('/payroll/runs', {});
    },
    updatePayslip: async (id: string, updates: Partial<Payslip>) => {
        if (USE_MOCK_ADAPTER) { 
            await delay(MOCK_DELAY); 
            const current = DB.payslips;
            const idx = current.findIndex(p => p.id === id);
            if(idx !== -1) {
                current[idx] = { ...current[idx], ...updates };
                DB.payslips = current;
                
                // Update run total
                const runId = current[idx].payrollRunId;
                const runPayslips = current.filter(p => p.payrollRunId === runId);
                const total = runPayslips.reduce((acc, curr) => acc + (curr.breakdown?.netSalary || 0), 0);
                
                const runs = DB.payrollRuns;
                const runIdx = runs.findIndex(r => r.id === runId);
                if(runIdx !== -1) {
                    runs[runIdx].totalNetPay = total;
                    DB.payrollRuns = runs;
                }
            }
            return updates; 
        }
        return client.put(`/payroll/payslips/${id}`, updates); 
    },
    approveRun: async (runId: string) => {
        if (USE_MOCK_ADAPTER) { 
            await delay(MOCK_DELAY); 
            const runs = DB.payrollRuns;
            const idx = runs.findIndex(x => x.id === runId);
            if(idx !== -1) {
                runs[idx].status = 'APPROVED';
                DB.payrollRuns = runs;
            }
            
            // Approve payslips
            const slips = DB.payslips;
            slips.forEach(s => {
                if(s.payrollRunId === runId) s.status = 'APPROVED';
            });
            DB.payslips = slips;
            
            return true; 
        }
        return client.post(`/payroll/runs/${runId}/approve`, {});
    }
  },

  notifications: {
    getAll: async (userId: string) => {
        if (USE_MOCK_ADAPTER) {
            await delay(MOCK_DELAY);
            return DB.notifications.filter(n => n.userId === userId);
        }
        try {
            return await client.get(`/notifications`);
        } catch (error: any) {
            if (error?.message?.includes('404')) return [];
            throw error;
        }
    },
    markRead: async (id: string) => {
        if (USE_MOCK_ADAPTER) {
            const current = DB.notifications;
            const idx = current.findIndex(x => x.id === id);
            if(idx !== -1) {
                current[idx].isRead = true;
                DB.notifications = current;
            }
            return;
        }
        return client.put(`/notifications/${id}/read`, {});
    },
    markAllRead: async (userId: string) => {
        if (USE_MOCK_ADAPTER) {
            const current = DB.notifications;
            current.forEach(n => { if(n.userId === userId) n.isRead = true; });
            DB.notifications = current;
            return;
        }
        return client.post(`/notifications/mark-all-read`, {});
    }
  },

  reports: {
    getStats: async () => {
        if (USE_MOCK_ADAPTER) {
            await delay(MOCK_DELAY);
            
            // REAL TIME CALCULATION FROM DB
            const totalEmployees = DB.users.length;
            const presentToday = DB.attendance.filter(a => a.date === new Date().toISOString().split('T')[0] && a.status === 'PRESENT').length;
            const pendingLeaves = DB.leaves.filter(l => l.status === 'PENDING').length;
            
            // Dynamic Department Stats
            const deptDist = DB.depts.map(d => ({
                name: d.name,
                value: DB.users.filter(u => u.departmentId === d.id).length
            }));

            // Dynamic Leave Stats
            const leaveDist = [
                { name: 'Annual', value: DB.leaves.filter(l => l.type === 'Annual').length }, 
                { name: 'Sick', value: DB.leaves.filter(l => l.type === 'Sick').length },
                { name: 'Unpaid', value: DB.leaves.filter(l => l.type === 'Unpaid').length }
            ];

            return {
                summary: {
                    totalEmployees,
                    presentToday,
                    pendingLeaves,
                    openPositions: 3 // Static for now
                },
                headcountHistory: [
                    { month: 'Mar', count: Math.max(10, totalEmployees - 5) }, 
                    { month: 'Apr', count: Math.max(15, totalEmployees - 2) },
                    { month: 'May', count: totalEmployees }
                ],
                leaveDistribution: leaveDist,
                departmentDistribution: deptDist,
                payrollHistory: [
                    { month: 'Mar', amount: 48000 },
                    { month: 'Apr', amount: 52000 },
                    { month: 'May', amount: 55000 }
                ],
                departmentCosts: [
                    { name: 'Eng', value: 25000 }, { name: 'Sales', value: 15000 }
                ]
            };
        }
        return client.get('/reports/stats');
    }
  },

  chat: {
    getMessages: async (user1Id: string, user2Id: string) => {
        if (USE_MOCK_ADAPTER) {
            await delay(MOCK_DELAY);
            return DB.messages.filter(m => 
                (m.senderId === user1Id && m.receiverId === user2Id) || 
                (m.senderId === user2Id && m.receiverId === user1Id)
            );
        }
        return client.get(`/chat/messages/${user2Id}`);
    },
    getUnreadCount: async (userId: string) => {
        if (USE_MOCK_ADAPTER) {
            await delay(MOCK_DELAY);
            return DB.messages.filter(m => m.receiverId === userId && !m.isRead).length;
        }
        try {
            return await client.get('/chat/unread-count');
        } catch (error: any) {
            if (error?.message?.includes('404')) return 0;
            throw error;
        }
    },
    getRecentContacts: async (userId: string) => {
        if (USE_MOCK_ADAPTER) {
            await delay(MOCK_DELAY);
            const userMessages = DB.messages.filter(m => m.senderId === userId || m.receiverId === userId);
            const contactIds = new Set<string>();
            userMessages.forEach(m => {
                contactIds.add(m.senderId === userId ? m.receiverId : m.senderId);
            });
            return DB.users.filter(u => contactIds.has(u.id));
        }
        try {
            return await client.get('/chat/recent-contacts');
        } catch (error: any) {
            if (error?.message?.includes('404')) return [];
            throw error;
        }
    },
    sendMessage: async (receiverId: string, content: string, attachment?: File, type?: string) => {
        if (USE_MOCK_ADAPTER) { 
            await delay(MOCK_DELAY); 
            const userStr = localStorage.getItem('hcms_user');
            const senderId = userStr ? JSON.parse(userStr).id : 'unknown';
            
            const newMsg = {
                id: `msg-${Date.now()}`,
                senderId,
                receiverId,
                content,
                createdAt: new Date().toISOString(),
                isRead: false
            } as Message;
            
            DB.messages = [...DB.messages, newMsg];
            return newMsg; 
        }

        const formData = new FormData();
        formData.append('receiverId', receiverId);
        if(content) formData.append('content', content);
        if (attachment) {
            formData.append('attachment', attachment);
            if(type) formData.append('attachmentType', type);
        }
        return client.post('/chat/messages', formData);
    }
  },

  recruitment: {
    getJobs: async () => {
        if (USE_MOCK_ADAPTER) { await delay(MOCK_DELAY); return [...DB.jobs]; }
        return client.get('/jobs');
    },
    createJob: async (job: Omit<Job, 'id'>) => {
        if (USE_MOCK_ADAPTER) {
            await delay(MOCK_DELAY);
            const newJob = { ...job, id: `j-${Date.now()}` } as Job;
            DB.jobs = [newJob, ...DB.jobs];
            return newJob;
        }
        return client.post('/jobs', job);
    },
    updateJob: async (job: Job) => {
        if (USE_MOCK_ADAPTER) {
            await delay(MOCK_DELAY);
            const current = DB.jobs;
            const idx = current.findIndex(j => j.id === job.id);
            if (idx !== -1) {
                current[idx] = job;
                DB.jobs = current;
            }
            return job;
        }
        return client.put(`/jobs/${job.id}`, job);
    },
    deleteJob: async (id: string) => {
        if (USE_MOCK_ADAPTER) {
            await delay(MOCK_DELAY);
            DB.jobs = DB.jobs.filter(j => j.id !== id);
            return true;
        }
        return client.delete(`/jobs/${id}`);
    },
    getCandidates: async () => {
        if (USE_MOCK_ADAPTER) { await delay(MOCK_DELAY); return [...DB.candidates]; }
        return client.get('/candidates');
    },
    createCandidate: async (candidate: Omit<Candidate, 'id'>) => {
        if (USE_MOCK_ADAPTER) {
            await delay(MOCK_DELAY);
            const newCandidate = { ...candidate, id: `c-${Date.now()}` } as Candidate;
            DB.candidates = [newCandidate, ...DB.candidates];
            return newCandidate;
        }
        return client.post('/candidates', candidate);
    },
    updateCandidate: async (candidate: Candidate) => {
        if (USE_MOCK_ADAPTER) {
            await delay(MOCK_DELAY);
            const current = DB.candidates;
            const idx = current.findIndex(c => c.id === candidate.id);
            if (idx !== -1) {
                current[idx] = candidate;
                DB.candidates = current;
            }
            return candidate;
        }
        return client.put(`/candidates/${candidate.id}`, candidate);
    },
    deleteCandidate: async (id: string) => {
        if (USE_MOCK_ADAPTER) {
            await delay(MOCK_DELAY);
            DB.candidates = DB.candidates.filter(c => c.id !== id);
            return true;
        }
        return client.delete(`/candidates/${id}`);
    }
  }
};
