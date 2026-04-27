"use client";
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import TopNav from '../../../components/TopNav';
import {
    ChevronLeft, Send, Loader2, User,
    ShieldCheck, Clock, CheckCircle2, AlertCircle,
    Check, Info, MessageSquare
} from 'lucide-react';
import api from '@/lib/axios';
import { useAuth } from '@/features/auth/AuthContext';

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
    };
    messages: Message[];
}

export default function AdminTicketDetail() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuth();
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
            setTimeout(scrollToBottom, 100);
        } catch (error) {
            console.error("Erreur détails ticket admin", error);
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
            console.error("Erreur envoi message admin", error);
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
            console.error("Erreur mise à jour statut", error);
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex bg-slate-50 min-h-screen">
                <Sidebar mode="admin" />
                <main className="flex-1 ml-64 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                </main>
            </div>
        );
    }

    if (!ticket) return null;

    return (
        <div className="flex bg-white min-h-screen text-slate-900">
            <Sidebar mode="admin" />

            <main className="flex-1 ml-64 flex flex-col h-screen overflow-hidden bg-white">
                {/* Header */}
                <div className="bg-white border-b border-slate-100 px-8 py-5 flex items-center justify-between z-10 shadow-sm">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => router.push('/dashboard/admin/support')}
                            className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-all border border-slate-100"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">{ticket.subject}</h1>
                                {ticket.status === 'OPEN' && <span className="bg-red-50 text-red-600 text-[10px] font-black px-3 py-1 rounded-full uppercase border border-red-100 italic">Action Urgente</span>}
                                {ticket.status === 'IN_PROGRESS' && <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1 rounded-full uppercase border border-blue-100">En cours</span>}
                                {ticket.status === 'CLOSED' && <span className="bg-slate-100 text-slate-400 text-[10px] font-black px-3 py-1 rounded-full uppercase border border-slate-200">Résolu</span>}
                            </div>
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Vendeur: {ticket.seller?.name || `ID: ${ticket.sellerId.substring(0, 8)}`}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {ticket.status !== 'CLOSED' ? (
                            <button
                                onClick={() => updateStatus('CLOSED')}
                                disabled={isUpdatingStatus}
                                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-slate-900/10 flex items-center gap-2"
                            >
                                {isUpdatingStatus ? <Loader2 size={12} className="animate-spin" /> : <Check size={14} />}
                                Clôturer le ticket
                            </button>
                        ) : (
                            <button
                                onClick={() => updateStatus('IN_PROGRESS')}
                                className="text-emerald-600 hover:text-white hover:bg-emerald-600 text-[10px] font-black uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 transition-all font-sans"
                            >
                                Réouvrir
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Info Panel */}
                    <div className="w-80 bg-slate-50/50 border-r border-slate-100 p-8 hidden lg:flex flex-col gap-8 shrink-0 overflow-y-auto">
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-slate-900">
                                <Info size={16} className="text-emerald-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Spécifications</span>
                            </div>
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-5">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">ID Transmission</p>
                                    <p className="text-xs font-bold text-slate-700">#{ticket.id.split('-')[0].toUpperCase()}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Contact Marchand</p>
                                    <p className="text-xs font-bold text-slate-700 truncate">{ticket.seller?.email || 'N/A'}</p>
                                </div>
                                <div className="pt-4 border-t border-slate-50">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Dernière activité</p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col h-full bg-slate-50/20">
                        <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                            {ticket.messages.map((msg) => {
                                const isAdminMessage = msg.senderId !== ticket.sellerId;

                                return (
                                    <div key={msg.id} className={`flex ${isAdminMessage ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`flex flex-col ${isAdminMessage ? 'items-end' : 'items-start'} max-w-[75%]`}>
                                            <div className={`flex items-center gap-2 mb-2 ${isAdminMessage ? 'flex-row-reverse' : ''}`}>
                                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isAdminMessage ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white text-slate-300 border border-slate-100 shadow-sm'}`}>
                                                    {isAdminMessage ? <ShieldCheck size={12} /> : <User size={12} />}
                                                </div>
                                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest opacity-60">
                                                    {isAdminMessage ? 'Moi (Admin)' : 'Vendeur'}
                                                </span>
                                            </div>

                                            <div className={`p-6 rounded-[2rem] shadow-sm transition-all duration-300 ${isAdminMessage
                                                    ? 'bg-emerald-500 text-white rounded-tr-none shadow-emerald-500/10'
                                                    : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                                                }`}>
                                                <p className="text-sm font-medium leading-relaxed tracking-wide">{msg.message}</p>
                                                <div className={`mt-3 pt-3 border-t ${isAdminMessage ? 'border-white/10' : 'border-slate-50'} text-[8px] font-bold opacity-60`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* White Input Bar */}
                        <div className="p-10 bg-white border-t border-slate-100">
                            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
                                <div className="relative group">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                                        <MessageSquare size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        disabled={ticket.status === 'CLOSED'}
                                        placeholder={ticket.status === 'CLOSED' ? "Canal de support fermé." : "Apporter une réponse d'assistance..."}
                                        className="w-full pl-16 pr-16 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 focus:bg-white transition-all shadow-lg shadow-slate-200/10 disabled:opacity-50"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim() || isSending || ticket.status === 'CLOSED'}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-emerald-500 text-white rounded-[1.2rem] flex items-center justify-center hover:bg-emerald-600 shadow-xl shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-0 disabled:scale-0 cursor-pointer"
                                    >
                                        {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={20} />}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}
