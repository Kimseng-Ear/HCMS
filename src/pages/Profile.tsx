import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { Api } from '../services/api';
import { Mail, Phone, MapPin, Calendar, Briefcase, CreditCard, Camera, Award, Star, ThumbsUp, User as UserIcon, Edit2, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../utils';

export const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
      phone: '',
      address: '',
      avatarUrl: ''
  });

  // Update form data when user loads or modal opens
  useEffect(() => {
    if (user) {
      setFormData({
        phone: user.phone || '',
        address: user.address || '',
        avatarUrl: user.avatarUrl || ''
      });
    }
  }, [user, isEditing]);

  if (!user) return null;

  const handleUpdate = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      const updated = { ...user, ...formData };
      await Api.users.update(updated);
      await refreshUser();
      setLoading(false);
      setIsEditing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Basic validation: Check if file is an image and size (e.g. < 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert("File is too large. Please choose an image under 2MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-all group relative">
          <div className="h-48 bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          </div>
          <div className="px-6 sm:px-10 pb-10">
              <div className="relative flex flex-col sm:flex-row sm:items-end -mt-16 mb-8 gap-6">
                  <div className="flex items-end gap-6">
                      <div className="relative group/avatar">
                        <div className="w-32 h-32 rounded-full p-1 bg-white dark:bg-slate-800 shadow-xl">
                            <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover border-4 border-slate-50 dark:border-slate-700" />
                        </div>
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="absolute bottom-2 right-2 p-2.5 bg-primary-600 text-white rounded-full border-4 border-white dark:border-slate-800 shadow-lg opacity-0 group-hover/avatar:opacity-100 transition-all hover:bg-primary-700 hover:scale-110 active:scale-95"
                        >
                            <Camera className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="mb-3 hidden sm:block">
                          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                              {user.name}
                              <CheckCircle2 className="w-6 h-6 text-blue-500 fill-blue-500/10" />
                          </h1>
                          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg flex items-center gap-2">
                              <Briefcase className="w-4 h-4" />
                              {user.position}
                          </p>
                      </div>
                  </div>
                  
                  {/* Mobile Name Display */}
                  <div className="block sm:hidden text-center sm:text-left mt-2">
                       <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                           {user.name}
                           <CheckCircle2 className="w-5 h-5 text-blue-500" />
                       </h1>
                       <p className="text-slate-500 dark:text-slate-400 font-medium">{user.position}</p>
                  </div>

                  <div className="sm:ml-auto w-full sm:w-auto pb-2">
                    <Button 
                        onClick={() => setIsEditing(true)}
                        className="w-full sm:w-auto bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 shadow-sm hover:shadow-md transition-all font-bold rounded-xl py-2.5"
                    >
                        <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
                    </Button>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="group p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 hover:border-primary-200 dark:hover:border-primary-800 transition-all hover:shadow-md">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-4 mb-4 flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                              <Phone className="w-4 h-4" />
                          </div>
                          Contact Info
                      </h3>
                      <div className="space-y-4 text-sm">
                          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors">
                              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-400">
                                  <Mail className="w-4 h-4" />
                              </div>
                              <span className="font-medium">{user.email}</span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors">
                              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-400">
                                  <Phone className="w-4 h-4" />
                              </div>
                              <span className="font-medium">{user.phone || '+855 12 345 678'}</span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors">
                              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-400">
                                  <MapPin className="w-4 h-4" />
                              </div>
                              <span className="font-medium">{user.address || 'Phnom Penh, Cambodia'}</span>
                          </div>
                      </div>
                  </div>

                  <div className="group p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 hover:border-purple-200 dark:hover:border-purple-800 transition-all hover:shadow-md">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-4 mb-4 flex items-center gap-3">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                              <Briefcase className="w-4 h-4" />
                          </div>
                          Employment
                      </h3>
                      <div className="space-y-4 text-sm">
                          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors">
                              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-400">
                                  <Briefcase className="w-4 h-4" />
                              </div>
                              <span className="font-medium">{user.departmentId === 'dep-1' ? 'Human Resources' : 'Engineering'}</span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors">
                              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-400">
                                  <Calendar className="w-4 h-4" />
                              </div>
                              <span className="font-medium">Joined {new Date(user.joinDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                          </div>
                      </div>
                  </div>

                   <div className="group p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all hover:shadow-md">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-4 mb-4 flex items-center gap-3">
                          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                              <CreditCard className="w-4 h-4" />
                          </div>
                          Compensation
                      </h3>
                      <div className="space-y-4 text-sm">
                          <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                              <span className="text-slate-500 dark:text-slate-400 font-medium">Basic Salary</span>
                              <span className="font-mono font-bold text-lg text-emerald-600 dark:text-emerald-400">{formatCurrency(user.salary || 0)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 italic mt-2 p-2 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100/50 dark:border-emerald-900/20">
                              <Calendar className="w-3 h-3 text-emerald-500" />
                              Next payroll review: <span className="font-semibold text-emerald-700 dark:text-emerald-300">Dec 2023</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* RECOGNITION SECTION - Engagement Improvement */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3 relative z-10">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
                <Award className="w-5 h-5" />
              </div>
              Achievements & Recognition
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative z-10">
              <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex items-center gap-4 hover:shadow-md transition-all group hover:-translate-y-1">
                  <div className="p-3 bg-white dark:bg-amber-900/30 rounded-xl text-amber-500 shadow-sm group-hover:scale-110 transition-transform ring-1 ring-amber-100 dark:ring-amber-800">
                      <Award className="w-6 h-6" />
                  </div>
                  <div>
                      <p className="font-bold text-slate-800 dark:text-white">Year of Service</p>
                      <p className="text-xs text-slate-500 font-medium bg-white/50 dark:bg-slate-800/50 px-2 py-0.5 rounded-md inline-block mt-1">2023</p>
                  </div>
              </div>
              
              <div className="p-5 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/10 dark:to-blue-900/10 border border-primary-100 dark:border-primary-900/30 rounded-2xl flex items-center gap-4 hover:shadow-md transition-all group hover:-translate-y-1">
                  <div className="p-3 bg-white dark:bg-primary-900/30 rounded-xl text-primary-600 shadow-sm group-hover:scale-110 transition-transform ring-1 ring-primary-100 dark:ring-primary-800">
                      <Star className="w-6 h-6" />
                  </div>
                  <div>
                      <p className="font-bold text-slate-800 dark:text-white">Star Performer</p>
                      <p className="text-xs text-slate-500 font-medium bg-white/50 dark:bg-slate-800/50 px-2 py-0.5 rounded-md inline-block mt-1">Q3 2023</p>
                  </div>
              </div>

              <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl flex items-center gap-4 hover:shadow-md transition-all group hover:-translate-y-1">
                  <div className="p-3 bg-white dark:bg-emerald-900/30 rounded-xl text-emerald-600 shadow-sm group-hover:scale-110 transition-transform ring-1 ring-emerald-100 dark:ring-emerald-800">
                      <ThumbsUp className="w-6 h-6" />
                  </div>
                  <div>
                      <p className="font-bold text-slate-800 dark:text-white">Team Player</p>
                      <p className="text-xs text-slate-500 font-medium bg-white/50 dark:bg-slate-800/50 px-2 py-0.5 rounded-md inline-block mt-1">Peer Nominated</p>
                  </div>
              </div>
          </div>
      </div>

      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Edit Profile">
          <form onSubmit={handleUpdate} className="space-y-6">
              <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Profile Photo</label>
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 border-dashed">
                      <div className="relative group">
                        <img src={formData.avatarUrl || user.avatarUrl} alt="Preview" className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-slate-600 shadow-md" />
                        <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 w-full text-center sm:text-left">
                          <label className="cursor-pointer inline-flex items-center justify-center px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all shadow-sm hover:shadow-md w-full sm:w-auto hover:-translate-y-0.5">
                              <Camera className="w-4 h-4 mr-2" />
                              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                              Change Photo
                          </label>
                          <p className="text-xs text-slate-400 mt-3 font-medium">Recommended: Square JPG, PNG. Max 2MB.</p>
                      </div>
                  </div>
              </div>
              
              <div className="grid grid-cols-1 gap-5">
                  <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Phone Number</label>
                      <div className="relative">
                          <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input 
                              className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
                              value={formData.phone}
                              onChange={(e) => setFormData({...formData, phone: e.target.value})}
                              placeholder="+855 ..."
                          />
                      </div>
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Address</label>
                      <div className="relative">
                          <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                          <textarea 
                              className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
                              rows={3}
                              value={formData.address}
                              onChange={(e) => setFormData({...formData, address: e.target.value})}
                              placeholder="Your current address..."
                          />
                      </div>
                  </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-700">
                  <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} className="font-medium">Cancel</Button>
                  <Button type="submit" isLoading={loading} className="bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/30 rounded-xl px-6 font-bold">Save Changes</Button>
              </div>
          </form>
      </Modal>
    </div>
  );
};