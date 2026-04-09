import { User, Role, Department, AttendanceRecord, AttendanceStatus, LeaveRequest, LeaveStatus, LeaveType, Project, ProjectStatus, Task, TaskStatus, PayrollRun, Payslip } from '../src/types';

// Helper to generate random date within range
const randomDate = (start: Date, end: Date) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Helper to get random item from array
const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// --- DEPARTMENTS ---
export const generateDepartments = (): Department[] => [
    { id: 'dep-1', name: 'Engineering', managerId: 'EMP001', employeeCount: 0, budget: 500000 },
    { id: 'dep-2', name: 'Human Resources', managerId: 'EMP002', employeeCount: 0, budget: 150000 },
    { id: 'dep-3', name: 'Sales & Marketing', managerId: 'EMP005', employeeCount: 0, budget: 300000 },
    { id: 'dep-4', name: 'Finance', managerId: 'EMP010', employeeCount: 0, budget: 200000 },
    { id: 'dep-5', name: 'Customer Support', managerId: 'EMP015', employeeCount: 0, budget: 100000 },
    { id: 'dep-6', name: 'Product', managerId: 'EMP020', employeeCount: 0, budget: 250000 },
];

// --- USERS ---
const FIRST_NAMES = ['Sok', 'Chan', 'Dara', 'Bopha', 'Vibol', 'Srey', 'Chea', 'Rith', 'Sophea', 'Kanya', 'Visal', 'Nary', 'Tola', 'Vanna', 'Sothea', 'Phalla', 'Sokha', 'Veasna', 'Davy', 'Samnang'];
const LAST_NAMES = ['Heng', 'Sok', 'Chan', 'Chea', 'Ly', 'Lim', 'Ngoun', 'Sim', 'Keo', 'Ros', 'Mao', 'Chhem', 'Pech', 'Sem', 'Van', 'Touch', 'Ouk', 'Khun', 'Prom', 'Meas'];
const POSITIONS = ['Software Engineer', 'HR Specialist', 'Sales Executive', 'Accountant', 'Support Agent', 'Product Manager', 'Designer', 'QA Engineer', 'Data Analyst', 'Marketing Specialist'];

export const generateUsers = (count: number, depts: Department[]): User[] => {
    const users: User[] = [];
    
    // Admin User
    users.push({
        id: 'EMP000',
        name: 'Admin User',
        email: 'admin@hcms.com',
        role: Role.ADMIN,
        departmentId: 'dep-1',
        position: 'System Administrator',
        joinDate: '2020-01-01',
        status: 'Active',
        avatarUrl: 'https://i.pravatar.cc/150?u=EMP000',
        salary: 3000,
        phone: '012345678',
        address: 'Phnom Penh',
        bankAccount: '123-456-789',
        nationalId: '123456789',
        taxId: 'TAX123',
        nssfId: 'NSSF123',
        dependents: 0,
        shiftStart: '08:00',
        shiftEnd: '17:00'
    });

    for (let i = 1; i < count; i++) {
        const dept = randomItem(depts);
        const firstName = randomItem(FIRST_NAMES);
        const lastName = randomItem(LAST_NAMES);
        const role = i < 5 ? Role.MANAGER : (i < 10 ? Role.HR : Role.EMPLOYEE);
        
        users.push({
            id: `EMP${String(i).padStart(3, '0')}`,
            name: `${lastName} ${firstName}`,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@hcms.com`,
            role: role,
            departmentId: dept.id,
            position: randomItem(POSITIONS),
            joinDate: randomDate(new Date(2020, 0, 1), new Date()).toISOString().split('T')[0],
            status: 'Active',
            avatarUrl: `https://i.pravatar.cc/150?u=EMP${i}`,
            salary: Math.floor(Math.random() * 2000) + 500,
            phone: `0${Math.floor(Math.random() * 90000000 + 10000000)}`,
            address: 'Phnom Penh, Cambodia',
            bankAccount: `${Math.floor(Math.random() * 1000)}-${Math.floor(Math.random() * 1000)}-${Math.floor(Math.random() * 1000)}`,
            nationalId: String(Math.floor(Math.random() * 1000000000)),
            taxId: `TAX${Math.floor(Math.random() * 10000)}`,
            nssfId: `NSSF${Math.floor(Math.random() * 10000)}`,
            dependents: Math.floor(Math.random() * 4),
            shiftStart: '08:00',
            shiftEnd: '17:00',
            birthDate: randomDate(new Date(1980, 0, 1), new Date(2000, 0, 1)).toISOString().split('T')[0]
        });
    }
    return users;
};

// --- ATTENDANCE ---
export const generateAttendance = (users: User[], days: number): AttendanceRecord[] => {
    const records: AttendanceRecord[] = [];
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue;

        users.forEach(user => {
            // 90% chance of being present
            if (Math.random() > 0.1) {
                const clockInHour = 7 + Math.random() * 2; // 7:00 - 9:00
                const clockOutHour = 17 + Math.random() * 2; // 17:00 - 19:00
                
                const clockIn = new Date(date);
                clockIn.setHours(Math.floor(clockInHour), Math.floor((clockInHour % 1) * 60));
                
                const clockOut = new Date(date);
                clockOut.setHours(Math.floor(clockOutHour), Math.floor((clockOutHour % 1) * 60));

                records.push({
                    id: `att-${user.id}-${dateStr}`,
                    userId: user.id,
                    date: dateStr,
                    status: clockInHour > 8.5 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT,
                    clockIn: clockIn.toISOString(),
                    clockOut: clockOut.toISOString(),
                    locationIn: { lat: 11.5564, lng: 104.9282 },
                    locationOut: { lat: 11.5564, lng: 104.9282 }
                });
            } else {
                records.push({
                    id: `att-${user.id}-${dateStr}`,
                    userId: user.id,
                    date: dateStr,
                    status: AttendanceStatus.ABSENT
                });
            }
        });
    }
    return records;
};

// --- LEAVES ---
export const generateLeaves = (users: User[]): LeaveRequest[] => {
    const leaves: LeaveRequest[] = [];
    const types = ['Annual', 'Sick', 'Unpaid', 'Maternity'];
    
    for (let i = 0; i < 100; i++) {
        const user = randomItem(users);
        const startDate = randomDate(new Date(2023, 0, 1), new Date());
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 5) + 1);
        
        leaves.push({
            id: `leave-${i}`,
            userId: user.id,
            type: randomItem(types),
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            reason: 'Personal matters',
            status: randomItem([LeaveStatus.APPROVED, LeaveStatus.PENDING, LeaveStatus.REJECTED]),
            appliedAt: new Date(startDate.getTime() - 86400000 * 5).toISOString()
        });
    }
    return leaves;
};

// --- PROJECTS & TASKS ---
export const generateProjects = (users: User[]): { projects: Project[], tasks: Task[] } => {
    const projects: Project[] = [];
    const tasks: Task[] = [];
    const projectNames = ['Website Redesign', 'Mobile App V2', 'Q3 Marketing Campaign', 'Internal HR System', 'Client Portal', 'Data Migration', 'Security Audit'];
    
    projectNames.forEach((name, idx) => {
        const manager = randomItem(users.filter(u => u.role === Role.MANAGER || u.role === Role.ADMIN));
        const projectId = `proj-${idx}`;
        
        projects.push({
            id: projectId,
            name: name,
            description: `Strategic project for ${name}`,
            status: randomItem([ProjectStatus.ACTIVE, ProjectStatus.PLANNING, ProjectStatus.COMPLETED]),
            startDate: randomDate(new Date(2023, 0, 1), new Date()).toISOString().split('T')[0],
            endDate: randomDate(new Date(), new Date(2024, 11, 31)).toISOString().split('T')[0],
            managerId: manager.id,
            teamIds: users.slice(0, 5).map(u => u.id) // Random 5 members
        });

        // Generate tasks for this project
        for (let i = 0; i < 10; i++) {
            tasks.push({
                id: `task-${projectId}-${i}`,
                title: `Task ${i + 1} for ${name}`,
                description: 'Complete the assigned module',
                projectId: projectId,
                assigneeId: randomItem(users).id,
                creatorId: manager.id,
                status: randomItem([TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE]),
                priority: randomItem(['Low', 'Medium', 'High']),
                dueDate: randomDate(new Date(), new Date(2024, 11, 31)).toISOString().split('T')[0],
                createdAt: new Date().toISOString()
            });
        }
    });
    
    return { projects, tasks };
};

// --- PAYROLL ---
export const generatePayroll = (users: User[]): { runs: PayrollRun[], slips: Payslip[] } => {
    const runs: PayrollRun[] = [];
    const slips: Payslip[] = [];
    const months = ['2023-01', '2023-02', '2023-03', '2023-04', '2023-05', '2023-06'];
    
    months.forEach(month => {
        const runId = `run-${month}`;
        let totalNet = 0;
        
        users.forEach(user => {
            const base = user.salary || 1000;
            const net = base * 0.95;
            totalNet += net;
            
            slips.push({
                id: `slip-${user.id}-${month}`,
                payrollRunId: runId,
                userId: user.id,
                month: month,
                status: 'PAID',
                generatedAt: `${month}-25T10:00:00Z`,
                breakdown: {
                    baseSalary: base,
                    proratedDays: 22,
                    allowances: { transport: 50, attendance: 20, meal: 30, seniority: 10 },
                    overtime: { hours150: 0, amount150: 0, hours200: 0, amount200: 0, total: 0 },
                    grossSalary: base + 110,
                    deductions: { nssf: base * 0.02, taxOnSalary: base * 0.05, absences: 0, advances: 0, total: base * 0.07 },
                    netSalary: (base + 110) - (base * 0.07),
                    exchangeRate: 4100,
                    netSalaryKHR: ((base + 110) - (base * 0.07)) * 4100
                }
            });
        });

        runs.push({
            id: runId,
            month: month,
            status: 'PAID',
            totalEmployees: users.length,
            totalNetPay: totalNet,
            createdAt: `${month}-25T09:00:00Z`,
            approvedBy: 'EMP000'
        });
    });
    
    return { runs, slips };
};
