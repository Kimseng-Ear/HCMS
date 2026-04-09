"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceMiddleware = exports.DatabaseOptimizer = void 0;
const sequelize_1 = require("sequelize");
// Database optimization utilities and queries
class DatabaseOptimizer {
    constructor(sequelize) {
        this.sequelize = sequelize;
    }
    // Create optimized indexes for better query performance
    async createOptimizedIndexes() {
        const indexes = [
            // User table indexes
            'CREATE INDEX IF NOT EXISTS idx_users_active_dept ON users(is_active, department_id) WHERE is_active = true',
            'CREATE INDEX IF NOT EXISTS idx_users_role_join_date ON users(role, join_date)',
            'CREATE INDEX IF NOT EXISTS idx_users_search ON users USING gin(to_tsvector(\'english\', name || \' \' || email || \' \' || position))',
            // Employee table indexes
            'CREATE INDEX IF NOT EXISTS idx_employees_active_status ON employees(status, department_id) WHERE status = \'active\'',
            'CREATE INDEX IF NOT EXISTS idx_employees_join_date ON employees(join_date DESC)',
            'CREATE INDEX IF NOT EXISTS idx_employees_search ON employees USING gin(to_tsvector(\'english\', first_name || \' \' || last_name || \' \' || email))',
            'CREATE INDEX IF NOT EXISTS idx_employees_manager ON employees(reporting_manager_id) WHERE reporting_manager_id IS NOT NULL',
            // Attendance indexes
            'CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance_records(user_id, date DESC)',
            'CREATE INDEX IF NOT EXISTS idx_attendance_date_status ON attendance_records(date, status) WHERE date >= CURRENT_DATE - INTERVAL \'30 days\'',
            'CREATE INDEX IF NOT EXISTS idx_attendance_location ON attendance_records USING gist((location_in->\'lat\'), (location_in->\'lng\')) WHERE location_in IS NOT NULL',
            // Leave request indexes
            'CREATE INDEX IF NOT EXISTS idx_leave_user_status ON leave_requests(user_id, status, start_date DESC)',
            'CREATE INDEX IF NOT EXISTS idx_leave_date_range ON leave_requests USING gist(start_date, end_date)',
            'CREATE INDEX IF NOT EXISTS idx_leave_pending ON leave_requests(status, applied_date DESC) WHERE status = \'PENDING\'',
            // Project and task indexes
            'CREATE INDEX IF NOT EXISTS idx_projects_dept_status ON projects(department_id, status, progress DESC)',
            'CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status ON tasks(assignee_id, status, due_date) WHERE status != \'DONE\'',
            'CREATE INDEX IF NOT EXISTS idx_tasks_creator_date ON tasks(creator_id, created_at DESC)',
            // Department indexes
            'CREATE INDEX IF NOT EXISTS idx_departments_hierarchy ON departments(parent_department_id) WHERE parent_department_id IS NOT NULL',
            // Composite indexes for common queries
            'CREATE INDEX IF NOT EXISTS idx_employee_composite ON employees(department_id, status, join_date DESC)',
            'CREATE INDEX IF NOT EXISTS idx_attendance_composite ON attendance_records(user_id, date, status) WHERE date >= CURRENT_DATE - INTERVAL \'90 days\'',
        ];
        for (const indexSql of indexes) {
            try {
                await this.sequelize.query(indexSql);
                console.log(`✓ Created index: ${indexSql.split('idx_')[1]?.split(' ')[0] || 'unknown'}`);
            }
            catch (error) {
                console.warn(`⚠ Index creation failed: ${error}`);
            }
        }
    }
    // Create materialized views for complex queries
    async createMaterializedViews() {
        const views = [
            // Employee dashboard view
            `CREATE MATERIALIZED VIEW IF NOT EXISTS mv_employee_dashboard AS
       SELECT 
         e.id,
         e.first_name || ' ' || e.last_name as full_name,
         e.email,
         e.department_id,
         d.name as department_name,
         e.position_id,
         p.title as position_title,
         e.status,
         e.join_date,
         e.base_salary,
         COALESCE(ar.present_days, 0) as present_days,
         COALESCE(ar.late_days, 0) as late_days,
         COALESCE(lr.pending_leaves, 0) as pending_leaves,
         COALESCE(t.active_tasks, 0) as active_tasks
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN positions p ON e.position_id = p.id
       LEFT JOIN (
         SELECT 
           user_id,
           COUNT(CASE WHEN status = 'PRESENT' THEN 1 END) as present_days,
           COUNT(CASE WHEN status = 'LATE' THEN 1 END) as late_days
         FROM attendance_records 
         WHERE date >= CURRENT_DATE - INTERVAL '30 days'
         GROUP BY user_id
       ) ar ON e.employee_id = ar.user_id
       LEFT JOIN (
         SELECT 
           user_id,
           COUNT(*) as pending_leaves
         FROM leave_requests 
         WHERE status = 'PENDING'
         GROUP BY user_id
       ) lr ON e.employee_id = lr.user_id
       LEFT JOIN (
         SELECT 
           assignee_id,
           COUNT(*) as active_tasks
         FROM tasks 
         WHERE status IN ('TODO', 'IN_PROGRESS')
         GROUP BY assignee_id
       ) t ON e.employee_id = t.assignee_id
       WHERE e.status = 'active'`,
            // Department statistics view
            `CREATE MATERIALIZED VIEW IF NOT EXISTS mv_department_stats AS
       SELECT 
         d.id,
         d.name,
         d.head_count,
         COUNT(e.id) as actual_employees,
         AVG(e.base_salary) as avg_salary,
         COUNT(CASE WHEN e.join_date >= CURRENT_DATE - INTERVAL '90 days' THEN 1 END) as new_hires,
         COUNT(CASE WHEN ar.status = 'PRESENT' THEN 1 END) as present_today,
         COUNT(CASE WHEN lr.status = 'PENDING' THEN 1 END) as pending_leaves
       FROM departments d
       LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'active'
       LEFT JOIN attendance_records ar ON e.employee_id = ar.user_id AND ar.date = CURRENT_DATE
       LEFT JOIN leave_requests lr ON e.employee_id = lr.user_id AND lr.status = 'PENDING'
       GROUP BY d.id, d.name, d.head_count`,
            // Project progress view
            `CREATE MATERIALIZED VIEW IF NOT EXISTS mv_project_progress AS
       SELECT 
         p.id,
         p.title,
         p.department_id,
         d.name as department_name,
         p.status,
         p.progress,
         p.deadline,
         COUNT(t.id) as total_tasks,
         COUNT(CASE WHEN t.status = 'DONE' THEN 1 END) as completed_tasks,
         COUNT(CASE WHEN t.status IN ('TODO', 'IN_PROGRESS') THEN 1 END) as active_tasks,
         COUNT(CASE WHEN t.due_date < CURRENT_DATE AND t.status != 'DONE' THEN 1 END) as overdue_tasks,
         ROUND(
           COUNT(CASE WHEN t.status = 'DONE' THEN 1 END) * 100.0 / 
           NULLIF(COUNT(t.id), 0), 2
         ) as task_completion_rate
       FROM projects p
       LEFT JOIN departments d ON p.department_id = d.id
       LEFT JOIN tasks t ON p.id = t.project_id
       GROUP BY p.id, p.title, p.department_id, d.name, p.status, p.progress, p.deadline`,
        ];
        for (const viewSql of views) {
            try {
                await this.sequelize.query(viewSql);
                console.log(`✓ Created materialized view`);
            }
            catch (error) {
                console.warn(`⚠ Materialized view creation failed: ${error}`);
            }
        }
    }
    // Refresh materialized views
    async refreshMaterializedViews() {
        const views = [
            'mv_employee_dashboard',
            'mv_department_stats',
            'mv_project_progress'
        ];
        for (const view of views) {
            try {
                await this.sequelize.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY ${view}`);
                console.log(`✓ Refreshed view: ${view}`);
            }
            catch (error) {
                console.warn(`⚠ View refresh failed: ${error}`);
            }
        }
    }
    // Optimized queries for common operations
    async getEmployeeDashboardData(employeeId) {
        return await this.sequelize.query(`
      SELECT * FROM mv_employee_dashboard 
      WHERE id = :employeeId
    `, {
            replacements: { employeeId },
            type: sequelize_1.QueryTypes.SELECT,
            plain: true
        });
    }
    async getDepartmentStatistics(departmentId) {
        const whereClause = departmentId ? 'WHERE id = :departmentId' : '';
        return await this.sequelize.query(`
      SELECT * FROM mv_department_stats 
      ${whereClause}
      ORDER BY actual_employees DESC
    `, {
            replacements: { departmentId },
            type: sequelize_1.QueryTypes.SELECT
        });
    }
    async getAttendanceTrends(days = 30) {
        return await this.sequelize.query(`
      SELECT 
        date,
        COUNT(*) as total_employees,
        COUNT(CASE WHEN status = 'PRESENT' THEN 1 END) as present,
        COUNT(CASE WHEN status = 'LATE' THEN 1 END) as late,
        COUNT(CASE WHEN status = 'ABSENT' THEN 1 END) as absent,
        COUNT(CASE WHEN status = 'ON_LEAVE' THEN 1 END) as on_leave,
        ROUND(
          COUNT(CASE WHEN status = 'PRESENT' THEN 1 END) * 100.0 / 
          COUNT(*), 2
        ) as attendance_rate
      FROM attendance_records 
      WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY date
      ORDER BY date DESC
      LIMIT :days
    `, {
            replacements: { days },
            type: sequelize_1.QueryTypes.SELECT
        });
    }
    async getProjectAnalytics() {
        return await this.sequelize.query(`
      SELECT 
        d.name as department,
        COUNT(p.id) as total_projects,
        COUNT(CASE WHEN p.status = 'ACTIVE' THEN 1 END) as active_projects,
        COUNT(CASE WHEN p.status = 'COMPLETED' THEN 1 END) as completed_projects,
        AVG(p.progress) as avg_progress,
        COUNT(CASE WHEN p.deadline < CURRENT_DATE AND p.status != 'COMPLETED' THEN 1 END) as overdue_projects
      FROM departments d
      LEFT JOIN projects p ON d.id = p.department_id
      GROUP BY d.id, d.name
      ORDER BY total_projects DESC
    `, {
            type: sequelize_1.QueryTypes.SELECT
        });
    }
    // Search optimization
    async searchEmployees(query, limit = 20) {
        return await this.sequelize.query(`
      SELECT 
        e.id,
        e.first_name || ' ' || e.last_name as name,
        e.email,
        e.position_id,
        p.title as position,
        d.name as department,
        e.status,
        ts_rank(search_vector, plainto_tsquery('english', :query)) as relevance
      FROM (
        SELECT 
          id, first_name, last_name, email, position_id, department_id, status,
          to_tsvector('english', first_name || ' ' || last_name || ' ' || email || ' ' || COALESCE(position_id, '')) as search_vector
        FROM employees
        WHERE status = 'active'
      ) e
      LEFT JOIN positions p ON e.position_id = p.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE search_vector @@ plainto_tsquery('english', :query)
      ORDER BY relevance DESC
      LIMIT :limit
    `, {
            replacements: { query, limit },
            type: sequelize_1.QueryTypes.SELECT
        });
    }
    // Batch operations for better performance
    async bulkUpdateAttendance(records) {
        const updates = records.map(record => [
            record.id,
            record.status,
            record.clockOut
        ]);
        return await this.sequelize.query(`
      UPDATE attendance_records 
      SET 
        status = CASE id ${updates.map((_, i) => `WHEN :id${i} THEN :status${i}`).join(' ')} END,
        clock_out = CASE id ${updates.map((_, i) => `WHEN :id${i} THEN :clockOut${i}`).join(' ')} END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id IN (${updates.map((_, i) => `:id${i}`).join(', ')})
    `, {
            replacements: updates.reduce((acc, [id, status, clockOut], i) => {
                acc[`id${i}`] = id;
                acc[`status${i}`] = status;
                acc[`clockOut${i}`] = clockOut;
                return acc;
            }, {}),
            type: sequelize_1.QueryTypes.UPDATE
        });
    }
    // Cleanup old data
    async cleanupOldData(daysToKeep = 365) {
        // Clean up old audit logs
        await this.sequelize.query(`
      DELETE FROM audit_logs 
      WHERE created_at < CURRENT_DATE - INTERVAL :days days
    `, {
            replacements: { days: daysToKeep },
            type: sequelize_1.QueryTypes.DELETE
        });
        // Clean up old notification tokens
        await this.sequelize.query(`
      DELETE FROM notification_tokens 
      WHERE created_at < CURRENT_DATE - INTERVAL :days days
    `, {
            replacements: { days: daysToKeep },
            type: sequelize_1.QueryTypes.DELETE
        });
        console.log(`✓ Cleaned up data older than ${daysToKeep} days`);
    }
    // Database health check
    async getDatabaseHealth() {
        const [tableSizes, indexUsage, slowQueries] = await Promise.all([
            this.sequelize.query(`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `, { type: sequelize_1.QueryTypes.SELECT }),
            this.sequelize.query(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes 
        ORDER BY idx_scan DESC
      `, { type: sequelize_1.QueryTypes.SELECT }),
            this.sequelize.query(`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows
        FROM pg_stat_statements 
        WHERE mean_time > 100
        ORDER BY mean_time DESC
        LIMIT 10
      `, { type: sequelize_1.QueryTypes.SELECT })
        ]);
        return {
            tableSizes,
            indexUsage,
            slowQueries
        };
    }
}
exports.DatabaseOptimizer = DatabaseOptimizer;
// Performance monitoring middleware
const performanceMiddleware = async (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        // Log slow queries
        if (duration > 1000) {
            console.warn(`🐌 Slow request: ${req.method} ${req.url} took ${duration}ms`);
        }
        // Store performance metrics
        // In production, you'd want to store this in a monitoring system
        if (process.env.NODE_ENV === 'production') {
            // Could send to APM tools like New Relic, DataDog, etc.
        }
    });
    next();
};
exports.performanceMiddleware = performanceMiddleware;
