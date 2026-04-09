import React, { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/FormFields';
import { Edit2, Trash2 } from 'lucide-react';
import { http } from '../../services/http';

interface Role {
  id: string;
  name: string;
  description: string;
}

export const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const loadRoles = async () => {
    const { data } = await http.get('/roles');
    setRoles((data || []).map((r: any) => ({ id: String(r.id), name: r.name, description: r.description || '' })));
  };

  useEffect(() => {
    loadRoles().catch(console.error);
  }, []);

  const resetForm = () => {
    setEditingRoleId(null);
    setName('');
    setDescription('');
  };

  const saveRole = async () => {
    if (!name.trim()) return;
    if (editingRoleId) {
      await http.put(`/roles/${editingRoleId}`, { name, description });
    } else {
      await http.post('/roles', { name, description });
    }
    await loadRoles();
    resetForm();
  };

  const startEdit = (role: Role) => {
    setEditingRoleId(role.id);
    setName(role.name);
    setDescription(role.description || '');
  };

  const deleteRole = async (id: string) => {
    await http.delete(`/roles/${id}`);
    await loadRoles();
    if (editingRoleId === id) resetForm();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">{editingRoleId ? 'Edit Role' : 'Create Role'}</h3>
        <div className="space-y-3">
          <Input label="Role Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="HR" />
          <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Role description" />
          <div className="flex gap-2">
            <Button onClick={saveRole} className="flex-1">{editingRoleId ? 'Update Role' : 'Create Role'}</Button>
            {editingRoleId && <Button variant="outline" onClick={resetForm}>Cancel</Button>}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Existing Roles</h3>
        <div className="space-y-3">
          {roles.map((role) => (
            <div key={role.id} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 p-3">
              <div>
                <div className="font-medium text-slate-900 dark:text-white">{role.name}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{role.description}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => startEdit(role)}><Edit2 className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => deleteRole(role.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

