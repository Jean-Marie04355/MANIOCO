"use client";
import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';
import { 
  HelpCircle, Plus, Search, MessageSquare, Clock, 
  CheckCircle2, AlertCircle, X, Send, Loader2 
} from 'lucide-react';
import api from '@/lib/axios';

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  createdAt: string;
}

export default function SellerSupport() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Paiement');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Paiement',
    'Problème Technique',
    'Question sur un Produit',
    'Litige Client',
    'Autre'
  ];

  const fetchTickets = async () => {
    try {
      const res = await api.get('/support/tickets/my-tickets');
      setTickets(res.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des tickets", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      await api.post('/support/tickets', {
        subject,
        category,
        message
      });
      setIsModalOpen(false);
      setSubject('');
      setMessage('');
      fetchTickets(); // Refresh list
    } catch (error) {
      console.error("Erreur création ticket", error);
      alert("Une erreur est survenue lors de l'envoi du ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN': 
        return <span className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-fit"><AlertCircle size={12}/> Ouvert</span>;
      case 'IN_PROGRESS': 
        return <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-fit"><Clock size={12}/> En traitement</span>;
      case 'CLOSED': 
        return <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-fit"><CheckCircle2 size={12}/> Résolu</span>;
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

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar mode="seller" />
      
      <main className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
        <TopNav title="Aide & Support" isAdmin={false} />
        
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* Header section */}
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Support Technique</h1>
                <p className="text-sm text-slate-500 mt-2">Un problème ? Notre équipe est là pour vous aider.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-slate-900/20"
              >
                <Plus size={18} />
                Nouveau Ticket
              </button>
            </div>

            {/* Tickets List */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Rechercher un ticket..." 
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  />
                </div>
              </div>

              {tickets.length === 0 ? (
                <div className="p-20 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                    <MessageSquare size={24} />
                  </div>
                  <p className="text-slate-900 font-black">Aucun ticket ouvert</p>
                  <p className="text-sm text-slate-500 mt-1">Si vous rencontrez un problème, n'hésitez pas à nous contacter.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {tickets.map(ticket => (
                    <button 
                      type="button"
                      key={ticket.id} 
                      className="w-full text-left p-6 hover:bg-slate-50/50 transition-colors flex items-center justify-between group cursor-pointer" 
                      onClick={() => globalThis.location.href = `/dashboard/seller/support/${ticket.id}`}
                    >
                      <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <HelpCircle size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-black text-slate-900">{ticket.subject}</h3>
                            {getStatusBadge(ticket.status)}
                          </div>
                          <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                            <span className="px-2 py-0.5 bg-slate-100 rounded-md">ID: {ticket.id.substring(0, 8).toUpperCase()}</span>
                            <span>•</span>
                            <span className="uppercase tracking-widest">{ticket.category}</span>
                            <span>•</span>
                            <span>Ouvert le {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-xs font-black uppercase tracking-widest">Voir</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* New Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
             role="button"
             tabIndex={-1}
             aria-label="Fermer la modal"
             className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
             onClick={() => !isSubmitting && setIsModalOpen(false)}
             onKeyDown={(e) => { if (e.key === 'Escape' && !isSubmitting) setIsModalOpen(false); }}
           ></div>
          <div className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in fade-in duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <HelpCircle className="text-orange-500" />
                Nouveau Ticket
              </h3>
              <button 
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-900"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label htmlFor="ticketSubject" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sujet / Résumé du problème</label>
                  <input 
                    id="ticketSubject"
                    type="text" 
                    required
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Ex: Mon paiement FedaPay est bloqué"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all"
                  />
                </div>
                
                <div className="col-span-2">
                  <label htmlFor="ticketCategory" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Catégorie</label>
                  <select 
                    id="ticketCategory"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="col-span-2">
                  <label htmlFor="ticketMessage" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Message détaillé</label>
                  <textarea 
                    id="ticketMessage"
                    required
                    rows={5}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Expliquez votre problème en détail ici..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all resize-none custom-scrollbar"
                  ></textarea>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => !isSubmitting && setIsModalOpen(false)}
                  className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Envoyer le ticket
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
