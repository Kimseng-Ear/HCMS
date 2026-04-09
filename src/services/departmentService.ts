
import { Department } from '../types';
import { MOCK_DEPARTMENTS } from './mockData';

const STORAGE_PREFIX = 'hcms_dept_db_';

class DeptPersistence {
  private cache: Department[] | null = null;

  private getStorageKey(): string {
    return `${STORAGE_PREFIX}data`;
  }

  getAll(): Department[] {
    if (this.cache) return this.cache;
    const saved = localStorage.getItem(this.getStorageKey());
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.cache = parsed;
        return parsed;
      } catch (e) {
        console.error("Failed to parse dept database", e);
      }
    }

    this.save(MOCK_DEPARTMENTS);
    return MOCK_DEPARTMENTS;
  }

  save(depts: Department[]): void {
    this.cache = depts;
    localStorage.setItem(this.getStorageKey(), JSON.stringify(depts));
  }

  async create(dept: Partial<Department>): Promise<Department> {
    const depts = this.getAll();
    const newDept: Department = {
      ...dept,
      id: `dep-${Date.now()}`,
      headCount: 0
    } as Department;
    this.save([...depts, newDept]);
    return newDept;
  }

  async update(dept: Department): Promise<Department> {
    const depts = this.getAll();
    const idx = depts.findIndex(d => d.id === dept.id);
    if (idx !== -1) {
      depts[idx] = { ...dept };
      this.save([...depts]);
    }
    return dept;
  }
}

export const departmentService = new DeptPersistence();
