import { SystemSetting, DepartmentSetting, PositionSetting, EmployeeSetting, SettingAuditLog } from '../db';
import { Op } from 'sequelize';

export interface SettingValue {
  value: any;
  source: 'global' | 'department' | 'position' | 'employee';
  levelId?: string;
}

export interface SettingHierarchy {
  global: any;
  department?: any;
  position?: any;
  employee?: any;
  effective: any;
  effectiveSource: string;
}

export class SystemSettingService {
  // Get effective setting with hierarchy resolution
  static async getEffectiveSetting(key: string, employeeId?: string): Promise<SettingValue | null> {
    try {
      // Priority: Employee > Position > Department > Global
      
      // 1. Check Employee Setting (highest priority)
      if (employeeId) {
        const employeeSetting = await EmployeeSetting.findOne({
          where: { employeeId, settingKey: key }
        });
        if (employeeSetting) {
          return {
            value: employeeSetting.get('value'),
            source: 'employee',
            levelId: employeeId
          };
        }

        // Get employee's position and department
        const employee = await (await import('../db')).User.findByPk(employeeId);
        if (employee) {
          // 2. Check Position Setting
          if (employee.get('position')) {
            const positionSetting = await PositionSetting.findOne({
              where: { positionId: employee.get('position'), settingKey: key }
            });
            if (positionSetting) {
              return {
                value: positionSetting.get('value'),
                source: 'position',
                levelId: employee.get('position')
              };
            }
          }

          // 3. Check Department Setting
          if (employee.get('departmentId')) {
            const departmentSetting = await DepartmentSetting.findOne({
              where: { departmentId: employee.get('departmentId'), settingKey: key }
            });
            if (departmentSetting) {
              return {
                value: departmentSetting.get('value'),
                source: 'department',
                levelId: employee.get('departmentId')
              };
            }
          }
        }
      }

      // 4. Check Global Setting (fallback)
      const globalSetting = await SystemSetting.findOne({
        where: { key }
      });
      if (globalSetting) {
        return {
          value: globalSetting.get('value'),
          source: 'global'
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting effective setting:', error);
      throw error;
    }
  }

  // Get complete setting hierarchy
  static async getSettingHierarchy(key: string, employeeId?: string): Promise<SettingHierarchy | null> {
    try {
      const global = await SystemSetting.findOne({ where: { key } });
      let department, position, employee;

      if (employeeId) {
        const userRecord = await (await import('../db')).User.findByPk(employeeId);
        if (userRecord) {
          if (userRecord.get('departmentId')) {
            department = await DepartmentSetting.findOne({
              where: { departmentId: userRecord.get('departmentId'), settingKey: key }
            });
          }
          if (userRecord.get('position')) {
            position = await PositionSetting.findOne({
              where: { positionId: userRecord.get('position'), settingKey: key }
            });
          }
          employee = await EmployeeSetting.findOne({
            where: { employeeId, settingKey: key }
          });
        }
      }

      // Determine effective value
      let effective = global?.get('value');
      let effectiveSource = 'global';

      if (employee) {
        effective = employee.get('value');
        effectiveSource = 'employee';
      } else if (position) {
        effective = position.get('value');
        effectiveSource = 'position';
      } else if (department) {
        effective = department.get('value');
        effectiveSource = 'department';
      }

      return {
        global: global?.get('value') || null,
        department: department?.get('value') || null,
        position: position?.get('value') || null,
        employee: employee?.get('value') || null,
        effective,
        effectiveSource
      };
    } catch (error) {
      console.error('Error getting setting hierarchy:', error);
      throw error;
    }
  }

  // Update global setting
  static async updateGlobalSetting(
    key: string, 
    value: any, 
    updatedBy: string, 
    reason?: string
  ): Promise<SystemSetting> {
    try {
      const existingSetting = await SystemSetting.findOne({ where: { key } });
      const oldValue = existingSetting?.get('value');

      const setting = await SystemSetting.upsert({
        key,
        value,
        category: this.inferCategory(key),
        description: this.getDefaultDescription(key),
        isPublic: this.isPublicSetting(key)
      });

      // Log the change
      if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
        await SettingAuditLog.create({
          id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          settingKey: key,
          settingLevel: 'global',
          oldValue,
          newValue: value,
          changedBy: updatedBy,
          reason: reason || 'Global setting updated'
        });
      }

      return setting[0];
    } catch (error) {
      console.error('Error updating global setting:', error);
      throw error;
    }
  }

  // Update department setting
  static async updateDepartmentSetting(
    departmentId: string,
    key: string,
    value: any,
    updatedBy: string,
    reason?: string
  ): Promise<DepartmentSetting> {
    try {
      const existingSetting = await DepartmentSetting.findOne({
        where: { departmentId, settingKey: key }
      });
      const oldValue = existingSetting?.get('value');

      const setting = await DepartmentSetting.upsert({
        id: existingSetting?.get('id') || `dept-set-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        departmentId,
        settingKey: key,
        value
      });

      // Log the change
      if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
        await SettingAuditLog.create({
          id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          settingKey: key,
          settingLevel: 'department',
          levelId: departmentId,
          oldValue,
          newValue: value,
          changedBy: updatedBy,
          reason: reason || 'Department setting updated'
        });
      }

      return setting[0];
    } catch (error) {
      console.error('Error updating department setting:', error);
      throw error;
    }
  }

  // Update position setting
  static async updatePositionSetting(
    positionId: string,
    key: string,
    value: any,
    updatedBy: string,
    reason?: string
  ): Promise<PositionSetting> {
    try {
      const existingSetting = await PositionSetting.findOne({
        where: { positionId, settingKey: key }
      });
      const oldValue = existingSetting?.get('value');

      const setting = await PositionSetting.upsert({
        id: existingSetting?.get('id') || `pos-set-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        positionId,
        settingKey: key,
        value
      });

      // Log the change
      if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
        await SettingAuditLog.create({
          id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          settingKey: key,
          settingLevel: 'position',
          levelId: positionId,
          oldValue,
          newValue: value,
          changedBy: updatedBy,
          reason: reason || 'Position setting updated'
        });
      }

      return setting[0];
    } catch (error) {
      console.error('Error updating position setting:', error);
      throw error;
    }
  }

  // Update employee setting
  static async updateEmployeeSetting(
    employeeId: string,
    key: string,
    value: any,
    updatedBy: string,
    reason?: string
  ): Promise<EmployeeSetting> {
    try {
      const existingSetting = await EmployeeSetting.findOne({
        where: { employeeId, settingKey: key }
      });
      const oldValue = existingSetting?.get('value');

      const setting = await EmployeeSetting.upsert({
        id: existingSetting?.get('id') || `emp-set-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        employeeId,
        settingKey: key,
        value
      });

      // Log the change
      if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
        await SettingAuditLog.create({
          id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          settingKey: key,
          settingLevel: 'employee',
          levelId: employeeId,
          oldValue,
          newValue: value,
          changedBy: updatedBy,
          reason: reason || 'Employee setting updated'
        });
      }

      return setting[0];
    } catch (error) {
      console.error('Error updating employee setting:', error);
      throw error;
    }
  }

  // Get all settings by category
  static async getSettingsByCategory(category: string): Promise<SystemSetting[]> {
    try {
      return await SystemSetting.findAll({
        where: { category },
        order: [['key', 'ASC']]
      });
    } catch (error) {
      console.error('Error getting settings by category:', error);
      throw error;
    }
  }

  // Get audit trail for a setting
  static async getSettingAuditTrail(key: string, limit = 50): Promise<SettingAuditLog[]> {
    try {
      return await SettingAuditLog.findAll({
        where: { settingKey: key },
        order: [['changedAt', 'DESC']],
        limit
      });
    } catch (error) {
      console.error('Error getting setting audit trail:', error);
      throw error;
    }
  }

  // Helper methods
  private static inferCategory(key: string): string {
    if (key.startsWith('company.')) return 'Company Profile';
    if (key.startsWith('working_hours.')) return 'Working Hours';
    if (key.startsWith('attendance.')) return 'Attendance Policies';
    if (key.startsWith('leave.')) return 'Leave Policies';
    if (key.startsWith('payroll.')) return 'Payroll Policies';
    if (key.startsWith('security.')) return 'Security';
    if (key.startsWith('notification.')) return 'Notifications';
    return 'General';
  }

  private static getDefaultDescription(key: string): string {
    const descriptions: Record<string, string> = {
      'company.name': 'Company name for official documents',
      'company.address': 'Company physical address',
      'company.phone': 'Company contact phone number',
      'company.email': 'Company contact email',
      'working_hours.start': 'Default work start time',
      'working_hours.end': 'Default work end time',
      'working_hours.break_duration': 'Default break duration in minutes',
      'attendance.grace_period': 'Grace period for late arrival in minutes',
      'leave.annual_days': 'Annual leave entitlement in days',
      'payroll.cycle': 'Payroll processing frequency',
      'security.session_timeout': 'User session timeout in minutes',
      'notification.email_enabled': 'Enable email notifications'
    };
    return descriptions[key] || `Setting for ${key}`;
  }

  private static isPublicSetting(key: string): boolean {
    const publicSettings = [
      'company.name',
      'working_hours.start',
      'working_hours.end'
    ];
    return publicSettings.includes(key);
  }
}
