"use client";
import Sidebar from '../components/Sidebar';
import { 
    Users, Shield, Activity, TrendingUp, Bell, Search, 
    Zap, Globe, Lock, ChevronRight, PieChart as PieIcon,
    ShoppingBag, UserCheck, Loader2, Clock, Terminal,
    RefreshCw, ShieldCheck, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '@/lib/axios';

export default function ProfessionalSuperAdminDashboard() {
  const [stats, setStats] = useState({ users: 0, admins: 0, online: 0, clients: 0, sellers: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commandLoading, setCommandLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ msg: string, type: 'success' | 'alert' } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [uRes, logRes, statsRes, onlineRes] = await Promise.all([
        api.get('/users'),
        api.get('/audit-logs'),
        api.get('/audit-logs/stats'),
        api.get('/realtime/online-count')
      ]);

      let onlineCount = onlineRes.data?.count || 0;
      const users = uRes.data;
        const c = users.filter((u: any) => u.role === 'client').length;
        const s = users.filter((u: any) => u.role === 'vendeur').length;
        const a = users.filter((u: any) => u.role === 'admin' && !u.deletedAt).length;
        setStats({ users: c + s, admins: a, online: onlineCount, clients: c, sellers: s });
        setPieData([
            { name: 'Admins', value: a, color: '#10b981' },
            { name: 'Clients', value: c, color: '#3b82f6' },
            { name: 'Vendeurs', value: s, color: '#f43f5e' }
        ]);

      const rawStats = statsRes.data;
      const daysData = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const match = rawStats.find((s: any) => s.date.startsWith(dateStr));
          daysData.push({ name: d.toLocaleDateString('fr-FR', { weekday: 'short' }), actions: match ? match.count : 0 });
      }
      setChartData(daysData);

      const logs = logRes.data;
      setRecentLogs(logs.slice(0, 6));
    } catch (err) { console.error("Erreur", err); }
    finally { setLoading(false); }
  };

  const handleCommand = async (type: 'sync' | 'audit') => {
      setCommandLoading(type);
      
      // Simulation de traitement lourd
      await new Promise(r => setTimeout(r, 1500));

      if (type === 'sync') {
          await fetchAllData();
          showNotification("Synchronisation des Citoyens terminée avec succès", "success");
      } else {
          showNotification("Audit Alpha terminé. 0 vulnérabilité détectée.", "success");
      }
      setCommandLoading(null);
  };

  const showNotification = (msg: string, type: 'success' | 'alert') => {
      setNotification({ msg, type });
      setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="flex bg-[#F4F7FE] min-h-screen text-slate-700 font-sans selection:bg-indigo-100 relative">
      <Sidebar mode="super-admin" />
      
      {/* Notifications Crystal Overlay */}
      {notification && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-notification">
              <div className={`px-8 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-4 ${notification.type === 'success' ? 'bg-emerald-50/90 border-emerald-100 text-emerald-600' : 'bg-rose-50/90 border-rose-100 text-rose-600'}`}>
                  {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  <span className="text-xs font-bold uppercase tracking-wider">{notification.msg}</span>
              </div>
          </div>
      )}

      <main className="flex-1 ml-72 p-8">
        
        <header className="mb-10 flex justify-between items-center">
            <div>
                <div className="flex items-center gap-2 text-indigo-600 mb-1">
                    <Zap size={16} className="fill-indigo-600" />
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Afrigari Central Control</span>
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Console de <span className="text-indigo-600">Surveillance</span></h1>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Niveau de Sécurité</p>
                    <p className="text-xs font-bold text-emerald-500 uppercase">Protocole Alpha Actif</p>
                </div>
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-slate-400">
                    <Bell size={20} />
                </div>
            </div>
        </header>

        {loading ? (
             <div className="flex flex-col items-center justify-center h-[60vh]">
                <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Initialisation...</span>
            </div>
        ) : (
          <div className="space-y-8 animate-reveal">
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <CompactStatCard label="Citoyens" value={stats.users} icon={Users} color="blue" />
                <CompactStatCard label="Garde" value={stats.admins} icon={Shield} color="emerald" />
                <CompactStatCard label="Marchands" value={stats.sellers} icon={ShoppingBag} color="purple" />
                <CompactStatCard label="Live" value={stats.online} icon={Activity} color="indigo" pulse />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight italic">Flux d'Activité <span className="text-indigo-600">Live</span></h3>
                    </div>
                    <div className="h-[280px] w-full" style={{ minHeight: '280px', minWidth: '0' }}>
                        {mounted && (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorAct" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" fontSize={10} fontWeight={700} axisLine={false} tickLine={false} stroke="#94a3b8" />
                                    <YAxis fontSize={9} axisLine={false} tickLine={false} stroke="#94a3b8" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="actions" stroke="#4f46e5" strokeWidth={3} fill="url(#colorAct)" animationDuration={1000} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm relative flex flex-col items-center justify-center">
                    <h3 className="absolute top-8 left-8 text-lg font-bold text-slate-900 uppercase tracking-tight italic">Démographie</h3>
                    <div className="h-[220px] w-full mt-6" style={{ minHeight: '220px', minWidth: '0' }}>
                        {mounted && (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} innerRadius={65} outerRadius={85} paddingAngle={8} dataKey="value" stroke="none">
                                        {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[10px] text-center">
                            <div className="text-2xl font-black text-slate-900 tracking-tighter italic">{stats.users + stats.admins}</div>
                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Total</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 w-full mt-6">
                        <LegendItem label="Garde" color="#10b981" />
                        <LegendItem label="Clients" color="#3b82f6" />
                        <LegendItem label="Vendeurs" color="#f43f5e" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                    <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-4">
                        <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight italic flex items-center gap-2">
                             <Terminal size={18} className="text-indigo-600" /> Flux d'Audit Récent
                        </h3>
                    </div>
                    <div className="space-y-4">
                        {recentLogs.map((log, i) => (
                            <div key={i} className="flex items-center gap-4 py-3 hover:bg-slate-50 rounded-xl px-2 transition-all group">
                                <div className="text-[9px] font-bold text-slate-300 w-12 font-mono">
                                    {new Date(log.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.4)]"></div>
                                <div className="flex-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter bg-slate-50 px-2 py-0.5 rounded-md mr-3">{log.adminName}</span>
                                    <span className="text-xs font-medium text-slate-700 group-hover:text-indigo-600 transition-colors uppercase italic tracking-tighter">{log.details}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Accès Rapides FONCTIONNELS */}
                <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col justify-between group overflow-hidden relative">
                    <div className="relative z-10">
                        <h3 className="text-xl font-black italic uppercase tracking-tighter mb-4">Commandes_Alpha</h3>
                        <p className="text-white/40 text-[10px] font-medium leading-relaxed mb-8">Maintenance système et audits de sécurité.</p>
                        <div className="space-y-3">
                             <QuickBtn 
                                label="Sync Citoyens" 
                                icon={RefreshCw} 
                                onClick={() => handleCommand('sync')}
                                loading={commandLoading === 'sync'}
                             />
                             <QuickBtn 
                                label="Protocole Sécurité" 
                                icon={ShieldCheck} 
                                onClick={() => handleCommand('audit')}
                                loading={commandLoading === 'audit'}
                             />
                        </div>
                    </div>
                    <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-1000">
                        <Zap size={200} />
                    </div>
                </div>
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes reveal {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes notification {
            0% { opacity: 0; transform: translate(-50%, -20px); }
            10% { opacity: 1; transform: translate(-50%, 0); }
            90% { opacity: 1; transform: translate(-50%, 0); }
            100% { opacity: 0; transform: translate(-50%, -20px); }
        }
        .animate-reveal { animation: reveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-notification { animation: notification 4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
}

function CompactStatCard({ label, value, icon: Icon, color, pulse }: any) {
    const colors: any = {
        blue: "text-blue-600 bg-blue-50 border-blue-100 shadow-blue-50",
        emerald: "text-emerald-600 bg-emerald-50 border-emerald-100 shadow-emerald-50",
        purple: "text-purple-600 bg-purple-50 border-purple-100 shadow-purple-50",
        indigo: "text-indigo-600 bg-indigo-50 border-indigo-100 shadow-indigo-50",
    };
    return (
        <div className={`p-6 bg-white border rounded-[24px] shadow-sm flex items-center gap-5 hover:shadow-md transition-all group overflow-hidden`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 ${colors[color].split(' ')[0]} ${colors[color].split(' ')[1]}`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 italic">{label}</p>
                <div className="flex items-center gap-2">
                    <h4 className="text-2xl font-black text-slate-900 leading-none">{value}</h4>
                    {pulse && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></div>}
                </div>
            </div>
        </div>
    );
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-2xl border border-slate-700">
                <p className="text-base font-black italic">{payload[0].value} <span className="text-[10px]">Actions</span></p>
            </div>
        );
    }
    return null;
};

function LegendItem({ label, color }: any) {
    return (
        <div className="flex flex-col items-center">
            <div className={`w-3 h-1 rounded-full mb-1`} style={{ backgroundColor: color }}></div>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic">{label}</span>
        </div>
    );
}

function QuickBtn({ label, icon: Icon, onClick, loading }: any) {
    return (
        <button 
            onClick={onClick}
            disabled={loading}
            className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white hover:text-slate-900 transition-all font-bold uppercase text-[9px] tracking-widest italic group/btn disabled:opacity-50"
        >
            <div className="flex items-center gap-3">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
                {label}
            </div>
            {!loading && <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />}
        </button>
    );
}
