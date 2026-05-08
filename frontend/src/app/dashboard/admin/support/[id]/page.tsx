"use client";
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import {
    ChevronLeft, Send, Loader2, User,
    ShieldCheck, CheckCircle2, AlertCircle,
    Check, Info, MessageSquare, Clock, Phone, Mail
} from 'lucide-react';
import api from '@/lib/axios';

interface Message {
    id: string;
    senderId: string;
    message: string;
    createdAt: string;
}

interface Ticket {
    id: string;
    subject: string;
    category: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
    sellerId: string;
    seller?: {
        name: string;
        email: string;
        phone?: string;
    };
    messages: Message[];
    createdAt: string;
}

export default function AdminTicketDetail() {
    const { id } = useParams();
    const router = useRouter();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchTicketDetails = async () => {
        try {
            const res = await api.get(`/support/tickets/${id}`);
            setTicket(res.data);
            setIsLoading(false);
            setTimeout(scrollToBottom, 300);
        } catch (error) {
            console.error("Erreur lors du chargement des détails du ticket:");
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTicketDetails();
    }, [id]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        if (ticket?.status === 'OPEN') {
            await updateStatus('IN_PROGRESS');
        }

        setIsSending(true);
        try {
            await api.post(`/support/tickets/${id}/messages`, {
                message: newMessage
            });
            setNewMessage('');
            fetchTicketDetails();
        } catch (error) {
            console.error("Erreur lors de l'envoi du message:");
        } finally {
            setIsSending(false);
        }
    };

    const updateStatus = async (status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED') => {
        setIsUpdatingStatus(true);
        try {
            await api.patch(`/support/tickets/${id}/status`, { status });
            fetchTicketDetails();
        } catch (error) {
            console.error("Erreur lors de la mise à jour du statut:");
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    if (isLoading || !ticket) {
        return (
            <div className="flex bg-[#F8FAFC] min-h-screen">
                <Sidebar mode="admin" />
                <main className="flex-1 lg:ml-64 flex items-center justify-center">
                    <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                </main>
            </div>
        );
    }

    return (
        <div className="flex bg-[#F8FAFC] min-h-screen font-sans">
            <Sidebar mode="admin" />

            {/* Layout principal */}
            <main className="flex-1 lg:ml-64 flex flex-col h-screen relative bg-slate-50/50">
                {/* 1. Header supérieur Premium */}
                <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => router.push('/dashboard/admin/support')}
                            className="group flex flex-col items-center justify-center hover:scale-105 transition-transform"
                        >
                            <div className="w-10 h-10 rounded-[14px] bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors shadow-sm">
                                <ChevronLeft size={20} strokeWidth={3} />
                            </div>
                        </button>
                        <div>
                            <div className="flex items-center gap-4">
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">{ticket.subject}</h1>
                                
                                {/* Badges de statut ultra-visuels */}
                                {ticket.status === 'OPEN' && (
                                    <span className="flex items-center gap-1.5 bg-rose-50 text-rose-600 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest border border-rose-100 shadow-sm italic animate-pulse">
                                        <AlertCircle size={12} />Urgent - Nouveau
                                    </span>
                                )}
                                {ticket.status === 'IN_PROGRESS' && (
                                    <span className="flex items-center gap-1.5 bg-sky-50 text-sky-600 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest border border-sky-100 shadow-sm italic">
                                        <Clock size={12} className="animate-spin-slow" />En Traitement
                                    </span>
                                )}
                                {ticket.status === 'CLOSED' && (
                                    <span className="flex items-center gap-1.5 bg-slate-100 text-slate-500 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest border border-slate-200 shadow-sm italic">
                                        <CheckCircle2 size={12} />Résolu
                                    </span>
                                )}
                            </div>
                            <p className="text-[10px] font-black text-slate-400 tracking-widest mt-1 uppercase">Ticket ID: <span className="text-emerald-500">{ticket.id.split('-')[0]}</span></p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {ticket.status === 'CLOSED' ? (
                            <button
                                onClick={() => updateStatus('IN_PROGRESS')}
                                className="text-emerald-600 hover:text-white hover:bg-emerald-500 text-[10px] font-black uppercase tracking-widest bg-emerald-50 px-6 py-3 rounded-xl border border-emerald-200 transition-all shadow-sm active:scale-95"
                            >
                                Réouvrir le dossier
                            </button>
                        ) : (
                            <button
                                onClick={() => updateStatus('CLOSED')}
                                disabled={isUpdatingStatus}
                                className="group bg-slate-900 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-slate-900/10 hover:shadow-emerald-500/30 flex items-center gap-2 active:scale-95"
                            >
                                {isUpdatingStatus ? <Loader2 size={14} className="animate-spin" /> : <Check size={16} className="group-hover:scale-125 transition-transform" />}
                                Clôturer le ticket
                            </button>
                        )}
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden relative">
                    
                    {/* Arrière-plan de la zone de chat (Motif type iMessage/WhatsApp) */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

                    {/* 2. Zone de Chat */}
                    <div className="flex-1 flex flex-col h-full relative z-10 w-full overflow-hidden">
                        
                        {/* Bulle info centrale de début */}
                        <div className="w-full flex justify-center pt-8 pb-4 absolute top-0 z-10 bg-gradient-to-b from-slate-50/90 to-transparent pointer-events-none">
                            <div className="bg-white/80 backdrop-blur-md px-4 py-1.5 rounded-full shadow-sm border border-slate-200/50 flex items-center gap-2">
                                <ShieldCheck size={12} className="text-emerald-500" />
                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 italic">Début de l'historique chiffré</span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-16 lg:px-12 space-y-6 custom-scrollbar pb-32">
                            {ticket.messages.map((msg, index) => {
                                const isAdminMessage = msg.senderId !== ticket.sellerId;
                                const isLastMessage = index === ticket.messages.length - 1;

                                return (
                                    <div key={msg.id} className={`flex w-full ${isAdminMessage ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-500 ease-out`} style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}>
                                        <div className={`flex flex-col ${isAdminMessage ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[70%]`}>
                                            
                                            {/* Nom de l'expéditeur au-dessus de la bulle */}
                                            <div className={`flex items-center gap-1.5 mb-1.5 ${isAdminMessage ? 'flex-row-reverse' : ''} px-2`}>
                                                <span className={`text-[9px] font-black uppercase tracking-widest italic ${isAdminMessage ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                    {isAdminMessage ? 'Support Admin' : ticket.seller?.name || 'Vendeur'}
                                                </span>
                                            </div>

                                            {/* Corps de la bulle de message */}
                                            <div className={`relative px-6 py-4 rounded-[1.5rem] shadow-sm transform transition-all hover:scale-[1.01] ${
                                                    isAdminMessage
                                                    ? 'bg-gradient-to-tr from-emerald-500 to-emerald-400 text-white rounded-tr-sm shadow-emerald-500/20'
                                                    : 'bg-white text-slate-700 rounded-tl-sm border border-slate-200 shadow-slate-200/50'
                                                }`}>
                                                <p className="text-[15px] font-medium leading-relaxed">{msg.message}</p>
                                                
                                                {/* Heure intégrée */}
                                                <div className={`mt-2 flex items-center gap-1 ${isAdminMessage ? 'justify-end text-emerald-100' : 'justify-start text-slate-400'}`}>
                                                    <Clock size={10} />
                                                    <span className="text-[9px] font-black tracking-widest">
                                                        {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} className="h-4" />
                        </div>

                        {/* 3. Barre de saisie flottante moderne */}
                        <div className="absolute bottom-6 left-6 right-6 lg:left-12 lg:right-12">
                            <form onSubmit={handleSendMessage} className="relative group">
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-white -z-10 group-focus-within:shadow-emerald-500/10 transition-all duration-300"></div>
                                <div className="flex items-center p-2 relative">
                                    <div className="w-12 h-12 flex items-center justify-center text-slate-300 group-focus-within:text-emerald-500 transition-colors shrink-0">
                                        <MessageSquare size={20} />
                                    </div>
                                    
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        disabled={ticket.status === 'CLOSED'}
                                        placeholder={ticket.status === 'CLOSED' ? "Ce ticket a été clôturé." : "Apporter une réponse d'assistance..."}
                                        className="flex-1 bg-transparent border-none text-[15px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0 disabled:opacity-50 min-w-0"
                                    />
                                    
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim() || isSending || ticket.status === 'CLOSED'}
                                        className="w-12 h-12 bg-emerald-500 text-white rounded-[1.5rem] flex items-center justify-center hover:bg-emerald-600 hover:scale-105 hover:rotate-12 shadow-xl shadow-emerald-500/30 transition-all duration-300 active:scale-95 disabled:opacity-0 disabled:scale-50 cursor-pointer shrink-0 ml-2"
                                    >
                                        {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="-translate-x-0.5 translate-y-0.5" />}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* 4. Panneau latéral d'informations (Refondu) */}
                    <div className="w-80 bg-white border-l border-slate-200/60 p-6 hidden xl:flex flex-col gap-6 shrink-0 z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.02)] relative">
                        
                        {/* Carte d'identité du Ticket */}
                        <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-900/10 relative overflow-hidden group">
                            <div className="relative z-10">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 italic">Dossier Support</h3>
                                <p className="text-xl font-black uppercase tracking-tighter italic">#{ticket.id.substring(0, 8)}</p>
                                
                                <div className="mt-6 flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center"><Info size={14} /></div>
                                        <div>
                                            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Catégorie</p>
                                            <p className="text-xs font-bold">{ticket.category}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center"><Clock size={14} /></div>
                                        <div>
                                            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Ouverture</p>
                                            <p className="text-xs font-bold">{new Date(ticket.createdAt).toLocaleDateString('fr-FR')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Élément graphique */}
                            <ShieldCheck size={120} className="absolute -right-4 -bottom-4 text-white opacity-5 group-hover:rotate-12 transition-transform duration-700" />
                        </div>

                        {/* Fiche Utilisateur */}
                        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
                                <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                                    <User size={18} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 uppercase italic tracking-tight">Demandeur</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Partenaire Vendeur</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Mail size={14} className="text-slate-400 mt-0.5" />
                                    <div>
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Email Contact</p>
                                        <p className="text-xs font-bold text-slate-700 break-all">{ticket.seller?.email || 'NR'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Phone size={14} className="text-slate-400 mt-0.5" />
                                    <div>
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Téléphone</p>
                                        <p className="text-xs font-bold text-slate-700">{ticket.seller?.phone || 'Non renseigné'}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <button className="w-full mt-6 py-3 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 hover:text-emerald-600 transition-colors border border-slate-100">
                                Voir la boutique
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(148, 163, 184, 0.3);
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(148, 163, 184, 0.5);
                }
            `}</style>
        </div>
    );
}
