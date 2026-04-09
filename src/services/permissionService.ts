
import { Role } from '../types';

export interface Permission {
  id: string;
  name: string;
  key: string;
  module: string;
  category: string;
  description: string;
  isSensitive: boolean;
}

export interface RolePermission {
  role: string | Role;
  permission_id: string;
  permission_key: string;
  granted: boolean;
}

const STORAGE_KEYS = {
  PERMISSIONS: 'hcms_perm_list',
  ROLE_PERMISSIONS: 'hcms_role_perm_matrix',
  OVERRIDES: 'hcms_user_perm_overrides'
};

const DEFAULT_PERMISSIONS: Permission[] = [
  // --- SYSTEM MODULE ---
  { id: 'p1', name: 'Create Users', key: 'system.users.create', module: 'System', category: 'System', description: 'Create new user accounts', isSensitive: true },
  { id: 'p1_e', name: 'Edit Users', key: 'system.users.edit', module: 'System', category: 'System', description: 'Modify existing user accounts', isSensitive: true },
  { id: 'p1_d', name: 'Delete Users', key: 'system.users.delete', module: 'System', category: 'System', description: 'Permanently remove users', isSensitive: true },
  { id: 'p2', name: 'Create Roles', key: 'system.roles.create', module: 'System', category: 'System', description: 'Define new security roles', isSensitive: true },
  { id: 'p2_e', name: 'Edit Roles', key: 'system.roles.edit', module: 'System', category: 'System', description: 'Modify existing roles and permissions', isSensitive: true },
  { id: 'p3', name: 'View System Settings', key: 'system.settings.view', module: 'System', category: 'System', description: 'Access organization configuration', isSensitive: true },
  { id: 'p3_e', name: 'Edit System Settings', key: 'system.settings.edit', module: 'System', category: 'System', description: 'Update organization policies', isSensitive: true },
  { id: 'p4_v', name: 'View Management Dashboard', key: 'dashboard.view', module: 'System', category: 'System', description: 'Access administrative analytics', isSensitive: false },
  
  // --- HR / EMPLOYEE MODULE ---
  { id: 'p10_v', name: 'View Employees', key: 'hr.employee.view', module: 'Employees', category: 'HR', description: 'Access employee directory', isSensitive: false },
  { id: 'p10_c', name: 'Create Employees', key: 'hr.employee.create', module: 'Employees', category: 'HR', description: 'Add new staff members (Hire)', isSensitive: true },
  { id: 'p10_ep', name: 'Edit Personal Details', key: 'hr.employee.edit.personal', module: 'Employees', category: 'HR', description: 'Modify employee personal contact and bio info', isSensitive: false },
  { id: 'p10_ej', name: 'Edit Job & Position', key: 'hr.employee.edit.job', module: 'Employees', category: 'HR', description: 'Modify employee roles, departments, and status', isSensitive: true },
  { id: 'p10_er', name: 'Edit Payroll Info', key: 'hr.employee.edit.payroll', module: 'Employees', category: 'HR', description: 'Modify employee salary, banking, and tax info', isSensitive: true },
  { id: 'p10_d', name: 'Terminate Employees', key: 'hr.employee.delete', module: 'Employees', category: 'HR', description: 'Remove staff from active duty', isSensitive: true },
  { id: 'p12_c', name: 'Create Departments', key: 'hr.departments.create', module: 'Departments', category: 'HR', description: 'Initialize new company departments', isSensitive: false },
  { id: 'p12_e', name: 'Edit Departments', key: 'hr.departments.edit', module: 'Departments', category: 'HR', description: 'Update department details and leads', isSensitive: false },
  { id: 'p12_v', name: 'View Departments', key: 'hr.departments.view', module: 'Departments', category: 'HR', description: 'Access department directory', isSensitive: false },
  { id: 'p13_v', name: 'View Profile', key: 'profile.view', module: 'Employees', category: 'HR', description: 'Access personal employee profile', isSensitive: false },
  { id: 'p13_e', name: 'Edit Profile', key: 'profile.edit', module: 'Employees', category: 'HR', description: 'Modify personal profile details', isSensitive: false },
  
  // --- ATTENDANCE MODULE ---
  { id: 'p20_v', name: 'View Logs', key: 'attendance.view', module: 'Attendance', category: 'HR', description: 'Monitor daily check-ins', isSensitive: false },
  { id: 'p20_c', name: 'Log Attendance', key: 'attendance.create', module: 'Attendance', category: 'HR', description: 'Ability to check-in and check-out', isSensitive: false },
  { id: 'p20_e', name: 'Edit Logs', key: 'attendance.edit', module: 'Attendance', category: 'HR', description: 'Manually adjust attendance records', isSensitive: true },
  { id: 'p20_d', name: 'Delete Logs', key: 'attendance.delete', module: 'Attendance', category: 'HR', description: 'Remove attendance history', isSensitive: true },
  
  // --- LEAVE MODULE ---
  { id: 'p30_c', name: 'Submit Requests', key: 'leave.create', module: 'Leaves', category: 'HR', description: 'Submit personalized leave requests', isSensitive: false },
  { id: 'p30_e', name: 'Edit Requests', key: 'leave.edit', module: 'Leaves', category: 'HR', description: 'Update pending leave details', isSensitive: false },
  { id: 'p31_a', name: 'Approve/Reject', key: 'leave.process', module: 'Leaves', category: 'HR', description: 'Approve or deny team leave applications', isSensitive: true },
  
  // --- PROJECTS MODULE ---
  { id: 'p40_v', name: 'View Projects', key: 'projects.view', module: 'Projects', category: 'Projects', description: 'Access project dashboards', isSensitive: false },
  { id: 'p40_c', name: 'Create Projects', key: 'projects.create', module: 'Projects', category: 'Projects', description: 'Initialize new project roadmaps', isSensitive: true },
  { id: 'p40_ei', name: 'Edit Project Info', key: 'projects.edit.info', module: 'Projects', category: 'Projects', description: 'Modify project titles and descriptions', isSensitive: false },
  { id: 'p40_el', name: 'Assign Project Leads', key: 'projects.edit.lead', module: 'Projects', category: 'Projects', description: 'Change the lead responsible for the project', isSensitive: true },
  { id: 'p40_es', name: 'Update Project Status', key: 'projects.edit.status', module: 'Projects', category: 'Projects', description: 'Transitions project between active/planning/complete', isSensitive: false },
  { id: 'p40_d', name: 'Delete Projects', key: 'projects.delete', module: 'Projects', category: 'Projects', description: 'Permanently remove projects', isSensitive: true },
  
  // --- TASKS MODULE ---
  { id: 'p41_c', name: 'Create Tasks', key: 'tasks.create', module: 'Tasks', category: 'Tasks', description: 'Add new tasks to projects', isSensitive: false },
  { id: 'p41_a', name: 'Assign Tasks', key: 'tasks.assign', module: 'Tasks', category: 'Tasks', description: 'Assign tasks to other team members', isSensitive: false },
  { id: 'p41_i', name: 'Edit Task Info', key: 'tasks.edit.info', module: 'Tasks', category: 'Tasks', description: 'Modify task titles and descriptions', isSensitive: false },
  { id: 'p41_t', name: 'Edit Task Timeline', key: 'tasks.edit.dates', module: 'Tasks', category: 'Tasks', description: 'Adjust task start and end dates', isSensitive: false },
  { id: 'p41_p', name: 'Update Progress', key: 'tasks.progress', module: 'Tasks', category: 'Tasks', description: 'Update task percentage and status', isSensitive: false },
  { id: 'p41_d', name: 'Delete Tasks', key: 'tasks.delete', module: 'Tasks', category: 'Tasks', description: 'Remove tasks from projects', isSensitive: true },

  // --- PAYROLL MODULE ---
  { id: 'p50_v', name: 'View Payroll', key: 'payroll.view', module: 'Payroll', category: 'Finance', description: 'Access compensation records', isSensitive: true },
  { id: 'p50_p', name: 'Process Payroll', key: 'payroll.run', module: 'Payroll', category: 'Finance', description: 'Generate and lock monthly payroll', isSensitive: true },
  { id: 'p50_e', name: 'Edit Payslips', key: 'payroll.edit', module: 'Payroll', category: 'Finance', description: 'Adjust individual payslip items', isSensitive: true },

  // --- RECRUITMENT MODULE ---
  { id: 'p60_c', name: 'Post Jobs', key: 'recruitment.jobs.create', module: 'Recruitment', category: 'HR', description: 'Publish new job vacancies', isSensitive: false },
  { id: 'p60_e', name: 'Edit Jobs', key: 'recruitment.jobs.edit', module: 'Recruitment', category: 'HR', description: 'Modify existing job postings', isSensitive: false },
  { id: 'p61_m', name: 'Manage Applicants', key: 'recruitment.apps.process', module: 'Recruitment', category: 'HR', description: 'Review and transition candidate stages', isSensitive: false },
  { id: 'p61_d', name: 'Reject/Delete Apps', key: 'recruitment.apps.delete', module: 'Recruitment', category: 'HR', description: 'Remove or decline candidates', isSensitive: false },

  // --- COMMUNICATION ---
  { id: 'p70_a', name: 'Access Chat', key: 'chat.access', module: 'Communication', category: 'Communication', description: 'Use messaging features', isSensitive: false },
  { id: 'p71_c', name: 'Clear History', key: 'chat.clear', module: 'Communication', category: 'Communication', description: 'Delete conversation logs', isSensitive: false },
];

class PermissionPersistence {
  private pCache: Permission[] | null = null;
  private rpCache: RolePermission[] | null = null;
  private oCache: UserOverride[] | null = null;

  getAll(): Permission[] {
    if (this.pCache) return this.pCache;
    const saved = localStorage.getItem(STORAGE_KEYS.PERMISSIONS);
    if (saved) {
      this.pCache = JSON.parse(saved);
      // Check if current storage is legacy (shorter than expected OR contains old keys)
      const hasOldKeys = this.pCache!.some(p => p.name === 'Manage Shared Tasks' || p.key === 'tasks.manage');
      if (this.pCache!.length < 60 || hasOldKeys) {
        localStorage.removeItem(STORAGE_KEYS.PERMISSIONS);
        localStorage.removeItem(STORAGE_KEYS.ROLE_PERMISSIONS);
        this.pCache = null;
        return this.getAll();
      }
      return this.pCache!;
    }
    this.savePermissions(DEFAULT_PERMISSIONS);
    return DEFAULT_PERMISSIONS;
  }

  savePermissions(perms: Permission[]): void {
    this.pCache = perms;
    localStorage.setItem(STORAGE_KEYS.PERMISSIONS, JSON.stringify(perms));
  }

  getRolePermissions(role: string): RolePermission[] {
    const all = this.getAllRolePermissions();
    return all.filter(rp => rp.role === role);
  }

  getAllRolePermissions(): RolePermission[] {
    if (this.rpCache) return this.rpCache;
    const saved = localStorage.getItem(STORAGE_KEYS.ROLE_PERMISSIONS);
    if (saved) {
      const parsed = JSON.parse(saved) as RolePermission[];
      
      // MIGRATION: Check if any new default permissions are missing from the saved cache
      const perms = this.getAll();
      let needsSync = false;
      
      perms.forEach(p => {
        const exists = parsed.some(rp => rp.permission_key === p.key);
        if (!exists) {
          needsSync = true;
          parsed.push({ role: 'ADMIN', permission_id: p.id, permission_key: p.key, granted: true });
          parsed.push({ role: 'HR', permission_id: p.id, permission_key: p.key, granted: p.category === 'HR' || p.category === 'Communication' || p.name.includes('View') || p.key === 'dashboard.view' });
          parsed.push({ role: 'MANAGER', permission_id: p.id, permission_key: p.key, granted: p.name.includes('View') || p.category === 'Projects' || p.key === 'leave.process' || p.key === 'dashboard.view' || p.module === 'Tasks' || p.key === 'hr.employee.edit.job' });
          parsed.push({ role: 'EMPLOYEE', permission_id: p.id, permission_key: p.key, granted: p.key.includes('.view') || p.key === 'leave.create' || p.key === 'chat.access' || p.key === 'attendance.create' || p.key === 'tasks.progress' || p.key === 'profile.view' || p.key === 'profile.edit' });
        }
      });

      // Special force-grant for tasks.progress for existing Employee records
      const empProg = parsed.find(rp => rp.role === 'EMPLOYEE' && rp.permission_key === 'tasks.progress');
      if (empProg && !empProg.granted) {
        empProg.granted = true;
        needsSync = true;
      }

      if (needsSync) {
        this.saveRolePermissions(parsed);
      }

      this.rpCache = parsed;
      return parsed;
    }
    
    // Initialize defaults (ADMIN has everything)
    const initial: RolePermission[] = [];
    const perms = this.getAll();
    perms.forEach(p => {
      initial.push({ role: 'ADMIN', permission_id: p.id, permission_key: p.key, granted: true });
      initial.push({ role: 'HR', permission_id: p.id, permission_key: p.key, granted: p.category === 'HR' || p.category === 'Communication' || p.name.includes('View') });
      initial.push({ role: 'MANAGER', permission_id: p.id, permission_key: p.key, granted: p.name.includes('View') || p.category === 'Projects' || p.key === 'leave.process' });
      initial.push({ role: 'EMPLOYEE', permission_id: p.id, permission_key: p.key, granted: p.key.includes('.view') || p.key === 'leave.create' || p.key === 'chat.access' || p.key === 'attendance.create' || p.key === 'tasks.progress' });
    });

    this.saveRolePermissions(initial);
    return initial;
  }

  updateRolePermission(role: string, permissionId: string, granted: boolean): void {
    const all = this.getAllRolePermissions();
    const perm = this.getAll().find(p => p.id === permissionId);
    const idx = all.findIndex(rp => rp.role === role && rp.permission_id === permissionId);
    
    if (idx !== -1) {
      all[idx].granted = granted;
    } else if (perm) {
      all.push({ role, permission_id: permissionId, permission_key: perm.key, granted });
    }
    
    this.saveRolePermissions(all);
  }

  saveRolePermissions(rps: RolePermission[]): void {
    this.rpCache = rps;
    localStorage.setItem(STORAGE_KEYS.ROLE_PERMISSIONS, JSON.stringify(rps));
  }

  // --- USER OVERRIDES ---
  getUserOverrides(userId?: string): UserOverride[] {
    const all = this.getAllUserOverrides();
    if (userId) return all.filter(o => o.userId === userId);
    return all;
  }

  getAllUserOverrides(): UserOverride[] {
    if (this.oCache) return this.oCache;
    const saved = localStorage.getItem(STORAGE_KEYS.OVERRIDES);
    if (saved) {
      this.oCache = JSON.parse(saved);
      return this.oCache!;
    }
    return [];
  }

  saveUserOverrides(overrides: UserOverride[]): void {
    this.oCache = overrides;
    localStorage.setItem(STORAGE_KEYS.OVERRIDES, JSON.stringify(overrides));
  }

  addUserOverride(userId: string, permissionId: string, type: 'GRANT' | 'REVOKE', reason: string, expiresAt?: string | null): UserOverride {
    const all = this.getAllUserOverrides();
    const newOverride: UserOverride = {
      id: `ov-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      permissionId,
      overrideType: type,
      reason,
      grantedBy: 'System Admin',
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt || null,
      status: 'ACTIVE'
    };
    all.push(newOverride);
    this.saveUserOverrides(all);
    return newOverride;
  }

  removeUserOverride(overrideId: string): void {
    const all = this.getAllUserOverrides();
    const filtered = all.filter(o => o.id !== overrideId);
    this.saveUserOverrides(filtered);
  }
}

export interface UserOverride {
  id: string;
  userId: string;
  permissionId: string;
  overrideType: 'GRANT' | 'REVOKE';
  reason: string;
  grantedBy: string;
  createdAt: string;
  expiresAt: string | null;
  status: string;
}

export const permissionService = new PermissionPersistence();
