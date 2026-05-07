"use client";
import Sidebar from '../../components/Sidebar';
import {
    Mail, Calendar, Smartphone, LogOut, Camera,
    Lock, Bell, Eye, EyeOff,
    Zap, Award, Fingerprint, Activity, Trash2
} from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';

export default function AdminProfilePage() {
    const [showPass, setShowPass] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', email: '' });
    const [recentLogs, setRecentLogs] = useState<any[]>([]);
    const { user, isLoading, logout, fetchUser } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        if (!isLoading && !user) {
            router.push('/auth/login');
        } else if (user) {
            setEditForm({ name: user.name || '', email: user.email || '' });
            api.get('/audit-logs').then(res => {
                const logs = res.data.filter((l: any) => l.userId === user.id);
                // Sort by date desc
                logs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setRecentLogs(logs.slice(0, 3));
            }).catch(err => console.error("Could not fetch user logs"));
        }
    }, [isLoading, user, router]);

    if (isLoading || !user) {
        return (
            <div className="flex bg-[#F8FAFC] min-h-screen items-center justify-center">
                <Loader2 className="animate-spin text-emerald-500 mb-4" size={40} />
            </div>
        );
    }

    const getInitials = (name: string) => {
        if (!name) return 'AD';
        const parts = name.split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.slice(0, 2).toUpperCase();
    };

    const formattedRole = user.role.replace('_', ' ').toUpperCase();

    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            // Upload to S3
            const uploadRes = await api.post('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const photoUrl = uploadRes.data.path;

            // Update user profile
            await api.patch(`/users/${user.id}`, { profilePhoto: photoUrl });
            
            // Refresh context
            if (fetchUser) await fetchUser();
        } catch (error) {
            console.error("Erreur lors de l'upload", error);
            alert("Erreur lors de l'envoi de la photo.");
        } finally {
            setIsUploading(false);
        }
    };

    const handlePhotoDelete = async () => {
        if (!user || isUploading) return;
        setIsUploading(true);
        try {
            await api.patch(`/users/${user.id}`, { profilePhoto: null });
            if (fetchUser) await fetchUser();
        } catch (error) {
            console.error("Erreur de suppression");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveProfile = async () => {
        try {
            await api.patch(`/users/${user.id}`, {
                name: editForm.name,
                email: editForm.email
            });
            setIsEditing(false);
            if (fetchUser) await fetchUser();
        } catch (error) {
            console.error("Erreur de sauvegarde");
            alert("Erreur lors de la sauvegarde du profil.");
        }
    };

    return (
        <div className="flex bg-[#F8FAFC] min-h-screen text-slate-700 font-sans selection:bg-emerald-100">
            <Sidebar mode="admin" />
            <main className="flex-1 lg:ml-64 p-8">

                {/* Header de la Page */}
                <header className="mb-10 flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-2 text-emerald-500 mb-1">
                            <Fingerprint size={16} className="text-emerald-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Identité_Admin_V1</span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight italic">Mon <span className="text-emerald-500">Profil</span></h1>
                    </div>
                    <div className="flex gap-4">
                        {isEditing ? (
                            <>
                                <button onClick={() => setIsEditing(false)} className="px-6 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-all shadow-sm italic">
                                    Annuler
                                </button>
                                <button onClick={handleSaveProfile} className="px-6 py-2.5 bg-emerald-500 border border-emerald-600 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white hover:bg-emerald-600 transition-all shadow-sm italic focus:ring-4 focus:ring-emerald-100">
                                    Enregistrer
                                </button>
                            </>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:border-emerald-500 hover:text-emerald-500 transition-all shadow-sm italic">
                                Modifier les informations
                            </button>
                        )}
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-reveal">

                    {/* Colonne Gauche : Identité & Avatar */}
                    <div className="space-y-8">
                        <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm flex flex-col items-center text-center">
                            <div className="relative mb-6">
                                <div className="w-32 h-32 rounded-[40px] bg-gradient-to-br from-emerald-400 to-teal-500 p-1">
                                    {user.profilePhoto ? (
                                        <img src={user.profilePhoto} alt={user.name} className="w-full h-full rounded-[38px] object-cover" />
                                    ) : (
                                        <div className="w-full h-full rounded-[38px] bg-white flex items-center justify-center text-4xl font-black text-emerald-500 italic">
                                            {getInitials(user.name)}
                                        </div>
                                    )}
                                </div>
                                {user.profilePhoto && (
                                    <button 
                                        onClick={handlePhotoDelete}
                                        disabled={isUploading}
                                        className="absolute -top-2 -right-2 p-2.5 bg-white border border-rose-100 rounded-xl shadow-xl text-rose-500 hover:scale-110 hover:bg-rose-50 transition-transform z-10"
                                        title="Supprimer la photo"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                                <label className="absolute -bottom-2 -right-2 p-3 bg-white border border-slate-100 rounded-2xl shadow-xl text-emerald-500 hover:scale-110 transition-transform cursor-pointer z-10">
                                    {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={isUploading} />
                                </label>
                            </div>
                            
                            {isEditing ? (
                                <div className="w-full space-y-3 mb-6 px-4">
                                    <input 
                                        type="text" 
                                        value={editForm.name} 
                                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                                        className="w-full text-center text-lg font-black text-slate-900 italic border-b-2 border-emerald-200 focus:border-emerald-500 outline-none bg-transparent pb-1"
                                        placeholder="Votre Nom"
                                    />
                                    <input 
                                        type="email" 
                                        value={editForm.email} 
                                        onChange={e => setEditForm({...editForm, email: e.target.value})}
                                        className="w-full text-center text-xs font-bold text-slate-500 border-b-2 border-emerald-200 focus:border-emerald-500 outline-none bg-transparent pb-1"
                                        placeholder="Votre Email"
                                    />
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase mb-2">{user.name || 'Administrateur'}</h2>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">{formattedRole}</p>
                                </>
                            )}

                            <div className="flex gap-2 mb-8">
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100 italic">Plateforme</span>
                                <span className="px-3 py-1 bg-teal-50 text-teal-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-teal-100 italic">Vérifié</span>
                            </div>

                            <div className="w-full border-t border-slate-50 pt-8 space-y-4">
                                <ProfileInfoItem icon={Mail} label="Email Primaire" value={user.email} />
                                <ProfileInfoItem icon={Calendar} label="Création de compte" value={(user as any).createdAt ? new Date((user as any).createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : 'Inconnu'} />
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden group">
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-emerald-400">
                                        <Award size={18} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest italic">Puissance d'Accès</span>
                                </div>
                                <div className="space-y-6">
                                    <PowerBar label="Modération" percent={100} />
                                    <PowerBar label="Gestion Utilisateurs" percent={85} />
                                    <PowerBar label="Finances" percent={90} />
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
                                <Lock size={20} className="text-emerald-500" /> Centre de Sécurité
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
                                        <code className="text-xs font-mono font-bold text-slate-600 tracking-widest break-all">
                                            {showPass ? user.id : "•••••••••••••••••"}
                                        </code>
                                        <button onClick={() => setShowPass(!showPass)} className="text-slate-400 hover:text-emerald-500 transition-colors">
                                            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    <p className="mt-4 text-[9px] font-medium text-slate-400 leading-relaxed italic">Cette clé est unique à votre session administrateur. Ne la partagez jamais.</p>
                                </div>
                            </div>
                        </div>

                        {/* Journaux d'Accès Récents */}
                        <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight italic mb-8 flex items-center gap-3">
                                <Activity size={20} className="text-emerald-500" /> Historique de Session Personnelle
                            </h3>

                            <div className="space-y-6">
                                {recentLogs.length > 0 ? (
                                    recentLogs.map((log: any, idx: number) => (
                                        <AccessLogItem 
                                            key={log.id || idx}
                                            device={log.action} 
                                            ip={log.ipAddress || "Localhost"} 
                                            date={new Date(log.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })} 
                                            status={idx === 0 ? "Récent" : undefined} 
                                        />
                                    ))
                                ) : (
                                    <p className="text-xs text-slate-400 font-bold italic">Aucune activité récente détectée sur votre profil.</p>
                                )}
                            </div>
                        </div>

                        {/* Zone Critique */}
                        <div className="bg-rose-50 border border-rose-100 rounded-[32px] p-8 flex items-center justify-between group">
                            <div>
                                <h4 className="text-rose-600 font-black uppercase text-sm italic tracking-widest mb-1 italic">Zone Sensible</h4>
                                <p className="text-rose-400 text-[10px] font-semibold italic uppercase">Déconnexion sécurisée de votre session.</p>
                            </div>
                            <button
                                onClick={() => logout()}
                                className="px-8 py-3 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-rose-700 shadow-xl shadow-rose-100 transition-all"
                            >
                                <LogOut size={16} />
                                Déconnexion
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
            <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center border border-slate-100 group-hover:bg-emerald-500 group-hover:text-white transition-all">
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
                <span className="text-[9px] font-bold text-emerald-400 uppercase italic">{percent}%</span>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                    style={{ width: `${percent}%` }}
                ></div>
            </div>
        </div>
    );
}

function SecurityToggle({ label, desc, active, icon: Icon }: any) {
    return (
        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-emerald-100 transition-all">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
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
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-emerald-500 transition-colors"></div>
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
