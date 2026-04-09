import { Permission, Role, RolePermission, UserPermissionOverride, PermissionOverrideRequest, User, PermissionTemplate } from '../db';
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';

export interface PermissionCheck {
  hasPermission: boolean;
  source: 'role' | 'override_grant' | 'override_revoke';
  permission?: Permission;
  override?: UserPermissionOverride;
}

export interface EffectivePermission {
  permissionKey: string;
  moduleName: string;
  permissionName: string;
  actions: string[];
  hasPermission: boolean;
  source: 'role' | 'override_grant' | 'override_revoke';
  isOverride: boolean;
  overrideId?: string;
}

export class PermissionService {
  private static async resolvePermission(permissionKeyOrId: string): Promise<any | null> {
    let permission = await Permission.findOne({ where: { key: permissionKeyOrId } });
    if (!permission) {
      permission = await Permission.findByPk(permissionKeyOrId);
    }
    return permission;
  }

  private static async resolveUserRoleId(user: any): Promise<string | null> {
    const roleName = String(user?.get?.('role') || user?.role || '').toUpperCase();
    const role = await Role.findOne({ where: { name: roleName } });
    return role ? String(role.get('id')) : null;
  }

  // Check if user has permission (considers overrides)
  static async hasPermission(userId: string, permissionKey: string): Promise<PermissionCheck> {
    try {
      const permission = await this.resolvePermission(permissionKey);
      if (!permission) {
        return { hasPermission: false, source: 'role' };
      }
      const permissionId = String(permission.get('id'));

      // 1. Check User Permission Overrides (Highest Priority)
      const override = await UserPermissionOverride.findOne({
        where: { 
          userId, 
          permissionId,
          status: 'ACTIVE'
        }
      });

      if (override) {
        // Check if override is expired
        if (override.get('expiresAt') && new Date(override.get('expiresAt')) < new Date()) {
          // Auto-expire the override
          await this.expireOverride(override.get('id'));
        } else {
          return {
            hasPermission: override.get('overrideType') === 'GRANT',
            source: override.get('overrideType') === 'GRANT' ? 'override_grant' : 'override_revoke',
            permission: permission as Permission,
            override: override as UserPermissionOverride
          };
        }
      }

      // 2. Check Role-Based Permissions (Default)
      const user = await User.findByPk(userId);

      if (!user) {
        return { hasPermission: false, source: 'role' };
      }
      const roleId = await this.resolveUserRoleId(user);
      if (!roleId) return { hasPermission: false, source: 'role' };

      const rolePermission = await RolePermission.findOne({
        where: { 
          roleId,
          permissionId
        }
      });

      return {
        hasPermission: !!rolePermission,
        source: 'role',
        permission: permission as Permission
      };
    } catch (error) {
      console.error('Error checking permission:', error);
      throw error;
    }
  }

  // Get all effective permissions for a user
  static async getUserEffectivePermissions(userId: string): Promise<EffectivePermission[]> {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        throw new Error('User not found');
      }
      const roleId = await this.resolveUserRoleId(user);
      if (!roleId) return [];

      // Get all permissions
      const allPermissions = await Permission.findAll({
        order: [['module', 'ASC'], ['key', 'ASC']]
      });

      // Get role permissions
      const rolePermissions = await RolePermission.findAll({
        where: { roleId }
      });

      // Get user overrides
      const overrides = await UserPermissionOverride.findAll({
        where: { 
          userId, 
          status: 'ACTIVE',
          [Op.or]: [
            { expiresAt: null },
            { expiresAt: { [Op.gte]: new Date() } }
          ]
        }
      });

      const effectivePermissions: EffectivePermission[] = [];

      for (const permission of allPermissions) {
        const permissionKey = permission.get('key');
        
        // Check for override first
        const permissionId = String(permission.get('id'));
        const override = overrides.find(o => o.get('permissionId') === permissionId);
        let hasPermission = false;
        let source: 'role' | 'override_grant' | 'override_revoke' = 'role';
        let isOverride = false;
        let overrideId: string | undefined;

        if (override) {
          hasPermission = override.get('overrideType') === 'GRANT';
          source = override.get('overrideType') === 'GRANT' ? 'override_grant' : 'override_revoke';
          isOverride = true;
          overrideId = override.get('id');
        } else {
          // Check role permission
          const rolePerm = rolePermissions.find(rp => rp.get('permissionId') === permissionId);
          hasPermission = !!rolePerm;
        }

        effectivePermissions.push({
          permissionKey,
          moduleName: permission.get('module'),
          permissionName: permission.get('name'),
          actions: rolePermissions.find(rp => rp.get('permissionId') === permissionId)?.get('actions') || [],
          hasPermission,
          source,
          isOverride,
          overrideId
        });
      }

      return effectivePermissions;
    } catch (error) {
      console.error('Error getting user effective permissions:', error);
      throw error;
    }
  }

  // Get user's permission overrides
  static async getUserPermissionOverrides(userId: string): Promise<UserPermissionOverride[]> {
    try {
      return await UserPermissionOverride.findAll({
        where: { userId },
        include: [{ model: Permission, as: 'permission' }],
        order: [['createdAt', 'DESC']]
      });
    } catch (error) {
      console.error('Error getting user permission overrides:', error);
      throw error;
    }
  }

  // Grant permission to user
  static async grantPermission(
    userId: string,
    permissionId: string,
    grantedBy: string,
    reason: string,
    expiresAt?: Date
  ): Promise<UserPermissionOverride> {
    try {
      // Check if permission requires approval
      const permission = await this.resolvePermission(permissionId);
      if (!permission) {
        throw new Error('Permission not found');
      }
      const resolvedPermissionId = String(permission.get('id'));

      const override = await UserPermissionOverride.create({
        id: `override-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        permissionId: resolvedPermissionId,
        overrideType: 'GRANT',
        grantedBy,
        reason,
        expiresAt,
        status: permission.get('isSensitive') ? 'PENDING' : 'ACTIVE',
        requiresApproval: permission.get('isSensitive'),
        approvedBy: permission.get('isSensitive') ? null : grantedBy,
        approvedAt: permission.get('isSensitive') ? null : new Date()
      });

      // Log the permission change
      await this.logPermissionChange(userId, resolvedPermissionId, 'GRANT', grantedBy, reason, expiresAt);

      return override;
    } catch (error) {
      console.error('Error granting permission:', error);
      throw error;
    }
  }

  // Revoke permission from user
  static async revokePermission(
    userId: string,
    permissionId: string,
    revokedBy: string,
    reason: string
  ): Promise<UserPermissionOverride> {
    try {
      // Check if override already exists
      const existingOverride = await UserPermissionOverride.findOne({
        where: { userId, permissionId, overrideType: 'GRANT' }
      });

      const override = await UserPermissionOverride.create({
        id: `override-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        permissionId,
        overrideType: 'REVOKE',
        grantedBy: revokedBy,
        reason,
        status: 'ACTIVE',
        requiresApproval: false,
        approvedBy: revokedBy,
        approvedAt: new Date()
      });

      // Log the permission change
      await this.logPermissionChange(userId, permissionId, 'REVOKE', revokedBy, reason);

      return override;
    } catch (error) {
      console.error('Error revoking permission:', error);
      throw error;
    }
  }

  // Get permission matrix
  static async getPermissionMatrix(): Promise<any> {
    try {
      const permissions = await Permission.findAll({
        order: [['module', 'ASC'], ['key', 'ASC']]
      });

      const roles = await Role.findAll({
        include: [{ 
          model: RolePermission, 
          as: 'rolePermissions',
          include: [{ model: Permission, as: 'permission' }]
        }],
        order: [['name', 'ASC']]
      });

      const matrix: any = {};

      // Group permissions by module
      const permissionsByModule = permissions.reduce((acc, perm) => {
        const module = perm.get('module');
        if (!acc[module]) acc[module] = [];
        acc[module].push(perm);
        return acc;
      }, {});

      // Build matrix
      for (const [module, modulePermissions] of Object.entries(permissionsByModule)) {
        matrix[module] = {
          permissions: modulePermissions,
          rolePermissions: {}
        };

        for (const role of roles) {
          matrix[module].rolePermissions[role.get('name')] = {};
          
          for (const perm of modulePermissions) {
            const rolePerm = role.get('rolePermissions').find((rp: any) => 
              rp.get('permissionId') === perm.get('id')
            );
            matrix[module].rolePermissions[role.get('name')][perm.get('key')] = {
              hasPermission: !!rolePerm,
              actions: rolePerm?.get('actions') || []
            };
          }
        }
      }

      return matrix;
    } catch (error) {
      console.error('Error getting permission matrix:', error);
      throw error;
    }
  }

  // Get users with specific override
  static async getUsersWithOverride(permissionId: string): Promise<any[]> {
    try {
      const overrides = await UserPermissionOverride.findAll({
        where: { permissionId, status: 'ACTIVE' },
        include: [
          { model: User, as: 'user' },
          { model: Permission, as: 'permission' }
        ],
        order: [['createdAt', 'DESC']]
      });

      return overrides.map(override => ({
        user: override.get('user'),
        permission: override.get('permission'),
        overrideType: override.get('overrideType'),
        grantedBy: override.get('grantedBy'),
        reason: override.get('reason'),
        expiresAt: override.get('expiresAt'),
        createdAt: override.get('createdAt')
      }));
    } catch (error) {
      console.error('Error getting users with override:', error);
      throw error;
    }
  }

  // Create permission override request
  static async createOverrideRequest(
    userId: string,
    permissionId: string,
    overrideType: 'GRANT' | 'REVOKE',
    reason: string,
    requestedBy: string,
    expiresAt?: Date
  ): Promise<PermissionOverrideRequest> {
    try {
      const request = await PermissionOverrideRequest.create({
        id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        permissionId,
        overrideType,
        requestedBy,
        reason,
        expiresAt,
        status: 'PENDING'
      });

      return request;
    } catch (error) {
      console.error('Error creating override request:', error);
      throw error;
    }
  }

  // Approve override request
  static async approveRequest(
    requestId: string,
    approvedBy: string,
    comments?: string
  ): Promise<PermissionOverrideRequest> {
    try {
      const request = await PermissionOverrideRequest.findByPk(requestId);
      if (!request || request.get('status') !== 'PENDING') {
        throw new Error('Invalid request');
      }

      // Update request
      await request.update({
        status: 'APPROVED',
        reviewedBy: approvedBy,
        reviewedAt: new Date(),
        comments
      });

      // Create the actual override
      await UserPermissionOverride.create({
        id: `override-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: request.get('userId'),
        permissionId: request.get('permissionId'),
        overrideType: request.get('overrideType'),
        grantedBy: approvedBy,
        reason: request.get('reason'),
        expiresAt: request.get('expiresAt'),
        status: 'ACTIVE',
        requiresApproval: false,
        approvedBy,
        approvedAt: new Date()
      });

      return request;
    } catch (error) {
      console.error('Error approving request:', error);
      throw error;
    }
  }

  // Reject override request
  static async rejectRequest(
    requestId: string,
    rejectedBy: string,
    comments?: string
  ): Promise<PermissionOverrideRequest> {
    try {
      const request = await PermissionOverrideRequest.findByPk(requestId);
      if (!request || request.get('status') !== 'PENDING') {
        throw new Error('Invalid request');
      }

      await request.update({
        status: 'REJECTED',
        reviewedBy: rejectedBy,
        reviewedAt: new Date(),
        comments
      });

      return request;
    } catch (error) {
      console.error('Error rejecting request:', error);
      throw error;
    }
  }

  // Get pending requests
  static async getPendingRequests(role?: string): Promise<PermissionOverrideRequest[]> {
    try {
      const whereClause: any = { status: 'PENDING' };
      
      // If role is specified, filter by user role
      if (role) {
        const usersWithRole = await User.findAll({
          where: { role },
          attributes: ['id']
        });
        whereClause.userId = usersWithRole.map(u => u.get('id'));
      }

      return await PermissionOverrideRequest.findAll({
        where: whereClause,
        include: [
          { model: User, as: 'user' },
          { model: Permission, as: 'permission' }
        ],
        order: [['createdAt', 'ASC']]
      });
    } catch (error) {
      console.error('Error getting pending requests:', error);
      throw error;
    }
  }

  // Auto-expire overrides
  static async autoExpireOverrides(): Promise<number> {
    try {
      const expiredOverrides = await UserPermissionOverride.findAll({
        where: {
          status: 'ACTIVE',
          expiresAt: {
            [Op.lt]: new Date()
          }
        }
      });

      for (const override of expiredOverrides) {
        await this.expireOverride(override.get('id'));
      }

      return expiredOverrides.length;
    } catch (error) {
      console.error('Error auto-expiring overrides:', error);
      throw error;
    }
  }

  // Helper methods
  private static async expireOverride(overrideId: string): Promise<void> {
    try {
      await UserPermissionOverride.update(
        { status: 'EXPIRED' },
        { where: { id: overrideId } }
      );
    } catch (error) {
      console.error('Error expiring override:', error);
      throw error;
    }
  }

  private static async logPermissionChange(
    userId: string,
    permissionId: string,
    action: string,
    performedBy: string,
    reason: string,
    expiresAt?: Date
  ): Promise<void> {
    try {
      // This would log to an audit table
      console.log(`Permission change logged: User ${userId}, Permission ${permissionId}, Action ${action}, By ${performedBy}, Reason: ${reason}`);
    } catch (error) {
      console.error('Error logging permission change:', error);
    }
  }
}
