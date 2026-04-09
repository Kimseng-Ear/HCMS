import express from 'express';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import {
  User, Department, Position, Employee, AttendanceRecord, LeaveRequest,
  Project, Task, PayrollRun, Payslip, Job, Candidate,
  Notification, Message, Permission, Role, RolePermission,
  UserPermissionOverride, PermissionOverrideRequest,
  SystemSetting, DepartmentSetting, PositionSetting, EmployeeSetting,
  PermissionTemplate, AuditLog,
  EmployeeOnboardingSession, EmployeeAllowance, EmployeeDeduction,
  EmployeeDependent, EmployeeDocument, EmployeeStatusHistory, EmployeeIdSequence
} from './db';
import crypto from 'crypto';
import { Op } from 'sequelize';
import { authMiddleware } from './middleware/auth';
import { requirePermission, requirePermissionAction } from './middleware/permissions';

export const router = express.Router();
const upload = multer({ dest: 'uploads/' });

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';

// Health check endpoint for Render
router.get('/health', (req, res) => {
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
const permissionCache = new Map<string, { data: any, timestamp: number }>();
const settingsCache = new Map<string, { data: any, timestamp: number }>();

function getCache(cacheMap: Map<string, { data: any, timestamp: number }>, key: string) {
  const cached = cacheMap.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCache(cacheMap: Map<string, { data: any, timestamp: number }>, key: string, data: any) {
  cacheMap.set(key, { data, timestamp: Date.now() });
}

// Invalidate cache when overrides change
function invalidateUserCache(userId: string) {
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
const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL_2 = 5 * 60 * 1000; // 5 minutes

function getCached(key: string) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_2) {
    return cached.data;
  }
  return null;
}

function setCached(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

function clearCachePrefix(prefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

// Auth - Password Login
router.post('/auth/login', async (req, res) => {
  const { phone, password } = req.body;
  const user: any = await User.findOne({ where: { phone } });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (!user.password) {
    return res.status(401).json({ message: 'Please use OTP to login' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Generate session token
  const sessionToken = crypto.randomUUID();
  user.sessionToken = sessionToken;
  user.lastActivity = new Date();
  await user.save();

  const token = jwt.sign(
    { id: user.id, role: user.role, sessionToken },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

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

// Protect all non-auth endpoints with strict JWT middleware.
router.use((req, res, next) => {
  if (req.path === '/health' || req.path.startsWith('/auth/')) {
    return next();
  }
  return authMiddleware(req as any, res, next);
});

// ============ PERMISSIONS API ============

router.get('/permissions', requirePermission('users.manage'), async (req, res) => {
  const cacheKey = 'permissions_matrix';
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const [permissions, roles, allRolePermissions] = await Promise.all([
      Permission.findAll({ order: [['module', 'ASC'], ['name', 'ASC']] }),
      Role.findAll(),
      RolePermission.findAll()
    ]);

    const matrix: Record<string, Record<string, string[]>> = {};
    const rolePermMap = new Map<string, string[]>();
    
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
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/permissions/modules', async (req, res) => {
  const cacheKey = 'permission_modules';
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  const perms = await Permission.findAll({ attributes: ['module'] });
  const modules = [...new Set(perms.map(p => p.module))];
  setCached(cacheKey, modules);
  res.json(modules);
});

router.get('/roles', requirePermission('users.manage'), async (_req, res) => {
  try {
    const roles = await Role.findAll({ order: [['name', 'ASC']] });
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/roles', requirePermissionAction('users.manage', 'manage'), async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, error: 'Role name is required' });
    }

    const normalizedName = String(name).trim().toUpperCase();
    const existing = await Role.findOne({ where: { name: normalizedName } });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Role already exists' });
    }

    const role = await Role.create({
      id: `role-${Date.now()}`,
      name: normalizedName,
      description: description || `${normalizedName} role`
    } as any);

    res.status(201).json({ success: true, data: role });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/roles/:id', requirePermissionAction('users.manage', 'manage'), async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) return res.status(404).json({ success: false, error: 'Role not found' });

    const { name, description } = req.body;
    if (name && String(name).trim()) {
      const normalizedName = String(name).trim().toUpperCase();
      const duplicate = await Role.findOne({ where: { name: normalizedName } });
      if (duplicate && String((duplicate as any).id) !== String(role.id)) {
        return res.status(409).json({ success: false, error: 'Role already exists' });
      }
      (role as any).name = normalizedName;
    }
    if (typeof description === 'string') (role as any).description = description;

    await role.save();
    res.json({ success: true, data: role });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/roles/:id', requirePermissionAction('users.manage', 'manage'), async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) return res.status(404).json({ success: false, error: 'Role not found' });

    const usersOnRole = await User.count({ where: { role: (role as any).name } });
    if (usersOnRole > 0) {
      return res.status(400).json({ success: false, error: 'Cannot delete role assigned to users' });
    }

    await RolePermission.destroy({ where: { roleId: req.params.id } });
    await Role.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/permissions/role/:roleId', requirePermission('users.manage'), async (req, res) => {
  try {
    const rolePermissions = await RolePermission.findAll({ where: { roleId: req.params.roleId } });
    const permissions = await Permission.findAll({ order: [['module', 'ASC'], ['name', 'ASC']] });
    const rpMap = new Map(rolePermissions.map((rp: any) => [String(rp.permissionId), rp]));
    const result = permissions.map((perm: any) => {
      const rp: any = rpMap.get(String(perm.id));
      return {
        permission_id: String(perm.id),
        permission_key: perm.key,
        permission_name: perm.key,
        category: perm.module,
        granted: !!rp
      };
    });
    res.json(result);
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/permissions/role/:roleId/:permissionId', requirePermissionAction('users.manage', 'manage'), async (req, res) => {
  try {
    const { granted } = req.body;
    const permissionId = req.params.permissionId;
    const roleId = req.params.roleId;
    const existing = await RolePermission.findOne({ where: { roleId, permissionId } });
    if (granted) {
      if (!existing) {
        await RolePermission.create({
          id: `rp-${Date.now()}`,
          roleId,
          permissionId,
          actions: ['view']
        });
      }
    } else if (existing) {
      await RolePermission.destroy({ where: { id: existing.id } });
    }
    clearCachePrefix('permissions_');
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating role permission:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/users/:id/permissions', requirePermission('users.view'), async (req, res) => {
  const userId = req.params.id;
  const cacheKey = `user_permissions_${userId}`;
  const cached = getCache(permissionCache, cacheKey);
  if (cached) return res.json(cached);

  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const roleId = `role-${user.role === 'ADMIN' ? 1 : user.role === 'HR' ? 2 : user.role === 'MANAGER' ? 3 : 4}`;

    const [permissions, overrides, rolePerms] = await Promise.all([
      Permission.findAll(),
      UserPermissionOverride.findAll({ where: { userId, status: 'ACTIVE' } }),
      RolePermission.findAll({ where: { roleId } })
    ]);

    const overrideMap = new Map<string, any>();
    for (const o of overrides) {
      overrideMap.set(o.permissionId, o);
    }
    
    const rolePermMap = new Map<string, any>();
    for (const rp of rolePerms) {
      rolePermMap.set(rp.permissionId, rp);
    }

    const effectivePerms: Record<string, any> = {};
    const now = new Date();

    for (const perm of permissions) {
      const override = overrideMap.get(perm.id);
      let hasPermission = false;
      let actions: string[] = [];
      let source = 'role';

      if (override) {
        if (override.overrideType === 'GRANT' && (!override.expiresAt || new Date(override.expiresAt) > now)) {
          hasPermission = true;
          actions = override.actions || ['view'];
          source = 'override';
        } else if (override.overrideType === 'REVOKE') {
          hasPermission = false;
          actions = [];
          source = 'override';
        }
      } else {
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
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/users/:id/overrides', requirePermission('users.view'), async (req, res) => {
  try {
    const overrides = await UserPermissionOverride.findAll({
      where: { userId: req.params.id },
      include: [{ model: Permission, as: 'permission' }],
      order: [['createdAt', 'DESC']]
    });

    res.json(overrides);
  } catch (error) {
    console.error('Error fetching user overrides:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/users/:id/overrides', requirePermissionAction('users.manage', 'manage'), async (req, res) => {
  const { permissionId, overrideType, reason, expiresAt } = req.body;
  const currentUser = (req as any).user;

  try {
    const permission = await Permission.findByPk(permissionId);
    if (!permission) return res.status(404).json({ message: 'Permission not found' });

    // Check if sensitive permission requires approval
    if (permission.isSensitive) {
      const request = await PermissionOverrideRequest.create({
        id: `req-${Date.now()}`,
        userId: req.params.id,
        permissionId,
        overrideType,
        requestedBy: currentUser.id,
        reason,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        status: 'PENDING'
      });

      await AuditLog.create({
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
    const override = await UserPermissionOverride.create({
      id: `ovr-${Date.now()}`,
      userId: req.params.id,
      permissionId,
      overrideType,
      grantedBy: currentUser.id,
      reason,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      status: 'ACTIVE'
    });

    await AuditLog.create({
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
  } catch (error) {
    console.error('Error creating override:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/users/:id/overrides/:overrideId', requirePermissionAction('users.manage', 'manage'), async (req, res) => {
  try {
    await UserPermissionOverride.destroy({ where: { id: req.params.overrideId } });
    invalidateUserCache(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing override:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/permissions/requests/pending', requirePermissionAction('users.manage', 'approve'), async (req, res) => {
  try {
    const requests = await PermissionOverrideRequest.findAll({
      where: { status: 'PENDING' },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'role'] },
        { model: Permission, as: 'permission' }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/permissions/requests/my', async (req, res) => {
  try {
    const currentUser = (req as any).user;
    const requests = await PermissionOverrideRequest.findAll({
      where: { requestedBy: currentUser.id },
      include: [{ model: Permission, as: 'permission' }],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('Error fetching my requests:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/permissions/requests', async (req, res) => {
  try {
    const currentUser = (req as any).user;
    const { user_id, permission_id, override_type, reason, expires_at } = req.body;
    const request = await PermissionOverrideRequest.create({
      id: `req-${Date.now()}`,
      userId: user_id,
      permissionId: permission_id,
      overrideType: override_type,
      requestedBy: currentUser.id,
      reason,
      expiresAt: expires_at ? new Date(expires_at) : null,
      status: 'PENDING'
    });
    res.status(201).json({ success: true, data: request });
  } catch (error) {
    console.error('Error creating permission request:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/permissions/overrides/active', requirePermission('users.manage'), async (_req, res) => {
  try {
    const now = new Date();
    const items = await UserPermissionOverride.findAll({
      where: {
        status: 'ACTIVE',
        [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gte]: now } }]
      },
      include: [{ model: User, as: 'user' }, { model: Permission, as: 'permission' }],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error fetching active overrides:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/permissions/overrides/expired', requirePermission('users.manage'), async (_req, res) => {
  try {
    const items = await UserPermissionOverride.findAll({
      where: {
        [Op.or]: [{ status: 'EXPIRED' }, { expiresAt: { [Op.lt]: new Date() } }]
      },
      include: [{ model: User, as: 'user' }, { model: Permission, as: 'permission' }],
      order: [['updatedAt', 'DESC']]
    });
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error fetching expired overrides:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/permissions/requests/:id/approve', requirePermissionAction('users.manage', 'approve'), async (req, res) => {
  const currentUser = (req as any).user;
  const { comments } = req.body;

  try {
    const request = await PermissionOverrideRequest.findByPk(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = 'APPROVED';
    request.reviewedBy = currentUser.id;
    request.reviewedAt = new Date();
    request.comments = comments;
    await request.save();

    // Create the override
    const override = await UserPermissionOverride.create({
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

    await AuditLog.create({
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
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/permissions/requests/:id/reject', requirePermissionAction('users.manage', 'approve'), async (req, res) => {
  const currentUser = (req as any).user;
  const { comments } = req.body;

  try {
    const request = await PermissionOverrideRequest.findByPk(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = 'REJECTED';
    request.reviewedBy = currentUser.id;
    request.reviewedAt = new Date();
    request.comments = comments;
    await request.save();

    await AuditLog.create({
      id: `audit-${Date.now()}`,
      entityType: 'permission_request',
      entityId: req.params.id,
      action: 'REJECT',
      oldValue: { status: 'PENDING' },
      newValue: { status: 'REJECTED', comments },
      performedBy: currentUser.id
    });

    res.json(request);
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ============ SETTINGS API ============

router.get('/settings/global', async (req, res) => {
  const cacheKey = 'global_settings';
  const cached = getCache(settingsCache, cacheKey);
  if (cached) return res.json(cached);

  try {
    const settings = await SystemSetting.findAll({ order: [['category', 'ASC'], ['key', 'ASC']] });
    setCache(settingsCache, cacheKey, settings);
    res.json(settings);
  } catch (error) {
    console.error('Error fetching global settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/settings/global', async (req, res) => {
  const { key, value, description } = req.body;
  const currentUser = (req as any).user;

  try {
    const existing = await SystemSetting.findOne({ where: { key } });
    const oldValue = existing?.value;

    if (existing) {
      existing.value = value;
      if (description) existing.description = description;
      await existing.save();
    } else {
      await SystemSetting.create({
        id: `ss-${Date.now()}`,
        key,
        value,
        category: key.split('.')[0],
        description
      });
    }

    await AuditLog.create({
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
  } catch (error) {
    console.error('Error updating global setting:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/settings/global/:key', requirePermissionAction('settings.edit', 'edit'), async (req, res) => {
  const key = req.params.key;
  const { value, reason } = req.body;
  const currentUser = (req as any).user;
  try {
    const existing = await SystemSetting.findOne({ where: { key } });
    const oldValue = existing?.value ?? null;
    if (existing) {
      existing.value = value;
      await existing.save();
    } else {
      await SystemSetting.create({
        id: `ss-${Date.now()}`,
        key,
        value,
        category: key.split('.')[0]
      });
    }

    await AuditLog.create({
      id: `audit-${Date.now()}`,
      entityType: 'system_setting',
      entityId: key,
      action: 'UPDATE',
      oldValue,
      newValue: value,
      performedBy: currentUser.id,
      reason: reason || `Updated ${key}`
    });

    invalidateGlobalCache();
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating global setting by key:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/settings/departments/:id', async (req, res) => {
  try {
    const settings = await DepartmentSetting.findAll({ where: { departmentId: req.params.id } });
    res.json(settings);
  } catch (error) {
    console.error('Error fetching department settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/settings/departments/:id', async (req, res) => {
  const { key, value } = req.body;
  const currentUser = (req as any).user;

  try {
    const existing = await DepartmentSetting.findOne({
      where: { departmentId: req.params.id, settingKey: key }
    });
    const oldValue = existing?.value;

    if (existing) {
      existing.value = value;
      await existing.save();
    } else {
      await DepartmentSetting.create({
        id: `ds-${Date.now()}`,
        departmentId: req.params.id,
        settingKey: key,
        value
      });
    }

    await AuditLog.create({
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
  } catch (error) {
    console.error('Error updating department setting:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/settings/positions/:id', requirePermission('settings.view'), async (req, res) => {
  try {
    const settings = await PositionSetting.findAll({ where: { positionId: req.params.id } });
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching position settings:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/settings/positions/:id', requirePermissionAction('settings.override', 'manage'), async (req, res) => {
  const { key, value, reason } = req.body;
  const currentUser = (req as any).user;
  try {
    const existing = await PositionSetting.findOne({
      where: { positionId: req.params.id, settingKey: key }
    });
    const oldValue = existing?.value ?? null;
    if (existing) {
      existing.value = value;
      await existing.save();
    } else {
      await PositionSetting.create({
        id: `ps-${Date.now()}`,
        positionId: req.params.id,
        settingKey: key,
        value
      });
    }
    await AuditLog.create({
      id: `audit-${Date.now()}`,
      entityType: 'position_setting',
      entityId: `${req.params.id}_${key}`,
      action: 'UPDATE',
      oldValue,
      newValue: value,
      performedBy: currentUser.id,
      reason: reason || 'Position setting updated',
      metadata: { positionId: req.params.id, settingKey: key }
    });
    invalidateGlobalCache();
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating position setting:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/settings/employees/:id', requirePermission('settings.view'), async (req, res) => {
  try {
    const settings = await EmployeeSetting.findAll({ where: { employeeId: req.params.id } });
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching employee settings:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/settings/employees/:id', requirePermissionAction('settings.override', 'manage'), async (req, res) => {
  const { key, value, reason } = req.body;
  const currentUser = (req as any).user;
  try {
    const existing = await EmployeeSetting.findOne({
      where: { employeeId: req.params.id, settingKey: key }
    });
    const oldValue = existing?.value ?? null;
    if (existing) {
      existing.value = value;
      await existing.save();
    } else {
      await EmployeeSetting.create({
        id: `es-${Date.now()}`,
        employeeId: req.params.id,
        settingKey: key,
        value
      });
    }
    await AuditLog.create({
      id: `audit-${Date.now()}`,
      entityType: 'employee_setting',
      entityId: `${req.params.id}_${key}`,
      action: 'UPDATE',
      oldValue,
      newValue: value,
      performedBy: currentUser.id,
      reason: reason || 'Employee setting updated',
      metadata: { employeeId: req.params.id, settingKey: key }
    });
    invalidateGlobalCache();
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating employee setting:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/settings/effective/:employeeId/:key', async (req, res) => {
  const { employeeId, key } = req.params;

  try {
    let value = null;
    let level = 'none';
    let levelId = null;

    // Check employee-specific override
    const empSetting = await EmployeeSetting.findOne({
      where: { employeeId, settingKey: key }
    });
    if (empSetting) {
      value = empSetting.value;
      level = 'employee';
      levelId = employeeId;
    } else {
      // Check position override
      const user = await User.findByPk(employeeId);
      if (user) {
        const posSetting = await PositionSetting.findOne({
          where: { positionId: user.position, settingKey: key }
        });
        if (posSetting) {
          value = posSetting.value;
          level = 'position';
          levelId = user.position;
        } else {
          // Check department override
          const deptSetting = await DepartmentSetting.findOne({
            where: { departmentId: user.departmentId, settingKey: key }
          });
          if (deptSetting) {
            value = deptSetting.value;
            level = 'department';
            levelId = user.departmentId;
          } else {
            // Use global setting
            const globalSetting = await SystemSetting.findOne({ where: { key } });
            if (globalSetting) {
              value = globalSetting.value;
              level = 'global';
            }
          }
        }
      }
    }

    res.json({ value, level, levelId });
  } catch (error) {
    console.error('Error getting effective setting:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/settings/audit/:settingKey', requirePermission('settings.view'), async (req, res) => {
  try {
    const data = await AuditLog.findAll({
      where: { entityType: 'system_setting', entityId: req.params.settingKey },
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching setting audit:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ============ AUDIT API ============

router.get('/audit/all', async (req, res) => {
  const { entityType, performedBy, startDate, endDate, limit = 100 } = req.query;

  try {
    const where: any = {};

    if (entityType) where.entityType = entityType;
    if (performedBy) where.performedBy = performedBy;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate as string);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate as string);
    }

    const logs = await AuditLog.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit as string)
    });

    res.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/audit/compliance-report', async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'Start and end dates required' });
  }

  try {
    const logs = await AuditLog.findAll({
      where: {
        createdAt: {
          [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
        }
      },
      order: [['createdAt', 'ASC']]
    });

    const summary = {
      totalChanges: logs.length,
      settingChanges: logs.filter(l => l.entityType.includes('setting')).length,
      permissionChanges: logs.filter(l => l.entityType === 'permission_override' || l.entityType === 'permission_request').length,
      usersAffected: new Set(logs.map(l => l.entityId)).size,
      byUser: {} as Record<string, number>
    };

    for (const log of logs) {
      summary.byUser[log.performedBy] = (summary.byUser[log.performedBy] || 0) + 1;
    }

    res.json({ logs, summary });
  } catch (error) {
    console.error('Error generating compliance report:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ============ EXISTING API ENDPOINTS ============

// Users
router.get('/users', requirePermission('users.view'), async (req, res) => {
  const cacheKey = 'all_users';
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  const users = await User.findAll();
  setCached(cacheKey, users);
  res.json(users);
});

router.get('/users/:id', requirePermission('users.view'), async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

router.post('/users', requirePermissionAction('users.create', 'create'), async (req, res) => {
  const { username, email, password, role, phone } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
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
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Departments
router.get('/departments', requirePermission('department.view'), async (req, res) => {
  const cacheKey = 'all_departments';
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  const departments = await Department.findAll();
  setCached(cacheKey, departments);
  res.json(departments);
});

router.get('/positions', requirePermission('position.view'), async (_req, res) => {
  try {
    const positions = await Position.findAll({ order: [['title', 'ASC']] });
    res.json(positions);
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/departments', requirePermissionAction('department.create', 'create'), async (req, res) => {
  const { name, description } = req.body;
  try {
    const department = await Department.create({
      id: `dept-${Date.now()}`,
      name,
      description
    });
    clearCachePrefix('all_departments');
    res.status(201).json(department);
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/positions', requirePermissionAction('position.create', 'create'), async (req, res) => {
  const { title, departmentId, salary } = req.body;
  try {
    const position = await Position.create({
      id: `pos-${Date.now()}`,
      title,
      departmentId,
      salary
    });
    res.status(201).json(position);
  } catch (error) {
    console.error('Error creating position:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/employees', requirePermissionAction('employees.create', 'create'), async (req, res) => {
  const { userId, firstName, lastName, email, positionId, departmentId, hireDate } = req.body;
  try {
    const employee = await Employee.create({
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
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Attendance
router.get('/attendance', requirePermission('attendance.view'), async (req, res) => {
  const attendance = await AttendanceRecord.findAll({ order: [['date', 'DESC']] });
  res.json(attendance);
});

router.get('/users/:id/attendance', requirePermission('attendance.view'), async (req, res) => {
  try {
    const records = await AttendanceRecord.findAll({
      where: { userId: req.params.id },
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });
    res.json(records);
  } catch (error) {
    console.error('Error fetching user attendance:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/attendance/clock-in', requirePermissionAction('attendance.edit', 'edit'), async (req, res) => {
  const employeeId = req.body.employeeId || req.body.userId;
  const timestamp = req.body.timestamp || new Date().toISOString();
  try {
    const date = new Date(timestamp).toISOString().split('T')[0];
    const attendance = await AttendanceRecord.create({
      id: `att-${Date.now()}`,
      userId: employeeId,
      date,
      clockIn: timestamp,
      status: 'PRESENT'
    });
    clearCachePrefix('report_stats');
    res.status(201).json(attendance);
  } catch (error) {
    console.error('Error clocking in:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/attendance/clock-out', requirePermissionAction('attendance.edit', 'edit'), async (req, res) => {
  const employeeId = req.body.employeeId || req.body.userId;
  const timestamp = req.body.timestamp || new Date().toISOString();
  try {
    const date = new Date(timestamp).toISOString().split('T')[0];
    const attendance = await AttendanceRecord.findOne({
      where: { userId: employeeId, date },
      order: [['createdAt', 'DESC']]
    });
    if (attendance) {
      attendance.clockOut = timestamp;
      await attendance.save();
      res.json(attendance);
    } else {
      res.status(404).json({ message: 'No attendance record found for today' });
    }
  } catch (error) {
    console.error('Error clocking out:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/attendance/:recordId/clock-out', requirePermissionAction('attendance.edit', 'edit'), async (req, res) => {
  try {
    const attendance = await AttendanceRecord.findByPk(req.params.recordId);
    if (!attendance) return res.status(404).json({ message: 'Attendance record not found' });

    attendance.clockOut = new Date().toISOString();
    if (req.body?.location) {
      (attendance as any).locationOut = req.body.location;
    }
    await attendance.save();
    res.json(attendance);
  } catch (error) {
    console.error('Error clocking out by record id:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Leaves
router.get('/leaves', requirePermission('leave.view'), async (req, res) => {
  const leaves = await LeaveRequest.findAll({ order: [['createdAt', 'DESC']] });
  res.json(leaves);
});

router.get('/leaves/types', requirePermission('leave.view'), async (_req, res) => {
  res.json([
    { id: 'lt-annual', name: 'Annual', description: 'Annual leave' },
    { id: 'lt-sick', name: 'Sick', description: 'Sick leave' },
    { id: 'lt-unpaid', name: 'Unpaid', description: 'Unpaid leave' }
  ]);
});

router.post('/leaves/types', requirePermissionAction('leave.edit', 'edit'), async (req, res) => {
  const { name, description } = req.body || {};
  if (!name) return res.status(400).json({ message: 'name is required' });
  res.status(201).json({ id: `lt-${Date.now()}`, name, description: description || '' });
});

router.post('/leave', requirePermissionAction('leave.create', 'create'), async (req, res) => {
  const { employeeId, type, startDate, endDate, reason } = req.body;
  try {
    const leave = await LeaveRequest.create({
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
  } catch (error) {
    console.error('Error submitting leave request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/leaves', requirePermissionAction('leave.create', 'create'), async (req, res) => {
  const { userId, employeeId, type, startDate, endDate, reason } = req.body;
  try {
    const leave = await LeaveRequest.create({
      id: `leave-${Date.now()}`,
      userId: userId || employeeId,
      type,
      startDate,
      endDate,
      reason,
      status: 'PENDING',
      appliedOn: new Date().toISOString().split('T')[0]
    });
    clearCachePrefix('report_stats');
    res.status(201).json(leave);
  } catch (error) {
    console.error('Error submitting leave request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/leaves/:id/status', requirePermissionAction('leave.approve', 'approve'), async (req, res) => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body;
  try {
    const leave = await LeaveRequest.findByPk(id);
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });
    leave.status = status;
    (leave as any).rejectionReason = rejectionReason || null;
    await leave.save();
    clearCachePrefix('report_stats');
    res.json(leave);
  } catch (error) {
    console.error('Error updating leave status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Projects
const formatProjectCode = (n: number) => `PRJ-${new Date().getFullYear()}-${String(n).padStart(3, '0')}`;

const generateProjectCode = async () => {
  const count = await Project.count();
  return formatProjectCode(count + 1);
};

const isValidProjectTransition = (from: string, to: string) => {
  if (from === to) return true;
  const map: Record<string, string[]> = {
    PLANNING: ['ACTIVE', 'CANCELLED'],
    ACTIVE: ['ON_HOLD', 'COMPLETED', 'CANCELLED'],
    ON_HOLD: ['ACTIVE', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: []
  };
  return (map[from] || []).includes(to);
};

const toTaskDto = (task: any) => {
  const due = task?.dueDate ? new Date(task.dueDate) : null;
  const overdue = !!due && due < new Date() && task.status !== 'DONE';
  return { ...task.toJSON(), overdue };
};

const validateHours = (estimatedHours: number, loggedHours: number, approvedExtraHours: boolean) => {
  if ((loggedHours || 0) > (estimatedHours || 0) && !approvedExtraHours) {
    return false;
  }
  return true;
};

const isValidTaskTransition = (from: string, to: string) => {
  if (from === to) return true;
  const map: Record<string, string[]> = {
    TODO: ['IN_PROGRESS', 'BLOCKED'],
    IN_PROGRESS: ['REVIEW', 'BLOCKED'],
    REVIEW: ['DONE', 'IN_PROGRESS', 'BLOCKED'],
    BLOCKED: ['TODO', 'IN_PROGRESS'],
    DONE: []
  };
  return (map[from] || []).includes(to);
};

const sendDueSoonNotification = async (assigneeId?: string, taskName?: string, dueDate?: string, projectId?: string) => {
  if (!assigneeId || !dueDate) return;
  const due = new Date(dueDate);
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays >= 0 && diffDays <= 3) {
    await Notification.create({
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: assigneeId,
      title: 'Task due soon',
      message: `Task "${taskName || 'Untitled task'}" is due on ${due.toLocaleDateString()}.`,
      type: 'WARNING',
      isRead: false,
      createdAt: new Date().toISOString(),
      link: projectId ? `/projects` : '/tasks'
    });
  }
};

const calculateProjectProgress = async (projectId: string) => {
  const tasks = await Task.findAll({ where: { projectId } });
  const total = tasks.length;
  const completed = tasks.filter((t: any) => t.status === 'DONE').length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, progress };
};

const toProjectDto = async (project: any) => {
  const { total, completed, progress } = await calculateProjectProgress(String(project.id));
  if (Number(project.progress || 0) !== progress) {
    project.progress = progress;
    await project.save();
  }

  return {
    ...project.toJSON(),
    totalTasks: total,
    completedTasks: completed,
    members: project.members || [],
    milestones: project.milestones || []
  };
};

const logProjectActivity = async (projectId: string, userId: string | null, action: string, description: string, oldValue?: any, newValue?: any) => {
  try {
    await AuditLog.create({
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      entityType: 'project',
      entityId: projectId,
      action,
      oldValue: oldValue ?? null,
      newValue: newValue ?? null,
      performedBy: userId || null,
      reason: description
    } as any);
  } catch (error) {
    console.error('Failed to log project activity:', error);
  }
};

router.get('/projects/timeline', requirePermission('project.view'), async (req, res) => {
  try {
    const projects = await Project.findAll({ order: [['createdAt', 'DESC']] });
    const mapped = await Promise.all(projects.map((p: any) => toProjectDto(p)));
    res.json(mapped);
  } catch (error) {
    console.error('Error fetching projects timeline:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/projects/statistics', requirePermission('project.view'), async (_req, res) => {
  try {
    const projects = await Project.findAll();
    const list = await Promise.all(projects.map((p: any) => toProjectDto(p)));
    const total = list.length;
    const active = list.filter((p: any) => p.status === 'ACTIVE').length;
    const planning = list.filter((p: any) => p.status === 'PLANNING').length;
    const completed = list.filter((p: any) => p.status === 'COMPLETED').length;
    const onHold = list.filter((p: any) => p.status === 'ON_HOLD').length;
    const cancelled = list.filter((p: any) => p.status === 'CANCELLED').length;
    const overallProgress = total === 0 ? 0 : Math.round(list.reduce((acc: number, p: any) => acc + Number(p.progress || 0), 0) / total);
    res.json({ total, active, planning, completed, onHold, cancelled, overallProgress });
  } catch (error) {
    console.error('Error fetching project statistics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/projects', requirePermission('project.view'), async (req, res) => {
  try {
    const where: any = {};
    if (req.query.status && req.query.status !== 'ALL') {
      where.status = req.query.status;
    }
    const projects = await Project.findAll({ where, order: [['createdAt', 'DESC']] });
    const mapped = await Promise.all(projects.map((p: any) => toProjectDto(p)));
    res.json(mapped);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/projects/:id', requirePermission('project.view'), async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const tasksRaw = await Task.findAll({
      where: { projectId: req.params.id },
      order: [['createdAt', 'DESC']]
    });
    const tasks = tasksRaw.map((t: any) => toTaskDto(t));

    const membersRaw = (project as any).members || [];
    const memberIds = membersRaw.map((m: any) => m.userId).filter(Boolean);
    const users = memberIds.length ? await User.findAll({ where: { id: memberIds } }) : [];
    const usersMap = new Map(users.map((u: any) => [String(u.id), u]));
    const members = membersRaw.map((m: any) => ({
      ...m,
      user: usersMap.get(String(m.userId)) || null
    }));

    const payload = await toProjectDto(project);
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: any) => t.status === 'DONE').length;
    const teamMembers = new Set((project as any).members?.map((m: any) => m.userId).filter(Boolean)).size;
    const teamProgress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    const individualProgress = Array.from(new Set(tasks.map((t: any) => t.assigneeId).filter(Boolean))).map((assigneeId: any) => {
      const assigneeTasks = tasks.filter((t: any) => String(t.assigneeId) === String(assigneeId));
      const done = assigneeTasks.filter((t: any) => t.status === 'DONE').length;
      return {
        employeeId: assigneeId,
        totalTasks: assigneeTasks.length,
        completedTasks: done,
        progress: assigneeTasks.length === 0 ? 0 : Math.round((done / assigneeTasks.length) * 100)
      };
    });
    res.json({
      project: payload,
      tasks,
      members,
      milestones: payload.milestones || [],
      metrics: {
        teamMembers,
        totalTasks,
        completedTasks,
        teamProgress,
        individualProgress
      }
    });
  } catch (error) {
    console.error('Error fetching project details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/projects', requirePermissionAction('project.create', 'create'), async (req, res) => {
  try {
    const startDate = req.body.startDate || new Date().toISOString().split('T')[0];
    const endDate = req.body.deadline || req.body.endDate;
    if (endDate && new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const requestedCode = req.body.projectCode || req.body.project_code;
    const projectCode = requestedCode || (await generateProjectCode());
    const codeExists = await Project.findOne({ where: { projectCode } });
    if (codeExists) {
      return res.status(409).json({ message: 'Project code must be unique' });
    }

    const project = await Project.create({
      id: `proj-${Date.now()}`,
      projectCode,
      title: req.body.title,
      description: req.body.description || '',
      // New projects always start in planning phase per lifecycle rules.
      status: 'PLANNING',
      departmentId: req.body.departmentId || null,
      leadId: req.body.leadId || null,
      startDate,
      deadline: endDate || null,
      members: req.body.members || [],
      milestones: req.body.milestones || [],
      priority: req.body.priority || 'MEDIUM',
      budget: req.body.budget || 0,
      actualCost: req.body.actualCost || 0,
      progress: 0
    });
    await logProjectActivity(String((project as any).id), (req as any).user?.id || null, 'create', 'Project created', null, project.toJSON());
    res.status(201).json(await toProjectDto(project));
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/projects/:id', requirePermissionAction('project.edit', 'edit'), async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const fromStatus = String((project as any).status || 'PLANNING');
    const toStatus = String(req.body.status ?? fromStatus);
    if (!isValidProjectTransition(fromStatus, toStatus)) {
      return res.status(400).json({ message: `Invalid status transition: ${fromStatus} -> ${toStatus}` });
    }

    const startDate = req.body.startDate ?? (project as any).startDate;
    const deadline = req.body.deadline ?? (project as any).deadline;
    if (deadline && startDate && new Date(deadline) < new Date(startDate)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const budget = Number(req.body.budget ?? (project as any).budget ?? 0);
    const actualCost = Number(req.body.actualCost ?? (project as any).actualCost ?? 0);
    if (actualCost > budget && !req.body.approvedBudgetOverrun) {
      return res.status(400).json({ message: 'Actual cost cannot exceed budget without approval' });
    }

    const old = (project as any).toJSON();
    await (project as any).update({
      title: req.body.title ?? (project as any).title,
      description: req.body.description ?? (project as any).description,
      status: toStatus,
      departmentId: req.body.departmentId ?? (project as any).departmentId,
      leadId: req.body.leadId ?? (project as any).leadId,
      startDate,
      deadline,
      priority: req.body.priority ?? (project as any).priority,
      budget,
      actualCost,
      actualEndDate: toStatus === 'COMPLETED' ? (req.body.actualEndDate || new Date().toISOString().split('T')[0]) : ((project as any).actualEndDate || null)
    });
    await logProjectActivity(req.params.id, (req as any).user?.id || null, 'update', 'Project updated', old, (project as any).toJSON());
    res.json(await toProjectDto(project));
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/projects/:id', requirePermissionAction('project.delete', 'delete'), async (req, res) => {
  try {
    const taskCount = await Task.count({ where: { projectId: req.params.id } as any });
    if (taskCount > 0) {
      return res.status(400).json({ message: 'Cannot delete project with existing tasks' });
    }
    const project = await Project.findByPk(req.params.id);
    await Project.destroy({ where: { id: req.params.id } });
    await logProjectActivity(req.params.id, (req as any).user?.id || null, 'delete', 'Project deleted', project ? (project as any).toJSON() : null, null);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/projects/:id/team', requirePermissionAction('project.edit', 'edit'), async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const members = Array.isArray(req.body.members) ? req.body.members : [];

    const warnings: string[] = [];
    for (const member of members) {
      const employeeId = String(member.userId || '');
      const allocation = Number(member.allocation || 0);
      if (!employeeId) continue;

      const allProjects = await Project.findAll();
      const totalAllocation = allProjects.reduce((acc: number, p: any) => {
        const pMembers = (p.members || []) as any[];
        const alloc = pMembers
          .filter((m: any) => String(m.userId) === employeeId)
          .reduce((s: number, m: any) => s + Number(m.allocation || 0), 0);
        if (String(p.id) === String(req.params.id)) return acc + allocation;
        return acc + alloc;
      }, 0);

      if (totalAllocation > 100) {
        return res.status(400).json({ message: `Allocation critical: employee ${employeeId} exceeds 100%` });
      }
      if (totalAllocation > 80) {
        warnings.push(`Allocation warning: employee ${employeeId} is at ${totalAllocation}%`);
      }
    }

    (project as any).members = members;
    await project.save();
    await logProjectActivity(req.params.id, (req as any).user?.id || null, 'update', 'Project team updated', null, members);
    res.json({ success: true, members, warnings });
  } catch (error) {
    console.error('Error updating project team:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/projects/availability/:employeeId', requirePermission('project.view'), async (req, res) => {
  try {
    const employeeId = String(req.params.employeeId);
    const projects = await Project.findAll();
    const totalAllocation = projects.reduce((acc: number, p: any) => {
      const pMembers = (p.members || []) as any[];
      return acc + pMembers
        .filter((m: any) => String(m.userId) === employeeId)
        .reduce((s: number, m: any) => s + Number(m.allocation || 0), 0);
    }, 0);
    res.json({
      employeeId,
      totalAllocation,
      available: Math.max(0, 100 - totalAllocation),
      warning: totalAllocation > 80,
      critical: totalAllocation > 100
    });
  } catch (error) {
    console.error('Error checking employee availability:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/projects/:id/milestones', requirePermissionAction('project.edit', 'edit'), async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const milestones = Array.isArray(req.body.milestones) ? req.body.milestones : [];
    (project as any).milestones = milestones;
    await project.save();
    await logProjectActivity(req.params.id, (req as any).user?.id || null, 'update', 'Project milestones updated', null, milestones);
    res.json({ success: true, milestones });
  } catch (error) {
    console.error('Error updating milestones:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/projects/:id/tasks', requirePermission('project.view'), async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: { projectId: req.params.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(tasks.map((t: any) => toTaskDto(t)));
  } catch (error) {
    console.error('Error fetching project tasks:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/projects/:id/team', requirePermission('project.view'), async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const members = (project as any).members || [];
    const ids = members.map((m: any) => m.userId).filter(Boolean);
    const users = ids.length ? await User.findAll({ where: { id: ids } as any }) : [];
    const userMap = new Map(users.map((u: any) => [String(u.id), u]));
    res.json(members.map((m: any) => ({ ...m, user: userMap.get(String(m.userId)) || null })));
  } catch (error) {
    console.error('Error fetching project team:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/projects/:id/assign', requirePermissionAction('project.edit', 'edit'), async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const members = ((project as any).members || []) as any[];
    const newMember = {
      userId: req.body.employeeId || req.body.userId,
      role: req.body.role || 'Member',
      allocation: Number(req.body.allocation ?? req.body.allocation_percentage ?? 100)
    };
    if (!newMember.userId) return res.status(400).json({ message: 'employeeId is required' });
    if (members.some((m) => String(m.userId) === String(newMember.userId))) {
      return res.status(409).json({ message: 'Employee already assigned' });
    }
    members.push(newMember);
    (project as any).members = members;
    await project.save();
    await logProjectActivity(req.params.id, (req as any).user?.id || null, 'update', 'Team member assigned', null, newMember);
    res.status(201).json({ success: true, member: newMember });
  } catch (error) {
    console.error('Error assigning team member:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/projects/:id/assign/:employeeId', requirePermissionAction('project.edit', 'edit'), async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const members = ((project as any).members || []) as any[];
    const idx = members.findIndex((m) => String(m.userId) === String(req.params.employeeId));
    if (idx === -1) return res.status(404).json({ message: 'Assignment not found' });
    members[idx] = {
      ...members[idx],
      role: req.body.role ?? members[idx].role,
      allocation: Number(req.body.allocation ?? req.body.allocation_percentage ?? members[idx].allocation ?? 100)
    };
    (project as any).members = members;
    await project.save();
    await logProjectActivity(req.params.id, (req as any).user?.id || null, 'update', 'Team allocation updated', null, members[idx]);
    res.json({ success: true, member: members[idx] });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/projects/:id/assign/:employeeId', requirePermissionAction('project.edit', 'edit'), async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const members = ((project as any).members || []) as any[];
    const next = members.filter((m) => String(m.userId) !== String(req.params.employeeId));
    (project as any).members = next;
    await project.save();
    await logProjectActivity(req.params.id, (req as any).user?.id || null, 'delete', 'Team member removed', null, { employeeId: req.params.employeeId });
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing assignment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/projects/:id/milestones', requirePermission('project.view'), async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json((project as any).milestones || []);
  } catch (error) {
    console.error('Error fetching milestones:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/projects/:id/milestones', requirePermissionAction('project.edit', 'edit'), async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const milestones = ((project as any).milestones || []) as any[];
    const milestone = {
      id: `ms-${Date.now()}`,
      title: req.body.title || req.body.milestone_name || 'Milestone',
      dueDate: req.body.dueDate || req.body.target_date || new Date().toISOString().split('T')[0],
      completed: !!req.body.completed
    };
    milestones.push(milestone);
    (project as any).milestones = milestones;
    await project.save();
    res.status(201).json(milestone);
  } catch (error) {
    console.error('Error creating milestone:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/projects/:id/milestones/:milestoneId', requirePermissionAction('project.edit', 'edit'), async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const milestones = ((project as any).milestones || []) as any[];
    const idx = milestones.findIndex((m) => String(m.id) === String(req.params.milestoneId));
    if (idx === -1) return res.status(404).json({ message: 'Milestone not found' });
    milestones[idx] = {
      ...milestones[idx],
      title: req.body.title ?? milestones[idx].title,
      dueDate: req.body.dueDate ?? milestones[idx].dueDate,
      completed: req.body.completed ?? milestones[idx].completed
    };
    (project as any).milestones = milestones;
    await project.save();
    res.json(milestones[idx]);
  } catch (error) {
    console.error('Error updating milestone:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/projects/:id/milestones/:milestoneId', requirePermissionAction('project.edit', 'edit'), async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const milestones = ((project as any).milestones || []) as any[];
    (project as any).milestones = milestones.filter((m) => String(m.id) !== String(req.params.milestoneId));
    await project.save();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting milestone:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/projects/:id/gantt', requirePermission('project.view'), async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const tasks = await Task.findAll({ where: { projectId: req.params.id } as any, order: [['createdAt', 'ASC']] });
    res.json({
      project: await toProjectDto(project),
      tasks: tasks.map((t: any) => toTaskDto(t)),
      milestones: (project as any).milestones || []
    });
  } catch (error) {
    console.error('Error fetching project gantt:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/projects/:id/team/progress', requirePermission('project.view'), async (req, res) => {
  try {
    const tasks = await Task.findAll({ where: { projectId: req.params.id } as any });
    const grouped: Record<string, { total: number; done: number }> = {};
    for (const t of tasks as any[]) {
      const uid = String(t.assigneeId || '');
      if (!uid) continue;
      if (!grouped[uid]) grouped[uid] = { total: 0, done: 0 };
      grouped[uid].total += 1;
      if (t.status === 'DONE') grouped[uid].done += 1;
    }
    const users = await User.findAll({ where: { id: Object.keys(grouped) } as any });
    const map = new Map(users.map((u: any) => [String(u.id), u]));
    const rows = Object.entries(grouped).map(([uid, s]) => ({
      employeeId: uid,
      employee: map.get(uid) || null,
      totalTasks: s.total,
      completedTasks: s.done,
      progress: s.total === 0 ? 0 : Math.round((s.done / s.total) * 100)
    }));
    const totalTasks = tasks.length;
    const completedTasks = (tasks as any[]).filter((t) => t.status === 'DONE').length;
    res.json({
      teamMembers: rows.length,
      totalTasks,
      completedTasks,
      teamProgress: totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
      members: rows
    });
  } catch (error) {
    console.error('Error fetching team progress:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/projects/:id/activity', requirePermission('project.view'), async (req, res) => {
  try {
    const logs = await AuditLog.findAll({
      where: { entityType: 'project', entityId: req.params.id } as any,
      order: [['createdAt', 'DESC']]
    });
    res.json(logs);
  } catch (error) {
    console.error('Error fetching project activity:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/projects/:id/tasks', requirePermissionAction('project.create', 'create'), async (req, res) => {
  try {
    if ((req.body.dueDate && req.body.startDate) && new Date(req.body.dueDate) < new Date(req.body.startDate)) {
      return res.status(400).json({ message: 'Task due date must be after start date' });
    }
    if (!validateHours(Number(req.body.estimatedHours || 0), Number(req.body.loggedHours || 0), !!req.body.approvedExtraHours)) {
      return res.status(400).json({ message: 'Actual hours cannot exceed estimated hours without approval' });
    }
    const task = await Task.create({
      id: `task-${Date.now()}`,
      projectId: req.params.id,
      title: req.body.title,
      description: req.body.description || '',
      assigneeId: req.body.assigneeId || null,
      creatorId: (req as any).user?.id || req.body.creatorId || null,
      status: req.body.status || 'TODO',
      startDate: req.body.startDate || null,
      dueDate: req.body.dueDate || null,
      createdAt: new Date().toISOString(),
      estimatedHours: req.body.estimatedHours || 0,
      loggedHours: req.body.loggedHours || 0,
      dependencies: req.body.dependencies || [],
      subtasks: req.body.subtasks || [],
      comments: req.body.comments || []
    });

    await sendDueSoonNotification((task as any).assigneeId, (task as any).title, (task as any).dueDate, req.params.id);

    const project = await Project.findByPk(req.params.id);
    if (project) {
      const { progress } = await calculateProjectProgress(req.params.id);
      (project as any).progress = progress;
      await project.save();
    }

    res.status(201).json(toTaskDto(task));
  } catch (error) {
    console.error('Error creating project task:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/tasks/:id/status', requirePermissionAction('project.edit', 'edit'), async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const updated = await (task as any).update({ status: req.body.status });
    if ((task as any).projectId) {
      const project = await Project.findByPk(String((task as any).projectId));
      if (project) {
        const { progress } = await calculateProjectProgress(String((task as any).projectId));
        (project as any).progress = progress;
        await project.save();
      }
    }
    res.json(toTaskDto(updated));
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/tasks/:id/time', requirePermissionAction('project.edit', 'edit'), async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const hours = Number(req.body.hours || 0);
    const current = Number((task as any).loggedHours || 0);
    (task as any).loggedHours = current + hours;
    const entry = {
      id: `te-${Date.now()}`,
      employeeId: req.body.employeeId || (req as any).user?.id || null,
      logDate: req.body.logDate || new Date().toISOString().split('T')[0],
      hours,
      description: req.body.description || ''
    };
    const currentEntries = Array.isArray((task as any).timeEntries) ? (task as any).timeEntries : [];
    (task as any).timeEntries = [...currentEntries, entry];
    await task.save();
    res.status(201).json(entry);
  } catch (error) {
    console.error('Error logging task time:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/tasks/:id/comment', requirePermissionAction('project.edit', 'edit'), async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const comment = {
      id: `tc-${Date.now()}`,
      userId: (req as any).user?.id || req.body.userId || null,
      message: req.body.comment || req.body.message || '',
      createdAt: new Date().toISOString()
    };
    const comments = Array.isArray((task as any).comments) ? (task as any).comments : [];
    (task as any).comments = [...comments, comment];
    await task.save();
    res.status(201).json(comment);
  } catch (error) {
    console.error('Error adding task comment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/employees/:id/workload', requirePermission('project.view'), async (req, res) => {
  try {
    const employeeId = String(req.params.id);
    const projects = await Project.findAll();
    const allocations = projects
      .map((p: any) => {
        const member = ((p.members || []) as any[]).find((m) => String(m.userId) === employeeId);
        if (!member) return null;
        return {
          projectId: p.id,
          projectTitle: p.title,
          allocation: Number(member.allocation || 0),
          role: member.role || 'Member'
        };
      })
      .filter(Boolean);
    const totalAllocation = allocations.reduce((acc: number, a: any) => acc + Number(a.allocation || 0), 0);
    res.json({
      employeeId,
      totalAllocation,
      warning: totalAllocation > 80,
      critical: totalAllocation > 100,
      projects: allocations
    });
  } catch (error) {
    console.error('Error fetching employee workload:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/projects/export/excel', requirePermissionAction('project.view', 'export'), async (_req, res) => {
  try {
    const projects = await Project.findAll({ order: [['createdAt', 'DESC']] });
    const rows = ['project_code,project_name,status,priority,start_date,end_date,progress_percentage'];
    for (const p of projects as any[]) {
      rows.push(
        [
          p.projectCode || '',
          `"${String(p.title || '').replace(/"/g, '""')}"`,
          p.status || '',
          p.priority || '',
          p.startDate || '',
          p.deadline || '',
          p.progress || 0
        ].join(',')
      );
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="projects-export.csv"');
    res.send(rows.join('\n'));
  } catch (error) {
    console.error('Error exporting projects:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/projects/export/gantt/pdf', requirePermissionAction('project.view', 'export'), async (_req, res) => {
  try {
    const projects = await Project.findAll({ order: [['createdAt', 'DESC']] });
    const lines = ['Gantt Export', '============', ''];
    for (const p of projects as any[]) {
      lines.push(`${p.title} | ${p.status} | ${p.startDate || '-'} -> ${p.deadline || '-'} | ${p.progress || 0}%`);
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="projects-gantt.pdf"');
    res.send(Buffer.from(lines.join('\n')));
  } catch (error) {
    console.error('Error exporting gantt pdf:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/projects/benchmarks', requirePermission('project.view'), async (_req, res) => {
  try {
    const t0 = Date.now();
    const projects = await Project.findAll({ order: [['createdAt', 'DESC']] });
    await Promise.all((projects as any[]).map((p: any) => toProjectDto(p)));
    const ganttRenderMs = Date.now() - t0;

    const t1 = Date.now();
    const sampleTask = await Task.findOne({ order: [['createdAt', 'DESC']] as any });
    if (sampleTask) {
      await (sampleTask as any).update({ updatedAt: new Date().toISOString() });
    }
    const taskUpdateLatencyMs = Date.now() - t1;

    const t2 = Date.now();
    const allProjects = await Project.findAll();
    for (const p of allProjects as any[]) {
      const members = ((p as any).members || []) as any[];
      const grouped = new Map<string, number>();
      for (const m of members) {
        const uid = String(m.userId || '');
        if (!uid) continue;
        grouped.set(uid, (grouped.get(uid) || 0) + Number(m.allocation || 0));
      }
      // consume map to complete allocation computation
      Array.from(grouped.values()).forEach(() => null);
    }
    const resourceCalculationMs = Date.now() - t2;

    const t3 = Date.now();
    const rows = ['project_code,project_name,status,priority,start_date,end_date,progress_percentage'];
    for (const p of projects as any[]) {
      rows.push(
        [
          p.projectCode || '',
          `"${String(p.title || '').replace(/"/g, '""')}"`,
          p.status || '',
          p.priority || '',
          p.startDate || '',
          p.deadline || '',
          p.progress || 0
        ].join(',')
      );
    }
    const exportGenerationMs = Date.now() - t3;

    res.json({
      metrics: {
        ganttRenderTimeMs: ganttRenderMs,
        taskUpdateLatencyMs,
        resourceCalculationTimeMs: resourceCalculationMs,
        exportGenerationTimeMs: exportGenerationMs
      },
      targets: {
        ganttRenderTimeMs: '<2000',
        taskUpdateLatencyMs: '<500',
        resourceCalculationTimeMs: '<1000',
        exportGenerationTimeMs: '<5000'
      }
    });
  } catch (error) {
    console.error('Error generating project benchmarks:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/tasks', requirePermission('project.view'), async (_req, res) => {
  try {
    const tasks = await Task.findAll({ order: [['createdAt', 'DESC']] });
    res.json(tasks.map((t: any) => toTaskDto(t)));
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/tasks', requirePermissionAction('project.create', 'create'), async (req, res) => {
  try {
    if ((req.body.dueDate && req.body.startDate) && new Date(req.body.dueDate) < new Date(req.body.startDate)) {
      return res.status(400).json({ message: 'Task due date must be after start date' });
    }
    if (!validateHours(Number(req.body.estimatedHours || 0), Number(req.body.loggedHours || 0), !!req.body.approvedExtraHours)) {
      return res.status(400).json({ message: 'Actual hours cannot exceed estimated hours without approval' });
    }
    const task = await Task.create({
      id: `task-${Date.now()}`,
      ...req.body,
      startDate: req.body?.startDate || null,
      estimatedHours: req.body?.estimatedHours || 0,
      loggedHours: req.body?.loggedHours || 0,
      dependencies: req.body?.dependencies || [],
      subtasks: req.body?.subtasks || [],
      comments: req.body?.comments || [],
      createdAt: req.body?.createdAt || new Date().toISOString()
    });
    await sendDueSoonNotification((task as any).assigneeId, (task as any).title, (task as any).dueDate, (task as any).projectId);
    if ((task as any).projectId) {
      const project = await Project.findByPk((task as any).projectId);
      if (project) {
        const { progress } = await calculateProjectProgress(String((task as any).projectId));
        (project as any).progress = progress;
        await project.save();
      }
    }
    res.status(201).json(toTaskDto(task));
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/tasks/:id', requirePermissionAction('project.edit', 'edit'), async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const fromStatus = String((task as any).status || 'TODO');
    const toStatus = String(req.body.status ?? fromStatus);
    if (!isValidTaskTransition(fromStatus, toStatus)) {
      return res.status(400).json({ message: `Invalid task status transition: ${fromStatus} -> ${toStatus}` });
    }

    const dependencies = (req.body.dependencies ?? (task as any).dependencies ?? []) as string[];
    if (toStatus === 'DONE' && Array.isArray(dependencies) && dependencies.length > 0) {
      const depTasks = await Task.findAll({ where: { id: dependencies } as any });
      const blocked = depTasks.some((d: any) => d.status !== 'DONE');
      if (blocked) {
        return res.status(400).json({ message: 'Cannot mark done while dependency tasks are incomplete' });
      }
    }
    if ((req.body.dueDate && req.body.startDate) && new Date(req.body.dueDate) < new Date(req.body.startDate)) {
      return res.status(400).json({ message: 'Task due date must be after start date' });
    }
    const estimatedHours = Number(req.body.estimatedHours ?? (task as any).estimatedHours ?? 0);
    const loggedHours = Number(req.body.loggedHours ?? (task as any).loggedHours ?? 0);
    if (!validateHours(estimatedHours, loggedHours, !!req.body.approvedExtraHours)) {
      return res.status(400).json({ message: 'Actual hours cannot exceed estimated hours without approval' });
    }
    const previousProjectId = String((task as any).projectId || '');
    await (task as any).update({
      ...req.body,
      status: toStatus,
      completedAt: toStatus === 'DONE' ? (req.body.completedAt || new Date().toISOString()) : ((task as any).completedAt || null)
    });
    await sendDueSoonNotification((task as any).assigneeId, (task as any).title, (task as any).dueDate, (task as any).projectId);
    const affected = new Set<string>();
    if (previousProjectId) affected.add(previousProjectId);
    if ((task as any).projectId) affected.add(String((task as any).projectId));
    for (const projectId of affected) {
      const project = await Project.findByPk(projectId);
      if (project) {
        const { progress } = await calculateProjectProgress(projectId);
        (project as any).progress = progress;
        await project.save();
      }
    }
    res.json(toTaskDto(task));
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/tasks/:id', requirePermissionAction('project.delete', 'delete'), async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    const projectId = task ? String((task as any).projectId || '') : '';
    await Task.destroy({ where: { id: req.params.id } });
    if (projectId) {
      const project = await Project.findByPk(projectId);
      if (project) {
        const { progress } = await calculateProjectProgress(projectId);
        (project as any).progress = progress;
        await project.save();
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Recruitment
router.get('/jobs', requirePermission('project.view'), async (_req, res) => {
  try {
    const jobs = await Job.findAll({ order: [['createdAt', 'DESC']] });
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/jobs', requirePermissionAction('project.create', 'create'), async (req, res) => {
  try {
    const job = await Job.create({
      id: `job-${Date.now()}`,
      ...req.body,
      postedDate: req.body?.postedDate || new Date().toISOString().split('T')[0]
    });
    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/jobs/:id', requirePermissionAction('project.edit', 'edit'), async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    await (job as any).update(req.body);
    res.json(job);
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/jobs/:id', requirePermissionAction('project.delete', 'delete'), async (req, res) => {
  try {
    await Job.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/candidates', requirePermission('project.view'), async (_req, res) => {
  try {
    const candidates = await Candidate.findAll({ order: [['createdAt', 'DESC']] });
    res.json(candidates);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/candidates', requirePermissionAction('project.create', 'create'), async (req, res) => {
  try {
    const candidate = await Candidate.create({
      id: `cand-${Date.now()}`,
      ...req.body,
      appliedDate: req.body?.appliedDate || new Date().toISOString().split('T')[0]
    });
    res.status(201).json(candidate);
  } catch (error) {
    console.error('Error creating candidate:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/candidates/:id', requirePermissionAction('project.edit', 'edit'), async (req, res) => {
  try {
    const candidate = await Candidate.findByPk(req.params.id);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    await (candidate as any).update(req.body);
    res.json(candidate);
  } catch (error) {
    console.error('Error updating candidate:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/candidates/:id', requirePermissionAction('project.delete', 'delete'), async (req, res) => {
  try {
    await Candidate.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Payroll
router.get('/payroll/runs', requirePermission('payroll.view'), async (req, res) => {
  const runs = await PayrollRun.findAll({ order: [['createdAt', 'DESC']] });
  res.json(runs);
});

router.get('/payroll/runs/:runId/details', requirePermission('payroll.view'), async (req, res) => {
  try {
    const { runId } = req.params;
    const run = await PayrollRun.findByPk(runId);
    if (!run) return res.status(404).json({ message: 'Payroll run not found' });

    const payslips = await Payslip.findAll({
      where: { payrollRunId: runId },
      order: [['createdAt', 'DESC']]
    });
    res.json(payslips);
  } catch (error) {
    console.error('Error fetching payroll run details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/payroll/calculate', requirePermissionAction('payroll.create', 'create'), async (req, res) => {
  const { employeeId, period } = req.body;
  try {
    // Simple calculation - in real app would be more complex
    const user = await User.findByPk(employeeId);
    if (!user) return res.status(404).json({ message: 'Employee not found' });

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
  } catch (error) {
    console.error('Error calculating payroll:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Reports
router.get('/reports/stats', requirePermission('reports.view'), async (req, res) => {
  const cacheKey = 'report_stats';
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  const today = new Date().toISOString().split('T')[0];
  
  const [totalEmployees, presentToday, pendingLeaves, departments, annualLeaves, sickLeaves, unpaidLeaves] = await Promise.all([
    User.count(),
    AttendanceRecord.count({ where: { date: today, status: 'PRESENT' } }),
    LeaveRequest.count({ where: { status: 'PENDING' } }),
    Department.findAll({ attributes: ['id', 'name'] }),
    LeaveRequest.count({ where: { type: 'Annual' } }),
    LeaveRequest.count({ where: { type: 'Sick' } }),
    LeaveRequest.count({ where: { type: 'Unpaid' } })
  ]);

  const deptUserCounts = await Promise.all(
    departments.map(async (dept) => ({
      name: dept.name,
      value: await User.count({ where: { departmentId: dept.id } })
    }))
  );

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

router.get('/reports/attendance', requirePermission('reports.view'), async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    const attendance = await AttendanceRecord.findAll({
      where: {
        date: {
          [Op.between]: [startDate, endDate]
        }
      }
    });
    res.json(attendance);
  } catch (error) {
    console.error('Error generating attendance report:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/reports/payroll', requirePermission('reports.view'), async (req, res) => {
  const { period } = req.query;
  try {
    // Mock payroll report - in real app would query payroll runs
    const payrollData = [
      { employeeId: '1', period, grossSalary: 50000, netSalary: 45000 },
      { employeeId: '2', period, grossSalary: 60000, netSalary: 54000 }
    ];
    res.json(payrollData);
  } catch (error) {
    console.error('Error generating payroll report:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/chat/unread-count', async (req, res) => {
  try {
    const currentUser = (req as any).user;
    const count = await Message.count({ where: { receiverId: currentUser.id, isRead: false } });
    res.json(count);
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/chat/recent-contacts', async (req, res) => {
  try {
    const currentUser = (req as any).user;
    const messages = await Message.findAll({
      where: {
        [Op.or]: [{ senderId: currentUser.id }, { receiverId: currentUser.id }]
      },
      order: [['createdAt', 'DESC']]
    });
    const contactIds = new Set<string>();
    for (const m of messages as any[]) {
      if (m.senderId !== currentUser.id) contactIds.add(String(m.senderId));
      if (m.receiverId !== currentUser.id) contactIds.add(String(m.receiverId));
    }
    const contacts = await User.findAll({ where: { id: Array.from(contactIds) } });
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching recent contacts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/notifications', async (req, res) => {
  try {
    const currentUser = (req as any).user;
    const notifications = await Notification.findAll({
      where: { userId: currentUser.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ============================================
// EMPLOYEE MODULE API ENDPOINTS
// ============================================

// Employee Onboarding Endpoints
router.post('/employees/onboarding/start', requirePermissionAction('employees.create', 'create'), async (req, res) => {
  const { created_by } = req.body;
  try {
    const session = await EmployeeOnboardingSession.create({
      session_data: JSON.stringify({}),
      current_step: 1,
      progress_percentage: 0,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      created_by
    });
    res.status(201).json({ session_id: session.id, message: 'Onboarding session started' });
  } catch (error) {
    console.error('Error starting onboarding session:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/employees/onboarding/:sessionId/step/:step', requirePermissionAction('employees.edit', 'edit'), async (req, res) => {
  const { sessionId, step } = req.params;
  const stepData = req.body;

  try {
    const session = await EmployeeOnboardingSession.findByPk(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

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
  } catch (error) {
    console.error('Error saving step data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/employees/onboarding/:sessionId', requirePermission('employees.view'), async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await EmployeeOnboardingSession.findByPk(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    res.json({
      session_data: JSON.parse(session.session_data || '{}'),
      current_step: session.current_step,
      progress_percentage: session.progress_percentage
    });
  } catch (error) {
    console.error('Error retrieving session:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/employees/onboarding/:sessionId/submit', requirePermissionAction('employees.edit', 'edit'), async (req, res) => {
  const { sessionId } = req.params;
  const { submitted_by } = req.body;

  try {
    const session = await EmployeeOnboardingSession.findByPk(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

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

    const employee = await Employee.create(employeeData);

    // Create dependents if provided
    if (sessionData.step_5?.dependents) {
      for (const dependent of sessionData.step_5.dependents) {
        await EmployeeDependent.create({
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
        await EmployeeAllowance.create({
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
        await EmployeeDeduction.create({
          employee_id: employee.employee_id,
          deduction_name: deduction.name,
          amount: deduction.amount,
          is_recurring: deduction.recurring !== false,
          effective_from: employee.join_date
        });
      }
    }

    // Log status change
    await EmployeeStatusHistory.create({
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
  } catch (error) {
    console.error('Error submitting employee:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Employee CRUD Endpoints
router.get('/employees', requirePermission('employees.view'), async (req, res) => {
  const { page = 1, limit = 20, search, department_id, position_id, status } = req.query;

  try {
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (search) {
      where[Op.or] = [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { employee_id: { [Op.like]: `%${search}%` } }
      ];
    }
    if (department_id) where.department_id = department_id;
    if (position_id) where.position_id = position_id;
    if (status) where.status = status;

    const employees = await Employee.findAndCountAll({
      where,
      limit: parseInt(limit as string),
      offset,
      order: [['created_at', 'DESC']],
      include: [
        { model: Department, as: 'department', attributes: ['name'] },
        { model: Position, as: 'position', attributes: ['title'] }
      ]
    });

    res.json({
      employees: employees.rows,
      total: employees.count,
      page: parseInt(page as string),
      total_pages: Math.ceil(employees.count / parseInt(limit as string))
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/employees/:id', requirePermission('employees.view'), async (req, res) => {
  const { id } = req.params;

  try {
    const employee = await Employee.findOne({
      where: { employee_id: id },
      include: [
        { model: Department, as: 'department' },
        { model: Position, as: 'position' },
        { model: EmployeeAllowance, as: 'allowances' },
        { model: EmployeeDeduction, as: 'deductions' },
        { model: EmployeeDependent, as: 'dependents' },
        { model: EmployeeDocument, as: 'documents' }
      ]
    });

    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    res.json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/employees/:id', requirePermissionAction('employees.edit', 'edit'), async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const { updated_by } = req.body;

  try {
    const employee = await Employee.findOne({ where: { employee_id: id } });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    // Log status change if status is being updated
    if (updateData.status && updateData.status !== employee.status) {
      await EmployeeStatusHistory.create({
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
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/employees/:id', requirePermissionAction('employees.delete', 'delete'), async (req, res) => {
  const { id } = req.params;
  const { deleted_by, reason } = req.body;

  try {
    const employee = await Employee.findOne({ where: { employee_id: id } });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    // Soft delete by setting status to 'terminated'
    await employee.update({
      status: 'terminated',
      terminated_at: new Date(),
      termination_reason: reason,
      updated_at: new Date()
    });

    // Log termination
    await EmployeeStatusHistory.create({
      employee_id: id,
      old_status: employee.status,
      new_status: 'terminated',
      reason,
      changed_by: deleted_by
    });

    res.json({ message: 'Employee terminated successfully' });
  } catch (error) {
    console.error('Error terminating employee:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Employee ID Generation
router.get('/employees/generate-id', requirePermission('employees.create'), async (req, res) => {
  try {
    const sequence = await EmployeeIdSequence.findOne();
    if (!sequence) {
      // Create default sequence if not exists
      await EmployeeIdSequence.create({
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
  } catch (error) {
    console.error('Error generating employee ID:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Employee Activation (Admin approval)
router.post('/employees/:id/activate', requirePermissionAction('employees.edit', 'edit'), async (req, res) => {
  const { id } = req.params;
  const { activated_by } = req.body;

  try {
    const employee = await Employee.findOne({ where: { employee_id: id } });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

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
    await EmployeeStatusHistory.create({
      employee_id: id,
      old_status: 'pending_approval',
      new_status: 'active',
      reason: 'Admin approval',
      changed_by: activated_by
    });

    // TODO: Create user account automatically
    // This would integrate with the User Account module

    res.json({ message: 'Employee activated successfully' });
  } catch (error) {
    console.error('Error activating employee:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Employee Statistics
router.get('/employees/statistics', requirePermission('employees.view'), async (req, res) => {
  try {
    const totalEmployees = await Employee.count({ where: { status: 'active' } });
    const newHires = await Employee.count({
      where: {
        status: 'active',
        join_date: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    });
    const terminated = await Employee.count({
      where: {
        status: 'terminated',
        terminated_at: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    res.json({
      total_employees: totalEmployees,
      new_hires: newHires,
      terminated: terminated,
      net_change: newHires - terminated
    });
  } catch (error) {
    console.error('Error fetching employee statistics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});