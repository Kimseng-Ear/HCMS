-- HRMS PostgreSQL Schema for Audit & Compliance System
-- Complete hierarchical settings and permission management

-- Enable UUID extension for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USER MANAGEMENT TABLES
-- ============================================

-- Users table (employees)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    department_id UUID REFERENCES departments(id),
    position_id UUID REFERENCES positions(id),
    role_id UUID REFERENCES roles(id) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    level INTEGER DEFAULT 1, -- Role hierarchy level (1=highest)
    permissions JSONB DEFAULT '{}', -- Cached permissions for role
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Departments table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    parent_department_id UUID REFERENCES departments(id),
    head_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Positions table
CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    department_id UUID REFERENCES departments(id) NOT NULL,
    level INTEGER DEFAULT 1, -- Position hierarchy level
    base_salary DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PERMISSION MANAGEMENT TABLES
-- ============================================

-- Master permissions list
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL, -- Format: module.action (e.g., employee.view)
    category VARCHAR(100) NOT NULL, -- Module name (Employee, Attendance, etc.)
    description TEXT,
    is_sensitive BOOLEAN DEFAULT FALSE, -- Requires approval for overrides
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Role-based default permissions
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

-- User-specific permission overrides
CREATE TABLE user_permission_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted BOOLEAN NOT NULL, -- TRUE for grant, FALSE for revoke
    reason TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    expires_at TIMESTAMP WITH TIME ZONE, -- NULL for permanent overrides
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, permission_id)
);

-- Cached resolved permissions for users
CREATE TABLE user_effective_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    effective_granted BOOLEAN NOT NULL,
    source VARCHAR(50) NOT NULL, -- 'role', 'user_override', 'department_override', 'position_override'
    source_id UUID, -- ID of the source (user, department, position)
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE, -- Cache expiry
    UNIQUE(user_id, permission_id)
);

-- Permission override approval workflow
CREATE TABLE permission_override_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    permission_id UUID NOT NULL REFERENCES permissions(id),
    override_type VARCHAR(20) NOT NULL CHECK (override_type IN ('GRANT', 'REVOKE')),
    reason TEXT NOT NULL,
    requested_by UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED')),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    expires_at TIMESTAMP WITH TIME ZONE, -- For temporary overrides
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Permission templates for bulk operations
CREATE TABLE permission_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL, -- Array of permission IDs with granted status
    created_by UUID NOT NULL REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SYSTEM SETTINGS TABLES
-- ============================================

-- Global system settings
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT,
    data_type VARCHAR(20) DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    category VARCHAR(100) NOT NULL,
    is_sensitive BOOLEAN DEFAULT FALSE,
    validation_rules JSONB DEFAULT '{}', -- Validation rules for the setting
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Department-level setting overrides
CREATE TABLE department_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    setting_key VARCHAR(255) NOT NULL,
    setting_value TEXT,
    data_type VARCHAR(20) DEFAULT 'string',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(department_id, setting_key)
);

-- Position-level setting overrides
CREATE TABLE position_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    setting_key VARCHAR(255) NOT NULL,
    setting_value TEXT,
    data_type VARCHAR(20) DEFAULT 'string',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(position_id, setting_key)
);

-- Employee-level setting overrides
CREATE TABLE employee_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    setting_key VARCHAR(255) NOT NULL,
    setting_value TEXT,
    data_type VARCHAR(20) DEFAULT 'string',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, setting_key)
);

-- ============================================
-- AUDIT & COMPLIANCE TABLES
-- ============================================

-- Setting change audit logs
CREATE TABLE setting_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(255) NOT NULL,
    level VARCHAR(20) NOT NULL CHECK (level IN ('global', 'department', 'position', 'employee')),
    level_id UUID, -- Reference to department, position, or employee
    old_value TEXT,
    new_value TEXT,
    changed_by UUID NOT NULL REFERENCES users(id),
    change_reason TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Permission change audit logs
CREATE TABLE permission_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id), -- Target user
    permission_id UUID NOT NULL REFERENCES permissions(id),
    action VARCHAR(50) NOT NULL, -- 'GRANT', 'REVOKE', 'OVERRIDE_GRANT', 'OVERRIDE_REVOKE', 'CACHE_INVALIDATED'
    old_value BOOLEAN, -- Previous granted status
    new_value BOOLEAN, -- New granted status
    performed_by UUID NOT NULL REFERENCES users(id),
    reason TEXT,
    expires_at TIMESTAMP WITH TIME ZONE, -- For temporary changes
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System activity logs (general audit)
CREATE TABLE system_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- ============================================
-- PROJECT MODULE TABLES
-- ============================================

-- Enums for project module
DO $$ BEGIN
    CREATE TYPE project_status_enum AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_priority_enum AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status_enum AS ENUM ('todo', 'in_progress', 'review', 'done', 'blocked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE dependency_type_enum AS ENUM ('FS', 'SS', 'FF', 'SF');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_code VARCHAR(20) UNIQUE NOT NULL,
    project_name VARCHAR(200) NOT NULL,
    description TEXT,
    status project_status_enum NOT NULL DEFAULT 'planning',
    priority project_priority_enum NOT NULL DEFAULT 'medium',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    actual_end_date DATE,
    budget DECIMAL(12,2) DEFAULT 0,
    actual_cost DECIMAL(12,2) DEFAULT 0,
    project_manager_id UUID REFERENCES users(id),
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_projects_date_range CHECK (end_date >= start_date),
    CONSTRAINT chk_projects_progress_range CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    CONSTRAINT chk_projects_cost_non_negative CHECK (budget >= 0 AND actual_cost >= 0)
);

-- Project tasks table
CREATE TABLE IF NOT EXISTS project_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_task_id UUID REFERENCES project_tasks(id) ON DELETE SET NULL,
    task_name VARCHAR(200) NOT NULL,
    description TEXT,
    status task_status_enum NOT NULL DEFAULT 'todo',
    priority project_priority_enum NOT NULL DEFAULT 'medium',
    assigned_to UUID REFERENCES users(id),
    start_date DATE,
    due_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_hours DECIMAL(8,2) DEFAULT 0,
    actual_hours DECIMAL(8,2) DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_task_hours_non_negative CHECK (estimated_hours >= 0 AND actual_hours >= 0),
    CONSTRAINT chk_task_date_range CHECK (due_date IS NULL OR start_date IS NULL OR due_date >= start_date)
);

-- Task dependencies table
CREATE TABLE IF NOT EXISTS task_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
    dependency_type dependency_type_enum NOT NULL DEFAULT 'FS',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(task_id, depends_on_task_id),
    CONSTRAINT chk_no_self_dependency CHECK (task_id <> depends_on_task_id)
);

-- Project assignments table
CREATE TABLE IF NOT EXISTS project_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(100) NOT NULL,
    allocation_percentage DECIMAL(5,2) NOT NULL DEFAULT 100 CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, employee_id)
);

-- Project milestones table
CREATE TABLE IF NOT EXISTS project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    milestone_name VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    target_date DATE NOT NULL,
    achieved_date DATE,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Task comments table
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Task time entries table
CREATE TABLE IF NOT EXISTS task_time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES users(id),
    log_date DATE NOT NULL,
    hours DECIMAL(5,2) NOT NULL CHECK (hours > 0),
    description VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Project activity logs table
CREATE TABLE IF NOT EXISTS project_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL,
    description VARCHAR(500),
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PROJECT MODULE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_dates ON projects(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_projects_manager ON projects(project_manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON project_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON project_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON project_tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_task ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends ON task_dependencies(depends_on_task_id);
CREATE INDEX IF NOT EXISTS idx_milestones_project ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_time_entries_task ON task_time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_project_activity_project ON project_activity_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_assignments_project ON project_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_assignments_employee ON project_assignments(employee_id);

-- User and role indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_employee_id ON users(employee_id);
CREATE INDEX idx_users_department_id ON users(department_id);
CREATE INDEX idx_users_position_id ON users(position_id);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Permission indexes
CREATE INDEX idx_permissions_category ON permissions(category);
CREATE INDEX idx_permissions_is_sensitive ON permissions(is_sensitive);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Override indexes
CREATE INDEX idx_user_permission_overrides_user_id ON user_permission_overrides(user_id);
CREATE INDEX idx_user_permission_overrides_permission_id ON user_permission_overrides(permission_id);
CREATE INDEX idx_user_permission_overrides_expires_at ON user_permission_overrides(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_user_effective_permissions_user_id ON user_effective_permissions(user_id);
CREATE INDEX idx_user_effective_permissions_calculated_at ON user_effective_permissions(calculated_at);

-- Request indexes
CREATE INDEX idx_permission_override_requests_user_id ON permission_override_requests(user_id);
CREATE INDEX idx_permission_override_requests_status ON permission_override_requests(status);
CREATE INDEX idx_permission_override_requests_requested_by ON permission_override_requests(requested_by);

-- Settings indexes
CREATE INDEX idx_system_settings_category ON system_settings(category);
CREATE INDEX idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX idx_department_settings_department_id ON department_settings(department_id);
CREATE INDEX idx_position_settings_position_id ON position_settings(position_id);
CREATE INDEX idx_employee_settings_employee_id ON employee_settings(employee_id);

-- Audit log indexes
CREATE INDEX idx_setting_audit_logs_setting_key ON setting_audit_logs(setting_key);
CREATE INDEX idx_setting_audit_logs_changed_by ON setting_audit_logs(changed_by);
CREATE INDEX idx_setting_audit_logs_created_at ON setting_audit_logs(created_at);
CREATE INDEX idx_permission_audit_logs_user_id ON permission_audit_logs(user_id);
CREATE INDEX idx_permission_audit_logs_permission_id ON permission_audit_logs(permission_id);
CREATE INDEX idx_permission_audit_logs_performed_by ON permission_audit_logs(performed_by);
CREATE INDEX idx_permission_audit_logs_created_at ON permission_audit_logs(created_at);
CREATE INDEX idx_system_activity_logs_user_id ON system_activity_logs(user_id);
CREATE INDEX idx_system_activity_logs_action ON system_activity_logs(action);
CREATE INDEX idx_system_activity_logs_created_at ON system_activity_logs(created_at);

-- ============================================
-- TRIGGERS FOR AUTOMATIC AUDITING
-- ============================================

-- Trigger function for setting audit logging
CREATE OR REPLACE FUNCTION audit_setting_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO setting_audit_logs (setting_key, level, level_id, old_value, new_value, changed_by, change_reason)
        VALUES (
            COALESCE(NEW.setting_key, OLD.setting_key),
            CASE 
                WHEN TG_TABLE_NAME = 'system_settings' THEN 'global'
                WHEN TG_TABLE_NAME = 'department_settings' THEN 'department'
                WHEN TG_TABLE_NAME = 'position_settings' THEN 'position'
                WHEN TG_TABLE_NAME = 'employee_settings' THEN 'employee'
            END,
            CASE 
                WHEN TG_TABLE_NAME = 'department_settings' THEN NEW.department_id
                WHEN TG_TABLE_NAME = 'position_settings' THEN NEW.position_id
                WHEN TG_TABLE_NAME = 'employee_settings' THEN NEW.employee_id
                ELSE NULL
            END,
            OLD.setting_value,
            NEW.setting_value,
            NEW.created_by,
            'Setting updated via ' || TG_TABLE_NAME
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO setting_audit_logs (setting_key, level, level_id, old_value, new_value, changed_by, change_reason)
        VALUES (
            NEW.setting_key,
            CASE 
                WHEN TG_TABLE_NAME = 'system_settings' THEN 'global'
                WHEN TG_TABLE_NAME = 'department_settings' THEN 'department'
                WHEN TG_TABLE_NAME = 'position_settings' THEN 'position'
                WHEN TG_TABLE_NAME = 'employee_settings' THEN 'employee'
            END,
            CASE 
                WHEN TG_TABLE_NAME = 'department_settings' THEN NEW.department_id
                WHEN TG_TABLE_NAME = 'position_settings' THEN NEW.position_id
                WHEN TG_TABLE_NAME = 'employee_settings' THEN NEW.employee_id
                ELSE NULL
            END,
            NULL,
            NEW.setting_value,
            NEW.created_by,
            'Setting created via ' || TG_TABLE_NAME
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to settings tables
CREATE TRIGGER audit_system_settings_changes
    AFTER INSERT OR UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION audit_setting_changes();

CREATE TRIGGER audit_department_settings_changes
    AFTER INSERT OR UPDATE ON department_settings
    FOR EACH ROW EXECUTE FUNCTION audit_setting_changes();

CREATE TRIGGER audit_position_settings_changes
    AFTER INSERT OR UPDATE ON position_settings
    FOR EACH ROW EXECUTE FUNCTION audit_setting_changes();

CREATE TRIGGER audit_employee_settings_changes
    AFTER INSERT OR UPDATE ON employee_settings
    FOR EACH ROW EXECUTE FUNCTION audit_setting_changes();

-- Trigger function for permission audit logging
CREATE OR REPLACE FUNCTION audit_permission_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO permission_audit_logs (user_id, permission_id, action, old_value, new_value, performed_by, reason, expires_at)
    VALUES (
        NEW.user_id,
        NEW.permission_id,
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'OVERRIDE_' || (CASE WHEN NEW.granted THEN 'GRANT' ELSE 'REVOKE' END)
            WHEN TG_OP = 'UPDATE' THEN 'OVERRIDE_' || (CASE WHEN NEW.granted THEN 'GRANT' ELSE 'REVOKE' END)
            WHEN TG_OP = 'DELETE' THEN 'OVERRIDE_REMOVED'
        END,
        CASE WHEN TG_OP = 'UPDATE' THEN OLD.granted ELSE NULL END,
        CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE NEW.granted END,
        NEW.created_by,
        NEW.reason,
        NEW.expires_at
    );
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to permission overrides
CREATE TRIGGER audit_permission_override_changes
    AFTER INSERT OR UPDATE OR DELETE ON user_permission_overrides
    FOR EACH ROW EXECUTE FUNCTION audit_permission_changes();

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Active permission overrides view
CREATE VIEW active_permission_overrides AS
SELECT 
    uo.id,
    uo.user_id,
    uo.permission_id,
    uo.granted,
    uo.reason,
    uo.created_by,
    uo.expires_at,
    uo.created_at,
    u.name as user_name,
    p.name as permission_name,
    p.category as permission_category,
    cb.name as created_by_name
FROM user_permission_overrides uo
JOIN users u ON uo.user_id = u.id
JOIN permissions p ON uo.permission_id = p.id
JOIN users cb ON uo.created_by = cb.id
WHERE (uo.expires_at IS NULL OR uo.expires_at > CURRENT_TIMESTAMP)
AND u.is_active = TRUE;

-- Expired overrides archive view
CREATE VIEW expired_permission_overrides AS
SELECT 
    uo.id,
    uo.user_id,
    uo.permission_id,
    uo.granted,
    uo.reason,
    uo.created_by,
    uo.expires_at,
    uo.created_at,
    u.name as user_name,
    p.name as permission_name,
    p.category as permission_category,
    cb.name as created_by_name
FROM user_permission_overrides uo
JOIN users u ON uo.user_id = u.id
JOIN permissions p ON uo.permission_id = p.id
JOIN users cb ON uo.created_by = cb.id
WHERE uo.expires_at IS NOT NULL 
AND uo.expires_at <= CURRENT_TIMESTAMP;

-- Permission matrix view
CREATE VIEW permission_matrix AS
SELECT 
    r.id as role_id,
    r.name as role_name,
    p.id as permission_id,
    p.name as permission_name,
    p.category as permission_category,
    p.description as permission_description,
    COALESCE(rp.granted, FALSE) as granted
FROM roles r
CROSS JOIN permissions p
LEFT JOIN role_permissions rp ON r.id = rp.role_id AND p.id = rp.permission_id
ORDER BY p.category, p.name, r.name;

-- User effective permissions view
CREATE VIEW user_effective_permissions_view AS
WITH permission_hierarchy AS (
    -- Base role permissions
    SELECT 
        u.id as user_id,
        p.id as permission_id,
        COALESCE(rp.granted, FALSE) as granted,
        'role' as source,
        r.id as source_id
    FROM users u
    JOIN roles r ON u.role_id = r.id
    JOIN role_permissions rp ON r.id = rp.role_id
    CROSS JOIN permissions p
    
    UNION ALL
    
    -- User overrides (highest priority)
    SELECT 
        u.id as user_id,
        uo.permission_id,
        uo.granted,
        'user_override' as source,
        uo.id as source_id
    FROM users u
    JOIN user_permission_overrides uo ON u.id = uo.user_id
    WHERE (uo.expires_at IS NULL OR uo.expires_at > CURRENT_TIMESTAMP)
),
ranked_permissions AS (
    SELECT 
        user_id,
        permission_id,
        granted,
        source,
        source_id,
        ROW_NUMBER() OVER (PARTITION BY user_id, permission_id ORDER BY 
            CASE source 
                WHEN 'user_override' THEN 1
                ELSE 2
            END
        ) as rn
    FROM permission_hierarchy
)
SELECT 
    rp.user_id,
    rp.permission_id,
    rp.granted as effective_granted,
    rp.source,
    rp.source_id,
    u.name as user_name,
    p.name as permission_name,
    p.category as permission_category
FROM ranked_permissions rp
JOIN users u ON rp.user_id = u.id
JOIN permissions p ON rp.permission_id = p.id
WHERE rp.rn = 1
AND u.is_active = TRUE;

-- ============================================
-- SAMPLE DATA INSERTION
-- ============================================

-- Insert default roles
INSERT INTO roles (id, name, description, level) VALUES
(uuid_generate_v4(), 'Admin', 'System Administrator with full access', 1),
(uuid_generate_v4(), 'HR Manager', 'Human Resources Manager', 2),
(uuid_generate_v4(), 'Department Head', 'Department Head/Manager', 3),
(uuid_generate_v4(), 'Employee', 'Regular Employee', 4);

-- Insert default permissions (based on the matrix provided)
INSERT INTO permissions (name, category, description, is_sensitive) VALUES
-- Employee Module
('employee.view', 'Employee', 'View employee list and profiles', FALSE),
('employee.create', 'Employee', 'Create new employee records', TRUE),
('employee.edit', 'Employee', 'Edit employee information', FALSE),
('employee.delete', 'Employee', 'Delete employee records', TRUE),
('employee.approve', 'Employee', 'Approve employee-related requests', FALSE),
('employee.export', 'Employee', 'Export employee data', FALSE),
('employee.manage', 'Employee', 'Full employee management access', TRUE),

-- Attendance Module
('attendance.view', 'Attendance', 'View attendance records and summaries', FALSE),
('attendance.edit', 'Attendance', 'Edit attendance records', FALSE),
('attendance.export', 'Attendance', 'Export attendance data', FALSE),
('attendance.manage', 'Attendance', 'Manage attendance policies and settings', TRUE),

-- Leave Module
('leave.view', 'Leave', 'View leave requests and balances', FALSE),
('leave.create', 'Leave', 'Create leave requests', FALSE),
('leave.edit', 'Leave', 'Edit leave requests', FALSE),
('leave.export', 'Leave', 'Export leave data', FALSE),
('leave.manage', 'Leave', 'Manage leave policies and approvals', TRUE),

-- Payroll Module
('payroll.view', 'Payroll', 'View payroll information and reports', FALSE),
('payroll.create', 'Payroll', 'Create payroll runs', TRUE),
('payroll.edit', 'Payroll', 'Edit payroll data', TRUE),
('payroll.export', 'Payroll', 'Export payroll data', FALSE),
('payroll.manage', 'Payroll', 'Manage payroll policies and settings', TRUE),

-- Department Module
('department.view', 'Department', 'View department information', FALSE),
('department.create', 'Department', 'Create new departments', TRUE),
('department.edit', 'Department', 'Edit department information', FALSE),
('department.delete', 'Department', 'Delete departments', TRUE),
('department.approve', 'Department', 'Approve department-related requests', FALSE),

-- Position Module
('position.view', 'Position', 'View position information', FALSE),
('position.create', 'Position', 'Create new positions', TRUE),
('position.edit', 'Position', 'Edit position information', FALSE),
('position.delete', 'Position', 'Delete positions', TRUE),
('position.approve', 'Position', 'Approve position-related requests', FALSE),

-- Project Module
('project.view', 'Project', 'View project information and tasks', FALSE),
('project.create', 'Project', 'Create new projects', FALSE),
('project.edit', 'Project', 'Edit project information', FALSE),
('project.delete', 'Project', 'Delete projects', TRUE),
('project.approve', 'Project', 'Approve project-related requests', FALSE),
('project.export', 'Project', 'Export project data', FALSE),
('project.manage', 'Project', 'Manage project settings and policies', TRUE),

-- Report Module
('report.view', 'Report', 'View available reports', FALSE),
('report.export', 'Report', 'Export report data', FALSE),
('report.manage', 'Report', 'Manage report configurations and access', TRUE),

-- User Account Module
('user.view', 'User Account', 'View user accounts and profiles', FALSE),
('user.create', 'User Account', 'Create new user accounts', TRUE),
('user.edit', 'User Account', 'Edit user account information', FALSE),
('user.delete', 'User Account', 'Delete user accounts', TRUE),
('user.approve', 'User Account', 'Approve user-related requests', FALSE),
('user.manage', 'User Account', 'Full user account management', TRUE),

-- System Settings Module
('settings.view', 'System Settings', 'View system settings and configurations', FALSE),
('settings.manage', 'System Settings', 'Manage system settings and configurations', TRUE);

-- Insert sample system settings
INSERT INTO system_settings (setting_key, setting_value, data_type, description, category) VALUES
-- Company Profile
('company.name', 'iROC HR Consulting', 'string', 'Company legal name', 'Company Profile'),
('company.logo_url', '/images/iroc-logo.png', 'string', 'Company logo file path', 'Company Profile'),
('company.address', 'Phnom Penh, Cambodia', 'string', 'Company headquarters address', 'Company Profile'),
('company.tax_id', '123456789', 'string', 'Company tax identification number', 'Company Profile'),
('company.fiscal_year_start', '01-01', 'string', 'Fiscal year start date (MM-DD)', 'Company Profile'),
('company.timezone', 'Asia/Phnom_Penh', 'string', 'Default timezone for all operations', 'Company Profile'),
('company.currency', 'USD', 'string', 'Default currency for financial operations', 'Company Profile'),

-- Working Hours
('working_hours.default_start', '09:00', 'string', 'Default work start time (HH:MM)', 'Working Hours'),
('working_hours.default_end', '18:00', 'string', 'Default work end time (HH:MM)', 'Working Hours'),
('working_hours.break_duration', '60', 'number', 'Break duration in minutes', 'Working Hours'),
('working_hours.working_days', '["Monday","Tuesday","Wednesday","Thursday","Friday"]', 'json', 'Standard working days', 'Working Hours'),
('working_hours.overtime_rate', '1.5', 'number', 'Overtime pay multiplier', 'Working Hours'),

-- Security
('security.session_timeout', '30', 'number', 'Session timeout in minutes', 'Security'),
('security.password_min_length', '8', 'number', 'Minimum password length', 'Security'),
('security.password_require_uppercase', 'true', 'boolean', 'Require uppercase letters in password', 'Security'),
('security.password_require_lowercase', 'true', 'boolean', 'Require lowercase letters in password', 'Security'),
('security.password_require_numbers', 'true', 'boolean', 'Require numbers in password', 'Security'),
('security.password_require_symbols', 'true', 'boolean', 'Require special characters in password', 'Security'),
('security.password_expiry_days', '90', 'number', 'Password expiry in days', 'Security'),
('security.mfa_required', 'false', 'boolean', 'Require multi-factor authentication', 'Security'),
('security.login_attempt_limit', '5', 'number', 'Maximum failed login attempts before lockout', 'Security'),
('security.lockout_duration', '30', 'number', 'Account lockout duration in minutes', 'Security');

-- Create default permission template
INSERT INTO permission_templates (name, description, permissions, created_by) VALUES
('Standard Employee', 'Basic permissions for regular employees', 
'{"employee.view": true, "attendance.view": true, "leave.view": true, "leave.create": true, "leave.edit": true, "payroll.view": true, "project.view": true, "report.view": true}',
(SELECT id FROM users WHERE email = 'admin@iroc-hr.com' LIMIT 1);

COMMENT ON TABLE system_settings IS 'Global system configuration settings';
COMMENT ON TABLE department_settings IS 'Department-level setting overrides';
COMMENT ON TABLE position_settings IS 'Position-level setting overrides';
COMMENT ON TABLE employee_settings IS 'Employee-level setting overrides';
COMMENT ON TABLE permissions IS 'Master list of all system permissions';
COMMENT ON TABLE roles IS 'User roles with permission assignments';
COMMENT ON TABLE role_permissions IS 'Default permissions for each role';
COMMENT ON TABLE user_permission_overrides IS 'Individual user permission overrides (GRANT/REVOKE)';
COMMENT ON TABLE user_effective_permissions IS 'Cached resolved permissions for users';
COMMENT ON TABLE permission_override_requests IS 'Approval workflow for permission overrides';
COMMENT ON TABLE setting_audit_logs IS 'Complete audit trail of all setting changes';
COMMENT ON TABLE permission_templates IS 'Bulk permission presets for easy assignment';
