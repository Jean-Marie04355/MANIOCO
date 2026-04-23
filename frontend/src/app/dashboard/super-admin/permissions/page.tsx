"use client";
import Sidebar from '../../components/Sidebar';
import { 
  Shield, Info, User, CheckCircle2, XCircle, RefreshCcw, 
  Lock, Settings, Users, ShoppingBag, Eye, Zap,
  BarChart3, MessageSquare, CreditCard, Box, Globe, ChevronRight,
  Fingerprint, Cpu, Network
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

const PERM_GROUPS = [
  { 
    label: "Accès & Identités", 
    icon: Users,
    glow: "shadow-blue-500/10",
    perms: [
      { id: 'users:view', label: "Visualisation Citoyenne", desc: "Consultation de la base de données globale." },
      { id: 'users:manage', label: "Modération Active", desc: "Suspension ou réactivation des comptes." },
      { id: 'admins:manage', label: "Gestion du Staff", desc: "Modification des privilèges des gardiens." }
    ]
  },
  { 
    label: "Commerce & Logistique", 
    icon: ShoppingBag,
    glow: "shadow-purple-500/10",
    perms: [
      { id: 'stores:manage', label: "Validation Boutique", desc: "Filtrage et approbation des marchands." },
      { id: 'products:manage', label: "Contrôle Catalogue", desc: "Retrait ou modification des produits." },
      { id: 'stock:view', label: "Audit des Réserves", desc: "Consultation des inventaires en temps réel." }
    ]
  },
  { 
    label: "Gouvernance & Flux", 
    icon: CreditCard,
    glow: "shadow-emerald-500/10",
    perms: [
      { id: 'finance:view', label: "Flux Financiers", desc: "Consultation du grand livre transactionnel." },
      { id: 'support:manage', label: "Assistance Alpha", desc: "Résolution totale des litiges clients." }
    ]
  },
  {
    label: "Infrastructure Core",
    icon: Zap,
    glow: "shadow-orange-500/10",
    perms: [
      { id: 'settings:manage', label: "Mode Maintenance", desc: "Activation du protocole d'arrêt temporaire." },
      { id: 'logs:view', label: "Audit des Flux", desc: "Accès à l'historique complet des actions système." }
    ]
  }
];

export default function LuxuryPermissionsPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('http://localhost:3000/users/admin/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.filter((u: any) => u.role === 'admin' && !u.deletedAt));
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const togglePerm = async (adminId: string, permId: string) => {
    const admin = admins.find(a => a.id === adminId);
    if (!admin) return;
    setUpdatingId(`${adminId}-${permId}`);
    let newPerms = [...(admin.permissions || [])];
    newPerms = newPerms.includes(permId) ? newPerms.filter(p => p !== permId) : [...newPerms, permId];

    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`http://localhost:3000/users/${adminId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ permissions: newPerms })
      });
      setAdmins(prev => prev.map(a => a.id === adminId ? { ...a, permissions: newPerms } : a));
    } catch (err) { console.error(err); }
    finally { setTimeout(() => setUpdatingId(null), 500); }
  };

  const totalPermsCount = PERM_GROUPS.reduce((acc, g) => acc + g.perms.length, 0);

  return (
    <div className="flex bg-[#F8FAFF] min-h-screen text-slate-800 font-sans selection:bg-indigo-100">
      <Sidebar mode="super-admin" />
      <main className="flex-1 ml-80 p-16">
        
        {/* Header Premium High-Tech */}
        <header className="mb-20 relative">
          <div className="absolute -left-12 top-0 w-2 h-40 bg-gradient-to-b from-indigo-600 to-transparent rounded-full opacity-50 blur-[1px]"></div>
          <div className="flex items-center gap-4 text-indigo-600 mb-6">
            <div className="p-3 bg-white rounded-2xl shadow-[0_10px_30px_rgba(79,70,229,0.1)] border border-indigo-50"><Lock size={22} strokeWidth={2.5} /></div>
            <span className="text-[11px] font-black uppercase tracking-[0.6em] opacity-40 italic">Security_Protocol_v4.5</span>
          </div>
          <h1 className="text-7xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
            Matrice des <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 text-6xl">Accréditations</span>
          </h1>
          <p className="text-slate-400 text-xl mt-10 font-medium max-w-xl leading-relaxed italic border-l-2 border-indigo-50 pl-10">
            Déléguez la puissance de l'écosystème Citadel avec une précision chirurgicale. 
            Contrôlez les flux d'influence au sein de l'unité.
          </p>
        </header>

        {loading ? (
             <div className="flex flex-col items-center justify-center h-[50vh] animate-pulse">
                <div className="w-20 h-20 border-8 border-indigo-50 border-t-indigo-600 rounded-full animate-spin shadow-2xl"></div>
                <span className="mt-10 text-[12px] font-black uppercase tracking-[0.4em] text-indigo-400">Scan des niveaux de privilège...</span>
            </div>
        ) : (
          <div className="space-y-20 animate-reveal">
            
            {/* Grille de Profils "Quantum Cards" */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                {admins.map((admin) => {
                    const count = (admin.permissions || []).length;
                    const pct = Math.round((count / totalPermsCount) * 100);
                    return (
                        <div key={admin.id} className="group bg-white/70 backdrop-blur-2xl border border-white rounded-[50px] p-10 shadow-[0_40px_100px_rgba(79,70,229,0.06)] hover:shadow-[0_50px_100px_rgba(79,70,229,0.15)] hover:-translate-y-3 transition-all duration-700 overflow-hidden relative">
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-[24px] flex items-center justify-center font-black text-2xl shadow-2xl shadow-indigo-200 group-hover:rotate-6 transition-transform">
                                        {admin.name?.charAt(0)}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1 italic">Droit_Accès</div>
                                        <div className="text-2xl font-black text-indigo-600 italic leading-none">{pct}%</div>
                                    </div>
                                </div>
                                <h4 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter mb-4">{admin.name}</h4>
                                <div className="flex flex-col gap-2">
                                    <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                        <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 shadow-[0_0_10px_rgba(79,70,229,0.5)] transition-all duration-1000" style={{ width: `${pct}%` }}></div>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">{count} / {totalPermsCount} Capacités</span>
                                </div>
                            </div>
                            <Shield size={140} className="absolute -right-8 -bottom-8 text-indigo-50 opacity-20 group-hover:opacity-40 group-hover:rotate-12 transition-all duration-1000" />
                        </div>
                    );
                })}
            </div>

            {/* La Matrice "Holographic Matrix" */}
            <div className="bg-white/40 backdrop-blur-3xl border border-white rounded-[70px] p-3 shadow-[0_60px_150px_rgba(79,70,229,0.1)] overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-white/60 backdrop-blur-xl border-b border-slate-100">
                      <th className="p-14 w-[500px] sticky left-0 bg-white/90 backdrop-blur-2xl z-30 border-r border-slate-50 shadow-[10px_0_30px_rgba(0,0,0,0.02)]">
                        <div className="flex flex-col">
                            <span className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.5em] mb-3 italic">Command_Terminal</span>
                            <div className="text-4xl font-black text-slate-900 tracking-tight italic uppercase leading-none">Capacités</div>
                        </div>
                      </th>
                      {admins.map(admin => (
                        <th key={admin.id} className="p-14 text-center min-w-[250px] group">
                          <div className="flex flex-col items-center">
                            <div className="w-20 h-20 bg-white border border-slate-50 shadow-2xl rounded-[28px] flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:rotate-6 duration-500">
                              <Fingerprint size={32} strokeWidth={2.5} />
                            </div>
                            <div className="text-[12px] font-black text-slate-900 uppercase tracking-[0.3em] italic">{admin.name}</div>
                            <div className="w-1.5 h-12 bg-gradient-to-b from-indigo-50 to-transparent mt-4 rounded-full"></div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50/50">
                    {PERM_GROUPS.map((group, gIdx) => (
                      <React.Fragment key={gIdx}>
                        <tr className="bg-slate-50/40">
                          <td colSpan={admins.length + 1} className="px-14 py-8 sticky left-0 z-10 bg-slate-50/80 backdrop-blur-md">
                            <div className="flex items-center gap-6">
                                <div className={`p-3 bg-white rounded-2xl shadow-xl ${group.glow}`}>
                                    <group.icon size={22} className="text-indigo-600" />
                                </div>
                                <span className="text-sm font-black uppercase text-indigo-400 tracking-[0.6em] font-mono italic">{group.label}</span>
                            </div>
                          </td>
                        </tr>
                        {group.perms.map(p => (
                          <tr key={p.id} className="group hover:bg-white/90 transition-all duration-500">
                            <td className="p-14 sticky left-0 bg-white/40 backdrop-blur-2xl z-20 border-r border-slate-50 shadow-[10px_0_30px_rgba(0,0,0,0.01)]">
                              <div className="flex items-start gap-10">
                                 <div className="mt-1 w-14 h-14 bg-slate-50 rounded-[22px] flex items-center justify-center group-hover:bg-indigo-50/50 transition-all border border-transparent group-hover:border-indigo-100">
                                    <Cpu size={24} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                                 </div>
                                 <div className="max-w-[340px]">
                                    <div className="font-black text-slate-800 text-xl uppercase mb-2 tracking-tighter italic group-hover:text-indigo-600 transition-colors">{p.label}</div>
                                    <div className="text-[13px] text-slate-400 italic leading-relaxed font-bold opacity-80">{p.desc}</div>
                                 </div>
                              </div>
                            </td>
                            {admins.map(admin => {
                              const has = (admin.permissions || []).includes(p.id);
                              const isUpdating = updatingId === `${admin.id}-${p.id}`;
                              return (
                                <td key={admin.id} className="p-14 text-center border-l border-slate-50/30">
                                  <div className="flex justify-center">
                                      <button 
                                        onClick={() => togglePerm(admin.id, p.id)}
                                        disabled={isUpdating}
                                        className={`w-28 h-14 rounded-[30px] transition-all duration-700 relative flex items-center px-2 shadow-inner border-2 ${
                                            isUpdating ? 'opacity-30 scale-90' : 'hover:scale-110'
                                        } ${
                                            has 
                                            ? 'bg-indigo-600 border-indigo-400 shadow-[0_0_40px_rgba(79,70,229,0.3)]' 
                                            : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                                        }`}
                                      >
                                        <div className={`w-10 h-10 rounded-[22px] bg-white shadow-2xl flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.68,-0.55,0.27,1.55)] ${
                                            has ? 'translate-x-12 rotate-180' : 'translate-x-0'
                                        }`}>
                                            {isUpdating ? (
                                                <RefreshCcw size={18} className="animate-spin text-indigo-600" />
                                            ) : has ? (
                                                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_#6366f1]"></div>
                                            ) : (
                                                <Network size={18} className="text-slate-200" />
                                            )}
                                        </div>
                                      </button>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Légende de Précision */}
            <div className="flex justify-between items-center bg-white/50 backdrop-blur-xl border border-white p-8 rounded-[40px] shadow-2xl shadow-indigo-100/20">
                <div className="flex items-center gap-4 text-[11px] font-black uppercase text-slate-400 tracking-widest italic">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></div>
                    Sychronisation_Temps_Réel_Active
                </div>
                <div className="flex gap-16">
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] italic">
                        <div className="w-8 h-4 bg-indigo-600 rounded-full shadow-lg shadow-indigo-100"></div> Accrédité
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] italic">
                        <div className="w-8 h-4 bg-slate-100 rounded-full border border-slate-200"></div> Restreint
                    </div>
                </div>
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 12px;
          width: 0px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.1);
          margin: 40px;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 20px;
          border: 4px solid white;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4f46e5;
        }
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
