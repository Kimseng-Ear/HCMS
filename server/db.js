"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDb = exports.SettingAuditLog = exports.AuditLog = exports.PermissionTemplate = exports.EmployeeSetting = exports.PositionSetting = exports.DepartmentSetting = exports.SystemSetting = exports.PermissionOverrideRequest = exports.UserPermissionOverride = exports.RolePermission = exports.Role = exports.Permission = exports.Message = exports.Notification = exports.Candidate = exports.Job = exports.Payslip = exports.PayrollRun = exports.Task = exports.Project = exports.LeaveRequest = exports.AttendanceRecord = exports.EmployeeIdSequence = exports.EmployeeStatusHistory = exports.EmployeeDocument = exports.EmployeeDependent = exports.EmployeeDeduction = exports.EmployeeAllowance = exports.EmployeeOnboardingSession = exports.Employee = exports.Position = exports.Department = exports.User = exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
const dotenv_1 = require("dotenv");
const bcryptjs_1 = require("bcryptjs");
dotenv_1.default.config();
const host = process.env.DB_HOST;
const dialect = (host && host !== 'iroc' && host !== 'localhost') ? 'postgres' : 'sqlite';
const isPostgres = dialect === 'postgres';
exports.sequelize = new sequelize_1.Sequelize(isPostgres ? (process.env.DB_NAME || 'iroc_db') : (process.env.DB_NAME || 'iroc_db'), process.env.DB_USER || 'root', process.env.DB_PASSWORD || '', {
    host: host || 'localhost',
    dialect: dialect,
    storage: dialect === 'sqlite' ? './database.sqlite' : undefined,
    logging: false,
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    database: process.env.DB_NAME || 'iroc_db'
});
exports.User = exports.sequelize.define('User', {
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    name: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    email: { type: sequelize_1.DataTypes.STRING, allowNull: false, unique: true },
    password: { type: sequelize_1.DataTypes.STRING, allowNull: true },
    role: { type: sequelize_1.DataTypes.STRING, defaultValue: 'EMPLOYEE' },
    departmentId: { type: sequelize_1.DataTypes.STRING },
    position: { type: sequelize_1.DataTypes.STRING },
    joinDate: { type: sequelize_1.DataTypes.STRING },
    avatarUrl: { type: sequelize_1.DataTypes.STRING },
    phone: { type: sequelize_1.DataTypes.STRING, unique: true },
    address: { type: sequelize_1.DataTypes.STRING },
    salary: { type: sequelize_1.DataTypes.FLOAT, defaultValue: 0 },
    status: { type: sequelize_1.DataTypes.STRING, defaultValue: 'ACTIVE' },
    dependents: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 0 },
    otp: { type: sequelize_1.DataTypes.STRING },
    otpExpiry: { type: sequelize_1.DataTypes.DATE },
    sessionToken: { type: sequelize_1.DataTypes.STRING },
    lastActivity: { type: sequelize_1.DataTypes.DATE },
}, {
    indexes: [
        { unique: true, fields: ['email'] },
        { unique: true, fields: ['phone'] },
        { fields: ['departmentId'] },
        { fields: ['role'] }
    ]
});
exports.Department = exports.sequelize.define('Department', {
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    name: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    headCount: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 0 },
    geoFence: { type: sequelize_1.DataTypes.JSON },
});
exports.Position = exports.sequelize.define('Position', {
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    title: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    departmentId: { type: sequelize_1.DataTypes.STRING },
    salary: { type: sequelize_1.DataTypes.FLOAT, defaultValue: 0 },
    description: { type: sequelize_1.DataTypes.TEXT },
}, {
    indexes: [
        { fields: ['departmentId'] }
    ]
});
// ============================================
// EMPLOYEE MODULE DATABASE SCHEMA
// SQL Server Compatible
// ============================================
// 1. EMPLOYEES TABLE (Core employee information)
exports.Employee = exports.sequelize.define('Employee', {
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    employee_id: { type: sequelize_1.DataTypes.STRING, allowNull: false, unique: true },
    first_name: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    last_name: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    email: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    personal_email: { type: sequelize_1.DataTypes.STRING },
    phone: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    personal_phone: { type: sequelize_1.DataTypes.STRING },
    work_phone: { type: sequelize_1.DataTypes.STRING },
    avatar_url: { type: sequelize_1.DataTypes.STRING },
    gender: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    birth_date: { type: sequelize_1.DataTypes.DATE, allowNull: false },
    nationality: { type: sequelize_1.DataTypes.STRING, defaultValue: 'Cambodia' },
    ethnicity: { type: sequelize_1.DataTypes.STRING },
    religion: { type: sequelize_1.DataTypes.STRING },
    national_id: { type: sequelize_1.DataTypes.STRING },
    passport_number: { type: sequelize_1.DataTypes.STRING },
    marital_status: { type: sequelize_1.DataTypes.STRING, defaultValue: 'single' },
    spouse_name: { type: sequelize_1.DataTypes.STRING },
    spouse_occupation: { type: sequelize_1.DataTypes.STRING },
    spouse_phone: { type: sequelize_1.DataTypes.STRING },
    department_id: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    position_id: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    reporting_manager_id: { type: sequelize_1.DataTypes.STRING },
    employment_type: { type: sequelize_1.DataTypes.STRING, defaultValue: 'Full-Time' },
    join_date: { type: sequelize_1.DataTypes.DATE, allowNull: false },
    probation_period_months: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 3 },
    work_location: { type: sequelize_1.DataTypes.STRING, defaultValue: 'office' },
    street_address: { type: sequelize_1.DataTypes.STRING },
    city: { type: sequelize_1.DataTypes.STRING },
    state_province: { type: sequelize_1.DataTypes.STRING },
    postal_code: { type: sequelize_1.DataTypes.STRING },
    country: { type: sequelize_1.DataTypes.STRING, defaultValue: 'Cambodia' },
    emergency_contact_name: { type: sequelize_1.DataTypes.STRING },
    emergency_contact_relationship: { type: sequelize_1.DataTypes.STRING },
    emergency_contact_phone: { type: sequelize_1.DataTypes.STRING },
    salary_type: { type: sequelize_1.DataTypes.STRING, defaultValue: 'monthly' },
    base_salary: { type: sequelize_1.DataTypes.DECIMAL(12, 2), allowNull: false },
    currency: { type: sequelize_1.DataTypes.STRING, defaultValue: 'USD' },
    payment_day: { type: sequelize_1.DataTypes.INTEGER },
    bank_name: { type: sequelize_1.DataTypes.STRING },
    bank_account_number: { type: sequelize_1.DataTypes.STRING },
    tax_id: { type: sequelize_1.DataTypes.STRING },
    status: { type: sequelize_1.DataTypes.STRING, defaultValue: 'active' },
    onboarding_completed_at: { type: sequelize_1.DataTypes.DATE },
    terminated_at: { type: sequelize_1.DataTypes.DATE },
    termination_reason: { type: sequelize_1.DataTypes.STRING },
    created_by: { type: sequelize_1.DataTypes.STRING },
    created_at: { type: sequelize_1.DataTypes.DATE, defaultValue: sequelize_1.DataTypes.NOW },
    updated_at: { type: sequelize_1.DataTypes.DATE, defaultValue: sequelize_1.DataTypes.NOW },
}, {
    indexes: [
        { unique: true, fields: ['employee_id'] },
        { unique: true, fields: ['email'] },
        { fields: ['department_id'] },
        { fields: ['position_id'] },
        { fields: ['reporting_manager_id'] },
        { fields: ['status'] },
        { fields: ['join_date'] }
    ]
});
// 2. EMPLOYEE ONBOARDING SESSIONS (Draft saves)
exports.EmployeeOnboardingSession = exports.sequelize.define('EmployeeOnboardingSession', {
    id: { type: sequelize_1.DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employee_id: { type: sequelize_1.DataTypes.STRING },
    session_data: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
    current_step: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 1 },
    progress_percentage: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 0 },
    expires_at: { type: sequelize_1.DataTypes.DATE },
    created_by: { type: sequelize_1.DataTypes.STRING },
    created_at: { type: sequelize_1.DataTypes.DATE, defaultValue: sequelize_1.DataTypes.NOW },
    updated_at: { type: sequelize_1.DataTypes.DATE, defaultValue: sequelize_1.DataTypes.NOW },
}, {
    indexes: [
        { fields: ['employee_id'] },
        { fields: ['expires_at'] }
    ]
});
// 3. EMPLOYEE ALLOWANCES
exports.EmployeeAllowance = exports.sequelize.define('EmployeeAllowance', {
    id: { type: sequelize_1.DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employee_id: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    allowance_name: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    amount: { type: sequelize_1.DataTypes.DECIMAL(12, 2), allowNull: false },
    is_recurring: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: true },
    effective_from: { type: sequelize_1.DataTypes.DATE, allowNull: false },
    effective_to: { type: sequelize_1.DataTypes.DATE },
    created_at: { type: sequelize_1.DataTypes.DATE, defaultValue: sequelize_1.DataTypes.NOW },
}, {
    indexes: [
        { fields: ['employee_id'] }
    ]
});
// 4. EMPLOYEE DEDUCTIONS
exports.EmployeeDeduction = exports.sequelize.define('EmployeeDeduction', {
    id: { type: sequelize_1.DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employee_id: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    deduction_name: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    amount: { type: sequelize_1.DataTypes.DECIMAL(12, 2), allowNull: false },
    is_recurring: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: true },
    effective_from: { type: sequelize_1.DataTypes.DATE, allowNull: false },
    effective_to: { type: sequelize_1.DataTypes.DATE },
    created_at: { type: sequelize_1.DataTypes.DATE, defaultValue: sequelize_1.DataTypes.NOW },
}, {
    indexes: [
        { fields: ['employee_id'] }
    ]
});
// 5. EMPLOYEE DEPENDENTS
exports.EmployeeDependent = exports.sequelize.define('EmployeeDependent', {
    id: { type: sequelize_1.DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employee_id: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    name: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    relationship: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    birth_date: { type: sequelize_1.DataTypes.DATE },
    is_beneficiary: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
    created_at: { type: sequelize_1.DataTypes.DATE, defaultValue: sequelize_1.DataTypes.NOW },
}, {
    indexes: [
        { fields: ['employee_id'] }
    ]
});
// 6. EMPLOYEE DOCUMENTS
exports.EmployeeDocument = exports.sequelize.define('EmployeeDocument', {
    id: { type: sequelize_1.DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employee_id: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    document_type: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    document_name: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    file_path: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    file_size: { type: sequelize_1.DataTypes.INTEGER },
    uploaded_by: { type: sequelize_1.DataTypes.STRING },
    uploaded_at: { type: sequelize_1.DataTypes.DATE, defaultValue: sequelize_1.DataTypes.NOW },
}, {
    indexes: [
        { fields: ['employee_id'] },
        { fields: ['document_type'] }
    ]
});
// 7. EMPLOYEE STATUS HISTORY (Audit)
exports.EmployeeStatusHistory = exports.sequelize.define('EmployeeStatusHistory', {
    id: { type: sequelize_1.DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employee_id: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    old_status: { type: sequelize_1.DataTypes.STRING },
    new_status: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    reason: { type: sequelize_1.DataTypes.STRING },
    changed_by: { type: sequelize_1.DataTypes.STRING },
    changed_at: { type: sequelize_1.DataTypes.DATE, defaultValue: sequelize_1.DataTypes.NOW },
}, {
    indexes: [
        { fields: ['employee_id'] },
        { fields: ['changed_at'] }
    ]
});
// 8. EMPLOYEE ID SEQUENCE
exports.EmployeeIdSequence = exports.sequelize.define('EmployeeIdSequence', {
    id: { type: sequelize_1.DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    prefix: { type: sequelize_1.DataTypes.STRING, defaultValue: 'EMP' },
    current_number: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 0 },
    padding_length: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 5 },
    updated_at: { type: sequelize_1.DataTypes.DATE, defaultValue: sequelize_1.DataTypes.NOW },
});
exports.AttendanceRecord = exports.sequelize.define('AttendanceRecord', {
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    userId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    date: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    clockIn: { type: sequelize_1.DataTypes.STRING },
    clockOut: { type: sequelize_1.DataTypes.STRING },
    status: { type: sequelize_1.DataTypes.STRING },
    locationIn: { type: sequelize_1.DataTypes.JSON },
    locationOut: { type: sequelize_1.DataTypes.JSON },
    workHours: { type: sequelize_1.DataTypes.FLOAT },
}, {
    indexes: [
        { fields: ['userId', 'date'] },
        { fields: ['date'] }
    ]
});
exports.LeaveRequest = exports.sequelize.define('LeaveRequest', {
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    userId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    type: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    startDate: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    endDate: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    reason: { type: sequelize_1.DataTypes.TEXT },
    status: { type: sequelize_1.DataTypes.STRING, defaultValue: 'PENDING' },
    appliedOn: { type: sequelize_1.DataTypes.STRING },
    rejectionReason: { type: sequelize_1.DataTypes.TEXT },
}, {
    indexes: [
        { fields: ['userId'] },
        { fields: ['status'] }
    ]
});
exports.Project = exports.sequelize.define('Project', {
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    title: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    description: { type: sequelize_1.DataTypes.TEXT },
    status: { type: sequelize_1.DataTypes.STRING, defaultValue: 'ACTIVE' },
    progress: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 0 },
    deadline: { type: sequelize_1.DataTypes.STRING },
    departmentId: { type: sequelize_1.DataTypes.STRING },
    leadId: { type: sequelize_1.DataTypes.STRING },
}, {
    indexes: [
        { fields: ['departmentId'] },
        { fields: ['leadId'] },
        { fields: ['status'] }
    ]
});
exports.Task = exports.sequelize.define('Task', {
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    title: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    description: { type: sequelize_1.DataTypes.TEXT },
    assigneeId: { type: sequelize_1.DataTypes.STRING },
    creatorId: { type: sequelize_1.DataTypes.STRING },
    status: { type: sequelize_1.DataTypes.STRING, defaultValue: 'TODO' },
    dueDate: { type: sequelize_1.DataTypes.STRING },
    createdAt: { type: sequelize_1.DataTypes.STRING },
}, {
    indexes: [
        { fields: ['assigneeId'] },
        { fields: ['creatorId'] },
        { fields: ['status'] }
    ]
});
exports.PayrollRun = exports.sequelize.define('PayrollRun', {
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    month: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    totalEmployees: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 0 },
    totalNetPay: { type: sequelize_1.DataTypes.FLOAT, defaultValue: 0 },
    status: { type: sequelize_1.DataTypes.STRING, defaultValue: 'DRAFT' },
    processedBy: { type: sequelize_1.DataTypes.STRING },
    createdAt: { type: sequelize_1.DataTypes.STRING },
}, {
    indexes: [
        { fields: ['month'] },
        { fields: ['status'] }
    ]
});
exports.Payslip = exports.sequelize.define('Payslip', {
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    payrollRunId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    userId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    month: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    breakdown: { type: sequelize_1.DataTypes.JSON },
    status: { type: sequelize_1.DataTypes.STRING, defaultValue: 'DRAFT' },
    generatedAt: { type: sequelize_1.DataTypes.STRING },
}, {
    indexes: [
        { fields: ['payrollRunId'] },
        { fields: ['userId', 'month'] }
    ]
});
exports.Job = exports.sequelize.define('Job', {
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    title: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    departmentId: { type: sequelize_1.DataTypes.STRING },
    location: { type: sequelize_1.DataTypes.STRING },
    type: { type: sequelize_1.DataTypes.STRING },
    description: { type: sequelize_1.DataTypes.TEXT },
    requirements: { type: sequelize_1.DataTypes.JSON },
    status: { type: sequelize_1.DataTypes.STRING, defaultValue: 'OPEN' },
    postedDate: { type: sequelize_1.DataTypes.STRING },
    salaryRange: { type: sequelize_1.DataTypes.STRING },
}, {
    indexes: [
        { fields: ['departmentId'] },
        { fields: ['status'] }
    ]
});
exports.Candidate = exports.sequelize.define('Candidate', {
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    jobId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    name: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    email: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    phone: { type: sequelize_1.DataTypes.STRING },
    resumeUrl: { type: sequelize_1.DataTypes.STRING },
    status: { type: sequelize_1.DataTypes.STRING, defaultValue: 'NEW' },
    appliedDate: { type: sequelize_1.DataTypes.STRING },
    rating: { type: sequelize_1.DataTypes.INTEGER },
    notes: { type: sequelize_1.DataTypes.TEXT },
}, {
    indexes: [
        { fields: ['jobId'] },
        { fields: ['status'] }
    ]
});
exports.Notification = exports.sequelize.define('Notification', {
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    userId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    title: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    message: { type: sequelize_1.DataTypes.TEXT },
    type: { type: sequelize_1.DataTypes.STRING },
    isRead: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
    createdAt: { type: sequelize_1.DataTypes.STRING },
    link: { type: sequelize_1.DataTypes.STRING },
}, {
    indexes: [
        { fields: ['userId', 'isRead'] }
    ]
});
exports.Message = exports.sequelize.define('Message', {
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    senderId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    receiverId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    content: { type: sequelize_1.DataTypes.TEXT },
    isRead: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
    createdAt: { type: sequelize_1.DataTypes.STRING },
    attachmentUrl: { type: sequelize_1.DataTypes.STRING },
    attachmentType: { type: sequelize_1.DataTypes.STRING },
}, {
    indexes: [
        { fields: ['senderId'] },
        { fields: ['receiverId'] },
        { fields: ['isRead'] }
    ]
});
exports.Permission = exports.sequelize.define('Permission', {
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    name: { type: sequelize_1.DataTypes.STRING, allowNull: false, unique: true },
    key: { type: sequelize_1.DataTypes.STRING, allowNull: false, unique: true },
    module: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    description: { type: sequelize_1.DataTypes.TEXT },
    isSensitive: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
}, {
    indexes: [
        { fields: ['module'] },
        { fields: ['key'] }
    ]
});
exports.Role = exports.sequelize.define('Role', {
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    name: { type: sequelize_1.DataTypes.STRING, allowNull: false, unique: true },
    description: { type: sequelize_1.DataTypes.TEXT },
}, {
    indexes: [
        { unique: true, fields: ['name'] }
    ]
});
exports.RolePermission = exports.sequelize.define('RolePermission', {
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    roleId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    permissionId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    actions: { type: sequelize_1.DataTypes.JSON, defaultValue: ['view'] },
}, {
    indexes: [
        { fields: ['roleId', 'permissionId'] }
    ]
});
exports.UserPermissionOverride = exports.sequelize.define('UserPermissionOverride', {
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    userId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    permissionId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    overrideType: { type: sequelize_1.DataTypes.ENUM('GRANT', 'REVOKE'), allowNull: false },
    grantedBy: { type: sequelize_1.DataTypes.STRING },
    reason: { type: sequelize_1.DataTypes.TEXT },
    expiresAt: { type: sequelize_1.DataTypes.DATE },
    requiresApproval: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
    status: { type: sequelize_1.DataTypes.ENUM('ACTIVE', 'PENDING', 'EXPIRED', 'REVOKED'), defaultValue: 'PENDING' },
    approvedBy: { type: sequelize_1.DataTypes.STRING },
    approvedAt: { type: sequelize_1.DataTypes.DATE },
}, {
    indexes: [
        { fields: ['userId', 'permissionId'] },
        { fields: ['status', 'expiresAt'] }
    ]
});
exports.PermissionOverrideRequest = exports.sequelize.define('PermissionOverrideRequest', {
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    userId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    permissionId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    overrideType: { type: sequelize_1.DataTypes.ENUM('GRANT', 'REVOKE'), allowNull: false },
    requestedBy: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    reason: { type: sequelize_1.DataTypes.TEXT },
    expiresAt: { type: sequelize_1.DataTypes.DATE },
    status: { type: sequelize_1.DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'), defaultValue: 'PENDING' },
    reviewedBy: { type: sequelize_1.DataTypes.STRING },
    reviewedAt: { type: sequelize_1.DataTypes.DATE },
    comments: { type: sequelize_1.DataTypes.TEXT },
}, {
    indexes: [
        { fields: ['userId', 'status'] },
        { fields: ['status'] }
    ]
});
exports.SystemSetting = exports.sequelize.define('SystemSetting', {
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    key: { type: sequelize_1.DataTypes.STRING, allowNull: false, unique: true },
    value: { type: sequelize_1.DataTypes.JSON },
    category: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    description: { type: sequelize_1.DataTypes.TEXT },
    isPublic: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
}, {
    indexes: [
        { fields: ['key'] },
        { fields: ['category'] }
    ]
});
exports.DepartmentSetting = exports.sequelize.define('DepartmentSetting', {
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    departmentId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    settingKey: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    value: { type: sequelize_1.DataTypes.JSON },
}, {
    indexes: [
        { fields: ['departmentId', 'settingKey'], unique: true }
    ]
});
exports.PositionSetting = exports.sequelize.define('PositionSetting', {
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    positionId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    settingKey: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    value: { type: sequelize_1.DataTypes.JSON },
}, {
    indexes: [
        { fields: ['positionId', 'settingKey'], unique: true }
    ]
});
exports.EmployeeSetting = exports.sequelize.define('EmployeeSetting', {
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    employeeId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    settingKey: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    value: { type: sequelize_1.DataTypes.JSON },
}, {
    indexes: [
        { fields: ['employeeId', 'settingKey'], unique: true }
    ]
});
exports.PermissionTemplate = exports.sequelize.define('PermissionTemplate', {
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    name: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    description: { type: sequelize_1.DataTypes.TEXT },
    permissions: { type: sequelize_1.DataTypes.JSON },
    createdBy: { type: sequelize_1.DataTypes.STRING },
}, {
    indexes: [
        { fields: ['name'] }
    ]
});
exports.AuditLog = exports.sequelize.define('AuditLog', {
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    entityType: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    entityId: { type: sequelize_1.DataTypes.STRING },
    action: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    oldValue: { type: sequelize_1.DataTypes.JSON },
    newValue: { type: sequelize_1.DataTypes.JSON },
    performedBy: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    reason: { type: sequelize_1.DataTypes.TEXT },
    metadata: { type: sequelize_1.DataTypes.JSON },
}, {
    indexes: [
        { fields: ['entityType', 'entityId'] },
        { fields: ['performedBy', 'createdAt'] },
        { fields: ['createdAt'] }
    ]
});
// ============================================
// SYSTEM SETTINGS & PERMISSION OVERRIDE MODULE
// ============================================
// Setting Audit Logs (Track all setting changes)
exports.SettingAuditLog = exports.sequelize.define('SettingAuditLog', {
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    settingKey: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    settingLevel: { type: sequelize_1.DataTypes.ENUM('global', 'department', 'position', 'employee'), allowNull: false },
    levelId: { type: sequelize_1.DataTypes.STRING }, // departmentId, positionId, or employeeId
    oldValue: { type: sequelize_1.DataTypes.JSON },
    newValue: { type: sequelize_1.DataTypes.JSON },
    changedBy: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    reason: { type: sequelize_1.DataTypes.TEXT },
    changedAt: { type: sequelize_1.DataTypes.DATE, defaultValue: sequelize_1.DataTypes.NOW },
}, {
    indexes: [
        { fields: ['settingKey'] },
        { fields: ['settingLevel', 'levelId'] },
        { fields: ['changedBy', 'changedAt'] }
    ]
});
const initDb = async () => {
    try {
        await exports.sequelize.authenticate();
        console.log('Database connection has been established successfully.');
        await exports.sequelize.sync({ alter: true });
        console.log('All models were synchronized successfully (alter: true).');
        // Seed data if empty
        const userCount = await exports.User.count();
        if (userCount === 0) {
            console.log('Seeding initial data...');
            // Create Departments
            await exports.Department.bulkCreate([
                { id: 'dep-1', name: 'Engineering', headCount: 15 },
                { id: 'dep-2', name: 'Human Resources', headCount: 5 },
                { id: 'dep-3', name: 'Sales', headCount: 12 },
                { id: 'dep-4', name: 'Marketing', headCount: 8 },
                { id: 'dep-5', name: 'Finance', headCount: 6 },
            ]);
            const defaultPassword = await bcryptjs_1.default.hash('password123', 10);
            // Create Users
            await exports.User.bulkCreate([
                { id: 'u-1', name: 'Sokha Chan', email: 'admin@company.com', password: defaultPassword, role: 'ADMIN', departmentId: 'dep-1', position: 'CTO', avatarUrl: 'https://i.pravatar.cc/150?u=1', joinDate: '2020-01-01', phone: '012345678', salary: 2500, address: 'Phnom Penh' },
                { id: 'u-2', name: 'Dara Kim', email: 'hr@company.com', password: defaultPassword, role: 'HR', departmentId: 'dep-2', position: 'HR Manager', avatarUrl: 'https://i.pravatar.cc/150?u=2', joinDate: '2021-03-15', phone: '098765432', salary: 1800, address: 'Siem Reap' },
                { id: 'u-3', name: 'Vibol Meas', email: 'manager@company.com', password: defaultPassword, role: 'MANAGER', departmentId: 'dep-1', position: 'Engineering Manager', avatarUrl: 'https://i.pravatar.cc/150?u=3', joinDate: '2021-06-01', phone: '011223344', salary: 2000, address: 'Phnom Penh' },
                { id: 'u-4', name: 'Bopha Keo', email: 'employee@company.com', password: defaultPassword, role: 'EMPLOYEE', departmentId: 'dep-1', position: 'Senior Developer', avatarUrl: 'https://i.pravatar.cc/150?u=4', joinDate: '2022-01-10', phone: '077889900', salary: 1200, address: 'Battambang' },
                { id: 'u-5', name: 'Sok Dina', email: 'dina@company.com', password: defaultPassword, role: 'EMPLOYEE', departmentId: 'dep-1', position: 'Frontend Developer', avatarUrl: 'https://i.pravatar.cc/150?u=5', joinDate: '2022-03-20', phone: '085123456', salary: 900, address: 'Phnom Penh' },
                { id: 'u-6', name: 'Kimsour Rith', email: 'kimsour@company.com', password: defaultPassword, role: 'EMPLOYEE', departmentId: 'dep-1', position: 'Backend Developer', avatarUrl: 'https://i.pravatar.cc/150?u=6', joinDate: '2022-05-15', phone: '086234567', salary: 1000, address: 'Siem Reap' },
                { id: 'u-7', name: 'Lina Sok', email: 'lina@company.com', password: defaultPassword, role: 'EMPLOYEE', departmentId: 'dep-2', position: 'HR Officer', avatarUrl: 'https://i.pravatar.cc/150?u=7', joinDate: '2022-07-01', phone: '087345678', salary: 800, address: 'Phnom Penh' },
                { id: 'u-8', name: 'Mony Rat', email: 'mony@company.com', password: defaultPassword, role: 'EMPLOYEE', departmentId: 'dep-3', position: 'Sales Manager', avatarUrl: 'https://i.pravatar.cc/150?u=8', joinDate: '2021-09-10', phone: '088456789', salary: 1500, address: 'Battambang' },
                { id: 'u-9', name: 'Sokha Touch', email: 'touch@company.com', password: defaultPassword, role: 'EMPLOYEE', departmentId: 'dep-3', position: 'Sales Representative', avatarUrl: 'https://i.pravatar.cc/150?u=9', joinDate: '2023-01-05', phone: '089567890', salary: 700, address: 'Phnom Penh' },
                { id: 'u-10', name: 'Pich Serey', email: 'pich@company.com', password: defaultPassword, role: 'EMPLOYEE', departmentId: 'dep-4', position: 'Marketing Manager', avatarUrl: 'https://i.pravatar.cc/150?u=10', joinDate: '2021-11-20', phone: '090678901', salary: 1600, address: 'Siem Reap' },
                { id: 'u-11', name: 'Chanthy Rina', email: 'chanthy@company.com', password: defaultPassword, role: 'EMPLOYEE', departmentId: 'dep-5', position: 'Accountant', avatarUrl: 'https://i.pravatar.cc/150?u=11', joinDate: '2022-02-14', phone: '091789012', salary: 1100, address: 'Phnom Penh' },
                { id: 'u-12', name: 'Visal Hout', email: 'visal@company.com', password: defaultPassword, role: 'EMPLOYEE', departmentId: 'dep-1', position: 'DevOps Engineer', avatarUrl: 'https://i.pravatar.cc/150?u=12', joinDate: '2023-03-01', phone: '092890123', salary: 1300, address: 'Phnom Penh' },
            ]);
            // Create Positions
            await exports.Position.bulkCreate([
                { id: 'pos-1', title: 'CTO', departmentId: 'dep-1', description: 'Chief Technology Officer', level: 'L5' },
                { id: 'pos-2', title: 'HR Manager', departmentId: 'dep-2', description: 'Human Resources Manager', level: 'L4' },
                { id: 'pos-3', title: 'Engineering Manager', departmentId: 'dep-1', description: 'Manager of Engineering Team', level: 'L4' },
                { id: 'pos-4', title: 'Senior Developer', departmentId: 'dep-1', description: 'Senior Software Developer', level: 'L3' },
                { id: 'pos-5', title: 'Frontend Developer', departmentId: 'dep-1', description: 'Frontend Software Developer', level: 'L2' },
                { id: 'pos-6', title: 'Backend Developer', departmentId: 'dep-1', description: 'Backend Software Developer', level: 'L2' },
                { id: 'pos-7', title: 'HR Officer', departmentId: 'dep-2', description: 'Human Resources Officer', level: 'L2' },
                { id: 'pos-8', title: 'Sales Manager', departmentId: 'dep-3', description: 'Sales Team Manager', level: 'L4' },
                { id: 'pos-9', title: 'Sales Representative', departmentId: 'dep-3', description: 'Sales Representative', level: 'L1' },
                { id: 'pos-10', title: 'Marketing Manager', departmentId: 'dep-4', description: 'Marketing Team Manager', level: 'L4' },
                { id: 'pos-11', title: 'Accountant', departmentId: 'dep-5', description: 'Accountant', level: 'L3' },
                { id: 'pos-12', title: 'DevOps Engineer', departmentId: 'dep-1', description: 'DevOps Engineer', level: 'L3' },
            ]);
            // Create Employees (corresponding to Users)
            await exports.Employee.bulkCreate([
                {
                    id: 'emp-1',
                    employee_id: 'EMP001',
                    first_name: 'Sokha',
                    last_name: 'Chan',
                    email: 'admin@company.com',
                    phone: '012345678',
                    gender: 'Male',
                    birth_date: '1990-01-15',
                    department_id: 'dep-1',
                    position_id: 'pos-1',
                    join_date: '2020-01-01',
                    base_salary: 2500.00,
                    status: 'active',
                    created_by: 'system'
                },
                {
                    id: 'emp-2',
                    employee_id: 'EMP002',
                    first_name: 'Dara',
                    last_name: 'Kim',
                    email: 'hr@company.com',
                    phone: '098765432',
                    gender: 'Male',
                    birth_date: '1988-03-20',
                    department_id: 'dep-2',
                    position_id: 'pos-2',
                    join_date: '2021-03-15',
                    base_salary: 1800.00,
                    status: 'active',
                    created_by: 'system'
                },
                {
                    id: 'emp-3',
                    employee_id: 'EMP003',
                    first_name: 'Vibol',
                    last_name: 'Meas',
                    email: 'manager@company.com',
                    phone: '011223344',
                    gender: 'Male',
                    birth_date: '1985-06-10',
                    department_id: 'dep-1',
                    position_id: 'pos-3',
                    join_date: '2021-06-01',
                    base_salary: 2000.00,
                    status: 'active',
                    created_by: 'system'
                },
                {
                    id: 'emp-4',
                    employee_id: 'EMP004',
                    first_name: 'Bopha',
                    last_name: 'Keo',
                    email: 'employee@company.com',
                    phone: '077889900',
                    gender: 'Female',
                    birth_date: '1992-01-25',
                    department_id: 'dep-1',
                    position_id: 'pos-4',
                    join_date: '2022-01-10',
                    base_salary: 1200.00,
                    status: 'active',
                    created_by: 'system'
                },
                {
                    id: 'emp-5',
                    employee_id: 'EMP005',
                    first_name: 'Sok',
                    last_name: 'Dina',
                    email: 'dina@company.com',
                    phone: '085123456',
                    gender: 'Male',
                    birth_date: '1993-03-15',
                    department_id: 'dep-1',
                    position_id: 'pos-5',
                    join_date: '2022-03-20',
                    base_salary: 900.00,
                    status: 'active',
                    created_by: 'system'
                },
                {
                    id: 'emp-6',
                    employee_id: 'EMP006',
                    first_name: 'Kimsour',
                    last_name: 'Rith',
                    email: 'kimsour@company.com',
                    phone: '086234567',
                    gender: 'Male',
                    birth_date: '1991-05-20',
                    department_id: 'dep-1',
                    position_id: 'pos-6',
                    join_date: '2022-05-15',
                    base_salary: 1000.00,
                    status: 'active',
                    created_by: 'system'
                },
                {
                    id: 'emp-7',
                    employee_id: 'EMP007',
                    first_name: 'Lina',
                    last_name: 'Sok',
                    email: 'lina@company.com',
                    phone: '087345678',
                    gender: 'Female',
                    birth_date: '1990-07-10',
                    department_id: 'dep-2',
                    position_id: 'pos-7',
                    join_date: '2022-07-01',
                    base_salary: 800.00,
                    status: 'active',
                    created_by: 'system'
                },
                {
                    id: 'emp-8',
                    employee_id: 'EMP008',
                    first_name: 'Mony',
                    last_name: 'Rat',
                    email: 'mony@company.com',
                    phone: '088456789',
                    gender: 'Male',
                    birth_date: '1987-09-05',
                    department_id: 'dep-3',
                    position_id: 'pos-8',
                    join_date: '2021-09-10',
                    base_salary: 1500.00,
                    status: 'active',
                    created_by: 'system'
                },
                {
                    id: 'emp-9',
                    employee_id: 'EMP009',
                    first_name: 'Sokha',
                    last_name: 'Touch',
                    email: 'touch@company.com',
                    phone: '089567890',
                    gender: 'Male',
                    birth_date: '1994-01-30',
                    department_id: 'dep-3',
                    position_id: 'pos-9',
                    join_date: '2023-01-05',
                    base_salary: 700.00,
                    status: 'active',
                    created_by: 'system'
                },
                {
                    id: 'emp-10',
                    employee_id: 'EMP010',
                    first_name: 'Pich',
                    last_name: 'Serey',
                    email: 'pich@company.com',
                    phone: '090678901',
                    gender: 'Male',
                    birth_date: '1986-11-15',
                    department_id: 'dep-4',
                    position_id: 'pos-10',
                    join_date: '2021-11-20',
                    base_salary: 1600.00,
                    status: 'active',
                    created_by: 'system'
                },
                {
                    id: 'emp-11',
                    employee_id: 'EMP011',
                    first_name: 'Chanthy',
                    last_name: 'Rina',
                    email: 'chanthy@company.com',
                    phone: '091789012',
                    gender: 'Female',
                    birth_date: '1989-02-14',
                    department_id: 'dep-5',
                    position_id: 'pos-11',
                    join_date: '2022-02-14',
                    base_salary: 1100.00,
                    status: 'active',
                    created_by: 'system'
                },
                {
                    id: 'emp-12',
                    employee_id: 'EMP012',
                    first_name: 'Visal',
                    last_name: 'Hout',
                    email: 'visal@company.com',
                    phone: '092890123',
                    gender: 'Male',
                    birth_date: '1990-08-25',
                    department_id: 'dep-1',
                    position_id: 'pos-12',
                    join_date: '2023-03-01',
                    base_salary: 1300.00,
                    status: 'active',
                    created_by: 'system'
                },
            ]);
            // Create Jobs
            await exports.Job.bulkCreate([
                { id: 'j-1', title: 'Senior Frontend Developer', departmentId: 'dep-1', description: 'We are looking for an experienced React developer with 3+ years experience.', status: 'OPEN', postedDate: '2024-01-01', location: 'Phnom Penh', salaryRange: '$1500 - $2500', type: 'Full-time' },
                { id: 'j-2', title: 'HR Assistant', departmentId: 'dep-2', description: 'Assist with daily HR operations and recruitment.', status: 'OPEN', postedDate: '2024-01-15', location: 'Phnom Penh', salaryRange: '$500 - $800', type: 'Full-time' },
                { id: 'j-3', title: 'Sales Executive', departmentId: 'dep-3', description: 'Drive sales and maintain client relationships.', status: 'OPEN', postedDate: '2024-02-01', location: 'Phnom Penh', salaryRange: '$600 - $1200', type: 'Full-time' },
                { id: 'j-4', title: 'Marketing Specialist', departmentId: 'dep-4', description: 'Plan and execute marketing campaigns.', status: 'OPEN', postedDate: '2024-02-10', location: 'Phnom Penh', salaryRange: '$800 - $1500', type: 'Full-time' },
            ]);
            // Create Projects
            await exports.Project.bulkCreate([
                { id: 'p-1', title: 'Website Redesign', description: 'Revamp corporate website with modern design', departmentId: 'dep-1', status: 'ACTIVE', progress: 75, deadline: '2024-03-31', leadId: 'u-3' },
                { id: 'p-2', title: 'Mobile App Development', description: 'Build iOS and Android mobile app', departmentId: 'dep-1', status: 'ACTIVE', progress: 45, deadline: '2024-06-30', leadId: 'u-3' },
                { id: 'p-3', title: 'Q1 Sales Campaign', description: 'Q1 2024 sales target achievement', departmentId: 'dep-3', status: 'ACTIVE', progress: 60, deadline: '2024-03-31', leadId: 'u-8' },
                { id: 'p-4', title: 'Brand Awareness', description: 'Increase brand visibility in Cambodia', departmentId: 'dep-4', status: 'ACTIVE', progress: 80, deadline: '2024-12-31', leadId: 'u-10' },
            ]);
            // Create Tasks
            await exports.Task.bulkCreate([
                { id: 't-1', title: 'Fix Login Bug', description: 'Auth issue on mobile devices', assigneeId: 'u-4', creatorId: 'u-3', status: 'IN_PROGRESS', dueDate: '2024-03-20', createdAt: '2024-03-10' },
                { id: 't-2', title: 'Implement Dashboard Charts', description: 'Add analytics charts to dashboard', assigneeId: 'u-5', creatorId: 'u-3', status: 'TODO', dueDate: '2024-03-25', createdAt: '2024-03-12' },
                { id: 't-3', title: 'API Documentation', description: 'Document all REST API endpoints', assigneeId: 'u-6', creatorId: 'u-3', status: 'COMPLETED', dueDate: '2024-03-15', createdAt: '2024-03-08' },
                { id: 't-4', title: 'Client Meeting Prep', description: 'Prepare for ABC Corp meeting', assigneeId: 'u-9', creatorId: 'u-8', status: 'TODO', dueDate: '2024-03-22', createdAt: '2024-03-14' },
                { id: 't-5', title: 'Social Media Content', description: 'Create content for March', assigneeId: 'u-10', creatorId: 'u-10', status: 'IN_PROGRESS', dueDate: '2024-03-31', createdAt: '2024-03-01' },
            ]);
            // Create Attendance Records for today
            const today = new Date().toISOString().split('T')[0];
            await exports.AttendanceRecord.bulkCreate([
                { id: 'att-1', userId: 'u-1', date: today, status: 'PRESENT', clockIn: `${today}T08:00:00Z`, workHours: 0 },
                { id: 'att-2', userId: 'u-2', date: today, status: 'PRESENT', clockIn: `${today}T08:15:00Z`, workHours: 0 },
                { id: 'att-3', userId: 'u-3', date: today, status: 'PRESENT', clockIn: `${today}T07:55:00Z`, workHours: 0 },
                { id: 'att-4', userId: 'u-4', date: today, status: 'PRESENT', clockIn: `${today}T09:00:00Z`, workHours: 0 },
                { id: 'att-5', userId: 'u-5', date: today, status: 'LATE', clockIn: `${today}T09:10:00Z`, workHours: 0 },
                { id: 'att-6', userId: 'u-8', date: today, status: 'PRESENT', clockIn: `${today}T08:30:00Z`, workHours: 0 },
                { id: 'att-7', userId: 'u-9', date: today, status: 'PRESENT', clockIn: `${today}T08:00:00Z`, workHours: 0 },
            ]);
            // Create Leave Requests
            await exports.LeaveRequest.bulkCreate([
                { id: 'l-1', userId: 'u-6', type: 'Annual', startDate: '2024-03-20', endDate: '2024-03-25', reason: 'Family vacation', status: 'APPLIED', appliedOn: '2024-03-10' },
                { id: 'l-2', userId: 'u-7', type: 'Sick', startDate: '2024-03-14', endDate: '2024-03-15', reason: 'Medical appointment', status: 'APPLIED', appliedOn: '2024-03-13' },
                { id: 'l-3', userId: 'u-11', type: 'Annual', startDate: '2024-04-01', endDate: '2024-04-05', reason: 'Holiday trip', status: 'APPLIED', appliedOn: '2024-03-12' },
            ]);
            // Create Candidates
            await exports.Candidate.bulkCreate([
                { id: 'c-1', jobId: 'j-1', name: 'Sok Kanha', email: 'kanha@email.com', phone: '010111222', status: 'INTERVIEW', appliedDate: '2024-02-01', rating: 4 },
                { id: 'c-2', jobId: 'j-1', name: 'Kong Meng', email: 'meng@email.com', phone: '010333444', status: 'APPLIED', appliedDate: '2024-02-05', rating: 3 },
                { id: 'c-3', jobId: 'j-2', name: 'Srey Mao', email: 'mao@email.com', phone: '010555666', status: 'INTERVIEW', appliedDate: '2024-02-10', rating: 5 },
                { id: 'c-4', jobId: 'j-3', name: 'Bun Rithy', email: 'rithy@email.com', phone: '010777888', status: 'APPLIED', appliedDate: '2024-02-15', rating: 4 },
            ]);
            // Create Notifications
            await exports.Notification.bulkCreate([
                { id: 'n-1', userId: 'u-1', title: 'Leave Request', message: 'Kimsour Rith requested annual leave (Mar 20-25)', type: 'LEAVE', isRead: false, createdAt: new Date().toISOString(), link: '/leaves' },
                { id: 'n-2', userId: 'u-1', title: 'New Candidate', message: 'New application for Senior Frontend Developer', type: 'RECRUITMENT', isRead: false, createdAt: new Date().toISOString(), link: '/recruitment' },
                { id: 'n-3', userId: 'u-1', title: 'Project Update', message: 'Mobile App Development is 45% complete', type: 'PROJECT', isRead: true, createdAt: new Date(Date.now() - 86400000).toISOString(), link: '/projects' },
                { id: 'n-4', userId: 'u-1', title: 'Payroll Ready', message: 'February 2024 payroll has been processed', type: 'PAYROLL', isRead: true, createdAt: new Date(Date.now() - 172800000).toISOString(), link: '/payroll' },
                { id: 'n-5', userId: 'u-2', title: 'Task Assigned', message: 'You have been assigned to review resumes', type: 'TASK', isRead: false, createdAt: new Date().toISOString(), link: '/tasks' },
                { id: 'n-6', userId: 'u-3', title: 'New Message', message: 'You have a new message from Sokha Chan', type: 'MESSAGE', isRead: false, createdAt: new Date().toISOString(), link: '/chat' },
            ]);
            // Create Chat Messages
            await exports.Message.bulkCreate([
                { id: 'msg-1', senderId: 'u-1', receiverId: 'u-2', content: 'Hi Dara, can you review the leave requests today?', isRead: true, createdAt: new Date(Date.now() - 3600000).toISOString() },
                { id: 'msg-2', senderId: 'u-2', receiverId: 'u-1', content: 'Sure, I will review them this afternoon.', isRead: true, createdAt: new Date(Date.now() - 3500000).toISOString() },
                { id: 'msg-3', senderId: 'u-1', receiverId: 'u-3', content: 'Vibol, how is the mobile app project going?', isRead: true, createdAt: new Date(Date.now() - 7200000).toISOString() },
                { id: 'msg-4', senderId: 'u-3', receiverId: 'u-1', content: 'We are at 45% completion. Should be on track for June deadline.', isRead: true, createdAt: new Date(Date.now() - 7100000).toISOString() },
                { id: 'msg-5', senderId: 'u-1', receiverId: 'u-8', content: 'Mony, the Q1 sales campaign is looking great!', isRead: false, createdAt: new Date().toISOString() },
                { id: 'msg-6', senderId: 'u-4', receiverId: 'u-3', content: 'I fixed the login bug. Can you review the PR?', isRead: false, createdAt: new Date().toISOString() },
            ]);
            // Create Payroll Runs
            const payrollMonth = new Date();
            const monthStr = payrollMonth.toISOString().slice(0, 7);
            await exports.PayrollRun.bulkCreate([
                { id: 'run-1', month: '2024-01', status: 'APPROVED', totalEmployees: 12, totalNetPay: 45200, createdAt: new Date('2024-01-31').toISOString() },
                { id: 'run-2', month: '2024-02', status: 'APPROVED', totalEmployees: 12, totalNetPay: 46800, createdAt: new Date('2024-02-29').toISOString() },
            ]);
            // Create Payslips
            const payslips = [];
            const users = await exports.User.findAll();
            for (const u of users) {
                payslips.push({
                    id: `ps-${u.id}-2024-02`,
                    payrollRunId: 'run-2',
                    userId: u.id,
                    month: '2024-02',
                    status: 'APPROVED',
                    generatedAt: new Date('2024-02-29').toISOString(),
                    breakdown: {
                        basicSalary: u.salary,
                        allowances: 150,
                        deductions: { tax: u.salary * 0.1, social: 50, health: 25 },
                        netSalary: u.salary + 150 - (u.salary * 0.1) - 50 - 25
                    }
                });
            }
            await exports.Payslip.bulkCreate(payslips);
            // Seed Permissions - Complete Matrix as per specification
            const permissions = [
                // EMPLOYEE Module
                { id: 'perm-emp-view', name: 'View Employees', key: 'employees.view', module: 'EMPLOYEE', description: 'View employee list and details', isSensitive: false },
                { id: 'perm-emp-create', name: 'Create Employees', key: 'employees.create', module: 'EMPLOYEE', description: 'Create new employee records', isSensitive: true },
                { id: 'perm-emp-edit', name: 'Edit Employees', key: 'employees.edit', module: 'EMPLOYEE', description: 'Edit employee information', isSensitive: true },
                { id: 'perm-emp-delete', name: 'Delete Employees', key: 'employees.delete', module: 'EMPLOYEE', description: 'Delete employee records', isSensitive: true },
                { id: 'perm-emp-export', name: 'Export Employees', key: 'employees.export', module: 'EMPLOYEE', description: 'Export employee data', isSensitive: false },
                // ATTENDANCE Module
                { id: 'perm-att-view', name: 'View Attendance', key: 'attendance.view', module: 'ATTENDANCE', description: 'View attendance records', isSensitive: false },
                { id: 'perm-att-edit', name: 'Edit Attendance', key: 'attendance.edit', module: 'ATTENDANCE', description: 'Edit attendance records', isSensitive: true },
                { id: 'perm-att-approve', name: 'Approve Attendance', key: 'attendance.approve', module: 'ATTENDANCE', description: 'Approve attendance adjustments', isSensitive: true },
                // LEAVE Module
                { id: 'perm-leave-view', name: 'View Leave', key: 'leave.view', module: 'LEAVE', description: 'View leave requests', isSensitive: false },
                { id: 'perm-leave-create', name: 'Create Leave', key: 'leave.create', module: 'LEAVE', description: 'Submit leave requests', isSensitive: false },
                { id: 'perm-leave-edit', name: 'Edit Leave', key: 'leave.edit', module: 'LEAVE', description: 'Edit leave requests', isSensitive: true },
                { id: 'perm-leave-approve', name: 'Approve Leave', key: 'leave.approve', module: 'LEAVE', description: 'Approve or reject leave requests', isSensitive: true },
                // PAYROLL Module
                { id: 'perm-pay-view', name: 'View Payroll', key: 'payroll.view', module: 'PAYROLL', description: 'View payroll information', isSensitive: false },
                { id: 'perm-pay-create', name: 'Create Payroll', key: 'payroll.create', module: 'PAYROLL', description: 'Create payroll runs', isSensitive: true },
                { id: 'perm-pay-edit', name: 'Edit Payroll', key: 'payroll.edit', module: 'PAYROLL', description: 'Edit payroll information', isSensitive: true },
                { id: 'perm-pay-approve', name: 'Approve Payroll', key: 'payroll.approve', module: 'PAYROLL', description: 'Approve payroll runs', isSensitive: true },
                { id: 'perm-pay-export', name: 'Export Payroll', key: 'payroll.export', module: 'PAYROLL', description: 'Export payroll data', isSensitive: true },
                // DEPARTMENT Module
                { id: 'perm-dept-view', name: 'View Department', key: 'department.view', module: 'DEPARTMENT', description: 'View departments', isSensitive: false },
                { id: 'perm-dept-create', name: 'Create Department', key: 'department.create', module: 'DEPARTMENT', description: 'Create departments', isSensitive: true },
                { id: 'perm-dept-edit', name: 'Edit Department', key: 'department.edit', module: 'DEPARTMENT', description: 'Edit department details', isSensitive: true },
                { id: 'perm-dept-delete', name: 'Delete Department', key: 'department.delete', module: 'DEPARTMENT', description: 'Delete departments', isSensitive: true },
                // POSITION Module
                { id: 'perm-pos-view', name: 'View Position', key: 'position.view', module: 'POSITION', description: 'View positions', isSensitive: false },
                { id: 'perm-pos-create', name: 'Create Position', key: 'position.create', module: 'POSITION', description: 'Create positions', isSensitive: true },
                { id: 'perm-pos-edit', name: 'Edit Position', key: 'position.edit', module: 'POSITION', description: 'Edit position details', isSensitive: true },
                { id: 'perm-pos-delete', name: 'Delete Position', key: 'position.delete', module: 'POSITION', description: 'Delete positions', isSensitive: true },
                // PROJECT Module
                { id: 'perm-proj-view', name: 'View Project', key: 'project.view', module: 'PROJECT', description: 'View projects', isSensitive: false },
                { id: 'perm-proj-create', name: 'Create Project', key: 'project.create', module: 'PROJECT', description: 'Create projects', isSensitive: true },
                { id: 'perm-proj-edit', name: 'Edit Project', key: 'project.edit', module: 'PROJECT', description: 'Edit projects', isSensitive: true },
                { id: 'perm-proj-delete', name: 'Delete Project', key: 'project.delete', module: 'PROJECT', description: 'Delete projects', isSensitive: true },
                { id: 'perm-proj-approve', name: 'Approve Project', key: 'project.approve', module: 'PROJECT', description: 'Approve project changes', isSensitive: true },
                // REPORT Module
                { id: 'perm-report-view', name: 'View Reports', key: 'reports.view', module: 'REPORT', description: 'View reports and analytics', isSensitive: false },
                { id: 'perm-report-export', name: 'Export Reports', key: 'reports.export', module: 'REPORT', description: 'Export reports', isSensitive: false },
                // USER ACCOUNT Module
                { id: 'perm-user-view', name: 'View Users', key: 'users.view', module: 'USER ACCOUNT', description: 'View user accounts', isSensitive: false },
                { id: 'perm-user-create', name: 'Create Users', key: 'users.create', module: 'USER ACCOUNT', description: 'Create user accounts', isSensitive: true },
                { id: 'perm-user-edit', name: 'Edit Users', key: 'users.edit', module: 'USER ACCOUNT', description: 'Edit user accounts', isSensitive: true },
                { id: 'perm-user-delete', name: 'Delete Users', key: 'users.delete', module: 'USER ACCOUNT', description: 'Delete user accounts', isSensitive: true },
                { id: 'perm-user-manage', name: 'Manage Users', key: 'users.manage', module: 'USER ACCOUNT', description: 'Full user management', isSensitive: true },
                // SYSTEM SETTINGS Module
                { id: 'perm-settings-view', name: 'View Settings', key: 'settings.view', module: 'SYSTEM SETTINGS', description: 'View system settings', isSensitive: false },
                { id: 'perm-settings-edit', name: 'Edit Settings', key: 'settings.edit', module: 'SYSTEM SETTINGS', description: 'Edit system settings', isSensitive: true },
                { id: 'perm-settings-override', name: 'Override Settings', key: 'settings.override', module: 'SYSTEM SETTINGS', description: 'Create setting overrides', isSensitive: true },
            ];
            await exports.Permission.bulkCreate(permissions);
            // Seed Roles
            const roles = [
                { id: 'role-1', name: 'ADMIN', description: 'Full system access' },
                { id: 'role-2', name: 'HR', description: 'HR department access' },
                { id: 'role-3', name: 'MANAGER', description: 'Department management access' },
                { id: 'role-4', name: 'EMPLOYEE', description: 'Basic employee access' },
            ];
            await exports.Role.bulkCreate(roles);
            // Seed Role Permissions (Exact Matrix as Specified)
            const rolePermissions = [
                // ADMIN - Full access to everything
                { id: 'rp-admin-emp-view', roleId: 'role-1', permissionId: 'perm-emp-view', actions: ['view'] },
                { id: 'rp-admin-emp-create', roleId: 'role-1', permissionId: 'perm-emp-create', actions: ['create'] },
                { id: 'rp-admin-emp-edit', roleId: 'role-1', permissionId: 'perm-emp-edit', actions: ['edit'] },
                { id: 'rp-admin-emp-delete', roleId: 'role-1', permissionId: 'perm-emp-delete', actions: ['delete'] },
                { id: 'rp-admin-emp-export', roleId: 'role-1', permissionId: 'perm-emp-export', actions: ['export'] },
                { id: 'rp-admin-pay-view', roleId: 'role-1', permissionId: 'perm-pay-view', actions: ['view'] },
                { id: 'rp-admin-pay-create', roleId: 'role-1', permissionId: 'perm-pay-create', actions: ['create'] },
                { id: 'rp-admin-pay-edit', roleId: 'role-1', permissionId: 'perm-pay-edit', actions: ['edit'] },
                { id: 'rp-admin-pay-approve', roleId: 'role-1', permissionId: 'perm-pay-approve', actions: ['approve'] },
                { id: 'rp-admin-pay-export', roleId: 'role-1', permissionId: 'perm-pay-export', actions: ['export'] },
                { id: 'rp-admin-settings-view', roleId: 'role-1', permissionId: 'perm-settings-view', actions: ['view'] },
                { id: 'rp-admin-settings-edit', roleId: 'role-1', permissionId: 'perm-settings-edit', actions: ['edit'] },
                { id: 'rp-admin-settings-override', roleId: 'role-1', permissionId: 'perm-settings-override', actions: ['override'] },
                // Add all other permissions for admin (full access)
                ...permissions.filter(p => !['perm-emp-view', 'perm-emp-create', 'perm-emp-edit', 'perm-emp-delete', 'perm-emp-export',
                    'perm-pay-view', 'perm-pay-create', 'perm-pay-edit', 'perm-pay-approve', 'perm-pay-export',
                    'perm-settings-view', 'perm-settings-edit', 'perm-settings-override'].includes(p.id))
                    .map(p => ({ id: `rp-admin-${p.id}`, roleId: 'role-1', permissionId: p.id, actions: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'manage'] })),
                // HR MGR - As per matrix specification
                { id: 'rp-hr-emp-view', roleId: 'role-2', permissionId: 'perm-emp-view', actions: ['view'] },
                { id: 'rp-hr-emp-create', roleId: 'role-2', permissionId: 'perm-emp-create', actions: ['create'] },
                { id: 'rp-hr-emp-edit', roleId: 'role-2', permissionId: 'perm-emp-edit', actions: ['edit'] },
                { id: 'rp-hr-emp-export', roleId: 'role-2', permissionId: 'perm-emp-export', actions: ['export'] },
                { id: 'rp-hr-pay-view', roleId: 'role-2', permissionId: 'perm-pay-view', actions: ['view'] },
                { id: 'rp-hr-pay-create', roleId: 'role-2', permissionId: 'perm-pay-create', actions: ['create'] },
                { id: 'rp-hr-pay-approve', roleId: 'role-2', permissionId: 'perm-pay-approve', actions: ['approve'] },
                { id: 'rp-hr-pay-export', roleId: 'role-2', permissionId: 'perm-pay-export', actions: ['export'] },
                // Add additional HR permissions for other modules
                { id: 'rp-hr-att-view', roleId: 'role-2', permissionId: 'perm-att-view', actions: ['view'] },
                { id: 'rp-hr-att-edit', roleId: 'role-2', permissionId: 'perm-att-edit', actions: ['edit'] },
                { id: 'rp-hr-att-approve', roleId: 'role-2', permissionId: 'perm-att-approve', actions: ['approve'] },
                { id: 'rp-hr-leave-view', roleId: 'role-2', permissionId: 'perm-leave-view', actions: ['view'] },
                { id: 'rp-hr-leave-create', roleId: 'role-2', permissionId: 'perm-leave-create', actions: ['create'] },
                { id: 'rp-hr-leave-approve', roleId: 'role-2', permissionId: 'perm-leave-approve', actions: ['approve'] },
                { id: 'rp-hr-dept-view', roleId: 'role-2', permissionId: 'perm-dept-view', actions: ['view'] },
                { id: 'rp-hr-dept-create', roleId: 'role-2', permissionId: 'perm-dept-create', actions: ['create'] },
                { id: 'rp-hr-dept-edit', roleId: 'role-2', permissionId: 'perm-dept-edit', actions: ['edit'] },
                { id: 'rp-hr-pos-view', roleId: 'role-2', permissionId: 'perm-pos-view', actions: ['view'] },
                { id: 'rp-hr-pos-create', roleId: 'role-2', permissionId: 'perm-pos-create', actions: ['create'] },
                { id: 'rp-hr-pos-edit', roleId: 'role-2', permissionId: 'perm-pos-edit', actions: ['edit'] },
                { id: 'rp-hr-proj-view', roleId: 'role-2', permissionId: 'perm-proj-view', actions: ['view'] },
                { id: 'rp-hr-proj-create', roleId: 'role-2', permissionId: 'perm-proj-create', actions: ['create'] },
                { id: 'rp-hr-proj-edit', roleId: 'role-2', permissionId: 'perm-proj-edit', actions: ['edit'] },
                { id: 'rp-hr-report-view', roleId: 'role-2', permissionId: 'perm-report-view', actions: ['view'] },
                { id: 'rp-hr-report-export', roleId: 'role-2', permissionId: 'perm-report-export', actions: ['export'] },
                { id: 'rp-hr-user-view', roleId: 'role-2', permissionId: 'perm-user-view', actions: ['view'] },
                { id: 'rp-hr-user-create', roleId: 'role-2', permissionId: 'perm-user-create', actions: ['create'] },
                { id: 'rp-hr-user-edit', roleId: 'role-2', permissionId: 'perm-user-edit', actions: ['edit'] },
                // DEPT HEAD - Limited permissions as per matrix
                { id: 'rp-dept-emp-view', roleId: 'role-3', permissionId: 'perm-emp-view', actions: ['view'] },
                { id: 'rp-dept-pay-view', roleId: 'role-3', permissionId: 'perm-pay-view', actions: ['view'] },
                // Add other department head permissions
                { id: 'rp-dept-att-view', roleId: 'role-3', permissionId: 'perm-att-view', actions: ['view'] },
                { id: 'rp-dept-att-edit', roleId: 'role-3', permissionId: 'perm-att-edit', actions: ['edit'] },
                { id: 'rp-dept-att-approve', roleId: 'role-3', permissionId: 'perm-att-approve', actions: ['approve'] },
                { id: 'rp-dept-leave-view', roleId: 'role-3', permissionId: 'perm-leave-view', actions: ['view'] },
                { id: 'rp-dept-leave-create', roleId: 'role-3', permissionId: 'perm-leave-create', actions: ['create'] },
                { id: 'rp-dept-leave-approve', roleId: 'role-3', permissionId: 'perm-leave-approve', actions: ['approve'] },
                { id: 'rp-dept-dept-view', roleId: 'role-3', permissionId: 'perm-dept-view', actions: ['view'] },
                { id: 'rp-dept-pos-view', roleId: 'role-3', permissionId: 'perm-pos-view', actions: ['view'] },
                { id: 'rp-dept-proj-view', roleId: 'role-3', permissionId: 'perm-proj-view', actions: ['view'] },
                { id: 'rp-dept-proj-create', roleId: 'role-3', permissionId: 'perm-proj-create', actions: ['create'] },
                { id: 'rp-dept-proj-edit', roleId: 'role-3', permissionId: 'perm-proj-edit', actions: ['edit'] },
                { id: 'rp-dept-proj-approve', roleId: 'role-3', permissionId: 'perm-proj-approve', actions: ['approve'] },
                { id: 'rp-dept-report-view', roleId: 'role-3', permissionId: 'perm-report-view', actions: ['view'] },
                { id: 'rp-dept-report-export', roleId: 'role-3', permissionId: 'perm-report-export', actions: ['export'] },
                // EMPLOYEE - Basic self-service permissions
                { id: 'rp-emp-emp-view', roleId: 'role-4', permissionId: 'perm-emp-view', actions: ['view'] },
                { id: 'rp-emp-pay-view', roleId: 'role-4', permissionId: 'perm-pay-view', actions: ['view'] },
                // Add other employee permissions (self-service)
                { id: 'rp-emp-att-view', roleId: 'role-4', permissionId: 'perm-att-view', actions: ['view'] },
                { id: 'rp-emp-leave-view', roleId: 'role-4', permissionId: 'perm-leave-view', actions: ['view'] },
                { id: 'rp-emp-leave-create', roleId: 'role-4', permissionId: 'perm-leave-create', actions: ['create'] },
                { id: 'rp-emp-dept-view', roleId: 'role-4', permissionId: 'perm-dept-view', actions: ['view'] },
                { id: 'rp-emp-pos-view', roleId: 'role-4', permissionId: 'perm-pos-view', actions: ['view'] },
                { id: 'rp-emp-proj-view', roleId: 'role-4', permissionId: 'perm-proj-view', actions: ['view'] },
                { id: 'rp-emp-report-view', roleId: 'role-4', permissionId: 'perm-report-view', actions: ['view'] },
            ];
            await exports.RolePermission.bulkCreate(rolePermissions);
            // Seed System Settings (Global)
            const systemSettings = [
                { id: 'ss-1', key: 'company.name', value: 'IROC HR Consulting', category: 'company', description: 'Company name', isPublic: true },
                { id: 'ss-2', key: 'company.address', value: 'Phnom Penh, Cambodia', category: 'company', description: 'Company address', isPublic: true },
                { id: 'ss-3', key: 'company.taxId', value: 'TAX-001234', category: 'company', description: 'Tax ID', isPublic: false },
                { id: 'ss-4', key: 'company.currency', value: 'USD', category: 'company', description: 'Default currency', isPublic: true },
                { id: 'ss-5', key: 'workingHours.startTime', value: '08:00', category: 'working_hours', description: 'Default start time' },
                { id: 'ss-6', key: 'workingHours.endTime', value: '17:00', category: 'working_hours', description: 'Default end time' },
                { id: 'ss-7', key: 'workingHours.breakDuration', value: 60, category: 'working_hours', description: 'Break duration in minutes' },
                { id: 'ss-8', key: 'workingHours.workingDays', value: [1, 2, 3, 4, 5], category: 'working_hours', description: 'Working days (1=Mon, 7=Sun)' },
                { id: 'ss-9', key: 'attendance.gracePeriod', value: 15, category: 'attendance', description: 'Grace period in minutes' },
                { id: 'ss-10', key: 'attendance.latePenalty', value: 50, category: 'attendance', description: 'Late penalty percentage' },
                { id: 'ss-11', key: 'leave.annualLeaveDays', value: 15, category: 'leave', description: 'Annual leave days per year' },
                { id: 'ss-12', key: 'leave.carryoverLimit', value: 5, category: 'leave', description: 'Maximum carryover days' },
                { id: 'ss-13', key: 'payroll.cycle', value: 'monthly', category: 'payroll', description: 'Payroll cycle' },
                { id: 'ss-14', key: 'payroll.paymentDay', value: 28, category: 'payroll', description: 'Payment day of month' },
                { id: 'ss-15', key: 'security.sessionTimeout', value: 30, category: 'security', description: 'Session timeout in minutes' },
                { id: 'ss-16', key: 'security.passwordMinLength', value: 8, category: 'security', description: 'Minimum password length' },
            ];
            await exports.SystemSetting.bulkCreate(systemSettings);
            // Seed Permission Templates
            const templates = [
                { id: 'tmpl-1', name: 'Temporary Admin', description: 'Full admin access for temporary needs', permissions: permissions.map(p => p.key), createdBy: 'u-1' },
                { id: 'tmpl-2', name: 'Auditor', description: 'View-only access for auditors', permissions: ['employees.view', 'attendance.view', 'leave.view', 'payroll.view', 'department.view', 'project.view', 'reports.view', 'reports.export'], createdBy: 'u-1' },
                { id: 'tmpl-3', name: 'Project Lead', description: 'Extended project management access', permissions: ['project.view', 'project.create', 'project.edit', 'project.delete', 'project.approve', 'task.create', 'task.edit'], createdBy: 'u-1' },
            ];
            await exports.PermissionTemplate.bulkCreate(templates);
            console.log('Permission and settings seeding completed.');
        }
    }
    catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};
exports.initDb = initDb;
// ============================================
// SEQUELIZE ASSOCIATIONS - EMPLOYEE MODULE
// ============================================
// Employee associations
exports.Employee.belongsTo(exports.Department, { foreignKey: 'department_id', as: 'department' });
exports.Employee.belongsTo(exports.Position, { foreignKey: 'position_id', as: 'position' });
exports.Employee.belongsTo(exports.Employee, { foreignKey: 'reporting_manager_id', as: 'manager' });
// Department associations
exports.Department.hasMany(exports.Employee, { foreignKey: 'department_id', as: 'employees' });
exports.Department.hasMany(exports.Position, { foreignKey: 'department_id', as: 'positions' });
exports.Department.belongsTo(exports.Employee, { foreignKey: 'department_head_id', as: 'head' });
exports.Department.belongsTo(exports.Department, { foreignKey: 'parent_department_id', as: 'parent' });
exports.Department.hasMany(exports.Department, { foreignKey: 'parent_department_id', as: 'children' });
// Position associations
exports.Position.belongsTo(exports.Department, { foreignKey: 'department_id', as: 'department' });
exports.Position.hasMany(exports.Employee, { foreignKey: 'position_id', as: 'employees' });
// Employee onboarding session associations
exports.EmployeeOnboardingSession.belongsTo(exports.Employee, { foreignKey: 'employee_id', as: 'employee' });
// Employee allowances and deductions
exports.EmployeeAllowance.belongsTo(exports.Employee, { foreignKey: 'employee_id', as: 'employee' });
exports.EmployeeDeduction.belongsTo(exports.Employee, { foreignKey: 'employee_id', as: 'employee' });
// Employee dependents and documents
exports.EmployeeDependent.belongsTo(exports.Employee, { foreignKey: 'employee_id', as: 'employee' });
exports.EmployeeDocument.belongsTo(exports.Employee, { foreignKey: 'employee_id', as: 'employee' });
// Employee status history
exports.EmployeeStatusHistory.belongsTo(exports.Employee, { foreignKey: 'employee_id', as: 'employee' });
