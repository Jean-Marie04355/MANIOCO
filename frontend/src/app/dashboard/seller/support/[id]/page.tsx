"use client";
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import TopNav from '../../../components/TopNav';
import {
    ArrowLeft, Send, Loader2, User,
    ShieldCheck, Clock, CheckCircle2, AlertCircle
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
    messages: Message[];
}

export default function TicketDetail() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
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
            console.error("Erreur détails ticket", error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTicketDetails();
    }, [id]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        try {
            await api.post(`/support/tickets/${id}/messages`, {
                message: newMessage
            });
            setNewMessage('');
            fetchTicketDetails();
        } catch (error) {
            console.error("Erreur envoi message", error);
        } finally {
            setIsSending(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex bg-slate-50 min-h-screen">
                <Sidebar mode="seller" />
                <main className="flex-1 ml-64 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-manioco-terracotta animate-spin" />
                </main>
            </div>
        );
    }

    if (!ticket) return null;

    const currentUserId = user?.id || (user as any)?.userId;

    return (
        <div className="flex bg-slate-50/50 min-h-screen text-slate-900">
            <Sidebar mode="seller" />

            <main className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
                <TopNav title="Détails du Ticket" isAdmin={false} />

                <div className="flex-1 flex items-center justify-center p-12 overflow-hidden">
                    {/* Main Ticket Card */}
                    <div className="bg-white w-full max-w-5xl h-full rounded-[3.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 flex flex-col overflow-hidden relative">

                        {/* Internal Header */}
                        <div className="p-10 flex items-start justify-between">
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={() => router.push('/dashboard/seller/support')}
                                    className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:text-manioco-terracotta transition-all shadow-sm"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div>
                                    <h1 className="text-3xl font-black text-slate-900 tracking-tight lowercase">{ticket.subject}</h1>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                        TICKET ID: {ticket.id.substring(0, 8).toUpperCase()} • {ticket.category}
                                    </p>
                                </div>
                            </div>

                            <div className={`px-4 py-1.5 rounded-full border flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${ticket.status === 'OPEN' ? 'border-manioco-terracotta-200 text-manioco-terracotta bg-manioco-terracotta-50/30' : 'border-green-100 text-green-500 bg-green-50/30'
                                }`}>
                                <AlertCircle size={14} />
                                {ticket.status === 'OPEN' ? 'OUVERT' : ticket.status === 'IN_PROGRESS' ? 'EN COURS' : 'RÉSOLU'}
                            </div>
                        </div>

                        {/* Chat History */}
                        <div className="flex-1 overflow-y-auto px-12 py-4 space-y-10 custom-scrollbar">
                            {ticket.messages.map((msg) => {
                                const isMe = msg.senderId === currentUserId;

                                return (
                                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className={`flex items-center gap-2 mb-2 ${isMe ? 'opacity-40' : ''}`}>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                {isMe ? 'MOI' : 'SUPPORT'} {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        <div className={`flex items-end gap-3 ${isMe ? 'flex-row' : 'flex-row-reverse'}`}>
                                            <div className={`px-6 py-4 rounded-[1.8rem] text-sm font-bold max-w-sm ${isMe
                                                    ? 'bg-manioco-terracotta text-white rounded-tr-none'
                                                    : 'bg-slate-100 text-slate-700 rounded-tl-none'
                                                }`}>
                                                <p>{msg.message}</p>
                                            </div>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-slate-100 ${isMe ? 'bg-manioco-terracotta-50 text-manioco-terracotta' : 'bg-slate-100 text-slate-400'}`}>
                                                {isMe ? <User size={18} /> : <ShieldCheck size={18} />}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Card Internal Input */}
                        <div className="p-8 border-t border-slate-50">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-4">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        disabled={ticket.status === 'CLOSED' || isSending}
                                        placeholder={ticket.status === 'CLOSED' ? "Ce ticket est clôturé" : "Écrivez votre réponse..."}
                                        className="w-full bg-slate-50/50 border border-slate-100 rounded-[1.5rem] px-8 py-5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-manioco-terracotta/10 focus:bg-white transition-all placeholder:text-slate-300 disabled:opacity-50"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || isSending || ticket.status === 'CLOSED'}
                                    className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center transition-all shadow-lg active:scale-95 ${
                                        !newMessage.trim() || isSending || ticket.status === 'CLOSED'
                                        ? 'bg-slate-100 text-slate-300 shadow-none cursor-not-allowed'
                                        : 'bg-manioco-terracotta text-white shadow-manioco-terracotta/20 hover:bg-manioco-brown hover:-rotate-12'
                                    }`}
                                >
                                    {isSending ? (
                                        <Loader2 size={24} className="animate-spin" />
                                    ) : (
                                        <Send size={24} className={ticket.status === 'CLOSED' ? "" : "-rotate-45 translate-x-0.5 -translate-y-0.5"} />
                                    )}
                                </button>
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
                    background: #f1f5f9;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}
