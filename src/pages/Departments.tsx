import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Api } from '../services/api';
import { Department } from '../types';
import { MapPin, Users, Settings, Crosshair, Globe, ExternalLink, Building2, Search, Plus } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const Departments: React.FC = () => {
  const { t } = useLanguage();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const getGeoFence = (dept?: Partial<Department> | null) => ({
    latitude: dept?.geoFence?.latitude ?? 0,
    longitude: dept?.geoFence?.longitude ?? 0,
    radius: dept?.geoFence?.radius ?? 0
  });

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    const data = await Api.departments.getAll();
    setDepartments(data);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;
    setLoading(true);
    await Api.departments.update(editingDept);
    setLoading(false);
    setEditingDept(null);
    loadDepartments();
  };

  const handleGetCurrentLocation = () => {
    if (!editingDept) return;
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
            setEditingDept({
                ...editingDept,
                geoFence: {
                    ...getGeoFence(editingDept),
                    latitude: Number(position.coords.latitude.toFixed(6)),
                    longitude: Number(position.coords.longitude.toFixed(6))
                }
            });
        },
        (error) => {
             alert("Unable to retrieve location. Please ensure location services are enabled.");
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const filteredDepartments = departments.filter(dept => 
    dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="relative z-10">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{t('departments.title')}</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-lg">{t('departments.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto relative z-10">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search departments..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Button className="shrink-0 shadow-lg shadow-primary-500/20">
                <Plus className="w-4 h-4 mr-2" /> Add Department
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments.map(dept => (
            <div key={dept.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-xl hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-300 group relative overflow-hidden flex flex-col">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button 
                        onClick={() => setEditingDept(dept)}
                        className="p-2 bg-white dark:bg-slate-700 rounded-full text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 shadow-sm border border-slate-100 dark:border-slate-600 transition-colors hover:scale-110 transform"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/20 flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-inner group-hover:scale-110 transition-transform duration-300">
                        <Building2 className="w-7 h-7" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{dept.name}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center mt-1 font-medium">
                            <Users className="w-3.5 h-3.5 mr-1.5" />
                            {dept.headCount} {t('departments.employees')}
                        </p>
                    </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-100 dark:border-slate-700/50 space-y-4 flex-1">
                    {getGeoFence(dept).radius === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-4">
                            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
                                <Globe className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{t('departments.remote')}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">No location restrictions</span>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                    <span className="flex items-center font-medium"><MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Latitude</span>
                                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">{getGeoFence(dept).latitude}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                    <span className="flex items-center font-medium"><MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Longitude</span>
                                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">{getGeoFence(dept).longitude}</span>
                                </div>
                            </div>
                            
                            <div className="pt-3 mt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                <div className="flex items-center text-xs text-primary-700 dark:text-primary-400 font-bold bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded-lg">
                                    <div className="w-1.5 h-1.5 mr-2 bg-primary-500 rounded-full animate-pulse"></div>
                                    Radius: {getGeoFence(dept).radius}m
                                </div>
                                <a 
                                    href={`https://www.google.com/maps/search/?api=1&query=${getGeoFence(dept).latitude},${getGeoFence(dept).longitude}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors p-1 hover:bg-white dark:hover:bg-slate-800 rounded-lg"
                                    title="View on Google Maps"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        </>
                    )}
                </div>
            </div>
        ))}
      </div>

      {editingDept && (
        <Modal isOpen={!!editingDept} onClose={() => setEditingDept(null)} title={t('departments.edit')}>
            <form onSubmit={handleSave} className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('form.department')}</label>
                    <input 
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm"
                        value={editingDept.name}
                        onChange={e => setEditingDept({...editingDept, name: e.target.value})}
                    />
                </div>
                
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="font-bold text-slate-900 dark:text-white flex items-center text-sm">
                            <div className="p-1.5 bg-primary-100 dark:bg-primary-900/30 rounded-lg mr-2 text-primary-600">
                                <MapPin className="w-4 h-4" />
                            </div>
                            {t('departments.zone')}
                        </h4>
                        <Button type="button" size="sm" variant="outline" onClick={handleGetCurrentLocation} title="Set to my current location" className="text-xs h-8">
                            <Crosshair className="w-3.5 h-3.5 mr-1.5" /> {t('departments.useCurrentLoc')}
                        </Button>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-5">
                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Latitude</label>
                                <input 
                                    type="number" step="any"
                                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary-500 outline-none shadow-sm"
                                    value={getGeoFence(editingDept).latitude}
                                    onChange={e => setEditingDept({
                                        ...editingDept, 
                                        geoFence: { ...getGeoFence(editingDept), latitude: parseFloat(e.target.value) }
                                    })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Longitude</label>
                                <input 
                                    type="number" step="any"
                                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary-500 outline-none shadow-sm"
                                    value={getGeoFence(editingDept).longitude}
                                    onChange={e => setEditingDept({
                                        ...editingDept, 
                                        geoFence: { ...getGeoFence(editingDept), longitude: parseFloat(e.target.value) }
                                    })}
                                />
                            </div>
                        </div>
                        
                        <div>
                            <div className="flex justify-between mb-3">
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('departments.radius')}</label>
                                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${getGeoFence(editingDept).radius === 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'}`}>
                                    {getGeoFence(editingDept).radius === 0 ? t('departments.remote') : `${getGeoFence(editingDept).radius}m`}
                                </span>
                            </div>
                            <input 
                                type="range"
                                min="0" max="2000" step="50"
                                className="w-full accent-primary-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                value={getGeoFence(editingDept).radius}
                                onChange={e => setEditingDept({
                                    ...editingDept, 
                                    geoFence: { ...getGeoFence(editingDept), radius: parseInt(e.target.value) }
                                })}
                            />
                            <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                                <span>0 (Remote)</span>
                                <span>500m</span>
                                <span>1km</span>
                                <span>2km</span>
                            </div>
                        </div>
                        
                        <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                             <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${getGeoFence(editingDept).latitude},${getGeoFence(editingDept).longitude}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center bg-primary-50 dark:bg-primary-900/20 px-3 py-1.5 rounded-lg transition-colors"
                             >
                                 {t('departments.verifyMap')} <ExternalLink className="w-3 h-3 ml-1.5" />
                             </a>
                        </div>
                    </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={() => setEditingDept(null)} className="font-medium">{t('common.cancel')}</Button>
                    <Button type="submit" isLoading={loading} className="shadow-lg shadow-primary-500/20">{t('departments.saveSettings')}</Button>
                </div>
            </form>
        </Modal>
      )}
    </div>
  );
};