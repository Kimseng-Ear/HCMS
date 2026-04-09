"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const multer_1 = require("multer");
const jsonwebtoken_1 = require("jsonwebtoken");
const bcryptjs_1 = require("bcryptjs");
const db_1 = require("./db");
const crypto_1 = require("crypto");
const sequelize_1 = require("sequelize");
exports.router = express_1.default.Router();
const upload = (0, multer_1.default)({ dest: 'uploads/' });
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';
// Health check endpoint for Render
exports.router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    });
});
// Permission resolution is expensive - caching is critical
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL
const permissionCache = new Map();
const settingsCache = new Map();
function getCache(cacheMap, key) {
    const cached = cacheMap.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    return null;
}
function setCache(cacheMap, key, data) {
    cacheMap.set(key, { data, timestamp: Date.now() });
}
// Invalidate cache when overrides change
function invalidateUserCache(userId) {
    // Clear user-specific caches
    permissionCache.delete(`user_permissions_${userId}`);
    permissionCache.delete(`user_effective_settings_${userId}`);
    // Clear all permission check caches for this user
    for (const key of permissionCache.keys()) {
        if (key.startsWith(`user_permission_check_${userId}_`)) {
            permissionCache.delete(key);
        }
    }
}
function invalidateGlobalCache() {
    // Clear all user caches (expensive but necessary for global changes)
    permissionCache.clear();
    settingsCache.clear();
}
// Simple in-memory cache
const cache = new Map();
const CACHE_TTL_2 = 5 * 60 * 1000; // 5 minutes
function getCached(key) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_2) {
        return cached.data;
    }
    return null;
}
function setCached(key, data) {
    cache.set(key, { data, timestamp: Date.now() });
}
function clearCachePrefix(prefix) {
    for (const key of cache.keys()) {
        if (key.startsWith(prefix)) {
            cache.delete(key);
        }
    }
}
// Auth middleware
const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            const user = await db_1.User.findByPk(decoded.id);
            if (user && user.sessionToken === decoded.sessionToken) {
                const now = new Date();
                const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                // Check for 30 days inactivity
                if (user.lastActivity && new Date(user.lastActivity) < thirtyDaysAgo) {
                    user.sessionToken = null; // Invalidate session
                    await user.save();
                }
                else {
                    req.user = user;
                    // Update lastActivity if it's been more than 1 hour to avoid excessive DB writes
                    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
                    if (!user.lastActivity || new Date(user.lastActivity) < oneHourAgo) {
                        user.lastActivity = now;
                        await user.save();
                    }
                }
            }
        }
        catch (err) {
            // Invalid token
        }
    }
    next();
};
exports.router.use(authMiddleware);
// Auth - Password Login
exports.router.post('/auth/login', async (req, res) => {
    const { phone, password } = req.body;
    const user = await db_1.User.findOne({ where: { phone } });
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    if (!user.password) {
        return res.status(401).json({ message: 'Please use OTP to login' });
    }
    const isMatch = await bcryptjs_1.default.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    // Generate session token
    const sessionToken = crypto_1.default.randomUUID();
    user.sessionToken = sessionToken;
    user.lastActivity = new Date();
    await user.save();
    const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role, sessionToken }, JWT_SECRET, { expiresIn: '30d' });
    res.json({
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            departmentId: user.departmentId,
            position: user.position
        },
        token
    });
});
// ============ PERMISSIONS API ============
exports.router.get('/permissions', async (req, res) => {
    const cacheKey = 'permissions_matrix';
    const cached = getCached(cacheKey);
    if (cached)
        return res.json(cached);
    try {
        const [permissions, roles, allRolePermissions] = await Promise.all([
            db_1.Permission.findAll({ order: [['module', 'ASC'], ['name', 'ASC']] }),
            db_1.Role.findAll(),
            db_1.RolePermission.findAll()
        ]);
        const matrix = {};
        const rolePermMap = new Map();
        for (const rp of allRolePermissions) {
            rolePermMap.set(`${rp.roleId}:${rp.permissionId}`, rp.actions || []);
        }
        for (const role of roles) {
            matrix[role.name] = {};
            for (const perm of permissions) {
                matrix[role.name][perm.key] = rolePermMap.get(`${role.id}:${perm.id}`) || [];
            }
        }
        const result = { permissions, matrix };
        setCached(cacheKey, result);
        res.json(result);
    }
    catch (error) {
        console.error('Error fetching permissions:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.router.get('/permissions/modules', async (req, res) => {
    const cacheKey = 'permission_modules';
    const cached = getCached(cacheKey);
    if (cached)
        return res.json(cached);
    const perms = await db_1.Permission.findAll({ attributes: ['module'] });
    const modules = [...new Set(perms.map(p => p.module))];
    setCached(cacheKey, modules);
    res.json(modules);
});
exports.router.get('/users/:id/permissions', async (req, res) => {
    const userId = req.params.id;
    const cacheKey = `user_permissions_${userId}`;
    const cached = getCache(permissionCache, cacheKey);
    if (cached)
        return res.json(cached);
    try {
        const user = await db_1.User.findByPk(userId);
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const roleId = `role-${user.role === 'ADMIN' ? 1 : user.role === 'HR' ? 2 : user.role === 'MANAGER' ? 3 : 4}`;
        const [permissions, overrides, rolePerms] = await Promise.all([
            db_1.Permission.findAll(),
            db_1.UserPermissionOverride.findAll({ where: { userId, status: 'ACTIVE' } }),
            db_1.RolePermission.findAll({ where: { roleId } })
        ]);
        const overrideMap = new Map();
        for (const o of overrides) {
            overrideMap.set(o.permissionId, o);
        }
        const rolePermMap = new Map();
        for (const rp of rolePerms) {
            rolePermMap.set(rp.permissionId, rp);
        }
        const effectivePerms = {};
        const now = new Date();
        for (const perm of permissions) {
            const override = overrideMap.get(perm.id);
            let hasPermission = false;
            let actions = [];
            let source = 'role';
            if (override) {
                if (override.overrideType === 'GRANT' && (!override.expiresAt || new Date(override.expiresAt) > now)) {
                    hasPermission = true;
                    actions = override.actions || ['view'];
                    source = 'override';
                }
                else if (override.overrideType === 'REVOKE') {
                    hasPermission = false;
                    actions = [];
                    source = 'override';
                }
            }
            else {
                const rolePerm = rolePermMap.get(perm.id);
                if (rolePerm) {
                    hasPermission = true;
                    actions = rolePerm.actions || ['view'];
                }
            }
            if (hasPermission) {
                effectivePerms[perm.key] = { actions, source };
            }
        }
        setCache(permissionCache, cacheKey, effectivePerms);
        res.json(effectivePerms);
    }
    catch (error) {
        console.error('Error fetching user permissions:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.router.get('/users/:id/overrides', async (req, res) => {
    try {
        const overrides = await db_1.UserPermissionOverride.findAll({
            where: { userId: req.params.id },
            include: [{ model: db_1.Permission, as: 'permission' }],
            order: [['createdAt', 'DESC']]
        });
        res.json(overrides);
    }
    catch (error) {
        console.error('Error fetching user overrides:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.router.post('/users/:id/overrides', async (req, res) => {
    const { permissionId, overrideType, reason, expiresAt } = req.body;
    const currentUser = req.user;
    try {
        const permission = await db_1.Permission.findByPk(permissionId);
        if (!permission)
            return res.status(404).json({ message: 'Permission not found' });
        // Check if sensitive permission requires approval
        if (permission.isSensitive) {
            const request = await db_1.PermissionOverrideRequest.create({
                id: `req-${Date.now()}`,
                userId: req.params.id,
                permissionId,
                overrideType,
                requestedBy: currentUser.id,
                reason,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                status: 'PENDING'
            });
            await db_1.AuditLog.create({
                id: `audit-${Date.now()}`,
                entityType: 'permission_request',
                entityId: request.id,
                action: 'CREATE',
                newValue: { userId: req.params.id, permissionId, overrideType, reason },
                performedBy: currentUser.id,
                reason
            });
            return res.json({ message: 'Request submitted for approval', request });
        }
        // Direct approval for non-sensitive permissions
        const override = await db_1.UserPermissionOverride.create({
            id: `ovr-${Date.now()}`,
            userId: req.params.id,
            permissionId,
            overrideType,
            grantedBy: currentUser.id,
            reason,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            status: 'ACTIVE'
        });
        await db_1.AuditLog.create({
            id: `audit-${Date.now()}`,
            entityType: 'permission_override',
            entityId: override.id,
            action: overrideType,
            newValue: { userId: req.params.id, permissionId, expiresAt, reason },
            performedBy: currentUser.id,
            reason
        });
        invalidateUserCache(req.params.id);
        res.json(override);
    }
    catch (error) {
        console.error('Error creating override:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.router.delete('/users/:id/overrides/:overrideId', async (req, res) => {
    try {
        await db_1.UserPermissionOverride.destroy({ where: { id: req.params.overrideId } });
        invalidateUserCache(req.params.id);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error removing override:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.router.get('/permissions/requests/pending', async (req, res) => {
    try {
        const requests = await db_1.PermissionOverrideRequest.findAll({
            where: { status: 'PENDING' },
            include: [
                { model: db_1.User, as: 'user', attributes: ['id', 'name', 'email', 'role'] },
                { model: db_1.Permission, as: 'permission' }
            ],
            order: [['createdAt', 'ASC']]
        });
        res.json(requests);
    }
    catch (error) {
        console.error('Error fetching pending requests:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.router.put('/permissions/requests/:id/approve', async (req, res) => {
    const currentUser = req.user;
    const { comments } = req.body;
    try {
        const request = await db_1.PermissionOverrideRequest.findByPk(req.params.id);
        if (!request)
            return res.status(404).json({ message: 'Request not found' });
        request.status = 'APPROVED';
        request.reviewedBy = currentUser.id;
        request.reviewedAt = new Date();
        request.comments = comments;
        await request.save();
        // Create the override
        const override = await db_1.UserPermissionOverride.create({
            id: `ovr-${Date.now()}`,
            userId: request.userId,
            permissionId: request.permissionId,
            overrideType: request.overrideType,
            grantedBy: currentUser.id,
            reason: `Approved: ${request.reason}`,
            expiresAt: request.expiresAt,
            status: 'ACTIVE',
            approvedBy: currentUser.id,
            approvedAt: new Date()
        });
        await db_1.AuditLog.create({
            id: `audit-${Date.now()}`,
            entityType: 'permission_request',
            entityId: req.params.id,
            action: 'APPROVE',
            oldValue: { status: 'PENDING' },
            newValue: { status: 'APPROVED', comments },
            performedBy: currentUser.id
        });
        invalidateUserCache(request.userId);
        res.json({ request, override });
    }
    catch (error) {
        console.error('Error approving request:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.router.put('/permissions/requests/:id/reject', async (req, res) => {
    const currentUser = req.user;
    const { comments } = req.body;
    try {
        const request = await db_1.PermissionOverrideRequest.findByPk(req.params.id);
        if (!request)
            return res.status(404).json({ message: 'Request not found' });
        request.status = 'REJECTED';
        request.reviewedBy = currentUser.id;
        request.reviewedAt = new Date();
        request.comments = comments;
        await request.save();
        await db_1.AuditLog.create({
            id: `audit-${Date.now()}`,
            entityType: 'permission_request',
            entityId: req.params.id,
            action: 'REJECT',
            oldValue: { status: 'PENDING' },
            newValue: { status: 'REJECTED', comments },
            performedBy: currentUser.id
        });
        res.json(request);
    }
    catch (error) {
        console.error('Error rejecting request:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
// ============ SETTINGS API ============
exports.router.get('/settings/global', async (req, res) => {
    const cacheKey = 'global_settings';
    const cached = getCache(settingsCache, cacheKey);
    if (cached)
        return res.json(cached);
    try {
        const settings = await db_1.SystemSetting.findAll({ order: [['category', 'ASC'], ['key', 'ASC']] });
        setCache(settingsCache, cacheKey, settings);
        res.json(settings);
    }
    catch (error) {
        console.error('Error fetching global settings:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.router.put('/settings/global', async (req, res) => {
    const { key, value, description } = req.body;
    const currentUser = req.user;
    try {
        const existing = await db_1.SystemSetting.findOne({ where: { key } });
        const oldValue = existing?.value;
        if (existing) {
            existing.value = value;
            if (description)
                existing.description = description;
            await existing.save();
        }
        else {
            await db_1.SystemSetting.create({
                id: `ss-${Date.now()}`,
                key,
                value,
                category: key.split('.')[0],
                description
            });
        }
        await db_1.AuditLog.create({
            id: `audit-${Date.now()}`,
            entityType: 'system_setting',
            entityId: key,
            action: 'UPDATE',
            oldValue,
            newValue: value,
            performedBy: currentUser.id
        });
        invalidateGlobalCache();
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error updating global setting:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.router.get('/settings/departments/:id', async (req, res) => {
    try {
        const settings = await db_1.DepartmentSetting.findAll({ where: { departmentId: req.params.id } });
        res.json(settings);
    }
    catch (error) {
        console.error('Error fetching department settings:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.router.put('/settings/departments/:id', async (req, res) => {
    const { key, value } = req.body;
    const currentUser = req.user;
    try {
        const existing = await db_1.DepartmentSetting.findOne({
            where: { departmentId: req.params.id, settingKey: key }
        });
        const oldValue = existing?.value;
        if (existing) {
            existing.value = value;
            await existing.save();
        }
        else {
            await db_1.DepartmentSetting.create({
                id: `ds-${Date.now()}`,
                departmentId: req.params.id,
                settingKey: key,
                value
            });
        }
        await db_1.AuditLog.create({
            id: `audit-${Date.now()}`,
            entityType: 'department_setting',
            entityId: `${req.params.id}_${key}`,
            action: 'UPDATE',
            oldValue,
            newValue: value,
            performedBy: currentUser.id,
            metadata: { departmentId: req.params.id }
        });
        invalidateGlobalCache();
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error updating department setting:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.router.get('/settings/effective/:employeeId/:key', async (req, res) => {
    const { employeeId, key } = req.params;
    try {
        let value = null;
        let level = 'none';
        let levelId = null;
        // Check employee-specific override
        const empSetting = await db_1.EmployeeSetting.findOne({
            where: { employeeId, settingKey: key }
        });
        if (empSetting) {
            value = empSetting.value;
            level = 'employee';
            levelId = employeeId;
        }
        else {
            // Check position override
            const user = await db_1.User.findByPk(employeeId);
            if (user) {
                const posSetting = await db_1.PositionSetting.findOne({
                    where: { positionId: user.position, settingKey: key }
                });
                if (posSetting) {
                    value = posSetting.value;
                    level = 'position';
                    levelId = user.position;
                }
                else {
                    // Check department override
                    const deptSetting = await db_1.DepartmentSetting.findOne({
                        where: { departmentId: user.departmentId, settingKey: key }
                    });
                    if (deptSetting) {
                        value = deptSetting.value;
                        level = 'department';
                        levelId = user.departmentId;
                    }
                    else {
                        // Use global setting
                        const globalSetting = await db_1.SystemSetting.findOne({ where: { key } });
                        if (globalSetting) {
                            value = globalSetting.value;
                            level = 'global';
                        }
                    }
                }
            }
        }
        res.json({ value, level, levelId });
    }
    catch (error) {
        console.error('Error getting effective setting:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
// ============ AUDIT API ============
exports.router.get('/audit/all', async (req, res) => {
    const { entityType, performedBy, startDate, endDate, limit = 100 } = req.query;
    try {
        const where = {};
        if (entityType)
            where.entityType = entityType;
        if (performedBy)
            where.performedBy = performedBy;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt[sequelize_1.Op.gte] = new Date(startDate);
            if (endDate)
                where.createdAt[sequelize_1.Op.lte] = new Date(endDate);
        }
        const logs = await db_1.AuditLog.findAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit)
        });
        res.json(logs);
    }
    catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.router.get('/audit/compliance-report', async (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Start and end dates required' });
    }
    try {
        const logs = await db_1.AuditLog.findAll({
            where: {
                createdAt: {
                    [sequelize_1.Op.between]: [new Date(startDate), new Date(endDate)]
                }
            },
            order: [['createdAt', 'ASC']]
        });
        const summary = {
            totalChanges: logs.length,
            settingChanges: logs.filter(l => l.entityType.includes('setting')).length,
            permissionChanges: logs.filter(l => l.entityType === 'permission_override' || l.entityType === 'permission_request').length,
            usersAffected: new Set(logs.map(l => l.entityId)).size,
            byUser: {}
        };
        for (const log of logs) {
            summary.byUser[log.performedBy] = (summary.byUser[log.performedBy] || 0) + 1;
        }
        res.json({ logs, summary });
    }
    catch (error) {
        console.error('Error generating compliance report:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
// ============ EXISTING API ENDPOINTS ============
// Users
exports.router.get('/users', async (req, res) => {
    const cacheKey = 'all_users';
    const cached = getCached(cacheKey);
    if (cached)
        return res.json(cached);
    const users = await db_1.User.findAll();
    setCached(cacheKey, users);
    res.json(users);
});
exports.router.get('/users/:id', async (req, res) => {
    const user = await db_1.User.findByPk(req.params.id);
    if (!user)
        return res.status(404).json({ message: 'User not found' });
    res.json(user);
});
exports.router.post('/users', async (req, res) => {
    const { username, email, password, role, phone } = req.body;
    try {
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await db_1.User.create({
            id: `user-${Date.now()}`,
            name: username,
            email,
            password: hashedPassword,
            role: role || 'employee',
            phone
        });
        clearCachePrefix('all_users');
        clearCachePrefix('report_stats');
        res.status(201).json(user);
    }
    catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
// Departments
exports.router.get('/departments', async (req, res) => {
    const cacheKey = 'all_departments';
    const cached = getCached(cacheKey);
    if (cached)
        return res.json(cached);
    const departments = await db_1.Department.findAll();
    setCached(cacheKey, departments);
    res.json(departments);
});
exports.router.post('/departments', async (req, res) => {
    const { name, description } = req.body;
    try {
        const department = await db_1.Department.create({
            id: `dept-${Date.now()}`,
            name,
            description
        });
        clearCachePrefix('all_departments');
        res.status(201).json(department);
    }
    catch (error) {
        console.error('Error creating department:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.router.post('/positions', async (req, res) => {
    const { title, departmentId, salary } = req.body;
    try {
        const position = await db_1.Position.create({
            id: `pos-${Date.now()}`,
            title,
            departmentId,
            salary
        });
        res.status(201).json(position);
    }
    catch (error) {
        console.error('Error creating position:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.router.post('/employees', async (req, res) => {
    const { userId, firstName, lastName, email, positionId, departmentId, hireDate } = req.body;
    try {
        const employee = await db_1.Employee.create({
            id: `emp-${Date.now()}`,
            userId,
            firstName,
            lastName,
            email,
            positionId,
            departmentId,
            hireDate
        });
        res.status(201).json(employee);
    }
    catch (error) {
        console.error('Error creating employee:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
// Attendance
exports.router.get('/attendance', async (req, res) => {
    const attendance = await db_1.AttendanceRecord.findAll({ order: [['date', 'DESC']] });
    res.json(attendance);
});
exports.router.post('/attendance/clock-in', async (req, res) => {
    const { employeeId, timestamp } = req.body;
    try {
        const date = new Date(timestamp).toISOString().split('T')[0];
        const attendance = await db_1.AttendanceRecord.create({
            id: `att-${Date.now()}`,
            userId: employeeId,
            date,
            clockIn: timestamp,
            status: 'PRESENT'
        });
        clearCachePrefix('report_stats');
        res.status(201).json(attendance);
    }
    catch (error) {
        console.error('Error clocking in:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.router.post('/attendance/clock-out', async (req, res) => {
    const { employeeId, timestamp } = req.body;
    try {
        const date = new Date(timestamp).toISOString().split('T')[0];
        const attendance = await db_1.AttendanceRecord.findOne({
            where: { userId: employeeId, date },
            order: [['createdAt', 'DESC']]
        });
        if (attendance) {
            attendance.clockOut = timestamp;
            await attendance.save();
            res.json(attendance);
        }
        else {
            res.status(404).json({ message: 'No attendance record found for today' });
        }
    }
    catch (error) {
        console.error('Error clocking out:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
// Leaves
exports.router.get('/leaves', async (req, res) => {
    const leaves = await db_1.LeaveRequest.findAll({ order: [['createdAt', 'DESC']] });
    res.json(leaves);
});
exports.router.post('/leave', async (req, res) => {
    const { employeeId, type, startDate, endDate, reason } = req.body;
    try {
        const leave = await db_1.LeaveRequest.create({
            id: `leave-${Date.now()}`,
            userId: employeeId,
            type,
            startDate,
            endDate,
            reason,
            status: 'PENDING',
            appliedOn: new Date().toISOString().split('T')[0]
        });
        clearCachePrefix('report_stats');
        res.status(201).json(leave);
    }
    catch (error) {
        console.error('Error submitting leave request:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
// Projects
exports.router.get('/projects', async (req, res) => {
    const projects = await db_1.Project.findAll();
    res.json(projects);
});
// Payroll
exports.router.get('/payroll/runs', async (req, res) => {
    const runs = await db_1.PayrollRun.findAll({ order: [['createdAt', 'DESC']] });
    res.json(runs);
});
exports.router.post('/payroll/calculate', async (req, res) => {
    const { employeeId, period } = req.body;
    try {
        // Simple calculation - in real app would be more complex
        const user = await db_1.User.findByPk(employeeId);
        if (!user)
            return res.status(404).json({ message: 'Employee not found' });
        const grossSalary = user.salary || 0;
        const tax = grossSalary * 0.1; // 10% tax
        const netSalary = grossSalary - tax;
        res.json({
            employeeId,
            period,
            grossSalary,
            tax,
            netSalary
        });
    }
    catch (error) {
        console.error('Error calculating payroll:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
// Reports
exports.router.get('/reports/stats', async (req, res) => {
    const cacheKey = 'report_stats';
    const cached = getCached(cacheKey);
    if (cached)
        return res.json(cached);
    const today = new Date().toISOString().split('T')[0];
    const [totalEmployees, presentToday, pendingLeaves, departments, annualLeaves, sickLeaves, unpaidLeaves] = await Promise.all([
        db_1.User.count(),
        db_1.AttendanceRecord.count({ where: { date: today, status: 'PRESENT' } }),
        db_1.LeaveRequest.count({ where: { status: 'PENDING' } }),
        db_1.Department.findAll({ attributes: ['id', 'name'] }),
        db_1.LeaveRequest.count({ where: { type: 'Annual' } }),
        db_1.LeaveRequest.count({ where: { type: 'Sick' } }),
        db_1.LeaveRequest.count({ where: { type: 'Unpaid' } })
    ]);
    const deptUserCounts = await Promise.all(departments.map(async (dept) => ({
        name: dept.name,
        value: await db_1.User.count({ where: { departmentId: dept.id } })
    })));
    const result = {
        summary: {
            totalEmployees,
            presentToday,
            pendingLeaves,
            openPositions: 3
        },
        headcountHistory: [
            { month: 'Mar', count: Math.max(10, totalEmployees - 5) },
            { month: 'Apr', count: Math.max(15, totalEmployees - 2) },
            { month: 'May', count: totalEmployees }
        ],
        leaveDistribution: [
            { name: 'Annual', value: annualLeaves },
            { name: 'Sick', value: sickLeaves },
            { name: 'Unpaid', value: unpaidLeaves }
        ],
        departmentDistribution: deptUserCounts,
        payrollHistory: [
            { month: 'Mar', amount: 48000 },
            { month: 'Apr', amount: 52000 },
            { month: 'May', amount: 55000 }
        ],
        departmentCosts: [
            { name: 'Eng', value: 25000 }, { name: 'Sales', value: 15000 }
        ]
    };
    setCached(cacheKey, result);
    res.json(result);
});
exports.router.get('/reports/attendance', async (req, res) => {
    const { startDate, endDate } = req.query;
    try {
        const attendance = await db_1.AttendanceRecord.findAll({
            where: {
                date: {
                    [sequelize_1.Op.between]: [startDate, endDate]
                }
            }
        });
        res.json(attendance);
    }
    catch (error) {
        console.error('Error generating attendance report:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.router.get('/reports/payroll', async (req, res) => {
    const { period } = req.query;
    try {
        // Mock payroll report - in real app would query payroll runs
        const payrollData = [
            { employeeId: '1', period, grossSalary: 50000, netSalary: 45000 },
            { employeeId: '2', period, grossSalary: 60000, netSalary: 54000 }
        ];
        res.json(payrollData);
    }
    catch (error) {
        console.error('Error generating payroll report:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
// ============================================
// EMPLOYEE MODULE API ENDPOINTS
// ============================================
// Employee Onboarding Endpoints
exports.router.post('/employees/onboarding/start', async (req, res) => {
    const { created_by } = req.body;
    try {
        const session = await db_1.EmployeeOnboardingSession.create({
            session_data: JSON.stringify({}),
            current_step: 1,
            progress_percentage: 0,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            created_by
        });
        res.status(201).json({ session_id: session.id, message: 'Onboarding session started' });
    }
    catch (error) {
        console.error('Error starting onboarding session:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.router.post('/employees/onboarding/:sessionId/step/:step', async (req, res) => {
    const { sessionId, step } = req.params;
    const stepData = req.body;
    try {
        const session = await db_1.EmployeeOnboardingSession.findByPk(sessionId);
        if (!session)
            return res.status(404).json({ message: 'Session not found' });
        const existingData = JSON.parse(session.session_data || '{}');
        existingData[`step_${step}`] = stepData;
        // Calculate progress (5 steps total)
        const progress = Math.min((Object.keys(existingData).length / 5) * 100, 100);
        await session.update({
            session_data: JSON.stringify(existingData),
            current_step: parseInt(step),
            progress_percentage: progress,
            updated_at: new Date()
        });
        res.json({ message: 'Step data saved', progress_percentage: progress });
    }
    catch (error) {
        console.error('Error saving step data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.router.get('/employees/onboarding/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    try {
        const session = await db_1.EmployeeOnboardingSession.findByPk(sessionId);
        if (!session)
            return res.status(404).json({ message: 'Session not found' });
        res.json({
            session_data: JSON.parse(session.session_data || '{}'),
            current_step: session.current_step,
            progress_percentage: session.progress_percentage
        });
    }
    catch (error) {
        console.error('Error retrieving session:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.router.put('/employees/onboarding/:sessionId/submit', async (req, res) => {
    const { sessionId } = req.params;
    const { submitted_by } = req.body;
    try {
        const session = await db_1.EmployeeOnboardingSession.findByPk(sessionId);
        if (!session)
            return res.status(404).json({ message: 'Session not found' });
        const sessionData = JSON.parse(session.session_data || '{}');
        // Validate all required steps are complete
        const requiredSteps = ['step_1', 'step_2', 'step_3', 'step_4', 'step_5'];
        const missingSteps = requiredSteps.filter(step => !sessionData[step]);
        if (missingSteps.length > 0) {
            return res.status(400).json({
                message: 'Incomplete onboarding',
                missing_steps: missingSteps
            });
        }
        // Create employee record
        const employeeData = {
            employee_id: sessionData.step_1.employee_id,
            first_name: sessionData.step_1.first_name,
            last_name: sessionData.step_1.last_name,
            email: sessionData.step_1.email,
            personal_email: sessionData.step_3.personal_email,
            phone: sessionData.step_3.phone,
            personal_phone: sessionData.step_3.personal_phone,
            work_phone: sessionData.step_3.work_phone,
            gender: sessionData.step_2.gender,
            birth_date: sessionData.step_2.birth_date,
            nationality: sessionData.step_2.nationality || 'Cambodia',
            ethnicity: sessionData.step_2.ethnicity,
            religion: sessionData.step_2.religion,
            national_id: sessionData.step_2.national_id,
            passport_number: sessionData.step_2.passport,
            marital_status: sessionData.step_5.marital_status || 'single',
            spouse_name: sessionData.step_5.spouse_name,
            spouse_occupation: sessionData.step_5.spouse_occupation,
            spouse_phone: sessionData.step_5.spouse_phone,
            department_id: sessionData.step_2.department_id,
            position_id: sessionData.step_2.position_id,
            reporting_manager_id: sessionData.step_2.manager_id,
            employment_type: sessionData.step_2.employment_type || 'Full-Time',
            join_date: sessionData.step_2.join_date,
            probation_period_months: sessionData.step_2.probation_period || 3,
            work_location: sessionData.step_2.work_location || 'office',
            street_address: sessionData.step_3.address,
            city: sessionData.step_3.city,
            state_province: sessionData.step_3.state,
            postal_code: sessionData.step_3.postal_code,
            country: sessionData.step_3.country || 'Cambodia',
            emergency_contact_name: sessionData.step_3.emergency_name,
            emergency_contact_relationship: sessionData.step_3.emergency_relation,
            emergency_contact_phone: sessionData.step_3.emergency_phone,
            salary_type: sessionData.step_4.salary_type || 'monthly',
            base_salary: sessionData.step_4.base_salary,
            currency: sessionData.step_4.currency || 'USD',
            payment_day: sessionData.step_4.payment_day,
            bank_name: sessionData.step_4.bank_name,
            bank_account_number: sessionData.step_4.bank_account,
            tax_id: sessionData.step_4.tax_id,
            status: 'pending_approval',
            created_by: submitted_by
        };
        const employee = await db_1.Employee.create(employeeData);
        // Create dependents if provided
        if (sessionData.step_5?.dependents) {
            for (const dependent of sessionData.step_5.dependents) {
                await db_1.EmployeeDependent.create({
                    employee_id: employee.employee_id,
                    name: dependent.name,
                    relationship: dependent.relationship,
                    birth_date: dependent.birth_date,
                    is_beneficiary: dependent.is_beneficiary || false
                });
            }
        }
        // Create allowances if provided
        if (sessionData.step_4?.allowances) {
            for (const allowance of sessionData.step_4.allowances) {
                await db_1.EmployeeAllowance.create({
                    employee_id: employee.employee_id,
                    allowance_name: allowance.name,
                    amount: allowance.amount,
                    is_recurring: allowance.recurring !== false,
                    effective_from: employee.join_date
                });
            }
        }
        // Create deductions if provided
        if (sessionData.step_4?.deductions) {
            for (const deduction of sessionData.step_4.deductions) {
                await db_1.EmployeeDeduction.create({
                    employee_id: employee.employee_id,
                    deduction_name: deduction.name,
                    amount: deduction.amount,
                    is_recurring: deduction.recurring !== false,
                    effective_from: employee.join_date
                });
            }
        }
        // Log status change
        await db_1.EmployeeStatusHistory.create({
            employee_id: employee.employee_id,
            new_status: 'pending_approval',
            reason: 'Onboarding completed',
            changed_by: submitted_by
        });
        // Mark session as completed
        await session.destroy();
        res.json({
            message: 'Employee submitted for approval',
            employee_id: employee.employee_id
        });
    }
    catch (error) {
        console.error('Error submitting employee:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
// Employee CRUD Endpoints
exports.router.get('/employees', async (req, res) => {
    const { page = 1, limit = 20, search, department_id, position_id, status } = req.query;
    try {
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const where = {};
        if (search) {
            where[sequelize_1.Op.or] = [
                { first_name: { [sequelize_1.Op.like]: `%${search}%` } },
                { last_name: { [sequelize_1.Op.like]: `%${search}%` } },
                { email: { [sequelize_1.Op.like]: `%${search}%` } },
                { employee_id: { [sequelize_1.Op.like]: `%${search}%` } }
            ];
        }
        if (department_id)
            where.department_id = department_id;
        if (position_id)
            where.position_id = position_id;
        if (status)
            where.status = status;
        const employees = await db_1.Employee.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset,
            order: [['created_at', 'DESC']],
            include: [
                { model: db_1.Department, as: 'department', attributes: ['name'] },
                { model: db_1.Position, as: 'position', attributes: ['title'] }
            ]
        });
        res.json({
            employees: employees.rows,
            total: employees.count,
            page: parseInt(page),
            total_pages: Math.ceil(employees.count / parseInt(limit))
        });
    }
    catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.router.get('/employees/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const employee = await db_1.Employee.findOne({
            where: { employee_id: id },
            include: [
                { model: db_1.Department, as: 'department' },
                { model: db_1.Position, as: 'position' },
                { model: db_1.EmployeeAllowance, as: 'allowances' },
                { model: db_1.EmployeeDeduction, as: 'deductions' },
                { model: db_1.EmployeeDependent, as: 'dependents' },
                { model: db_1.EmployeeDocument, as: 'documents' }
            ]
        });
        if (!employee)
            return res.status(404).json({ message: 'Employee not found' });
        res.json(employee);
    }
    catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.router.put('/employees/:id', async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const { updated_by } = req.body;
    try {
        const employee = await db_1.Employee.findOne({ where: { employee_id: id } });
        if (!employee)
            return res.status(404).json({ message: 'Employee not found' });
        // Log status change if status is being updated
        if (updateData.status && updateData.status !== employee.status) {
            await db_1.EmployeeStatusHistory.create({
                employee_id: id,
                old_status: employee.status,
                new_status: updateData.status,
                reason: updateData.status_change_reason,
                changed_by: updated_by
            });
        }
        await employee.update({
            ...updateData,
            updated_at: new Date()
        });
        res.json({ message: 'Employee updated successfully', employee });
    }
    catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.router.delete('/employees/:id', async (req, res) => {
    const { id } = req.params;
    const { deleted_by, reason } = req.body;
    try {
        const employee = await db_1.Employee.findOne({ where: { employee_id: id } });
        if (!employee)
            return res.status(404).json({ message: 'Employee not found' });
        // Soft delete by setting status to 'terminated'
        await employee.update({
            status: 'terminated',
            terminated_at: new Date(),
            termination_reason: reason,
            updated_at: new Date()
        });
        // Log termination
        await db_1.EmployeeStatusHistory.create({
            employee_id: id,
            old_status: employee.status,
            new_status: 'terminated',
            reason,
            changed_by: deleted_by
        });
        res.json({ message: 'Employee terminated successfully' });
    }
    catch (error) {
        console.error('Error terminating employee:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
// Employee ID Generation
exports.router.get('/employees/generate-id', async (req, res) => {
    try {
        const sequence = await db_1.EmployeeIdSequence.findOne();
        if (!sequence) {
            // Create default sequence if not exists
            await db_1.EmployeeIdSequence.create({
                prefix: 'EMP',
                current_number: 0,
                padding_length: 5
            });
            return res.json({ next_id: 'EMP00001' });
        }
        const nextNumber = sequence.current_number + 1;
        const paddedNumber = nextNumber.toString().padStart(sequence.padding_length, '0');
        const nextId = `${sequence.prefix}${paddedNumber}`;
        res.json({ next_id: nextId });
    }
    catch (error) {
        console.error('Error generating employee ID:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
// Employee Activation (Admin approval)
exports.router.post('/employees/:id/activate', async (req, res) => {
    const { id } = req.params;
    const { activated_by } = req.body;
    try {
        const employee = await db_1.Employee.findOne({ where: { employee_id: id } });
        if (!employee)
            return res.status(404).json({ message: 'Employee not found' });
        if (employee.status !== 'pending_approval') {
            return res.status(400).json({ message: 'Employee is not pending approval' });
        }
        // Update employee status
        await employee.update({
            status: 'active',
            onboarding_completed_at: new Date(),
            updated_at: new Date()
        });
        // Log status change
        await db_1.EmployeeStatusHistory.create({
            employee_id: id,
            old_status: 'pending_approval',
            new_status: 'active',
            reason: 'Admin approval',
            changed_by: activated_by
        });
        // TODO: Create user account automatically
        // This would integrate with the User Account module
        res.json({ message: 'Employee activated successfully' });
    }
    catch (error) {
        console.error('Error activating employee:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
// Employee Statistics
exports.router.get('/employees/statistics', async (req, res) => {
    try {
        const totalEmployees = await db_1.Employee.count({ where: { status: 'active' } });
        const newHires = await db_1.Employee.count({
            where: {
                status: 'active',
                join_date: {
                    [sequelize_1.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                }
            }
        });
        const terminated = await db_1.Employee.count({
            where: {
                status: 'terminated',
                terminated_at: {
                    [sequelize_1.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
            }
        });
        res.json({
            total_employees: totalEmployees,
            new_hires: newHires,
            terminated: terminated,
            net_change: newHires - terminated
        });
    }
    catch (error) {
        console.error('Error fetching employee statistics:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
