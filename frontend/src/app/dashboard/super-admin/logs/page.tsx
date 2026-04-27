"use client";
import Sidebar from '../../components/Sidebar';
import { 
  Database, Search, Filter, Calendar, 
  ShieldAlert, Info, AlertTriangle, Clock,
  User, Globe, Cpu, Download, RefreshCcw,
  Key, Trash2, Edit2, PlusCircle, Activity,
  ChevronRight, Terminal
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
export default function LuxuryLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async (isRef = false) => {
    if (isRef) setIsRefreshing(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('http://localhost:3000/audit-logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) { console.error(err); }
    finally { 
        setLoading(false); 
        if (isRef) setIsRefreshing(false);
    }
  };

  const handleExport = () => {
    const dataToExport = filterLevel === 'all' && !searchQuery ? logs : filtered;
    if (dataToExport.length === 0) return alert('Aucune donnée à extraire.');

    const headers = ['Horodatage', 'Agent', 'Email Admin', 'Action', 'Détails'];
    const csvRows = [headers.join(',')];

    dataToExport.forEach(log => {
      const date = new Date(log.createdAt).toLocaleString('fr-FR');
      const values = [
        date,
        `"${log.adminName || ''}"`,
        `"${log.adminEmail || ''}"`,
        `"${log.action || ''}"`,
        `"${(log.details || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(values.join(','));
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Afrigari_Surveillance_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getIntensityIcon = (action: string) => {
    if (action.includes('DELETE') || action.includes('permanent')) return { icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', label: 'CRITIQUE' };
    if (action.includes('PATCH') || action.includes('UPDATE')) return { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', label: 'MODIF' };
    return { icon: Info, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', label: 'INFO' };
  };

  const filtered = logs.filter(log => {
      const matchesSearch = log.details?.toLowerCase().includes(searchQuery.toLowerCase()) || log.adminName?.toLowerCase().includes(searchQuery.toLowerCase());
      if (filterLevel === 'all') return matchesSearch;
      const intensity = getIntensityIcon(log.action);
      return matchesSearch && intensity.label.toLowerCase() === filterLevel.toLowerCase();
  });

  return (
    <div className="flex bg-[#F8FAFF] min-h-screen text-slate-800 font-sans selection:bg-indigo-100">
      <Sidebar mode="super-admin" />
      <main className="flex-1 ml-80 p-16">
        
        <header className="mb-16 relative">
          <div className="absolute -left-10 top-0 w-2 h-32 bg-indigo-600 rounded-full opacity-30 blur-[2px]"></div>
          <div className="flex items-center gap-4 text-indigo-600 mb-6">
            <div className="p-3 bg-white rounded-2xl shadow-xl border border-indigo-50"><Database size={22} strokeWidth={2.5} /></div>
            <span className="text-[11px] font-black uppercase tracking-[0.7em] opacity-50 italic">System_Blackbox_v2</span>
          </div>
          <h1 className="text-7xl font-black text-slate-900 tracking-tighter italic uppercase leading-[0.85]">
            Archives de <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-indigo-600">Surveillance</span>
          </h1>
          <div className="mt-10 flex justify-between items-end">
            <p className="text-slate-400 text-xl font-medium max-w-xl leading-relaxed italic border-l-2 border-indigo-50 pl-10">
                Traçabilité absolue des flux de pouvoir. Chaque octet d'action est consigné pour l'éternité du réseau.
            </p>
            <div className="flex gap-4">
                <button 
                    onClick={() => fetchLogs(true)}
                    className="w-16 h-16 bg-white border border-slate-100 rounded-3xl flex items-center justify-center text-slate-300 hover:text-indigo-600 hover:shadow-xl transition-all"
                >
                    <RefreshCcw size={22} className={isRefreshing ? 'animate-spin text-indigo-600' : ''} />
                </button>
                <button 
                    onClick={handleExport}
                    className="bg-indigo-600 text-white px-10 py-5 rounded-[30px] text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-200 flex items-center gap-4 hover:-translate-y-2 transition-all">
                    <Download size={18} />
                    Extraire les Données
                </button>
            </div>
          </div>
        </header>

        {/* Console de Commande (Filtres) */}
        <div className="bg-white/70 backdrop-blur-2xl border border-white rounded-[50px] p-4 shadow-[0_40px_100px_rgba(79,70,229,0.08)] mb-16 flex flex-col lg:flex-row items-center gap-8 animate-reveal">
            <div className="flex bg-slate-50/50 p-2 rounded-[32px] gap-2 border border-slate-100/50">
                <FilterTab label="Tous les Flux" active={filterLevel === 'all'} onClick={() => setFilterLevel('all')} />
                <FilterTab label="Modifications" active={filterLevel === 'modif'} onClick={() => setFilterLevel('modif')} color="amber" />
                <FilterTab label="Alertes" active={filterLevel === 'critique'} onClick={() => setFilterLevel('critique')} color="rose" />
            </div>
            <div className="flex-1 relative w-full group">
                <div className="absolute inset-y-0 left-8 flex items-center text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                    <Search size={24} strokeWidth={2.5} />
                </div>
                <input 
                    type="text" 
                    placeholder="Filtrer par agent ou type d'action..." 
                    className="w-full bg-transparent p-6 pl-20 outline-none font-black text-slate-900 text-lg italic tracking-tight placeholder:text-slate-200 transition-all"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>
        </div>

        {loading ? (
             <div className="flex flex-col items-center justify-center h-[40vh] animate-pulse">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <span className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Accès aux serveurs de logs...</span>
            </div>
        ) : (
          <div className="space-y-12 animate-reveal">
            
            {/* Terminal de Logs */}
            <div className="bg-white/40 backdrop-blur-3xl border border-white rounded-[60px] p-3 shadow-[0_50px_150px_rgba(79,70,229,0.08)] overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/50 border-b border-slate-50">
                            <th className="p-10 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Horodatage</th>
                            <th className="p-10 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Agent</th>
                            <th className="p-10 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic font-mono">Protocole_Action</th>
                            <th className="p-10 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Détails_Mutation</th>
                            <th className="p-10 text-right text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Intensité</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50/50">
                        {filtered.length === 0 ? (
                            <tr><td colSpan={5} className="p-32 text-center text-slate-300 font-black italic uppercase tracking-widest uppercase text-sm">Fin de flux. Aucune donnée trouvée.</td></tr>
                        ) : filtered.map((log, i) => {
                            const intensity = getIntensityIcon(log.action);
                            const Icon = intensity.icon;
                            return (
                                <tr key={i} className="group hover:bg-white/80 transition-all duration-500">
                                    <td className="p-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300">
                                                <Clock size={18} />
                                            </div>
                                            <div className="text-[11px] font-black text-slate-900 italic tracking-tighter">
                                                {new Date(log.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                                <span className="block text-indigo-400 font-mono">{new Date(log.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-[12px] group-hover:rotate-12 transition-transform">
                                                {log.adminName?.charAt(0)}
                                            </div>
                                            <span className="text-sm font-black text-slate-800 uppercase italic tracking-tighter">{log.adminName}</span>
                                        </div>
                                    </td>
                                    <td className="p-10 font-mono text-[10px] uppercase font-black text-slate-300 bg-slate-50/30">
                                        {log.action}
                                    </td>
                                    <td className="p-10">
                                        <div className="font-bold text-slate-800 text-[13px] italic line-clamp-1 max-w-[300px] leading-relaxed group-hover:text-indigo-600 transition-colors">
                                            {log.details || 'Mutation indéfinie'}
                                        </div>
                                    </td>
                                    <td className="p-10 text-right">
                                        <div className={`inline-flex items-center gap-3 px-6 py-2.5 rounded-full border-2 ${intensity.bg} ${intensity.border} ${intensity.color}`}>
                                            <Icon size={14} className="animate-pulse" />
                                            <span className="text-[10px] font-black uppercase tracking-widest italic">{intensity.label}</span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer de Surveillance */}
            <div className="flex justify-between items-center px-10">
                <div className="flex items-center gap-10">
                    <StatusBadge label="Serveur Logs" status="ONLINE" color="emerald" />
                    <StatusBadge label="Chiffrement" status="AES-256" color="indigo" />
                </div>
                <div className="text-[10px] font-black uppercase text-slate-300 tracking-widest italic">
                    Scan_Total: {filtered.length} Entrées chargées
                </div>
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes reveal {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-reveal {
            animation: reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}

function FilterTab({ label, active, onClick, color = "indigo" }: any) {
    const variants: any = {
        indigo: active ? 'bg-white text-indigo-600 shadow-2xl shadow-indigo-100' : 'text-slate-400 hover:text-slate-600',
        amber: active ? 'bg-amber-600 text-white shadow-2xl shadow-amber-100' : 'text-slate-400 hover:text-slate-600',
        rose: active ? 'bg-rose-600 text-white shadow-2xl shadow-rose-100' : 'text-slate-400 hover:text-slate-600',
    };
    return (
        <button 
            onClick={onClick}
            className={`px-10 py-4 rounded-[28px] text-[11px] font-black uppercase tracking-widest transition-all ${variants[color]}`}
        >
            {label}
        </button>
    );
}

function StatusBadge({ label, status, color }: any) {
    const colors: any = {
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    };
    return (
        <div className="flex flex-col gap-1.5 px-6 border-l-2 border-slate-50">
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic leading-none">{label}</span>
            <div className={`px-2.5 py-0.5 rounded-lg border text-[9px] font-black uppercase italic w-fit ${colors[color]}`}>{status}</div>
        </div>
    );
}
