
import { Task } from '../types';
import { MOCK_TASKS } from './mockData';

const STORAGE_PREFIX = 'hcms_task_db_';

class TaskPersistence {
  private cache: Task[] | null = null;

  private getStorageKey(): string {
    return `${STORAGE_PREFIX}data`;
  }

  getAll(): Task[] {
    if (this.cache) return this.cache;

    const saved = localStorage.getItem(this.getStorageKey());
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.cache = parsed;
        return parsed;
      } catch (e) {
        console.error("Failed to parse task database", e);
      }
    }

    // Initialize with mock data if empty
    this.save(MOCK_TASKS);
    return MOCK_TASKS;
  }

  getByProject(projectId: string): Task[] {
    return this.getAll().filter(t => t.projectId === projectId);
  }

  save(tasks: Task[]): void {
    this.cache = tasks;
    localStorage.setItem(this.getStorageKey(), JSON.stringify(tasks));
  }

  async create(task: Partial<Task>): Promise<Task> {
    const tasks = this.getAll();
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      loggedHours: 0,
    } as Task;

    const updated = [newTask, ...tasks];
    this.save(updated);
    return newTask;
  }

  async update(task: Task): Promise<Task> {
    const tasks = this.getAll();
    const idx = tasks.findIndex(t => t.id === task.id);
    if (idx !== -1) {
      tasks[idx] = { ...task };
      this.save([...tasks]);
    }
    return task;
  }

  async delete(id: string): Promise<boolean> {
    const tasks = this.getAll();
    const filtered = tasks.filter(t => t.id !== id);
    this.save(filtered);
    return true;
  }
}

export const taskService = new TaskPersistence();
