import { User, Role, Department, AttendanceRecord, AttendanceStatus, LeaveRequest, LeaveStatus, Project, ProjectStatus, Task, TaskStatus, Notification, NotificationType, Message, PayrollRun, Payslip, LeaveType, FeaturePermission, Job, Candidate, ApplicationStatus } from '../types';

export const MOCK_DEPARTMENTS: Department[] = [
    { id: 'dep-1', name: 'Engineering', headCount: 12, geoFence: { latitude: 11.5564, longitude: 104.9282, radius: 100 } },
    { id: 'dep-2', name: 'Human Resources', headCount: 4, geoFence: { latitude: 11.5564, longitude: 104.9282, radius: 100 } },
    { id: 'dep-3', name: 'Sales', headCount: 8, geoFence: { latitude: 11.5564, longitude: 104.9282, radius: 100 } },
];

export const MOCK_JOBS: Job[] = [
    { id: 'j-1', title: 'Senior Frontend Developer', departmentId: 'dep-1', description: 'We are looking for an experienced React developer.', requirements: ['React', 'TypeScript', 'Tailwind'], status: 'OPEN', postedDate: '2023-10-01', location: 'Phnom Penh', salaryRange: '$1500 - $2500', type: 'Full-time' },
    { id: 'j-2', title: 'HR Assistant', departmentId: 'dep-2', description: 'Assist with daily HR operations.', requirements: ['Communication', 'Organization'], status: 'OPEN', postedDate: '2023-10-05', location: 'Phnom Penh', salaryRange: '$500 - $800', type: 'Internship' },
];

export const MOCK_CANDIDATES: Candidate[] = [
    { id: 'c-1', jobId: 'j-1', name: 'Sophea Ly', email: 'sophea@example.com', phone: '012345678', status: ApplicationStatus.APPLIED, appliedDate: '2023-10-10', rating: 0 },
    { id: 'c-2', jobId: 'j-1', name: 'Veasna Chan', email: 'veasna@example.com', phone: '098765432', status: ApplicationStatus.INTERVIEW, appliedDate: '2023-10-08', rating: 4 },
];

export const MOCK_USERS: User[] = [
    { id: 'u-1', name: 'Sokha Chan', email: 'admin@company.com', role: Role.ADMIN, departmentId: 'dep-1', position: 'CTO', avatarUrl: 'https://i.pravatar.cc/150?u=1', joinDate: '2020-01-01', salary: 2500, phone: '012345678', address: 'Phnom Penh' },
    { id: 'u-2', name: 'Dara Kim', email: 'hr@company.com', role: Role.HR, departmentId: 'dep-2', position: 'HR Manager', avatarUrl: 'https://i.pravatar.cc/150?u=2', joinDate: '2021-03-15', salary: 1800, phone: '098765432', address: 'Siem Reap' },
    { id: 'u-3', name: 'Vibol Meas', email: 'manager@company.com', role: Role.MANAGER, departmentId: 'dep-1', position: 'Eng Manager', avatarUrl: 'https://i.pravatar.cc/150?u=3', joinDate: '2021-06-01', salary: 2000, phone: '011223344', address: 'Phnom Penh' },
    { id: 'u-4', name: 'Bopha Keo', email: 'employee@company.com', role: Role.EMPLOYEE, departmentId: 'dep-1', position: 'Developer', avatarUrl: 'https://i.pravatar.cc/150?u=4', joinDate: '2022-01-10', salary: 1200, phone: '077889900', address: 'Battambang' },
];

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
    { id: 'att-1', userId: 'u-4', date: new Date().toISOString().split('T')[0], status: AttendanceStatus.PRESENT, clockIn: new Date().toISOString(), locationIn: { lat: 11.5564, lng: 104.9282 } },
];

export const MOCK_LEAVES: LeaveRequest[] = [
    { id: 'l-1', userId: 'u-4', type: 'Annual', startDate: '2023-11-01', endDate: '2023-11-03', reason: 'Vacation', status: LeaveStatus.PENDING },
];

export const MOCK_PROJECTS: Project[] = [
    { id: 'p-1', title: 'Website Redesign', description: 'Revamp corporate website with modern design', departmentId: 'dep-1', leadId: 'u-3', status: ProjectStatus.ACTIVE, progress: 0, startDate: '2026-04-01', deadline: '2026-06-30' },
];

export const MOCK_TASKS: Task[] = [
    { id: 't-1', title: 'UI Design Refinement', description: 'Polish the landing page layout', assigneeId: 'u-4', creatorId: 'u-3', projectId: 'p-1', status: TaskStatus.DONE, progress: 100, dueDate: '2026-04-15', createdAt: '2026-04-01', startDate: '2026-04-02', priority: 'HIGH' },
    { id: 't-2', title: 'Responsive Testing', description: 'Verify mobile views', assigneeId: 'u-4', creatorId: 'u-3', projectId: 'p-1', status: TaskStatus.IN_PROGRESS, progress: 45, dueDate: '2026-04-28', createdAt: '2026-04-05', startDate: '2026-04-06', priority: 'MEDIUM' },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
    { id: 'n-1', userId: 'u-4', title: 'Leave Approved', message: 'Your leave request has been approved.', type: NotificationType.SUCCESS, isRead: false, createdAt: new Date().toISOString() },
];

export const MOCK_MESSAGES: Message[] = [
    { id: 'm-1', senderId: 'u-3', receiverId: 'u-4', content: 'Hey, how is the bug fix going?', createdAt: new Date(Date.now() - 3600000).toISOString(), isRead: true },
    { id: 'm-2', senderId: 'u-4', receiverId: 'u-3', content: 'Almost done, pushing soon.', createdAt: new Date(Date.now() - 1800000).toISOString(), isRead: false },
];

export const MOCK_PAYROLL_RUNS: PayrollRun[] = [];
export const MOCK_PAYSLIPS: Payslip[] = [];

export const MOCK_LEAVE_TYPES: LeaveType[] = [
    { id: 'lt-1', name: 'Annual', isPaid: true, daysAllowed: 18 },
    { id: 'lt-2', name: 'Sick', isPaid: true, daysAllowed: 7 },
    { id: 'lt-3', name: 'Unpaid', isPaid: false, daysAllowed: 30 },
    { id: 'lt-4', name: 'Maternity', isPaid: true, daysAllowed: 90 },
];

export const MOCK_PERMISSIONS: FeaturePermission[] = [
    { feature: 'manage_users', roles: [Role.ADMIN, Role.HR] },
    { feature: 'approve_leaves', roles: [Role.ADMIN, Role.HR, Role.MANAGER] },
    { feature: 'view_payroll', roles: [Role.ADMIN, Role.HR] },
];
