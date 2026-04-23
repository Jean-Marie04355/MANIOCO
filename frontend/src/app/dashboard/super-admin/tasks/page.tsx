"use client";
import Sidebar from '../../components/Sidebar';
import { 
  Zap, Clock, CheckCircle2, AlertCircle, 
  RefreshCcw, Database, Activity 
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function SimpleTasksPage() {
  const [queues, setQueues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(new Date());

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('http://localhost:3000/infra/queues/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQueues(data);
        setLastSync(new Date());
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex bg-slate-50 min-h-screen text-slate-800">
      <Sidebar mode="super-admin" />
      <main className="flex-1 ml-64 p-12">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Monitoring des <span className="text-indigo-600">Tâches</span></h1>
            <p className="text-slate-500 text-sm mt-1">Surveillez les processus d'arrière-plan en temps réel.</p>
          </div>
          <div className="text-right">
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Dernier Scan</div>
             <div className="text-sm font-bold text-indigo-600">{lastSync.toLocaleTimeString()}</div>
          </div>
        </header>

        {loading ? (
             <div className="flex items-center gap-3 text-slate-400 animate-pulse">
                <RefreshCcw className="animate-spin" size={18} /> Synchronisation des réacteurs...
             </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {queues.map(q => (
              <div key={q.name} className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                        <Database size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{q.name}</h2>
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Actif</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <MiniStat label="En attente" value={q.waiting} icon={Clock} color="text-amber-500" />
                    <MiniStat label="Actifs" value={q.active} icon={Activity} color="text-indigo-600" />
                    <MiniStat label="Terminés" value={q.completed} icon={CheckCircle2} color="text-emerald-600" />
                    <MiniStat label="Échecs" value={q.failed} icon={AlertCircle} color="text-rose-600" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon, color }: any) {
    return (
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className={`flex items-center gap-2 mb-2 ${color}`}>
                <Icon size={14} />
                <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-xl font-black text-slate-800 tracking-tight">{value}</div>
        </div>
    );
}
