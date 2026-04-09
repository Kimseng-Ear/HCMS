import { Request, Response, NextFunction } from 'express';
import { PermissionService } from '../services/PermissionService';

interface AuthRequest extends Request {
  user?: any;
}

export const requirePermission = (permissionKey: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      // Admin is allowed to access all protected routes.
      if (String(req.user.role || '').toUpperCase() === 'ADMIN') {
        return next();
      }

      const permissionCheck = await PermissionService.hasPermission(req.user.id, permissionKey);
      
      if (!permissionCheck.hasPermission) {
        return res.status(403).json({ 
          success: false, 
          error: 'Insufficient permissions',
          requiredPermission: permissionKey
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ success: false, error: 'Permission check failed' });
    }
  };
};

export const requirePermissionAction = (permissionKey: string, action: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      // Admin is allowed to access all protected routes.
      if (String(req.user.role || '').toUpperCase() === 'ADMIN') {
        return next();
      }

      const permissionCheck = await PermissionService.hasPermission(req.user.id, permissionKey);
      const allowedActions = (permissionCheck.override?.get('actions') as string[] | undefined)
        || ((permissionCheck.permission as any)?.actions as string[] | undefined)
        || [];

      if (!permissionCheck.hasPermission || (allowedActions.length > 0 && !allowedActions.includes(action))) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          requiredPermission: permissionKey,
          requiredAction: action
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ success: false, error: 'Permission check failed' });
    }
  };
};
