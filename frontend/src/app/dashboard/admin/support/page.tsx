"use client";
import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';
import { 
  HelpCircle, Search, MessageSquare, Clock, 
  CheckCircle2, AlertCircle, Loader2, Filter, 
  User as UserIcon, Calendar, ArrowRight,
  Inbox, Zap, Shield
} from 'lucide-react';
import api from '@/lib/axios';

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  createdAt: string;
  sellerId: string;
  seller?: {
    name: string;
    email: string;
  };
}

export default function AdminSupportHub() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'CLOSED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAllTickets = async () => {
    try {
      const res = await api.get('/support/tickets/all');
      setTickets(res.data);
    } catch (error) {
      console.error("Erreur récupération tickets admin");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTickets();
  }, []);

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'OPEN').length,
    inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    closed: tickets.filter(t => t.status === 'CLOSED').length
  };

  const filteredTickets = tickets.filter(t => {
    const matchesFilter = filter === 'ALL' || t.status === filter;
    const matchesSearch = t.subject?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.seller?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN': 
        return <span className="px-3 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest border border-red-100 flex items-center gap-1.5"><Zap size={12}/> Urgent</span>;
      case 'IN_PROGRESS': 
        return <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100 flex items-center gap-1.5"><Clock size={12}/> En cours</span>;
      case 'CLOSED': 
        return <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest border border-slate-200 flex items-center gap-1.5"><CheckCircle2 size={12}/> Résolu</span>;
      default: return null;
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

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-900 font-sans">
      <Sidebar mode="admin" />
      
      <main className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
        <TopNav title="Support & Conciergerie" isAdmin={true} />
        
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-10">
            
            {/* Elegant Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Opérations Clientèle</span>
                </div>
                <h1 className="text-4xl font-black tracking-tight text-slate-900">Support <span className="text-emerald-500">Exécutif</span></h1>
                <p className="text-sm text-slate-500 mt-2 font-medium">Gérez les demandes de vos vendeurs avec élégance et rapidité.</p>
              </div>

              {/* Minimalist Stats */}
              <div className="flex gap-4">
                  {[
                      { label: 'Urgents', value: stats.open, color: 'text-red-500', bg: 'bg-red-50' },
                      { label: 'Encours', value: stats.inProgress, color: 'text-blue-500', bg: 'bg-blue-50' }
                  ].map((s, i) => (
                      <div key={i} className={`${s.bg} px-6 py-3 rounded-2xl border border-white/50 shadow-sm flex flex-col items-center min-w-[100px]`}>
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">{s.label}</span>
                          <span className={`text-xl font-black ${s.color}`}>{s.value}</span>
                      </div>
                  ))}
              </div>
            </div>

            {/* Premium Control Bar */}
            <div className="bg-white border border-slate-200/60 rounded-[2rem] p-3 shadow-xl shadow-slate-200/40 flex flex-col lg:flex-row gap-4 items-center">
              <div className="relative flex-1 group w-full">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une transmission..."
                  className="w-full pl-14 pr-4 py-4 bg-transparent border-none text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-0"
                />
              </div>
              
              <div className="flex gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                {(['ALL', 'OPEN', 'IN_PROGRESS', 'CLOSED'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      filter === f 
                      ? 'bg-white text-emerald-600 shadow-md border border-slate-100' 
                      : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                    }`}
                  >
                    {f === 'ALL' ? 'Tous' : f === 'OPEN' ? 'Urgents' : f === 'IN_PROGRESS' ? 'Saisie' : 'Résolus'}
                  </button>
                ))}
              </div>
            </div>

            {/* Tickets Feed */}
            <div className="grid grid-cols-1 gap-6">
              {filteredTickets.length === 0 ? (
                <div className="bg-white border border-slate-200/50 rounded-[3rem] p-24 text-center flex flex-col items-center shadow-inner">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6 border border-slate-100">
                    <MessageSquare size={28} />
                  </div>
                  <h3 className="text-xl font-black text-slate-400 italic">Aucun ticket à l'horizon</h3>
                </div>
              ) : (
                filteredTickets.map(ticket => (
                  <div 
                    key={ticket.id} 
                    onClick={() => window.location.href = `/dashboard/admin/support/${ticket.id}`}
                    className="group bg-white border border-slate-200/60 rounded-[2.5rem] p-8 hover:border-emerald-500/30 transition-all cursor-pointer flex items-center justify-between shadow-sm hover:shadow-2xl hover:shadow-emerald-500/5 hover:-translate-y-1"
                  >
                    <div className="flex gap-8 items-center">
                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center border transition-all ${
                            ticket.status === 'OPEN' ? 'bg-red-50 border-red-100 text-red-500' : 'bg-emerald-50 border-emerald-100 text-emerald-500'
                        }`}>
                            <Inbox size={28} />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-4">
                                <h3 className="text-xl font-black text-slate-800 group-hover:text-emerald-500 transition-colors uppercase tracking-tight">{ticket.subject}</h3>
                                {getStatusBadge(ticket.status)}
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                    <UserIcon size={12} className="text-emerald-500"/>
                                    {ticket.seller?.name || `Vendeur #${ticket.sellerId.substring(0,8)}`}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <Calendar size={12} className="text-slate-300"/>
                                    {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
                                </div>
                                <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                    #{ticket.category}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-emerald-500 group-hover:text-white transition-all group-hover:rotate-45 shadow-sm group-hover:shadow-emerald-200">
                            <ArrowRight size={20} />
                        </div>
                    </div>
                  </div>
                ))
              )}
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
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #10b981;
        }
      `}</style>
    </div>
  );
}
