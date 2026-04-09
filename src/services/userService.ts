
import { User, Role } from '../types';
import { MOCK_USERS } from './mockData';

const STORAGE_PREFIX = 'hcms_user_db_';

class UserPersistence {
  private cache: User[] | null = null;

  private getStorageKey(): string {
    return `${STORAGE_PREFIX}data`;
  }

  getAll(): User[] {
    if (this.cache) return this.cache;
    const saved = localStorage.getItem(this.getStorageKey());
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.cache = parsed;
        return parsed;
      } catch (e) {
        console.error("Failed to parse user database", e);
      }
    }

    // Initialize with mock data if empty
    this.save(MOCK_USERS);
    return MOCK_USERS;
  }

  save(users: User[]): void {
    this.cache = users;
    localStorage.setItem(this.getStorageKey(), JSON.stringify(users));
  }

  async create(user: Partial<User>): Promise<User> {
    const users = this.getAll();
    const newUser: User = {
      ...user,
      id: `u-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      joinDate: user.joinDate || new Date().toISOString().split('T')[0],
      avatarUrl: user.avatarUrl || `https://i.pravatar.cc/150?u=${Math.random()}`,
    } as User;

    const updated = [...users, newUser];
    this.save(updated);
    return newUser;
  }

  async update(user: User): Promise<User> {
    const users = this.getAll();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      users[idx] = { ...user };
      this.save([...users]);
    }
    return user;
  }

  async delete(id: string): Promise<boolean> {
    const users = this.getAll();
    const filtered = users.filter(u => u.id !== id);
    this.save(filtered);
    return true;
  }

  async getById(id: string): Promise<User | null> {
    const users = this.getAll();
    return users.find(u => u.id === id) || null;
  }
}

export const userService = new UserPersistence();
