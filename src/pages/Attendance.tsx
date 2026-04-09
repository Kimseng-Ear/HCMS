import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Api } from '../services/api';
import { userService } from '../services/userService';
import { AttendanceRecord, Department, User } from '../types';
import { calculateDistance, formatTime } from '../utils';
import { MapPin, RefreshCw, CheckCircle, ExternalLink, Clock, Calendar, ShieldCheck, Building2, Trophy, Map } from 'lucide-react';
import { useToast } from '../context/ToastContext';

// Isolated Clock Component
const LiveClock = React.memo(() => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    return (
        <div className="text-right">
            <div className="text-5xl sm:text-6xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400 tracking-widest transition-all drop-shadow-sm">
                {time.toLocaleTimeString(undefined, { hour12: false })}
            </div>
            <p className="text-xs sm:text-sm text-slate-400 uppercase tracking-[0.3em] font-bold mt-2">Current Time</p>
        </div>
    );
});

const MyAttendance: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [inZone, setInZone] = useState<boolean>(false);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [department, setDepartment] = useState<Department | null>(null);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    const fetchMeta = async () => {
        if(user) {
            const depts = await Api.departments.getAll();
            const myDept = depts.find(d => d.id === user.departmentId);
            setDepartment(myDept || null);
            const records = await Api.attendance.getForUser(user.id);
            setHistory(records);
            const currentDay = new Date().toISOString().split('T')[0];
            const record = records.find(t => t.date === currentDay);
            setTodayRecord(record || null);
        }
    };
    fetchMeta();
  }, [user]);

  const getLocation = () => {
    setLoadingLoc(true);
    if (!navigator.geolocation) {
      showToast("Geolocation not supported", 'error');
      setLoadingLoc(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCurrentLocation({ lat, lng });
        if (department?.geoFence) {
          if (department.geoFence.radius === 0) {
              setDistance(0); setInZone(true);
          } else {
              const dist = calculateDistance(lat, lng, department.geoFence.latitude, department.geoFence.longitude);
              setDistance(Math.round(dist));
              setInZone(dist <= department.geoFence.radius);
          }
        }
        setLoadingLoc(false);
      },
      (error) => {
        if(process.env.NODE_ENV !== 'production' && department?.geoFence) {
            showToast("Using Mock Location", 'info');
            setCurrentLocation({ lat: department.geoFence.latitude, lng: department.geoFence.longitude });
            setDistance(0);
            setInZone(true);
        } else {
            showToast("Location denied", 'error');
        }
        setLoadingLoc(false);
      }
    );
  };

  useEffect(() => { if(department) getLocation(); }, [department]);

  const handleClockIn = async () => {
    if(!user || !currentLocation) { if (!currentLocation) getLocation(); return; }
    setLoadingAction(true);
    try {
        const rec = await Api.attendance.clockIn(user.id, currentLocation);
        setTodayRecord(rec);
        setHistory(prev => [rec, ...prev]);
        showToast("Clocked in!", 'success');
    } catch (e: any) { showToast(e.message || "Failed", 'error'); } finally { setLoadingAction(false); }
  };

  const handleClockOut = async () => {
    if(!todayRecord || !currentLocation) { if (!currentLocation) getLocation(); return; }
    setLoadingAction(true);
    try {
        const rec = await Api.attendance.clockOut(todayRecord.id, currentLocation);
        setTodayRecord(rec);
        setHistory(prev => prev.map(p => p.id === rec.id ? rec : p));
        showToast("Clocked out!", 'success');
    } catch (e: any) { showToast(e.message || "Failed", 'error'); } finally { setLoadingAction(false); }
  };

  const isCheckedIn = !!todayRecord?.clockIn && !todayRecord?.clockOut;
  const isCheckedOut = !!todayRecord?.clockOut;
  const isRemote = (department?.geoFence?.radius ?? -1) === 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="mb-8 md:mb-0 text-center md:text-left relative z-10">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center justify-center md:justify-start gap-3">
                <div className="p-2.5 bg-primary-100 dark:bg-primary-900/30 rounded-2xl text-primary-600">
                    <Calendar className="w-6 h-6" />
                </div>
                {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h2>
            <div className="mt-4 flex items-center justify-center md:justify-start gap-3 text-slate-500 dark:text-slate-400 text-sm font-medium bg-slate-50 dark:bg-slate-700/50 px-4 py-2 rounded-xl w-fit mx-auto md:mx-0">
                <Clock className="w-4 h-4 text-primary-500" />
                Shift: <span className="text-slate-900 dark:text-white font-bold">{user?.shiftStart} - {user?.shiftEnd}</span>
            </div>
        </div>
        <div className="relative z-10 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-inner">
            <LiveClock />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col justify-center items-center relative min-h-[400px] group hover:shadow-lg transition-all duration-500">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500"></div>
            <div className="absolute inset-0 bg-slate-50/50 dark:bg-slate-900/20"></div>
            
            <div className="relative z-10 py-10 w-full max-w-sm mx-auto text-center space-y-8">
                <div className="relative mx-auto w-56 h-56 sm:w-64 sm:h-64 group cursor-pointer">
                    {!isCheckedIn && !isCheckedOut && inZone && (
                        <>
                            <div className="absolute inset-0 bg-primary-500 rounded-full animate-ping opacity-20 duration-1000"></div>
                            <div className="absolute inset-4 bg-primary-500 rounded-full animate-pulse opacity-10"></div>
                        </>
                    )}
                    
                    <button 
                        onClick={isCheckedIn ? handleClockOut : handleClockIn} 
                        disabled={loadingAction || (!inZone && !isCheckedOut && !isRemote)} 
                        className={`relative w-full h-full rounded-full border-[12px] shadow-2xl flex flex-col items-center justify-center transition-all duration-500 transform hover:scale-105 active:scale-95 ${
                            isCheckedOut 
                                ? 'border-slate-100 bg-slate-50 text-slate-400 cursor-default grayscale' 
                                : isCheckedIn 
                                    ? 'border-red-100 bg-gradient-to-br from-red-50 to-white hover:from-red-100 hover:to-red-50 text-red-600 shadow-red-500/20' 
                                    : inZone 
                                        ? 'border-primary-100 bg-gradient-to-br from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white shadow-primary-500/30' 
                                        : 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        {loadingAction ? (
                            <RefreshCw className="w-16 h-16 animate-spin" />
                        ) : isCheckedOut ? (
                            <>
                                <CheckCircle className="w-16 h-16 mb-4" />
                                <span className="text-xl font-bold tracking-widest">COMPLETED</span>
                                <span className="text-sm mt-2 font-medium opacity-70">See you tomorrow!</span>
                            </>
                        ) : isCheckedIn ? (
                            <>
                                <Clock className="w-16 h-16 mb-4 animate-pulse" />
                                <span className="text-2xl font-bold tracking-widest">CLOCK OUT</span>
                                <span className="text-xs mt-2 font-bold uppercase tracking-wider bg-red-100 text-red-700 px-3 py-1 rounded-full">Currently Working</span>
                            </>
                        ) : (
                            <>
                                <ShieldCheck className="w-16 h-16 mb-4" />
                                <span className="text-3xl font-bold tracking-widest">CLOCK IN</span>
                                {!inZone && !loadingLoc && (
                                    <span className="absolute bottom-10 text-[10px] font-bold uppercase tracking-widest text-red-500 bg-red-50 px-3 py-1 rounded-full border border-red-100 animate-bounce">
                                        Out of Zone
                                    </span>
                                )}
                            </>
                        )}
                    </button>
                </div>
                
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm border border-slate-100 dark:border-slate-700 inline-block">
                    {isCheckedIn ? "Don't forget to clock out before leaving." : isCheckedOut ? "Attendance recorded for today." : "Please ensure you are within the office zone."}
                </div>
            </div>
        </div>

        <Card title="Location Verification" icon={<MapPin className="w-5 h-5 text-rose-500" />} className="flex flex-col h-full">
            <div className="flex-1 flex flex-col justify-center space-y-8 p-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <div className="p-6 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-700/50 hover:border-primary-200 dark:hover:border-primary-800 transition-all group hover:-translate-y-1 duration-300">
                         <div className="flex items-start gap-4">
                             <div className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl text-primary-600 dark:text-primary-400 shadow-sm group-hover:scale-110 transition-transform">
                                 <Building2 className="w-6 h-6" />
                             </div>
                             <div>
                                 <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Office Location</p>
                                 <p className="text-lg font-bold text-slate-900 dark:text-white truncate">{department?.name}</p>
                                 <p className="text-xs text-slate-400 mt-1 font-medium bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-md w-fit">Radius: {department?.geoFence?.radius}m</p>
                             </div>
                         </div>
                     </div>
                     <div className="p-6 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-700/50 hover:border-rose-200 dark:hover:border-rose-800 transition-all group hover:-translate-y-1 duration-300">
                         <div className="flex items-start gap-4">
                             <div className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl text-rose-600 dark:text-rose-400 shadow-sm group-hover:scale-110 transition-transform">
                                 <MapPin className="w-6 h-6" />
                             </div>
                             <div>
                                 <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Your Status</p>
                                 <p className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                     {loadingLoc ? "Locating..." : currentLocation ? (inZone ? <span className="text-emerald-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> In Zone</span> : <span className="text-rose-600 flex items-center gap-1"><ExternalLink className="w-4 h-4" /> Out of Zone</span>) : "Unknown"}
                                 </p>
                                 <p className="text-xs text-slate-400 mt-1 font-medium">
                                     {distance !== null ? `${distance}m away` : "Distance unknown"}
                                 </p>
                             </div>
                         </div>
                     </div>
                </div>
                
                <div className="relative rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-900 h-56 flex items-center justify-center border border-slate-200 dark:border-slate-700 group">
                    <div className="absolute inset-0 opacity-40 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-cover bg-center group-hover:scale-105 transition-transform duration-700"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent"></div>
                    <div className="relative z-10 text-center">
                         <Button variant="outline" size="sm" onClick={getLocation} isLoading={loadingLoc} className="bg-white/90 backdrop-blur-md shadow-lg hover:bg-white text-primary-600 border-primary-200 hover:scale-105 transition-transform font-bold px-6 py-2.5 rounded-xl">
                            <RefreshCw className="w-4 h-4 mr-2" /> Refresh GPS Location
                         </Button>
                    </div>
                </div>
            </div>
        </Card>
      </div>
    </div>
  );
};

const AttendanceManagement: React.FC = () => {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    
    useEffect(() => {
        const fetchAll = async () => {
            const [recs, usrs] = await Promise.all([Api.attendance.getAll(), userService.getAll()]);
            setRecords(recs);
            setUsers(usrs);
        };
        fetchAll();
    }, []);

    const getUser = (id: string) => users.find(u => u.id === id);

    const openMap = (loc?: { lat: number, lng: number }) => {
        if (!loc) return;
        window.open(`https://www.google.com/maps?q=${loc.lat},${loc.lng}`, '_blank');
    };

    return (
        <Card title="Attendance List" icon={<Clock className="w-5 h-5 text-blue-500" />} className="overflow-hidden border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="overflow-x-auto -mx-6">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold uppercase tracking-wider text-xs">Employee</th>
                            <th className="hidden sm:table-cell px-6 py-4 font-bold uppercase tracking-wider text-xs">Date</th>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold uppercase tracking-wider text-xs">Check In</th>
                            <th className="hidden md:table-cell px-6 py-4 font-bold uppercase tracking-wider text-xs">Check Out</th>
                            <th className="hidden lg:table-cell px-6 py-4 font-bold uppercase tracking-wider text-xs">Location</th>
                            <th className="hidden sm:table-cell px-6 py-4 font-bold uppercase tracking-wider text-xs">Status</th>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold uppercase tracking-wider text-xs text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {records.map(rec => (
                            <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                <td className="px-4 sm:px-6 py-3 sm:py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img src={getUser(rec.userId)?.avatarUrl} className="w-10 h-10 rounded-full bg-slate-200 object-cover border-2 border-white dark:border-slate-700 shadow-sm" />
                                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${rec.clockOut ? 'bg-slate-400' : 'bg-emerald-500'}`}></div>
                                        </div>
                                        <span className="font-bold text-slate-900 dark:text-white">{getUser(rec.userId)?.name}</span>
                                    </div>
                                </td>
                                <td className="hidden sm:table-cell px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">{rec.date}</td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4 font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-2 py-1 w-fit border border-slate-100 dark:border-slate-700">{formatTime(rec.clockIn)}</td>
                                <td className="hidden md:table-cell px-6 py-4 font-mono text-slate-700 dark:text-slate-300">{rec.clockOut ? <span className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-2 py-1 border border-slate-100 dark:border-slate-700">{formatTime(rec.clockOut)}</span> : '-'}</td>
                                <td className="hidden lg:table-cell px-6 py-4">
                                    {rec.locationIn ? (
                                        <button 
                                            onClick={() => openMap(rec.locationIn)}
                                            className="flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/30 px-3 py-1.5 rounded-lg border border-primary-100 dark:border-primary-800 transition-all shadow-sm hover:shadow-md"
                                        >
                                            <Map className="w-3.5 h-3.5" />
                                            View Map
                                        </button>
                                    ) : (
                                        <span className="text-slate-400 text-xs italic flex items-center gap-1"><MapPin className="w-3 h-3" /> No Data</span>
                                    )}
                                </td>
                                <td className="hidden sm:table-cell px-6 py-4"><Badge variant={rec.status === 'LATE' ? 'warning' : 'success'} className="shadow-sm px-3 py-1">{rec.status}</Badge></td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                                    <button className="text-slate-400 hover:text-primary-600 font-medium text-xs p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                                        <ExternalLink className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

const AttendanceTracking: React.FC = () => {
    const [stats, setStats] = useState<any[]>([]);

    useEffect(() => {
        Promise.all([Api.attendance.getAll(), userService.getAll()]).then(([recs, usrs]) => {
            const userStats = usrs.map(u => {
                const userRecs = recs.filter(r => r.userId === u.id);
                let points = 0;
                let earlyArrivals = 0;
                userRecs.forEach(r => {
                    if(r.status === 'PRESENT') {
                        points += 10;
                        earlyArrivals++;
                    }
                    else if(r.status === 'LATE') points -= 5;
                });
                return { ...u, points, earlyArrivals };
            });
            setStats(userStats.sort((a,b) => b.points - a.points));
        });
    }, []);

    return (
        <Card title="Leaderboard (Top Early Birds)" icon={<Trophy className="w-5 h-5 text-yellow-500" />} className="border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="space-y-4">
                {stats.slice(0, 5).map((u, idx) => (
                    <div key={u.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl hover:shadow-lg hover:-translate-y-0.5 transition-all group gap-4">
                        <div className="flex items-center gap-4 sm:gap-5 w-full sm:w-auto">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 flex items-center justify-center rounded-2xl font-bold text-lg sm:text-xl shadow-md ${
                                idx === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-white ring-4 ring-yellow-100 dark:ring-yellow-900/30' : 
                                idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white ring-4 ring-slate-100 dark:ring-slate-800' :
                                idx === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white ring-4 ring-amber-100 dark:ring-amber-900/30' :
                                'bg-slate-100 dark:bg-slate-700 text-slate-500'
                            }`}>
                                {idx + 1}
                            </div>
                            <div className="relative flex-shrink-0">
                                <img src={u.avatarUrl} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-sm" />
                                {idx === 0 && <div className="absolute -top-2 -right-2 bg-yellow-400 text-white p-1.5 rounded-full shadow-sm animate-bounce"><Trophy className="w-3 h-3" /></div>}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-bold text-slate-900 dark:text-white text-base sm:text-lg truncate">{u.name}</p>
                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                    <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full font-medium truncate max-w-[120px] sm:max-w-none">{u.position}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto border-t sm:border-t-0 border-slate-100 dark:border-slate-700 pt-3 sm:pt-0">
                             <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-lg">
                                <Trophy className="w-4 h-4" />
                                <span className="font-mono font-bold text-lg sm:text-xl">{u.points}</span>
                            </div>
                            <p className="text-xs text-slate-400 font-medium mt-0 sm:mt-1">Total Points</p>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

export const Attendance: React.FC = () => {
    const { hasPermission } = useAuth();
    const [viewMode, setViewMode] = useState<'my' | 'list' | 'tracking'>('my');
    
    const canMonitor = hasPermission('attendance.view');

    return (
        <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8 pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-primary-500 rounded-xl text-white shadow-lg shadow-primary-500/30">
                            <Clock className="w-6 h-6" />
                        </div>
                        Attendance
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Track your daily attendance and location</p>
                </div>
                {canMonitor && (
                     <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto shadow-sm border border-slate-200 dark:border-slate-700">
                        <button onClick={() => setViewMode('my')} className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${viewMode === 'my' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-primary-200 dark:ring-primary-800' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>My Attendance</button>
                        <button onClick={() => setViewMode('list')} className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${viewMode === 'list' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-primary-200 dark:ring-primary-800' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>List & Approval</button>
                        <button onClick={() => setViewMode('tracking')} className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${viewMode === 'tracking' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-primary-200 dark:ring-primary-800' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>Leaderboard</button>
                     </div>
                )}
            </div>
            {viewMode === 'my' && <MyAttendance />}
            {viewMode === 'list' && <AttendanceManagement />}
            {viewMode === 'tracking' && <AttendanceTracking />}
        </div>
    );
};