import express from 'express';
import { SystemSettingService } from '../services/SystemSettingService';
import { PermissionService } from '../services/PermissionService';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';

const router = express.Router();

// ============================================
// SYSTEM SETTINGS ROUTES
// ============================================

// Get all global settings
router.get('/settings/global', authMiddleware, requirePermission('settings.view'), async (req, res) => {
  try {
    const { category } = req.query;
    const settings = category 
      ? await SystemSettingService.getSettingsByCategory(category as string)
      : await (await import('../db')).SystemSetting.findAll();
    
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update global setting
router.put('/settings/global/:key', authMiddleware, requirePermission('settings.edit'), async (req, res) => {
  try {
    const { key } = req.params;
    const { value, reason } = req.body;
    const userId = req.user?.id;

    const setting = await SystemSettingService.updateGlobalSetting(key, value, userId, reason);
    res.json({ success: true, data: setting });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get department settings
router.get('/settings/departments/:departmentId', authMiddleware, requirePermission('settings.view'), async (req, res) => {
  try {
    const { departmentId } = req.params;
    const settings = await (await import('../db')).DepartmentSetting.findAll({
      where: { departmentId }
    });
    
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update department setting
router.put('/settings/departments/:departmentId/:key', authMiddleware, requirePermission('settings.override'), async (req, res) => {
  try {
    const { departmentId, key } = req.params;
    const { value, reason } = req.body;
    const userId = req.user?.id;

    const setting = await SystemSettingService.updateDepartmentSetting(departmentId, key, value, userId, reason);
    res.json({ success: true, data: setting });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get position settings
router.get('/settings/positions/:positionId', authMiddleware, requirePermission('settings.view'), async (req, res) => {
  try {
    const { positionId } = req.params;
    const settings = await (await import('../db')).PositionSetting.findAll({
      where: { positionId }
    });
    
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update position setting
router.put('/settings/positions/:positionId/:key', authMiddleware, requirePermission('settings.override'), async (req, res) => {
  try {
    const { positionId, key } = req.params;
    const { value, reason } = req.body;
    const userId = req.user?.id;

    const setting = await SystemSettingService.updatePositionSetting(positionId, key, value, userId, reason);
    res.json({ success: true, data: setting });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get employee settings
router.get('/settings/employees/:employeeId', authMiddleware, requirePermission('settings.view'), async (req, res) => {
  try {
    const { employeeId } = req.params;
    const settings = await (await import('../db')).EmployeeSetting.findAll({
      where: { employeeId }
    });
    
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update employee setting
router.put('/settings/employees/:employeeId/:key', authMiddleware, requirePermission('settings.override'), async (req, res) => {
  try {
    const { employeeId, key } = req.params;
    const { value, reason } = req.body;
    const userId = req.user?.id;

    const setting = await SystemSettingService.updateEmployeeSetting(employeeId, key, value, userId, reason);
    res.json({ success: true, data: setting });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get effective setting for employee
router.get('/settings/effective/:employeeId/:key', authMiddleware, requirePermission('settings.view'), async (req, res) => {
  try {
    const { employeeId, key } = req.params;
    const setting = await SystemSettingService.getEffectiveSetting(key, employeeId);
    
    res.json({ success: true, data: setting });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get setting hierarchy
router.get('/settings/hierarchy/:employeeId/:key', authMiddleware, requirePermission('settings.view'), async (req, res) => {
  try {
    const { employeeId, key } = req.params;
    const hierarchy = await SystemSettingService.getSettingHierarchy(key, employeeId);
    
    res.json({ success: true, data: hierarchy });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get setting audit trail
router.get('/settings/audit/:key', authMiddleware, requirePermission('settings.view'), async (req, res) => {
  try {
    const { key } = req.params;
    const { limit = 50 } = req.query;
    const auditTrail = await SystemSettingService.getSettingAuditTrail(key, Number(limit));
    
    res.json({ success: true, data: auditTrail });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// PERMISSION ROUTES
// ============================================

// Get all permissions (grouped by module)
router.get('/permissions', authMiddleware, requirePermission('settings.view'), async (req, res) => {
  try {
    const matrix = await PermissionService.getPermissionMatrix();
    res.json({ success: true, data: matrix });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get permission modules
router.get('/permissions/modules', authMiddleware, requirePermission('settings.view'), async (req, res) => {
  try {
    const modules = await (await import('../db')).Permission.findAll({
      attributes: [[require('sequelize').fn('DISTINCT', require('sequelize').col('module')), 'module']],
      order: [['module', 'ASC']]
    });
    
    res.json({ success: true, data: modules.map(m => m.get('module')) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user's effective permissions
router.get('/users/:id/permissions', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    // Users can only view their own permissions unless they have admin rights
    if (req.user?.id !== id && !await PermissionService.hasPermission(req.user?.id, 'users.view')) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const permissions = await PermissionService.getUserEffectivePermissions(id);
    res.json({ success: true, data: permissions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user's permission overrides
router.get('/users/:id/overrides', authMiddleware, requirePermission('users.view'), async (req, res) => {
  try {
    const { id } = req.params;
    const overrides = await PermissionService.getUserPermissionOverrides(id);
    
    res.json({ success: true, data: overrides });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Grant/revoke permission override
router.post('/users/:id/overrides', authMiddleware, requirePermission('users.manage'), async (req, res) => {
  try {
    const { id } = req.params;
    const { permissionId, overrideType, reason, expiresAt } = req.body;
    const userId = req.user?.id;

    let override;
    if (overrideType === 'GRANT') {
      override = await PermissionService.grantPermission(id, permissionId, userId, reason, expiresAt ? new Date(expiresAt) : undefined);
    } else if (overrideType === 'REVOKE') {
      override = await PermissionService.revokePermission(id, permissionId, userId, reason);
    } else {
      return res.status(400).json({ success: false, error: 'Invalid override type' });
    }

    res.json({ success: true, data: override });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove override
router.delete('/users/:id/overrides/:overrideId', authMiddleware, requirePermission('users.manage'), async (req, res) => {
  try {
    const { overrideId } = req.params;
    await (await import('../db')).UserPermissionOverride.update(
      { status: 'REVOKED' },
      { where: { id: overrideId } }
    );
    
    res.json({ success: true, message: 'Override removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Submit override request
router.post('/permissions/requests', authMiddleware, async (req, res) => {
  try {
    const { userId, permissionId, overrideType, reason, expiresAt } = req.body;
    const requestedBy = req.user?.id;

    const request = await PermissionService.createOverrideRequest(
      userId, permissionId, overrideType, reason, requestedBy, expiresAt ? new Date(expiresAt) : undefined
    );
    
    res.json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get pending requests
router.get('/permissions/requests/pending', authMiddleware, requirePermission('users.manage'), async (req, res) => {
  try {
    const { role } = req.query;
    const requests = await PermissionService.getPendingRequests(role as string);
    
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Approve request
router.put('/permissions/requests/:id/approve', authMiddleware, requirePermission('users.manage'), async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const approvedBy = req.user?.id;

    const request = await PermissionService.approveRequest(id, approvedBy, comments);
    res.json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reject request
router.put('/permissions/requests/:id/reject', authMiddleware, requirePermission('users.manage'), async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const rejectedBy = req.user?.id;

    const request = await PermissionService.rejectRequest(id, rejectedBy, comments);
    res.json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// PERMISSION TEMPLATES
// ============================================

// List permission templates
router.get('/permissions/templates', authMiddleware, requirePermission('settings.view'), async (req, res) => {
  try {
    const templates = await (await import('../db')).PermissionTemplate.findAll({
      order: [['name', 'ASC']]
    });
    
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create template
router.post('/permissions/templates', authMiddleware, requirePermission('settings.edit'), async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const createdBy = req.user?.id;

    const template = await (await import('../db')).PermissionTemplate.create({
      id: `tmpl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      permissions,
      createdBy
    });
    
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Apply template to user
router.post('/permissions/templates/:templateId/apply/:userId', authMiddleware, requirePermission('users.manage'), async (req, res) => {
  try {
    const { templateId, userId } = req.params;
    const appliedBy = req.user?.id;

    const template = await (await import('../db')).PermissionTemplate.findByPk(templateId);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    const permissions = template.get('permissions');
    const results = [];

    for (const permissionId of permissions) {
      try {
        const override = await PermissionService.grantPermission(userId, permissionId, appliedBy, `Applied via template: ${template.get('name')}`);
        results.push({ permissionId, success: true, override });
      } catch (error) {
        results.push({ permissionId, success: false, error: error.message });
      }
    }

    res.json({ success: true, data: { template, results } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// AUDIT & COMPLIANCE
// ============================================

// Get setting change audit trail
router.get('/audit/settings', authMiddleware, requirePermission('settings.view'), async (req, res) => {
  try {
    const { settingKey, dateFrom, dateTo, limit = 100 } = req.query;
    
    const whereClause: any = {};
    if (settingKey) whereClause.settingKey = settingKey;
    if (dateFrom || dateTo) {
      whereClause.changedAt = {};
      if (dateFrom) whereClause.changedAt[require('sequelize').Op.gte] = new Date(dateFrom as string);
      if (dateTo) whereClause.changedAt[require('sequelize').Op.lte] = new Date(dateTo as string);
    }

    const auditLogs = await (await import('../db')).SettingAuditLog.findAll({
      where: whereClause,
      order: [['changedAt', 'DESC']],
      limit: Number(limit)
    });
    
    res.json({ success: true, data: auditLogs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get permission change audit trail
router.get('/audit/permissions', authMiddleware, requirePermission('settings.view'), async (req, res) => {
  try {
    const { userId, permissionId, dateFrom, dateTo, limit = 100 } = req.query;
    
    // This would query a dedicated permission audit table
    // For now, we'll return the user permission overrides as audit data
    const whereClause: any = {};
    if (userId) whereClause.userId = userId;
    if (permissionId) whereClause.permissionId = permissionId;

    const overrides = await (await import('../db')).UserPermissionOverride.findAll({
      where: whereClause,
      include: [{ model: (await import('../db')).User, as: 'user' }, { model: (await import('../db')).Permission, as: 'permission' }],
      order: [['createdAt', 'DESC']],
      limit: Number(limit)
    });
    
    res.json({ success: true, data: overrides });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate compliance report
router.get('/audit/compliance-report', authMiddleware, requirePermission('reports.export'), async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    
    // Generate comprehensive compliance report
    const report = {
      period: { dateFrom, dateTo },
      summary: {
        totalUsers: await (await import('../db')).User.count(),
        activeOverrides: await (await import('../db')).UserPermissionOverride.count({ where: { status: 'ACTIVE' } }),
        pendingRequests: await (await import('../db')).PermissionOverrideRequest.count({ where: { status: 'PENDING' } }),
        settingsChanged: await (await import('../db')).SettingAuditLog.count({
          where: {
            changedAt: {
              [require('sequelize').Op.between]: [
                new Date(dateFrom as string),
                new Date(dateTo as string)
              ]
            }
          }
        })
      },
      sensitivePermissions: await (await import('../db')).UserPermissionOverride.findAll({
        where: { 
          status: 'ACTIVE',
          [require('sequelize').Op.or]: [
            { expiresAt: { [require('sequelize').Op.lte]: new Date() } },
            { requiresApproval: true }
          ]
        },
        include: [{ model: (await import('../db')).User, as: 'user' }, { model: (await import('../db')).Permission, as: 'permission' }]
      })
    };
    
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export { router as settingsRouter };
