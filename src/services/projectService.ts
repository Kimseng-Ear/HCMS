
import { Project } from '../types';
import { MOCK_PROJECTS } from './mockData';

const STORAGE_PREFIX = 'hcms_project_db_';

class ProjectPersistence {
  private cache: Project[] | null = null;

  private getStorageKey(): string {
    return `${STORAGE_PREFIX}data`;
  }

  getAll(status?: string): Project[] {
    const projects = this.cache || this.load();
    if (status && status !== 'ALL') {
      return projects.filter(p => p.status === status);
    }
    return projects;
  }

  private load(): Project[] {
    const saved = localStorage.getItem(this.getStorageKey());
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.cache = parsed;
        return parsed;
      } catch (e) {
        console.error("Failed to parse project database", e);
      }
    }

    // Initialize with mock data if empty
    this.save(MOCK_PROJECTS);
    return MOCK_PROJECTS;
  }

  save(projects: Project[]): void {
    this.cache = projects;
    localStorage.setItem(this.getStorageKey(), JSON.stringify(projects));
  }

  async create(project: Partial<Project>): Promise<Project> {
    const projects = this.getAll();
    const newProject: Project = {
      ...project,
      id: `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      progress: 0,
      totalTasks: 0,
    } as Project;

    const updated = [newProject, ...projects];
    this.save(updated);
    return newProject;
  }

  async update(project: Project): Promise<Project> {
    const projects = this.getAll();
    const idx = projects.findIndex(p => p.id === project.id);
    if (idx !== -1) {
      projects[idx] = { ...project };
      this.save([...projects]);
    }
    return project;
  }

  async delete(id: string): Promise<boolean> {
    const projects = this.getAll();
    const filtered = projects.filter(p => p.id !== id);
    this.save(filtered);
    return true;
  }

  async getById(id: string): Promise<Project | null> {
    const projects = this.getAll();
    return projects.find(p => p.id === id) || null;
  }
}

export const projectService = new ProjectPersistence();
