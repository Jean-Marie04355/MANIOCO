"use client";
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';
import { 
  Users, Search, Filter, MoreVertical, Download, Bell, 
  ShieldAlert, Activity, UserCheck, UserX, Globe, Clock,
  AlertTriangle, Terminal, Eye, MoreHorizontal, FileText, CheckCircle2, XCircle, Loader2
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error("Non autorisé, token absent.");
      
      const res = await fetch('http://localhost:3000/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) throw new Error('Impossible de charger les utilisateurs');
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Statistiques dynamiques
  const stats = {
    total: users.length,
    clients: users.filter(u => u.role === 'client').length,
    vendeurs: users.filter(u => u.role === 'vendeur').length,
    livreurs: users.filter(u => u.role === 'livreur').length,
  };

  return (
    <div className="flex bg-[#0b0e14] min-h-screen text-slate-300 font-sans">
      <Sidebar mode="super-admin" />
      
      <main className="flex-1 ml-64 p-8 h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
           <div>
              <h1 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
                 <Users className="text-indigo-400" size={32} /> 
                 Citadel Users Control
              </h1>
              <p className="text-slate-500 font-bold text-sm mt-1 uppercase tracking-widest">Gestion centrale des identités et de la sécurité</p>
           </div>
           
           <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors">
                 <Download size={14} /> Exporter (CSV)
              </button>
              <button className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all">
                 <Bell size={14} /> Notifier Tous
              </button>
           </div>
        </div>

        {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 font-bold flex items-center justify-between">
                {error}
                <button onClick={fetchUsers} className="underline text-xs hover:text-red-300">Réessayer</button>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
           <StatCard title="Total Utilisateurs" value={isLoading ? "..." : stats.total} icon={Users} color="indigo" />
           <StatCard title="Nouveaux Inscrits" value="+142" subtitle="Estimation" icon={UserCheck} color="green" />
           <StatCard title="Actifs (24h)" value="Estimation" icon={Activity} color="orange" />
           
           <div className="bg-[#151921] p-5 rounded-3xl border border-slate-800 flex flex-col justify-center">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Clients</span>
                 <span className="text-xs font-black text-blue-400">{isLoading ? "-" : stats.clients}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vendeurs</span>
                 <span className="text-xs font-black text-orange-400">{isLoading ? "-" : stats.vendeurs}</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Livreurs</span>
                 <span className="text-xs font-black text-emerald-400">{isLoading ? "-" : stats.livreurs}</span>
              </div>
           </div>

           <div className="bg-indigo-500/10 border border-indigo-500/20 p-5 rounded-3xl relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full"></div>
              <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-1 flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div> En ligne (WSS)
              </h3>
              <p className="text-4xl font-black text-white">{isLoading ? "-" : "???"}</p>
           </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
           <div className="xl:col-span-3 space-y-6">
              
              <div className="flex bg-[#151921] p-2 rounded-2xl border border-slate-800 gap-2">
                 <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input type="text" placeholder="Rechercher par nom, email, ID..." className="w-full bg-transparent text-sm text-white px-12 py-3 outline-none" />
                 </div>
                 <div className="w-px bg-slate-800 my-2"></div>
                 <button className="flex items-center gap-2 text-slate-400 hover:text-white px-6 py-2 text-sm font-bold transition-colors">
                    <Filter size={16} /> Filtres
                 </button>
              </div>

              <div className="bg-[#151921] rounded-3xl border border-slate-800 overflow-hidden relative">
                 {isLoading && (
                    <div className="absolute inset-0 bg-[#151921]/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                       <Loader2 className="animate-spin text-indigo-400 mb-4" size={32} />
                       <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Chargement...</span>
                    </div>
                 )}
                 <table className="w-full text-left">
                    <thead className="bg-slate-900/50">
                       <tr className="text-[10px] uppercase tracking-widest text-slate-500">
                          <th className="p-5 font-bold">Utilisateur & Contact</th>
                          <th className="p-5 font-bold">Rôle</th>
                          <th className="p-5 font-bold">Statut</th>
                          <th className="p-5 font-bold">Chronologie</th>
                          <th className="p-5 font-bold text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                       {!isLoading && users.map((user: any) => (
                           <UserRow 
                              key={user.id}
                              name={user.name} 
                              email={user.email} 
                              role={formatRole(user.role)} 
                              status={user.deletedAt ? "Inactif" : "Actif"} 
                              joined="N/A" 
                              lastLogin="Inconnu" 
                              avatar={user.name ? user.name.charAt(0).toUpperCase() : "?"}
                           />
                       ))}
                       {!isLoading && users.length === 0 && (
                           <tr>
                               <td colSpan={5} className="p-8 text-center text-slate-500 font-bold uppercase text-[10px]">
                                   Aucun utilisateur trouvé
                               </td>
                           </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>

           <div className="space-y-8">
              
              <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-3xl relative overflow-hidden">
                 <ShieldAlert className="absolute -right-4 -top-4 text-red-500/10 w-32 h-32" />
                 <h3 className="font-bold text-red-400 text-sm uppercase tracking-widest flex items-center gap-2 mb-6">
                    <AlertTriangle size={16} /> Security Watch
                 </h3>
                 <div className="space-y-4 relative z-10">
                    <SecurityAlert text="Tentatives échouées (ID: 8092)" time="Il y a 2 min" critical={true} />
                    <SecurityAlert text="Connexion IP suspecte (Russie)" time="Il y a 15 min" critical={false} />
                    <SecurityAlert text="Changement mdp refusé" time="Il y a 1h" critical={false} />
                 </div>
                 <button className="w-full mt-6 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest py-3 rounded-xl transition-colors">
                    Examiner les logs
                 </button>
              </div>

              <div className="bg-slate-800/20 border border-slate-700/50 p-6 rounded-3xl">
                 <h3 className="font-bold text-slate-300 text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Eye size={16} /> Inspection Rapide
                 </h3>
                 <p className="text-xs text-slate-500 mb-4 italic">Sélectionnez un utilisateur pour voir ses détails locaux et fichiers S3 ici.</p>
                 <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 cursor-not-allowed opacity-50 blur-[1px]">
                    <div className="w-12 h-12 bg-indigo-500 rounded-full mb-3"></div>
                    <div className="h-4 w-3/4 bg-slate-700 rounded mb-2"></div>
                    <div className="h-3 w-1/2 bg-slate-800 rounded mb-6"></div>
                    <div className="h-10 w-full bg-slate-800 rounded"></div>
                 </div>
              </div>

           </div>
        </div>

      </main>
    </div>
  );
}

// --- HELPERS & SOUS COMPOSANTS ---

function formatRole(role: string) {
    if (role === 'super_admin') return 'Super Admin';
    if (role === 'admin') return 'Admin';
    if (role === 'vendeur') return 'Vendeur';
    if (role === 'livreur') return 'Livreur';
    return 'Client';
}

function StatCard({ title, value, subtitle, icon: Icon, color }: any) {
  const colors: any = {
    indigo: 'text-indigo-400 bg-indigo-400/10',
    green: 'text-emerald-400 bg-emerald-400/10',
    orange: 'text-orange-400 bg-orange-400/10',
  };
  return (
    <div className="bg-[#151921] p-5 rounded-3xl border border-slate-800 flex items-center gap-4">
      <div className={`p-4 rounded-2xl ${colors[color]}`}><Icon size={24} /></div>
      <div>
         <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{title}</p>
         <h4 className="text-2xl font-black text-white flex items-baseline gap-2">
            {value} {subtitle && <span className="text-[10px] font-bold text-emerald-500">{subtitle}</span>}
         </h4>
      </div>
    </div>
  );
}

function UserRow({ name, email, role, status, joined, lastLogin, avatar }: any) {
  const roleColors: any = {
    'Super Admin': 'text-purple-400 bg-purple-400/10 border border-purple-400/20',
    'Admin': 'text-purple-400 bg-purple-400/10 border border-purple-400/20',
    'Vendeur': 'text-orange-400 bg-orange-400/10 border border-orange-400/20',
    'Client': 'text-blue-400 bg-blue-400/10 border border-blue-400/20',
    'Livreur': 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20',
  };
  
  const statusStyles: any = {
    Actif: { text: "text-emerald-400", bg: "bg-emerald-400/20" },
    Inactif: { text: "text-slate-400", bg: "bg-slate-400/20" },
    Suspendu: { text: "text-orange-400", bg: "bg-orange-400/20" },
    Banni: { text: "text-red-500", bg: "bg-red-500/20" },
  };

  const st = statusStyles[status] || statusStyles['Inactif'];

  return (
    <tr className="hover:bg-white/5 transition-colors group">
      <td className="p-5">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-black text-slate-400 shrink-0">
               {avatar}
            </div>
            <div>
               <p className="font-bold text-slate-200">{name}</p>
               <p className="text-[10px] text-slate-500 flex items-center gap-1"><XCircle size={10} className="opacity-0 hidden" /> {email}</p>
            </div>
         </div>
      </td>
      <td className="p-5">
         <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${roleColors[role] || 'text-slate-400'}`}>
            {role}
         </span>
      </td>
      <td className="p-5">
         <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${st.bg} relative flex items-center justify-center`}>
               <div className={`w-1 h-1 rounded-full bg-current ${st.text}`}></div>
            </div>
            <span className={`text-xs font-bold ${st.text}`}>{status}</span>
         </div>
      </td>
      <td className="p-5">
         <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-300 font-medium">{joined}</span>
            <span className="text-[10px] text-slate-500 flex items-center gap-1"><Clock size={10} /> {lastLogin}</span>
         </div>
      </td>
      <td className="p-5 text-right">
         <div className="flex items-center justify-end gap-2">
            {role === 'Vendeur' && (
               <a href={`/dashboard/seller?preview=${email}`} className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors flex items-center gap-1 mr-2">
                  <Globe size={12} /> Vue Vendeur
               </a>
            )}
            {status === 'Banni' ? (
               <button className="text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center gap-1">
                  <CheckCircle2 size={14} /> Débannir
               </button>
            ) : status === 'Suspendu' ? (
               <button className="text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center gap-1">
                  <CheckCircle2 size={14} /> Réactiver
               </button>
            ) : (
               <>
                  <button className="text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors" title="Suspendre">
                     Suspendre
                  </button>
                  <button className="text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors" title="Bannir">
                     Bannir
                  </button>
               </>
            )}
            <button className="p-2 text-slate-500 hover:text-slate-300 transition-colors bg-slate-800 rounded-lg">
               <MoreHorizontal size={14} />
            </button>
         </div>
      </td>
    </tr>
  );
}

function SecurityAlert({ text, time, critical }: any) {
  return (
    <div className="flex gap-3 items-start">
       <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${critical ? 'bg-red-500 animate-ping' : 'bg-red-400/50'}`}></div>
       <div>
          <p className={`text-xs font-bold ${critical ? 'text-red-400' : 'text-red-300/70'}`}>{text}</p>
          <p className="text-[10px] text-red-500/50">{time}</p>
       </div>
    </div>
  );
}
