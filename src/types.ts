
export enum Role {
  ADMIN = 'ADMIN',     
  HR = 'HR',           
  MANAGER = 'MANAGER', 
  EMPLOYEE = 'EMPLOYEE'
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  LATE = 'LATE',
  ABSENT = 'ABSENT',
  ON_LEAVE = 'ON_LEAVE',
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
  BLOCKED = 'BLOCKED',
}

export enum NotificationType {
  INFO = 'INFO',
  WARNING = 'WARNING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface Department {
  id: string;
  name: string;
  headCount: number;
  managerId?: string;
  geoFence: {
    latitude: number;
    longitude: number;
    radius: number; // meters
  };
}

export interface Position {
    id: string;
    title: string;
    departmentId: string;
}

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId: string;
  position: string;
  avatarUrl: string;
  joinDate: string;
  salary?: number;
  birthDate?: string;
  shiftStart?: string; 
  shiftEnd?: string;   
  phone?: string;
  address?: string;
  dependents?: number; 
  emergencyContact?: EmergencyContact;
  token?: string; 
  permissionsOverride?: Record<string, boolean>; // Granular overrides
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  attachmentPath?: string;
  attachmentType?: 'image' | 'file' | 'audio';
  createdAt: string;
  isRead: boolean;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  clockIn?: string; // ISO string
  clockOut?: string; // ISO string
  status: AttendanceStatus;
  locationIn?: { lat: number; lng: number; address?: string };
  locationOut?: { lat: number; lng: number; address?: string };
}

// Updated to support dynamic types
export interface LeaveType {
    id: string;
    name: string;
    isPaid: boolean;
    daysAllowed: number;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  type: string; // Now refers to LeaveType.name
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  rejectionReason?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  departmentId: string;
  leadId: string;
  status: ProjectStatus;
  progress: number;
  startDate?: string;
  deadline: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  members?: Array<{ userId: string; role: string; allocation: number }>;
  milestones?: Array<{ id: string; title: string; dueDate: string; completed: boolean }>;
  totalTasks?: number;
  completedTasks?: number;
}

export interface Task {
  id: string;
  projectId?: string;
  title: string;
  description: string;
  assigneeId: string;
  creatorId: string;
  status: TaskStatus;
  progress: number; // 0-100
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  startDate?: string;
  dueDate: string; 
  createdAt: string;
  estimatedHours?: number;
  loggedHours?: number;
  dependencies?: string[];
  subtasks?: Array<{ id: string; title: string; done: boolean }>;
  comments?: Array<{ id: string; userId: string; message: string; createdAt: string }>;
}

// PAYROLL TYPES
export type PayrollStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PAID';

export interface SalaryBreakdown {
    baseSalary: number;
    proratedDays: number; 
    allowances: {
        transport: number;
        attendance: number; 
        meal: number;
        seniority: number; 
    };
    overtime: {
        hours150: number; 
        amount150: number;
        hours200: number; 
        amount200: number;
        total: number;
    };
    grossSalary: number;
    deductions: {
        nssf: number; 
        taxOnSalary: number; 
        absences: number;
        advances: number;
        total: number;
    };
    netSalary: number;
    exchangeRate: number; 
    netSalaryKHR: number;
}

export interface PayrollRun {
    id: string;
    month: string; 
    status: PayrollStatus;
    totalEmployees: number;
    totalNetPay: number;
    createdAt: string;
    approvedBy?: string;
}

export interface Payslip {
  id: string;
  payrollRunId: string;
  userId: string;
  month: string; 
  breakdown: SalaryBreakdown;
  status: PayrollStatus;
  generatedAt: string;
  basicSalary?: number;
  deductions?: number;
  netPay?: number;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'Public' | 'Company';
  description?: string;
}

export interface FeaturePermission {
    feature: string; // e.g., 'manage_users', 'approve_leaves'
    roles: Role[];
}

export enum ApplicationStatus {
  APPLIED = 'APPLIED',
  SCREENING = 'SCREENING',
  INTERVIEW = 'INTERVIEW',
  OFFER = 'OFFER',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED'
}

export interface Job {
  id: string;
  title: string;
  departmentId: string;
  description: string;
  requirements: string[];
  status: 'OPEN' | 'CLOSED';
  postedDate: string;
  location: string;
  salaryRange?: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
}

export interface Candidate {
  id: string;
  jobId: string;
  name: string;
  email: string;
  phone: string;
  resumeUrl?: string; // URL to the uploaded CV
  status: ApplicationStatus;
  appliedDate: string;
  notes?: string;
  rating?: number;
  matchScore?: number; // 0-100 score based on keyword matching
}
