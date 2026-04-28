"use client";
import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';
import { 
  HelpCircle, Plus, Search, MessageSquare, Clock, 
  CheckCircle2, AlertCircle, X, Send, Loader2,
  ChevronRight, LifeBuoy, ShieldAlert, Zap
} from 'lucide-react';
import api from '@/lib/axios';

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  createdAt: string;
}

export default function ClientHelp() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Commande');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Commande',
    'Paiement',
    'Livraison',
    'Retour & Remboursement',
    'Problème Technique',
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
        return <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 w-fit"><AlertCircle size={12}/> Ouvert</span>;
      case 'IN_PROGRESS': 
        return <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 w-fit"><Clock size={12}/> En cours</span>;
      case 'CLOSED': 
        return <span className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 w-fit"><CheckCircle2 size={12}/> Résolu</span>;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex bg-luxury-cream/30 min-h-screen font-sans">
        <Sidebar mode="client" />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-afrigari-gold animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex bg-luxury-cream/30 min-h-screen font-sans text-forest-night selection:bg-afrigari-gold selection:text-white">
      <Sidebar mode="client" />
      
      <main className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
        <TopNav title="Assistance & Support" isAdmin={false} />
        
        <div className="flex-1 p-8 lg:p-12 overflow-y-auto custom-scrollbar animate-reveal">
          <div className="max-w-7xl mx-auto space-y-12">
            
            {/* Header section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
              <div>
                <h1 className="text-5xl font-black tracking-tighter text-forest-night italic uppercase">Besoin d&apos;aide ?</h1>
                <p className="text-[10px] font-black text-forest-night/40 uppercase tracking-[0.4em] mt-2">Notre conciergerie digitale est à votre service</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-3 bg-forest-night text-white px-10 py-5 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-forest-night/20"
              >
                <Plus size={20} />
                Nouveau Ticket Support
              </button>
            </div>

            {/* Support Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="bg-white p-8 rounded-[3rem] border border-forest-night/5 shadow-sm space-y-4">
                  <div className="w-14 h-14 rounded-3xl bg-afrigari-gold/10 flex items-center justify-center text-afrigari-gold"><Zap size={28} /></div>
                  <h3 className="text-xl font-black tracking-tighter italic uppercase">Réponse Rapide</h3>
                  <p className="text-xs font-medium text-forest-night/50 leading-relaxed">Notre équipe s&apos;engage à traiter vos demandes en moins de 4 heures ouvrées.</p>
               </div>
               <div className="bg-white p-8 rounded-[3rem] border border-forest-night/5 shadow-sm space-y-4">
                  <div className="w-14 h-14 rounded-3xl bg-soft-mint flex items-center justify-center text-forest-night"><ShieldAlert size={28} /></div>
                  <h3 className="text-xl font-black tracking-tighter italic uppercase">Protection Totale</h3>
                  <p className="text-xs font-medium text-forest-night/50 leading-relaxed">Chaque achat est protégé. En cas de litige, l&apos;admin intervient en médiateur neutre.</p>
               </div>
               <div className="bg-white p-8 rounded-[3rem] border border-forest-night/5 shadow-sm space-y-4">
                  <div className="w-14 h-14 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-500"><LifeBuoy size={28} /></div>
                  <h3 className="text-xl font-black tracking-tighter italic uppercase">Guide Complet</h3>
                  <p className="text-xs font-medium text-forest-night/50 leading-relaxed">Consultez notre base de connaissance pour trouver des réponses instantanées.</p>
               </div>
            </div>

            {/* Tickets List */}
            <div className="bg-white rounded-[4rem] border border-forest-night/5 shadow-2xl overflow-hidden">
              <div className="p-10 border-b border-forest-night/5 bg-slate-50/30 flex flex-col md:flex-row gap-8 justify-between items-center">
                <div>
                   <h3 className="text-2xl font-black tracking-tighter text-forest-night italic uppercase">Mes Demandes en cours.</h3>
                   <p className="text-[10px] font-black text-forest-night/30 uppercase tracking-[0.3em] mt-1">Historique de vos échanges avec le support</p>
                </div>
                <div className="relative flex-1 max-w-md w-full">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-forest-night/20" size={20} />
                  <input 
                    type="text" 
                    placeholder="Chercher un ticket..." 
                    className="w-full pl-14 pr-6 py-4 bg-white border border-forest-night/5 rounded-3xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-afrigari-gold/5 focus:border-afrigari-gold/20 transition-all shadow-inner"
                  />
                </div>
              </div>

              {tickets.length === 0 ? (
                <div className="p-32 text-center flex flex-col items-center">
                  <div className="w-24 h-24 bg-luxury-cream rounded-full flex items-center justify-center text-forest-night/10 mb-8 animate-pulse">
                    <MessageSquare size={40} />
                  </div>
                  <p className="text-forest-night font-black italic uppercase tracking-[0.4em] text-sm">Aucun ticket ouvert</p>
                  <p className="text-xs font-bold text-forest-night/30 mt-4 uppercase tracking-widest">Tout semble en ordre dans votre espace.</p>
                </div>
              ) : (
                <div className="divide-y divide-forest-night/5">
                  {tickets.map(ticket => (
                    <div key={ticket.id} className="p-10 hover:bg-luxury-cream/10 transition-all flex items-center justify-between group cursor-pointer">
                      <div className="flex gap-8 items-center">
                        <div className="w-16 h-16 rounded-[2rem] bg-forest-night/5 text-forest-night/20 flex items-center justify-center shrink-0 group-hover:bg-forest-night group-hover:text-white group-hover:scale-110 transition-all duration-500">
                          <HelpCircle size={28} />
                        </div>
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <h3 className="text-xl font-black text-forest-night uppercase tracking-tighter">{ticket.subject}</h3>
                            {getStatusBadge(ticket.status)}
                          </div>
                          <div className="flex items-center gap-4 text-[10px] font-black text-forest-night/30">
                            <span className="px-3 py-1 bg-forest-night/5 rounded-lg">REF: {ticket.id.substring(0, 8).toUpperCase()}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-afrigari-gold"></span>
                            <span className="uppercase tracking-[0.2em]">{ticket.category}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-afrigari-gold"></span>
                            <span>Ouvert le {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>
                      <button className="w-12 h-12 bg-forest-night/5 rounded-2xl flex items-center justify-center text-forest-night/20 group-hover:bg-afrigari-gold group-hover:text-white transition-all shadow-lg">
                        <ChevronRight size={24} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* New Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-forest-night/60 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => !isSubmitting && setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-white rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(45,70,53,0.5)] border border-white/20 overflow-hidden animate-in zoom-in-95 fade-in duration-500">
            <div className="px-12 py-10 border-b border-forest-night/5 flex justify-between items-center bg-slate-50/30">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-afrigari-gold flex items-center justify-center text-white shadow-xl shadow-afrigari-gold/20">
                    <HelpCircle size={24} />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-forest-night uppercase italic tracking-tighter">Ouvrir un Dossier.</h3>
                   <p className="text-[10px] font-black text-forest-night/30 uppercase tracking-widest mt-1">Expliquez-nous la situation</p>
                </div>
              </div>
              <button 
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                className="w-12 h-12 flex items-center justify-center bg-white rounded-full transition-all text-forest-night/20 hover:text-forest-night hover:rotate-90 hover:bg-red-50"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-12 space-y-8">
              
              <div className="space-y-8">
                <div>
                  <label className="block text-[10px] font-black text-forest-night/40 uppercase tracking-[0.3em] mb-4">Objet de la demande</label>
                  <input 
                    type="text" 
                    required
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Ex: Retard sur ma commande #1234"
                    className="w-full px-8 py-5 bg-luxury-cream/30 border border-forest-night/5 rounded-[2rem] text-sm font-black focus:outline-none focus:ring-4 focus:ring-afrigari-gold/5 focus:border-afrigari-gold/20 transition-all placeholder:text-forest-night/20"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-forest-night/40 uppercase tracking-[0.3em] mb-4">Catégorie du litige</label>
                  <div className="grid grid-cols-2 gap-4">
                     {categories.map(c => (
                        <button 
                           key={c}
                           type="button"
                           onClick={() => setCategory(c)}
                           className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${category === c ? 'bg-forest-night text-white border-forest-night shadow-xl' : 'bg-white text-forest-night/40 border-forest-night/5 hover:border-afrigari-gold/30 hover:text-forest-night'}`}
                        >
                           {c}
                        </button>
                     ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-forest-night/40 uppercase tracking-[0.3em] mb-4">Message détaillé</label>
                  <textarea 
                    required
                    rows={5}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Décrivez précisément votre problème..."
                    className="w-full px-8 py-6 bg-luxury-cream/30 border border-forest-night/5 rounded-[2.5rem] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-afrigari-gold/5 focus:border-afrigari-gold/20 transition-all resize-none custom-scrollbar placeholder:text-forest-night/20"
                  ></textarea>
                </div>
              </div>

              <div className="pt-4 flex gap-6">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-6 bg-forest-night text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:scale-105 shadow-2xl shadow-forest-night/30 transition-all flex items-center justify-center gap-4 disabled:opacity-70 group"
                >
                  {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                  Soumettre au Support
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
