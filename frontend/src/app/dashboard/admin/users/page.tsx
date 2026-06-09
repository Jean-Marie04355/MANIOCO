"use client";
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';
import { 
    Search, ShieldCheck, 
    Mail, Trash2, CheckCircle, 
    User as UserIcon,
    AlertCircle, X, Clock, ShieldAlert, BadgeCheck,
    ChevronRight, ExternalLink, ShieldX, Loader2, FileText
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

export default function AdminUsersManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'vendeur' | 'client'>('pending');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    
    // Suspension state
    const [isSuspending, setIsSuspending] = useState(false);
    const [suspensionDays, setSuspensionDays] = useState(1);
    const [isKycOpen, setIsKycOpen] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            const data = res.data.filter((u: any) => u.role !== 'super_admin' && u.role !== 'admin');
            setUsers(data);
            if (data.length > 0 && !selectedUser) {
                // On sélectionne le premier par défaut (ou le premier en attente)
                const firstPending = data.find((u: any) => u.role === 'vendeur' && !u.isVerified);
                setSelectedUser(firstPending || data[0]);
            }
        } catch (error) {
            console.error("Erreur lors du chargement des utilisateurs", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: 'validate' | 'delete' | 'restore' | 'suspend') => {
        if (!selectedUser) return;
        
        const confirmations = {
            delete: `🚫 ATTENTION : Cette action supprimera DÉFINITIVEMENT ${selectedUser.name}. Confirmer ?`,
            validate: `Voulez-vous valider ce compte marchand ?`,
            restore: null,
            suspend: null
        };

        const confirmationMsg = confirmations[action];
        if (confirmationMsg && !confirm(confirmationMsg)) return;

        try {
            await performAction(action);
            await refreshUserList(action);
        } catch (error) {
            console.error('Erreur lors de execution action', error);
            alert("❌ Une erreur est survenue lors de l'opération.");
        }
    };

    const performAction = async (action: string) => {
        switch (action) {
            case 'validate':
                await api.patch(`/users/${selectedUser.id}`, { isVerified: true });
                break;
            case 'delete':
                await api.delete(`/users/${selectedUser.id}/permanent`);
                setSelectedUser(null);
                break;
            case 'restore':
                await api.patch(`/users/${selectedUser.id}/restore`);
                break;
            case 'suspend': {
                const until = new Date();
                until.setDate(until.getDate() + suspensionDays);
                await api.patch(`/users/${selectedUser.id}`, { suspensionUntil: until });
                setIsSuspending(false);
                break;
            }
        }
    };

    const refreshUserList = async (action: string) => {
        const res = await api.get('/users');
        const data = res.data.filter((u: any) => u.role !== 'super_admin' && u.role !== 'admin');
        setUsers(data);
        
        if (action === 'delete') {
            alert("🗑️ Compte supprimé définitivement.");
        } else {
            const updatedUser = data.find((u: any) => u.id === selectedUser.id);
            setSelectedUser(updatedUser);
            alert("✅ Action effectuée avec succès !");
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase());
        if (activeTab === 'pending') return matchesSearch && u.role === 'vendeur' && !u.isVerified;
        if (activeTab === 'vendeur') return matchesSearch && u.role === 'vendeur' && u.isVerified;
        if (activeTab === 'client') return matchesSearch && u.role === 'client';
        return matchesSearch;
    });

    const stats = {
        total: users.length,
        pending: users.filter(u => u.role === 'vendeur' && !u.isVerified).length,
    };

    return (
        <div className="flex bg-[#f8fafc] min-h-screen text-slate-900 font-sans">
            <Sidebar mode="admin" />
            
            <main className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
                <TopNav title="Command Center : Utilisateurs" isAdmin={true} />

                {/* Main Split Layout */}
                <div className="flex-1 flex overflow-hidden p-6 gap-6">
                    
                    {/* Left Column: Interactive List */}
                    <div className="w-96 bg-white rounded-[2.5rem] shadow-xl border border-slate-200 flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-slate-50 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-black italic tracking-tighter uppercase text-slate-900">Annuaire</h2>
                                {stats.pending > 0 && (
                                    <span className="px-3 py-1 bg-amber-500 text-white text-[9px] font-black rounded-full animate-bounce">
                                        {stats.pending} EN ATTENTE
                                    </span>
                                )}
                            </div>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Rechercher..."
                                    className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-manioco-terracotta-100 transition-all font-sans italic"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                <TabSmall active={activeTab === 'all'} label="Tous" onClick={() => setActiveTab('all')} />
                                <TabSmall active={activeTab === 'pending'} label="Alertes" onClick={() => setActiveTab('pending')} alert={stats.pending > 0} />
                                <TabSmall active={activeTab === 'vendeur'} label="Marchands" onClick={() => setActiveTab('vendeur')} />
                                <TabSmall active={activeTab === 'client'} label="Clients" onClick={() => setActiveTab('client')} />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                            {loading ? (
                                <div className="p-10 text-center animate-pulse text-slate-300 font-black text-[10px] uppercase">Chargement...</div>
                            ) : filteredUsers.map((u) => (
                                <button 
                                    key={u.id}
                                    onClick={() => setSelectedUser(u)}
                                    className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-4 text-left group ${
                                        selectedUser?.id === u.id 
                                        ? 'bg-manioco-terracotta border-manioco-terracotta shadow-lg shadow-manioco-terracotta/20 text-white' 
                                        : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-100'
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                                        selectedUser?.id === u.id ? 'bg-white/20' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                        {u.name?.charAt(0)}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-black text-[11px] uppercase tracking-tighter truncate">{u.name}</p>
                                        <p className={`text-[9px] truncate ${selectedUser?.id === u.id ? 'text-manioco-terracotta-100' : 'text-slate-400'}`}>{u.email}</p>
                                    </div>
                                    {u.role === 'vendeur' && !u.isVerified && (
                                        <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"></div>
                                    )}
                                    <ChevronRight size={14} className={`transition-transform ${selectedUser?.id === u.id ? 'translate-x-0' : '-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Deep Details Panel */}
                    <div className="flex-1 bg-white rounded-[3rem] shadow-2xl border border-slate-200 relative overflow-hidden flex flex-col">
                        
                        {(() => {
                            const isSuspended = selectedUser && (selectedUser.deletedAt || (selectedUser.suspensionUntil && new Date(selectedUser.suspensionUntil) > new Date()));
                            
                            return selectedUser ? (
                            <>
                                {/* Floating Background Accent */}
                                <div className="absolute top-0 right-0 w-96 h-96 bg-manioco-terracotta-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50"></div>
                                
                                {/* Header Detail */}
                                <div className="p-12 pb-8 relative z-10 flex items-end justify-between">
                                    <div className="flex items-center gap-8">
                                        <div className="w-32 h-32 rounded-[2.5rem] bg-slate-900 flex items-center justify-center text-white text-4xl font-black italic shadow-2xl">
                                            {selectedUser.name?.charAt(0)}
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">{selectedUser.name}</h1>
                                                {selectedUser.isVerified ? (
                                                    <BadgeCheck className="text-emerald-500" size={24} />
                                                ) : (
                                                    <div className="px-3 py-1 bg-amber-100 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest italic animate-pulse">Validation Requise</div>
                                                )}
                                            </div>
                                            <p className="text-slate-400 font-bold flex items-center gap-2">
                                                <Mail size={16} /> {selectedUser.email}
                                            </p>
                                            <div className="flex gap-2">
                                                <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">{selectedUser.role}</span>
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                                    isSuspended 
                                                    ? 'bg-rose-100 text-rose-600 shadow-sm shadow-rose-100' 
                                                    : 'bg-emerald-100 text-emerald-600 shadow-sm shadow-emerald-100'
                                                }`}>
                                                    {isSuspended ? 'Suspendu / Bloqué' : 'Compte Actif'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] italic">Identifiant Système</p>
                                        <p className="text-xs font-mono font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-md">{selectedUser.id}</p>
                                    </div>
                                </div>

                                {/* Body Detail */}
                                <div className="flex-1 p-12 pt-4 grid grid-cols-12 gap-8 relative z-10 overflow-y-auto no-scrollbar">
                                    
                                    {/* Action Panel */}
                                    <div className="col-span-12 lg:col-span-8 space-y-8">
                                        
                                        {/* Status Alert for Unverified */}
                                        {selectedUser.role === 'vendeur' && !selectedUser.isVerified && (
                                            <div className="p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100 flex items-start gap-6">
                                                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-amber-500 shadow-lg shadow-amber-200/50">
                                                    <BadgeCheck size={32} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="text-lg font-black text-amber-700 leading-tight">Dossier KYC</h3>
                                                        <KycStatusBadge status={selectedUser.kycStatus} />
                                                    </div>
                                                    <p className="text-sm text-amber-600/80 font-medium italic mb-6">
                                                        <KycStatusText status={selectedUser.kycStatus} />
                                                    </p>
                                                    <div className="flex gap-4">
                                                        {selectedUser.isVerified ? (
                                                            <div className="bg-emerald-50 text-emerald-600 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 border border-emerald-100">
                                                                <BadgeCheck size={16} /> Vendeur Validé
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {selectedUser.kycStatus === 'PENDING' && (
                                                                    <button 
                                                                        onClick={() => setIsKycOpen(true)}
                                                                        className="bg-amber-500 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-600 transition-all shadow-xl shadow-amber-500/20 flex items-center gap-2"
                                                                    >
                                                                        <ExternalLink size={16} /> Examiner le dossier
                                                                    </button>
                                                                )}
                                                                {selectedUser.kycStatus === 'REJECTED' && (
                                                                    <button 
                                                                        onClick={() => setIsKycOpen(true)}
                                                                        className="bg-slate-200 text-slate-600 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-300 transition-all flex items-center gap-2"
                                                                    >
                                                                        <FileText size={16} /> Revoir les motifs du rejet
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* KYC REVIEW MODAL */}
                                        {isKycOpen && (
                                            <KycReviewModal 
                                                user={selectedUser} 
                                                onClose={() => setIsKycOpen(false)} 
                                                onUpdate={fetchUsers} 
                                            />
                                        )}

                                        {/* Quick Actions Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {selectedUser.deletedAt || (selectedUser.suspensionUntil && new Date(selectedUser.suspensionUntil) > new Date()) ? (
                                               <ActionCard 
                                                   icon={ShieldCheck} 
                                                   label="Lever la suspension" 
                                                   desc="Rétablir tous les accès maintenant" 
                                                   onClick={() => handleAction('restore')}
                                                   variant="success"
                                               />
                                            ) : (
                                               <ActionCard 
                                                   icon={ShieldAlert} 
                                                   label="Gestion du blocage" 
                                                   desc="Suspendre l'accès temporairement" 
                                                   onClick={() => setIsSuspending(!isSuspending)}
                                                   variant="danger"
                                               />
                                            )}
                                            <ActionCard 
                                                icon={Mail} 
                                                label="Dossier de Support" 
                                                desc="Ouvrir une conversation directe" 
                                                onClick={() => router.push(`/dashboard/admin/chat?userId=${selectedUser.id}`)}
                                                variant="primary"
                                            />
                                            <ActionCard 
                                                icon={Trash2} 
                                                label="Suppression Totale" 
                                                desc="Effacer définitivement de la base" 
                                                onClick={() => handleAction('delete')}
                                                variant="danger-outline"
                                            />
                                        </div>

                                        {/* Animation Suspension */}
                                        {isSuspending && (
                                            <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white animate-reveal">
                                                <h3 className="text-xl font-black italic uppercase mb-6 flex items-center gap-3">
                                                    <Clock className="text-rose-500" /> Paramétrer la Sanction
                                                </h3>
                                                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-8">
                                                    {[1, 3, 7, 30, 182, 365].map(d => (
                                                        <button 
                                                            key={d} 
                                                            onClick={() => setSuspensionDays(d)}
                                                            className={`py-3 rounded-xl text-[10px] font-black border transition-all ${
                                                                suspensionDays === d ? 'bg-white text-slate-900 border-white' : 'border-white/20 text-white/50'
                                                            }`}
                                                        >
                                                            <SuspensionLabel days={d} />
                                                        </button>
                                                    ))}
                                                </div>
                                                <button 
                                                    onClick={() => handleAction('suspend')}
                                                    className="w-full bg-rose-500 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-rose-500/20 active:scale-95 transition-all"
                                                >
                                                    Confirmer le blocage
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Sidebar Detail: Stats & History */}
                                    <div className="col-span-12 lg:col-span-4 space-y-6">
                                        <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Archive des Documents</h4>
                                            {selectedUser.role === 'vendeur' && selectedUser.kycStatus !== 'NOT_SUBMITTED' ? (
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-manioco-terracotta-50 text-manioco-terracotta-600 rounded-lg"><FileText size={16} /></div>
                                                            <span className="text-xs font-black text-slate-700">Dossier Identité</span>
                                                        </div>
                                                        <button 
                                                            onClick={() => setIsKycOpen(true)}
                                                            className="text-manioco-terracotta-600 text-[10px] font-black uppercase tracking-widest hover:underline"
                                                        >
                                                            Consulter
                                                        </button>
                                                    </div>
                                                    <p className="text-[9px] text-slate-400 font-bold italic leading-tight text-center px-4">Ces documents sont stockés de manière sécurisée et consultables uniquement par l'administration.</p>
                                                </div>
                                            ) : (
                                                <div className="py-6 text-center">
                                                    <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest italic">Aucun document archivé</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-8 bg-manioco-terracotta rounded-[2.5rem] text-white shadow-xl shadow-manioco-terracotta/20">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-50">Note Administrative</h4>
                                            <p className="text-xs font-bold leading-relaxed italic">"Compte marchand actif. Historique des transactions conforme aux standards de sécurité."</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center opacity-30">
                                <UserIcon size={120} className="text-slate-200 mb-8" />
                                <h2 className="text-2xl font-black italic tracking-tighter uppercase">Sélectionnez un profil</h2>
                                <p className="font-bold text-sm">Contrôlez les accès et validez les nouveaux marchands.</p>
                            </div>
                        );
                    })()}
                    </div>
                </div>
            </main>
        </div>
    );
}

function KycReviewModal({ user, onClose, onUpdate }: { readonly user: any, readonly onClose: () => void, readonly onUpdate: () => void }) {
    const [rejectionReasons, setRejectionReasons] = useState<any>(() => {
        try {
            return user.kycRejectionReasons ? JSON.parse(user.kycRejectionReasons) : {};
        } catch (error) {
            console.error("Failed to parse KYC rejection reasons", error);
            return {};
        }
    });
    const [reviewedFields, setReviewedFields] = useState<any>(() => {
        try {
            const reasons = user.kycRejectionReasons ? JSON.parse(user.kycRejectionReasons) : {};
            const reviewed: any = {};
            Object.keys(reasons).forEach(k => reviewed[k] = 'REJECTED');
            return reviewed;
        } catch (error) {
            console.error("Failed to parse KYC rejection reasons for review", error);
            return {};
        }
    });
    const [loading, setLoading] = useState(false);

    const handleRejectField = (field: string, reason: string) => {
        setRejectionReasons((prev: any) => ({ ...prev, [field]: reason }));
        setReviewedFields((prev: any) => ({ ...prev, [field]: 'REJECTED' }));
    };

    const handleApproveField = (field: string) => {
        setRejectionReasons((prev: any) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
        setReviewedFields((prev: any) => ({ ...prev, [field]: 'APPROVED' }));
    };

    const submitReview = async (status: 'APPROVED' | 'REJECTED') => {
        setLoading(true);
        try {
            await api.patch(`/users/${user.id}/kyc/review`, {
                status,
                reasons: status === 'REJECTED' ? rejectionReasons : null
            });
            onUpdate();
            onClose();
            alert(`✅ Dossier ${status === 'APPROVED' ? 'approvré' : 'rejeté'} avec succès.`);
        } catch (error) {
            console.error("Erreur review KYC", error);
            alert("❌ Erreur lors de la soumission de la revue.");
        } finally {
            setLoading(false);
        }
    };

    const kycFields = [
        { id: 'dob', label: 'Date de naissance', value: user.dob },
        { id: 'nationality', label: 'Nationalité', value: user.nationality },
        { id: 'phoneNumber', label: 'Téléphone', value: user.phoneNumber },
        { id: 'idCardFront', label: 'CNI Recto', value: user.idCardFront, type: 'image' },
        { id: 'idCardBack', label: 'CNI Verso', value: user.idCardBack, type: 'image' },
        { id: 'sellerSelfie', label: 'Photo Vendeur', value: user.sellerSelfie, type: 'image' },
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <button 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm cursor-default border-none" 
                onClick={onClose} 
                onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
                aria-label="Fermer la modal"
            ></button>
            <div className="relative bg-white w-full max-w-5xl h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                
                {/* Header */}
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-200">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black italic uppercase tracking-tighter">Examen du dossier KYC</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Utilisateur : {user.name} ({user.email})</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X size={20} /></button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {kycFields.map((field) => (
                            <div key={field.id} className={`space-y-3 p-6 rounded-[2rem] border transition-all group relative ${
                                reviewedFields[field.id] === 'REJECTED' ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-100'
                            }`}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{field.label}</span>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleApproveField(field.id)}
                                            className={`p-1.5 rounded-lg transition-colors ${reviewedFields[field.id] === 'APPROVED' ? 'bg-emerald-500 text-white' : 'bg-white text-emerald-500 hover:bg-emerald-50'}`}
                                        >
                                            <CheckCircle size={14} />
                                        </button>
                                        <button 
                                            onClick={() => {
                                                const reason = prompt("Motif du rejet :");
                                                if (reason) handleRejectField(field.id, reason);
                                            }}
                                            className={`p-1.5 rounded-lg transition-colors ${reviewedFields[field.id] === 'REJECTED' ? 'bg-rose-500 text-white' : 'bg-white text-rose-500 hover:bg-rose-50'}`}
                                        >
                                            <ShieldX size={14} />
                                        </button>
                                    </div>
                                </div>

                                {field.type === 'image' ? (
                                    <div className="h-48 bg-white rounded-2xl overflow-hidden border border-slate-200 relative group/img">
                                        {field.value ? (
                                            <>
                                                <img src={field.value} alt={field.label} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-all">
                                                    <a href={field.value} target="_blank" rel="noopener noreferrer" className="bg-white p-3 rounded-full text-slate-900 hover:scale-110 transition-transform"><ExternalLink size={20} /></a>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-slate-300 italic text-xs">Document non fourni</div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm font-black text-slate-800 bg-white p-4 rounded-xl border border-slate-200">{field.value || 'N/A'}</p>
                                )}

                                {rejectionReasons[field.id] && (
                                    <p className="text-[10px] font-bold text-rose-500 mt-2 flex items-center gap-2 bg-rose-50 p-2 rounded-lg border border-rose-100 animate-in fade-in slide-in-from-top-1">
                                        <AlertCircle size={12} /> Motif : {rejectionReasons[field.id]}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                    <button 
                        onClick={() => submitReview('REJECTED')}
                        disabled={loading || Object.keys(rejectionReasons).length === 0}
                        className="flex-1 bg-white border border-rose-200 text-rose-600 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-rose-50 transition-all shadow-lg shadow-rose-100 disabled:opacity-30"
                    >
                        Rejeter le dossier ({Object.keys(rejectionReasons).length} motifs)
                    </button>
                    <button 
                        onClick={() => submitReview('APPROVED')}
                        disabled={loading || Object.keys(rejectionReasons).length > 0}
                        className="flex-[2] bg-emerald-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:scale-[1.02] transition-all shadow-xl shadow-emerald-200 disabled:opacity-30 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <><BadgeCheck size={18} /> Accepter et Valider le Vendeur</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

function TabSmall({ active, label, onClick, alert }: any) {
    return (
        <button 
            onClick={onClick}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                active ? 'bg-manioco-terracotta text-white shadow-md shadow-manioco-terracotta/10' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 shadow-sm'
            } ${alert && !active ? 'ring-2 ring-amber-400' : ''}`}
        >
            {label}
        </button>
    );
}

function MiniStat({ label, value }: { readonly label: string, readonly value: string }) {
    return (
        <div className="flex justify-between items-end border-b border-slate-200/50 pb-3">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{label}</span>
            <span className="text-sm font-black text-slate-900 tracking-tighter">{value}</span>
        </div>
    );
}

function KycStatusBadge({ status }: { readonly status: string }) {
    switch (status) {
        case 'PENDING':
            return <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-600 animate-pulse">Soumis pour examen</span>;
        case 'REJECTED':
            return <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-rose-100 text-rose-600">Rejeté - En attente de correction</span>;
        default:
            return <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-400">Non Soumis</span>;
    }
}

function KycStatusText({ status }: { readonly status: string }) {
    if (status === 'PENDING') {
        return <>Le vendeur a soumis ses documents. Veuillez les examiner pour valider son compte.</>;
    }
    if (status === 'REJECTED') {
        return <>Vous avez rejeté ce dossier. Le vendeur doit corriger ses informations avant que vous ne puissiez l'examiner à nouveau.</>;
    }
    return <>Le vendeur n'a pas encore commencé sa soumission d'identité.</>;
}

function SuspensionLabel({ days }: { readonly days: number }) {
    if (days === 1) return <>1J</>;
    if (days === 7) return <>1S</>;
    if (days === 30) return <>1M</>;
    if (days === 365) return <>1A</>;
    return <>{days}J</>;
}

function ActionCard({ icon: Icon, label, desc, onClick, variant }: any) {
    const styles = {
        primary: 'bg-manioco-terracotta text-white shadow-manioco-terracotta/20',
        secondary: 'bg-white text-manioco-terracotta border-slate-100 hover:border-manioco-terracotta-100',
        success: 'bg-emerald-500 text-white shadow-emerald-200',
        danger: 'bg-rose-500 text-white shadow-rose-200',
        'danger-outline': 'bg-white text-rose-500 border-slate-100 hover:border-rose-100'
    };
    const c = (styles as any)[variant] || styles.secondary;

    return (
        <button 
            onClick={onClick}
            className={`p-6 rounded-[2rem] border transition-all text-left flex items-start gap-4 group ${c} ${variant.includes('outline') || variant === 'secondary' ? 'hover:shadow-xl' : 'shadow-xl hover:-translate-y-1'}`}
        >
            <div className={`p-3 rounded-2xl ${variant.includes('outline') || variant === 'secondary' ? 'bg-slate-50 group-hover:bg-white' : 'bg-white/20'} transition-colors`}>
                <Icon size={20} />
            </div>
            <div>
                <p className="text-[11px] font-black uppercase tracking-tight leading-none mb-1">{label}</p>
                <p className={`text-[9px] font-medium opacity-70 leading-tight`}>{desc}</p>
            </div>
        </button>
    );
}
