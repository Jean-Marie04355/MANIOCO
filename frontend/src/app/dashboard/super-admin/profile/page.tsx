"use client";
import Sidebar from '../../components/Sidebar';
import { 
    User, Mail, Phone, ShieldCheck, MapPin, 
    Calendar, Key, Smartphone, LogOut, Camera,
    ChevronRight, Lock, Bell, Eye, EyeOff,
    Zap, Award, Fingerprint, Activity
} from 'lucide-react';
import React, { useState } from 'react';

export default function ProfessionalProfilePage() {
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="flex bg-[#F4F7FE] min-h-screen text-slate-700 font-sans selection:bg-indigo-100">
      <Sidebar mode="super-admin" />
      <main className="flex-1 ml-72 p-8">
        
        {/* Header de la Page */}
        <header className="mb-10 flex justify-between items-end">
            <div>
                <div className="flex items-center gap-2 text-indigo-600 mb-1">
                    <Fingerprint size={16} className="text-indigo-600" />
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Identité_Alpha_V1</span>
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight italic">Mon <span className="text-indigo-600">Profil</span></h1>
            </div>
            <div className="flex gap-4">
                <button className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm italic">
                    Modifier les informations
                </button>
            </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-reveal">
            
            {/* Colonne Gauche : Identité & Avatar */}
            <div className="space-y-8">
                <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm flex flex-col items-center text-center">
                    <div className="relative mb-6">
                        <div className="w-32 h-32 rounded-[40px] bg-gradient-to-br from-indigo-500 to-violet-600 p-1">
                            <div className="w-full h-full rounded-[38px] bg-white flex items-center justify-center text-4xl font-black text-indigo-600 italic">
                                SA
                            </div>
                        </div>
                        <button className="absolute -bottom-2 -right-2 p-3 bg-white border border-slate-100 rounded-2xl shadow-xl text-indigo-600 hover:scale-110 transition-transform">
                            <Camera size={18} />
                        </button>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase mb-2">Super Admin</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Administrateur Maître</p>
                    
                    <div className="flex gap-2 mb-8">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100 italic">Niveau 10</span>
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100 italic">Vérifié</span>
                    </div>

                    <div className="w-full border-t border-slate-50 pt-8 space-y-4">
                        <ProfileInfoItem icon={Mail} label="Email Primaire" value="admin@afrigari.com" />
                        <ProfileInfoItem icon={MapPin} label="Localisation" value="Douala, Cameroun" />
                        <ProfileInfoItem icon={Calendar} label="Membre depuis" value="Septembre 2025" />
                    </div>
                </div>

                <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden group">
                     <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                           <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-indigo-400">
                               <Award size={18} />
                           </div>
                           <span className="text-[10px] font-black uppercase tracking-widest italic">Puissance d'Accès</span>
                        </div>
                        <div className="space-y-6">
                            <PowerBar label="Contrôles Système" percent={100} />
                            <PowerBar label="Gestion Utilisateurs" percent={100} />
                            <PowerBar label="Sécurité Archives" percent={95} />
                        </div>
                     </div>
                     <Zap size={180} className="absolute -right-10 -bottom-10 text-white opacity-10 group-hover:rotate-12 transition-transform duration-1000" />
                </div>
            </div>

            {/* Colonne Droite : Paramètres & Sécurité */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* Section Sécurité */}
                <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight italic mb-8 flex items-center gap-3">
                        <Lock size={20} className="text-indigo-600" /> Centre de Sécurité
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <SecurityToggle 
                                label="Double Authentification (2FA)" 
                                desc="Ajoutez une couche de sécurité par code mobile."
                                active={true}
                                icon={Smartphone}
                            />
                            <SecurityToggle 
                                label="Alertes de Connexion" 
                                desc="Recevez un email à chaque nouvel accès."
                                active={true}
                                icon={Bell}
                            />
                        </div>
                        
                        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 italic">Clé de Sécurité</p>
                             <div className="flex items-center justify-between bg-white border border-slate-100 p-4 rounded-2xl">
                                 <code className="text-xs font-mono font-bold text-slate-600 tracking-widest">
                                     {showPass ? "AFR-PRO-99-ALPHA-X" : "•••••••••••••••••"}
                                 </code>
                                 <button onClick={() => setShowPass(!showPass)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                                     {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                 </button>
                             </div>
                             <p className="mt-4 text-[9px] font-medium text-slate-400 leading-relaxed italic">Cette clé est unique à votre instance Super Admin. Ne la partagez jamais.</p>
                        </div>
                    </div>
                </div>

                {/* Journaux d'Accès Récents */}
                <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight italic mb-8 flex items-center gap-3">
                        <Activity size={20} className="text-indigo-600" /> Historique de Session Personnelle
                    </h3>
                    
                    <div className="space-y-6">
                         <AccessLogItem device="MacBook Pro - Chrome" ip="192.168.1.44" date="Aujourd'hui, 21:30" status="Session Actuelle" />
                         <AccessLogItem device="iPhone 15 - Safari" ip="102.16.55.12" date="Hier, 08:12" />
                         <AccessLogItem device="Linux Terminal - CLI" ip="Localhost" date="21 Avr, 14:00" />
                    </div>
                </div>

                {/* Zone Critique */}
                <div className="bg-rose-50 border border-rose-100 rounded-[32px] p-8 flex items-center justify-between group">
                    <div>
                        <h4 className="text-rose-600 font-black uppercase text-sm italic tracking-widest mb-1 italic">Zone Sensible</h4>
                        <p className="text-rose-400 text-[10px] font-semibold italic uppercase">Réinitialisation des accès ou déconnexion globale.</p>
                    </div>
                    <button className="px-8 py-3 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-rose-700 shadow-xl shadow-rose-100 transition-all">
                        <LogOut size={16} />
                        Déconnexion Sécurisée
                    </button>
                </div>

            </div>

        </div>

      </main>

      <style jsx global>{`
        @keyframes reveal {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-reveal { animation: reveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
}

function ProfileInfoItem({ icon: Icon, label, value }: any) {
    return (
        <div className="flex items-center gap-4 text-left group">
            <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <Icon size={18} />
            </div>
            <div>
                <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mb-0.5 italic">{label}</p>
                <p className="text-xs font-black text-slate-700 italic">{value}</p>
            </div>
        </div>
    );
}

function PowerBar({ label, percent }: any) {
    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest italic">{label}</span>
                <span className="text-[9px] font-bold text-indigo-400 uppercase italic">{percent}%</span>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                    style={{ width: `${percent}%` }}
                ></div>
            </div>
        </div>
    );
}

function SecurityToggle({ label, desc, active, icon: Icon }: any) {
    return (
        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-indigo-100 transition-all">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                    <Icon size={18} />
                </div>
                <div>
                    <h5 className="text-[11px] font-bold text-slate-800 uppercase italic tracking-tighter">{label}</h5>
                    <p className="text-[9px] text-slate-400 italic leading-none">{desc}</p>
                </div>
            </div>
            <div className="w-10 h-5 bg-emerald-500 rounded-full p-1 flex justify-end items-center relative overflow-hidden">
                 <div className="w-3 h-3 bg-white rounded-full shadow-sm relative z-10"></div>
                 <div className="absolute inset-0 bg-emerald-400/20 animate-pulse"></div>
            </div>
        </div>
    );
}

function AccessLogItem({ device, ip, date, status }: any) {
    return (
        <div className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0 group">
            <div className="flex items-center gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-indigo-600 transition-colors"></div>
                <div>
                    <h5 className="text-xs font-black text-slate-800 italic uppercase tracking-tighter">{device}</h5>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">{ip}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-xs font-black text-slate-800 italic uppercase tracking-tighter">{date}</p>
                {status && <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest italic animate-pulse">{status}</span>}
            </div>
        </div>
    );
}
