import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { Shield, Zap, Database, Globe, Layers, AlertCircle, Terminal, HardDrive } from 'lucide-react';

export default function SuperAdminDashboard() {
  return (
    <div className="flex bg-[#0b0e14] min-h-screen text-slate-300">
      <Sidebar mode="super-admin" />
      
      <main className="flex-1 ml-64">
        <TopNav title="System Control Center" isAdmin={false} />
        
        <div className="p-8 space-y-8">
          {/* Infrastructure Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={Globe} label="Total Requêtes" value="245,532" change="+18%" color="indigo" />
            <StatCard icon={Shield} label="Admins Actifs" value="12" change="+2" color="purple" />
            <StatCard icon={Layers} label="Background Jobs" value="45,231" change="+22%" color="orange" />
            <StatCard icon={Zap} label="API Latency" value="24" suffix="ms" change="-15%" color="green" />
          </div>

          {/* Technical Monitors */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <MonitorCard title="Redis (Cache)" status="Actif" metrics={[
                { label: "Utilisation mémoire", value: "65%" },
                { label: "Clés", value: "12,452" }
            ]} color="red" />
            <MonitorCard title="BullMQ (Jobs)" status="Actif" metrics={[
                { label: "Jobs en attente", value: "32" },
                { label: "Jobs échoués", value: "3" }
            ]} color="pink" />
            <MonitorCard title="WebSocket" status="Actif" metrics={[
                { label: "Connexions", value: "562" },
                { label: "Messages / min", value: "1,245" }
            ]} color="green" />
            <MonitorCard title="Stockage S3" status="Online" metrics={[
                { label: "Total fichiers", value: "12,450" },
                { label: "Utilisation", value: "320 GB" }
            ]} color="blue" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* System Logs */}
            <div className="lg:col-span-2 bg-[#151921] p-6 rounded-3xl border border-slate-800">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    <Terminal size={20} className="text-indigo-400" /> Logs Système
                  </h3>
                  <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400 font-bold uppercase">Live</span>
               </div>
               <div className="space-y-4 font-mono text-xs">
                  {systemLogs.map((log, i) => (
                    <div key={i} className="flex gap-4 p-2 rounded hover:bg-white/5 transition-colors group">
                      <span className="text-slate-600">[{log.time}]</span>
                      <span className={log.color}>{log.event}</span>
                      <span className="text-slate-500 italic ml-auto opacity-0 group-hover:opacity-100">{log.ip}</span>
                    </div>
                  ))}
               </div>
            </div>

            {/* Storage Gauge */}
            <div className="bg-[#151921] p-6 rounded-3xl border border-slate-800">
               <h3 className="font-bold text-white text-lg mb-8 flex items-center gap-2">
                  <HardDrive size={20} className="text-blue-400" /> Utilisation Stockage
               </h3>
               <div className="flex flex-col items-center">
                  <div className="relative w-48 h-48 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-[10px] border-slate-800"></div>
                    <div className="absolute inset-0 rounded-full border-[10px] border-indigo-500 border-t-transparent transform rotate-45 animate-pulse"></div>
                    <div className="text-center">
                      <p className="text-3xl font-black text-white">320 GB</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">sur 1 TB</p>
                    </div>
                  </div>
                  <div className="mt-8 w-full space-y-4">
                     <StorageItem label="Images" size="120 GB" color="bg-blue-500" />
                     <StorageItem label="Vidéos" size="150 GB" color="bg-purple-500" />
                     <StorageItem label="Documents" size="30 GB" color="bg-indigo-500" />
                  </div>
               </div>
            </div>
          </div>

          {/* System Alerts */}
          <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl">
             <h3 className="text-red-500 font-bold mb-4 flex items-center gap-2">
                <AlertCircle size={18} /> Alertes Système Critiques
             </h3>
             <div className="space-y-3">
                <p className="text-sm text-red-300">• Espace disque élevé sur le serveur (85% utilisé) <span className="text-red-500/50 text-[10px] ml-2">il y a 5 min</span></p>
                <p className="text-sm text-red-300">• Plusieurs échecs de jobs détectés dans BullMQ <span className="text-red-500/50 text-[10px] ml-2">il y a 15 min</span></p>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, change, color, suffix = "" }: any) {
  const colors: any = {
    indigo: 'text-indigo-400 bg-indigo-400/10',
    purple: 'text-purple-400 bg-purple-400/10',
    orange: 'text-orange-400 bg-orange-400/10',
    green: 'text-emerald-400 bg-emerald-400/10',
  };
  return (
    <div className="bg-[#151921] p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all group">
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-2xl ${colors[color]} group-hover:scale-110 transition-transform`}><Icon size={22} /></div>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">{label}</p>
      </div>
      <div className="flex items-baseline gap-2">
        <h4 className="text-2xl font-black text-white">{value}<span className="text-sm text-slate-500 ml-1">{suffix}</span></h4>
        <span className="text-[10px] font-bold text-green-500">{change}</span>
      </div>
    </div>
  );
}

function MonitorCard({ title, status, metrics, color }: any) {
  const colors: any = {
    red: 'border-red-500/50 text-red-500',
    pink: 'border-pink-500/50 text-pink-500',
    green: 'border-emerald-500/50 text-emerald-500',
    blue: 'border-blue-500/50 text-blue-500',
  };
  return (
    <div className="bg-[#151921] p-5 rounded-2xl border border-slate-800 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl -mr-12 -mt-12 bg-${color}-500/10`}></div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</h4>
        <span className={`text-[10px] font-black uppercase flex items-center gap-1 ${colors[color]}`}>
          <div className={`w-1.5 h-1.5 rounded-full bg-current animate-pulse`}></div> {status}
        </span>
      </div>
      <div className="space-y-3 relative z-10">
        {metrics.map((m: any, i: number) => (
           <div key={i} className="flex justify-between items-center">
              <span className="text-[10px] text-slate-500">{m.label}</span>
              <span className="text-xs font-bold text-white">{m.value}</span>
           </div>
        ))}
      </div>
    </div>
  );
}

function StorageItem({ label, size, color }: any) {
  return (
    <div className="flex items-center justify-between">
       <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${color}`}></div>
          <span className="text-[10px] text-slate-400 font-bold uppercase">{label}</span>
       </div>
       <span className="text-xs font-black text-white">{size}</span>
    </div>
  );
}

const systemLogs = [
  { time: "00:45:21", event: "Connexion admin réussie", color: "text-green-400", ip: "192.168.1.10" },
  { time: "00:44:10", event: "Modification rôle admin", color: "text-blue-400", ip: "192.168.1.12" },
  { time: "00:42:05", event: "Suppression utilisateur", color: "text-red-400", ip: "192.168.1.15" },
  { time: "00:38:15", event: "Échec de connexion", color: "text-orange-400", ip: "192.168.1.20" },
  { time: "00:35:50", event: "Upload fichier sur S3", color: "text-indigo-400", ip: "192.168.1.18" },
];
