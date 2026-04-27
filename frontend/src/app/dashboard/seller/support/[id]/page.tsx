"use client";
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import TopNav from '../../../components/TopNav';
import { 
  ArrowLeft, Send, CheckCircle2, AlertCircle, Clock, 
  Loader2, User as UserIcon, Shield
} from 'lucide-react';
import api from '@/lib/axios';
import { useAuth } from '@/features/auth/AuthContext';

interface TicketMessage {
  id: string;
  message: string;
  senderId: string;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  createdAt: string;
  sellerId: string;
  messages: TicketMessage[];
}

export default function TicketDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTicket = async () => {
    try {
      const res = await api.get(`/support/tickets/${id}`);
      setTicket(res.data);
    } catch (error) {
      console.error("Erreur récupération ticket", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTicket();
    }
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !ticket || ticket.status === 'CLOSED') return;

    setIsSending(true);
    try {
      await api.post(`/support/tickets/${id}/messages`, {
        message: newMessage
      });
      setNewMessage('');
      fetchTicket(); // Refresh messages
    } catch (error) {
      console.error("Erreur envoi message", error);
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN': 
        return <span className="px-3 py-1.5 rounded-xl bg-orange-50 text-orange-600 text-xs font-black uppercase tracking-wider flex items-center gap-1 w-fit"><AlertCircle size={14}/> Ouvert</span>;
      case 'IN_PROGRESS': 
        return <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-xs font-black uppercase tracking-wider flex items-center gap-1 w-fit"><Clock size={14}/> En traitement</span>;
      case 'CLOSED': 
        return <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 text-xs font-black uppercase tracking-wider flex items-center gap-1 w-fit"><CheckCircle2 size={14}/> Résolu</span>;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex bg-slate-50 min-h-screen">
        <Sidebar mode="seller" />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        </main>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex bg-slate-50 min-h-screen">
        <Sidebar mode="seller" />
        <main className="flex-1 ml-64 p-8">
          <p>Ticket introuvable.</p>
        </main>
      </div>
    );
  }

  const currentUserId = user?.id || (user as any)?.userId;

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar mode="seller" />
      
      <main className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
        <TopNav title="Détails du Ticket" isAdmin={true} />
        
        <div className="flex-1 p-8 flex flex-col h-full overflow-hidden">
          <div className="max-w-4xl mx-auto w-full flex flex-col h-full bg-white rounded-[2.5rem] border border-slate-200/60 shadow-xl overflow-hidden">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => router.push('/dashboard/seller/support')}
                  className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-colors"
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h1 className="text-lg font-black text-slate-900">{ticket.subject}</h1>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Ticket ID: {ticket.id.substring(0, 8)} • {ticket.category}</p>
                </div>
              </div>
              <div>
                {getStatusBadge(ticket.status)}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/30">
              {ticket.messages && ticket.messages.map((msg, idx) => {
                const isMe = msg.senderId === currentUserId;
                const isAdmin = !isMe && msg.senderId !== ticket.sellerId; // Simple check, usually admin if not seller
                
                return (
                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-3 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        isMe ? 'bg-orange-100 text-orange-600' : 
                        isAdmin ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {isAdmin ? <Shield size={16} /> : <UserIcon size={16} />}
                      </div>

                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {isMe ? 'Moi' : isAdmin ? 'Support Technique' : 'Utilisateur'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {new Date(msg.createdAt).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        
                        <div className={`p-4 rounded-2xl text-sm font-medium whitespace-pre-wrap ${
                          isMe 
                            ? 'bg-orange-500 text-white rounded-tr-sm' 
                            : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'
                        }`}>
                          {msg.message}
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {ticket.status !== 'CLOSED' ? (
              <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Écrivez votre réponse..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    disabled={isSending}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || isSending}
                    className="bg-orange-500 hover:bg-orange-600 text-white w-14 rounded-2xl flex items-center justify-center transition-all disabled:opacity-50 disabled:hover:bg-orange-500 shadow-lg shadow-orange-500/20"
                  >
                    {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </form>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 border-t border-slate-100 text-center shrink-0">
                <p className="text-sm font-bold text-slate-500">Ce ticket a été marqué comme résolu. Vous ne pouvez plus y répondre.</p>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
