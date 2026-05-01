"use client";
import Sidebar from '../../components/Sidebar';
import {
  Shield, Locks, User, CheckCircle2, XCircle, RefreshCcw,
  Lock, Settings, Users, ShoppingBag, Eye, Zap,
  BarChart3, MessageSquare, CreditCard, Box, Globe, ChevronRight,
  Fingerprint, Cpu, Network, Activity, HardDrive, Terminal, Sparkles
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import api from '@/lib/axios';

const PERM_GROUPS = [
  {
    label: "Accès & Identités",
    icon: Users,
    color: "bg-blue-50 text-blue-600",
    accent: "bg-blue-600",
    glow: "shadow-blue-200/50",
    perms: [
      { id: 'users:view', label: "Visualisation Citoyenne", desc: "Consultation de la base de données globale." },
      { id: 'users:manage', label: "Modération Active", desc: "Suspension ou réactivation des comptes." },
      { id: 'admins:manage', label: "Gestion du Staff", desc: "Modification des privilèges des gardiens." }
    ]
  },
  {
    label: "Commerce & Logistique",
    icon: ShoppingBag,
    color: "bg-fuchsia-50 text-fuchsia-600",
    accent: "bg-fuchsia-600",
    glow: "shadow-fuchsia-200/50",
    perms: [
      { id: 'stores:manage', label: "Validation Boutique", desc: "Filtrage et approbation des marchands." },
      { id: 'products:manage', label: "Contrôle Catalogue", desc: "Retrait ou modification des produits." },
      { id: 'stock:view', label: "Audit des Réserves", desc: "Consultation des inventaires en temps réel." }
    ]
  },
  {
    label: "Gouvernance & Flux",
    icon: CreditCard,
    color: "bg-emerald-50 text-emerald-600",
    accent: "bg-emerald-600",
    glow: "shadow-emerald-200/50",
    perms: [
      { id: 'finance:view', label: "Flux Financiers", desc: "Consultation du grand livre transactionnel." },
      { id: 'support:manage', label: "Assistance Alpha", desc: "Résolution totale des litiges clients." }
    ]
  },
  {
    label: "Infrastructure Core",
    icon: Zap,
    color: "bg-orange-50 text-orange-600",
    accent: "bg-orange-600",
    glow: "shadow-orange-200/50",
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
      const res = await api.get('/users/admin/all');
      if (res.status === 200) {
        const data = Array.isArray(res.data) ? res.data : [];
        setAdmins(data.filter((u: any) => (u.role === 'admin' || u.role === 'super_admin') && !u.deletedAt));
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
      await api.patch(`/users/${adminId}`, { permissions: newPerms });
      setAdmins(prev => prev.map(a => a.id === adminId ? { ...a, permissions: newPerms } : a));
    } catch (err) { console.error(err); }
    finally { setTimeout(() => setUpdatingId(null), 500); }
  };

  const totalPermsCount = PERM_GROUPS.reduce((acc, g) => acc + g.perms.length, 0);

  return (
    <div className="flex bg-[#F1F5F9] min-h-screen text-slate-800 font-sans selection:bg-indigo-100 overflow-hidden relative">
      
      {/* Aurora Background Effects */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-200/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 -z-10 animate-pulse-slow"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-200/30 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 -z-10"></div>

      <Sidebar mode="super-admin" />
      
      <main className="flex-1 lg:ml-64 p-8 lg:p-16 relative z-10">

        {/* Header Elegant Light */}
        <header className="mb-16 relative">
          <div className="flex items-center gap-4 text-indigo-600 mb-6 animate-in slide-in-from-left duration-500">
            <div className="p-3 bg-white rounded-2xl shadow-[0_10px_30px_rgba(79,70,229,0.1)] border border-indigo-50">
              <Sparkles size={22} strokeWidth={2.5} className="text-indigo-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-400 italic">Citadel_Aurora_Protocol_v5.2</span>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
            <div className="animate-in slide-in-from-bottom duration-700">
              <h1 className="text-6xl lg:text-7xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
                Matrice des <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600">Accréditations</span>
              </h1>
              <p className="text-slate-500 text-lg mt-8 font-medium max-w-xl leading-relaxed italic border-l-4 border-indigo-500/20 pl-8 text-justify">
                Configurez les vecteurs d'autorité avec une clarté absolue. 
                L'écosystème Maverick, harmonisé et sécurisé.
              </p>
            </div>

            <div className="flex gap-4 animate-in fade-in zoom-in duration-1000 bg-white/80 p-6 rounded-[36px] border border-white shadow-[0_20px_50px_rgba(0,0,0,0.04)] backdrop-blur-xl">
               <div className="text-center px-8 border-r border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Unités</p>
                  <p className="text-3xl font-black text-slate-900 italic font-mono">{admins.length}</p>
               </div>
               <div className="text-center px-8">
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Capacités</p>
                  <p className="text-3xl font-black text-slate-900 italic font-mono">{totalPermsCount}</p>
               </div>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-[50vh]">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
            <span className="mt-8 text-[11px] font-black uppercase tracking-[0.5em] text-slate-400 italic animate-pulse">Initialisation du flux...</span>
          </div>
        ) : (
          <div className="space-y-16 animate-reveal">

            {/* Grille de Profils "Aurora Cards" */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {admins.map((admin, idx) => {
                const count = (admin.permissions || []).length;
                const pct = Math.round((count / totalPermsCount) * 100);
                const isSuper = admin.role === 'super_admin';

                return (
                  <div key={admin.id} 
                       className="group bg-white/70 backdrop-blur-2xl border border-white rounded-[48px] p-8 hover:-translate-y-2 transition-all duration-500 overflow-hidden relative shadow-[0_30px_60px_rgba(0,0,0,0.03)] hover:shadow-[0_40px_80px_rgba(79,70,229,0.12)]"
                       style={{ animationDelay: `${idx * 100}ms` }}>
                    
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-8">
                        <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center font-black text-2xl shadow-xl relative overflow-hidden transition-transform group-hover:rotate-6 ${
                          isSuper ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-indigo-200' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {admin.name?.charAt(0)}
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Niveau</div>
                          <div className={`text-2xl font-black italic leading-none ${isSuper ? 'text-indigo-600' : 'text-slate-400'}`}>{pct}%</div>
                        </div>
                      </div>

                      <h4 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter mb-4 flex items-center gap-2">
                        {admin.name}
                        {isSuper && <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>}
                      </h4>

                      <div className="space-y-3">
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-white shadow-inner">
                          <div className={`h-full transition-all duration-1000 rounded-full ${
                            isSuper ? 'bg-gradient-to-r from-indigo-500 to-violet-500 shadow-lg shadow-indigo-100' : 'bg-slate-300'
                          }`} style={{ width: `${pct}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest italic">
                          <span>{count} / {totalPermsCount} Noeuds</span>
                          <span className={isSuper ? 'text-indigo-500' : ''}>{admin.role?.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>

                    <Fingerprint size={140} className="absolute -right-8 -bottom-8 text-slate-50 group-hover:text-indigo-50 transition-all duration-1000 rotate-12" />
                  </div>
                );
              })}
            </div>

            {/* La Matrice "Crystal Access" */}
            <div className="bg-white/40 backdrop-blur-3xl border border-white rounded-[64px] p-2 shadow-[0_50px_100px_rgba(0,0,0,0.03)] overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar rounded-[60px]">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-white/60 border-b border-slate-100">
                      <th className="p-12 w-[480px] sticky left-0 bg-white/95 backdrop-blur-3xl z-30 border-r border-slate-50 shadow-[10px_0_30px_rgba(0,0,0,0.02)]">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] mb-4 italic">Unité_Système</span>
                          <div className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">Capacités</div>
                        </div>
                      </th>
                      {admins.map(admin => (
                        <th key={admin.id} className="p-12 text-center min-w-[220px] group">
                          <div className="flex flex-col items-center">
                            <div className="w-20 h-20 bg-white border border-slate-50 shadow-lg rounded-[28px] flex items-center justify-center mb-5 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-400 group-hover:shadow-[0_15px_40px_rgba(79,70,229,0.2)] transition-all transform group-hover:-translate-y-2 duration-500">
                              <User size={28} strokeWidth={2.5} />
                            </div>
                            <div className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] italic">{admin.name}</div>
                            <div className="w-1.5 h-10 bg-gradient-to-b from-indigo-50 to-transparent mt-4 rounded-full"></div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {PERM_GROUPS.map((group, gIdx) => (
                      <React.Fragment key={gIdx}>
                        {/* Group Row */}
                        <tr className="bg-slate-50/30">
                          <td colSpan={admins.length + 1} className="px-12 py-8 sticky left-0 z-10 bg-white/80 backdrop-blur-md">
                            <div className="flex items-center gap-6">
                              <div className={`p-3 rounded-2xl ${group.color} ${group.glow} shadow-xl border border-white`}>
                                <group.icon size={22} strokeWidth={2.5} />
                              </div>
                              <span className="text-[12px] font-black uppercase text-slate-400 tracking-[0.6em] italic font-mono">{group.label}</span>
                              <div className="flex-1 h-px bg-gradient-to-r from-slate-100 to-transparent ml-6"></div>
                            </div>
                          </td>
                        </tr>

                        {/* Permission Rows */}
                        {group.perms.map(p => (
                          <tr key={p.id} className="group/row hover:bg-white/90 transition-all duration-300">
                            <td className="p-12 sticky left-0 bg-white/60 backdrop-blur-3xl z-20 border-r border-slate-50 shadow-[10px_0_30px_rgba(0,0,0,0.01)]">
                              <div className="flex items-start gap-10">
                                <div className="mt-1 w-14 h-14 bg-slate-50 rounded-[22px] flex items-center justify-center shrink-0 border border-white shadow-inner group-hover/row:bg-indigo-50 group-hover/row:border-indigo-100 transition-all">
                                  <Cpu size={24} className="text-slate-300 group-hover/row:text-indigo-500 transition-colors" />
                                </div>
                                <div className="max-w-[340px]">
                                  <div className="font-black text-slate-800 text-xl uppercase mb-2 tracking-tighter italic group-hover/row:text-indigo-600 transition-colors">{p.label}</div>
                                  <div className="text-[14px] text-slate-400 italic leading-relaxed font-bold opacity-70 group-hover/row:opacity-100 transition-all">{p.desc}</div>
                                </div>
                              </div>
                            </td>
                            {admins.map(admin => {
                              const has = (admin.permissions || []).includes(p.id);
                              const isUpdating = updatingId === `${admin.id}-${p.id}`;
                              const isSuper = admin.role === 'super_admin';

                              return (
                                <td key={admin.id} className="p-12 text-center relative overflow-hidden group/cell border-l border-slate-50/50">
                                  <div className="flex justify-center relative z-10">
                                    <button
                                      onClick={() => !isSuper && togglePerm(admin.id, p.id)}
                                      disabled={isUpdating || isSuper}
                                      className={`w-32 h-14 rounded-[30px] transition-all duration-700 relative flex items-center px-2 border-2 ${
                                        isUpdating ? 'opacity-30 scale-95' : isSuper ? 'cursor-not-allowed opacity-80' : 'hover:scale-105 active:scale-95'
                                      } ${has
                                          ? 'bg-white border-indigo-500 shadow-[0_15px_40px_rgba(79,70,229,0.15)]'
                                          : 'bg-slate-50 border-slate-100 hover:border-slate-200 shadow-inner'
                                        }`}
                                    >
                                      <div className={`w-10 h-10 rounded-[22px] shadow-2xl flex items-center justify-center transition-all duration-700 cubic-bezier(0.68,-0.55,0.27,1.55) ${
                                        has ? 'translate-x-16 bg-indigo-600 text-white' : 'translate-x-0 bg-white text-slate-200'
                                      }`}>
                                        {isUpdating ? (
                                          <RefreshCcw size={18} className="animate-spin" />
                                        ) : has ? (
                                          <CheckCircle2 size={18} strokeWidth={3} />
                                        ) : (
                                          <XCircle size={18} strokeWidth={3} />
                                        )}
                                      </div>
                                      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-700 ${has ? 'opacity-100' : 'opacity-0'}`}>
                                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest pl-2">Actif</span>
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

            {/* Footer Legend Aurora */}
            <div className="flex flex-col lg:flex-row justify-between items-center bg-white/80 backdrop-blur-3xl border border-white p-10 rounded-[48px] shadow-[0_30px_60px_rgba(0,0,0,0.02)] gap-8">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-4 text-[11px] font-black uppercase text-emerald-600 tracking-[0.3em] italic bg-emerald-50 px-6 py-3 rounded-full border border-emerald-100">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  Sync_Réelle_Active
                </div>
                <div className="flex items-center gap-4 text-[11px] font-black uppercase text-indigo-600 tracking-[0.3em] italic bg-indigo-50 px-6 py-3 rounded-full border border-indigo-100">
                  <Activity size={16} className="animate-pulse" />
                  Flux_Sécurisé
                </div>
              </div>

              <div className="flex gap-12">
                <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.2em] italic text-slate-400">
                  <div className="w-10 h-5 rounded-full bg-indigo-500 shadow-lg shadow-indigo-100"></div> Accréditation
                </div>
                <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.2em] italic text-slate-400">
                  <div className="w-10 h-5 rounded-full bg-slate-100 border border-slate-200"></div> Accès Restreint
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 10px;
          width: 0px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
          margin: 40px;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 20px;
          border: 3px solid #F1F5F9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6366f1;
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1) translate(30%, -50%); }
          50% { opacity: 0.5; transform: scale(1.1) translate(35%, -55%); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s infinite ease-in-out;
        }

        @keyframes reveal {
            from { opacity: 0; transform: translateY(40px) scale(0.99); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-reveal {
            animation: reveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
