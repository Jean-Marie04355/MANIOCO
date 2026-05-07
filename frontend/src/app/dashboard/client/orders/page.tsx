"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, ChevronLeft, Clock, CheckCircle2, Truck, Package, Search, Loader2, AlertOctagon, X, Send, Store } from 'lucide-react';
import api from '@/lib/axios';
import { useAuth } from '@/features/auth/AuthContext';

export default function ClientOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedOrderToReport, setSelectedOrderToReport] = useState<any>(null);
  const [reportReason, setReportReason] = useState('ARNAQUE');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const handleOpenReport = (order: any) => {
    setSelectedOrderToReport(order);
    setIsReportModalOpen(true);
  };

  const handleSubmitReport = async () => {
    if (!reportDescription.trim()) return;
    setIsSubmittingReport(true);
    try {
      await api.post('/reports', { 
        orderId: selectedOrderToReport.id, 
        sellerId: selectedOrderToReport.store?.ownerId || selectedOrderToReport.sellerId,
        storeId: selectedOrderToReport.storeId,
        reason: reportReason, 
        description: reportDescription 
      });
      setIsReportModalOpen(false);
      setReportDescription('');
      alert("Signalement envoyé avec succès. Notre équipe va l'examiner.");
    } catch (error) {
      console.error("Erreur");
      alert("Erreur lors de l'envoi du signalement.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders');
        setOrders(res.data);
      } catch (error) {
        console.error("Erreur chargement commandes");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) fetchOrders();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="text-amber-500" size={16} />;
      case 'PAID': return <CheckCircle2 className="text-blue-500" size={16} />;
      case 'SHIPPED': return <Truck className="text-orange-500" size={16} />;
      case 'DELIVERED': return <Package className="text-green-500" size={16} />;
      default: return <Clock className="text-slate-400" size={16} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'En attente';
      case 'PAID': return 'En cours';
      case 'SHIPPED': return 'En route';
      case 'DELIVERED': return 'Livree';
      case 'CANCELLED': return 'Annulee';
      default: return status;
    }
  };

  return (
    <div className="bg-organic-cream min-h-screen text-forest-green selection:bg-afrigari-gold selection:text-white font-sans">
      
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-[200] transition-all duration-700 px-8 ${scrolled ? 'py-4' : 'py-10'}`}>
         <div className={`max-w-7xl mx-auto flex justify-between items-center px-10 py-5 transition-all duration-500 ${scrolled ? 'glass-premium rounded-full px-12 shadow-2xl' : ''}`}>
            <Link href="/dashboard/client" className="flex items-center gap-4 group">
               <div className="w-10 h-10 rounded-full border border-forest-green/10 flex items-center justify-center group-hover:bg-forest-green group-hover:text-white transition-all">
                  <ChevronLeft size={20} />
               </div>
               <span className="font-black text-xs uppercase tracking-widest hidden md:block">Retour au Dashboard</span>
            </Link>

            <div className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-lg bg-forest-green flex items-center justify-center text-white scale-110 group-hover:rotate-12 transition-transform">
                   <ShoppingBag size={16} />
                </div>
                <span className="font-black text-xl tracking-tighter uppercase font-display italic">AFRIGARI</span>
            </div>

            <div className="w-10 h-10 rounded-full border-2 border-white shadow-xl overflow-hidden relative bg-forest-green/5 flex items-center justify-center text-forest-green font-bold uppercase">
               {user?.profilePhoto ? (
                  <img src={user.profilePhoto} className="w-full h-full object-cover" />
               ) : (
                  <span>{user?.name?.[0] || 'U'}</span>
               )}
            </div>
         </div>
      </nav>

      <main className="max-w-4xl mx-auto pt-40 pb-20 px-8">
         <header className="mb-12 animate-reveal">
            <h1 className="text-5xl font-black tracking-tighter uppercase mb-4 italic">Suivi de <span className="text-afrigari-gold">Commandes</span></h1>
            <p className="text-xs font-bold text-forest-green/40 uppercase tracking-widest">Retrouvez l'historique et le statut de vos achats premium.</p>
         </header>

         {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 w-full bg-white/50 rounded-[48px] border-2 border-dashed border-forest-green/10">
               <Loader2 size={40} className="animate-spin text-forest-green" />
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-forest-green/40">Chargement de vos trésors...</p>
            </div>
         ) : orders.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-[48px] border border-forest-green/5 shadow-xl">
               <ShoppingBag size={64} className="mx-auto mb-6 text-forest-green/10" />
               <h3 className="text-xl font-black mb-2">Aucune commande</h3>
               <p className="text-xs text-forest-green/40 font-bold mb-8">Il semblerait que vous n'ayez pas encore passé de commande.</p>
               <Link href="/dashboard/client" className="bg-forest-green text-white px-10 py-4 rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all">
                  Commencer mes achats
               </Link>
            </div>
         ) : (
            <div className="space-y-6">
               {orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-[32px] p-6 shadow-xl border border-forest-green/5 hover:border-forest-green/20 transition-all group animate-reveal">
                     <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-4 border-b border-forest-green/5">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-forest-green/5 flex items-center justify-center text-forest-green">
                              <Package size={20} />
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Commande #{order.id.substring(0, 8).toUpperCase()}</p>
                              <p className="text-sm font-black italic">{new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                              {order.store?.name && (
                                 <div className="flex items-center gap-1.5 mt-1">
                                    <Store size={12} className="text-afrigari-gold" />
                                    <p className="text-[10px] font-black uppercase text-afrigari-gold tracking-wider">{order.store.name}</p>
                                 </div>
                              )}
                           </div>
                        </div>
                        
                        <div className="flex items-center gap-3 px-6 py-3 bg-forest-green/5 rounded-2xl group-hover:bg-forest-green/10 transition-colors">
                           {getStatusIcon(order.status)}
                           <span className="text-[10px] font-black uppercase tracking-widest">{getStatusLabel(order.status)}</span>
                        </div>
                     </div>

                     {/* Motif d'annulation */}
                     {order.status === 'CANCELLED' && order.cancellationReason && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                           <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center text-red-500 shrink-0 mt-0.5">
                              <ShoppingBag size={14} />
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Motif d'annulation</p>
                              <p className="text-sm font-bold text-red-600">{order.cancellationReason}</p>
                           </div>
                        </div>
                     )}

                     <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                        <div className="flex flex-col gap-3">
                           <div className="flex -space-x-3">
                              {order.items?.map((item: any, i: number) => (
                                 <div key={i} className="w-10 h-10 rounded-xl border-[3px] border-white overflow-hidden shadow-sm" title={item.productName}>
                                    <img src={item.productImage || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=100"} className="w-full h-full object-cover" />
                                 </div>
                              ))}
                              {order.items?.length > 3 && (
                                 <div className="w-10 h-10 rounded-xl border-[3px] border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 shadow-sm">
                                    +{order.items.length - 3}
                                 </div>
                              )}
                           </div>
                           <div className="flex flex-wrap gap-2">
                              {order.items?.map((item: any, i: number) => (
                                 <span key={i} className="text-[10px] font-black uppercase tracking-widest text-forest-green/60 bg-forest-green/5 px-3 py-1 rounded-full">
                                    {item.productName} {item.quantity > 1 ? `(x${item.quantity})` : ''}
                                 </span>
                              ))}
                           </div>
                        </div>
                           
                        <div className="text-right shrink-0">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Payé</p>
                           <p className="text-2xl font-black text-forest-green tracking-tighter mb-4">{Number(order.totalAmount).toLocaleString()} FCFA</p>
                           <button 
                              onClick={() => handleOpenReport(order)}
                              title="Signaler un problème avec ce vendeur"
                              className="w-10 h-10 flex items-center justify-center rounded-full border border-red-100 text-red-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm group/report ml-auto"
                           >
                              <AlertOctagon size={18} className="group-hover/report:scale-110 transition-transform" />
                           </button>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         )}
      </main>

      {/* Modal de Signalement */}
      {isReportModalOpen && selectedOrderToReport && (
        <div className="fixed inset-0 z-[500] bg-forest-green/40 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-reveal">
          <div className="bg-white rounded-[40px] p-8 md:p-12 w-full max-w-lg shadow-2xl relative border border-forest-green/10">
            <button 
              onClick={() => setIsReportModalOpen(false)}
              className="absolute top-8 right-8 w-10 h-10 bg-forest-green/5 text-forest-green rounded-full flex items-center justify-center hover:bg-forest-green/10 transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-sm border border-red-100">
              <AlertOctagon size={32} />
            </div>
            
            <h3 className="text-2xl font-black text-forest-green uppercase tracking-tight mb-2">
              Signaler le vendeur <span className="text-afrigari-gold italic">{selectedOrderToReport.store?.name || selectedOrderToReport.seller?.name || selectedOrderToReport.sellerName || "lié à cette commande"}</span>
            </h3>
            <p className="text-xs font-bold text-forest-green/60 uppercase tracking-widest mb-8">
              Commande #{selectedOrderToReport.id.substring(0, 8).toUpperCase()}
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-forest-green/60 mb-2">Motif du signalement</label>
                <div className="relative">
                   <select 
                     value={reportReason}
                     onChange={(e) => setReportReason(e.target.value)}
                     className="w-full bg-forest-green/5 border-none rounded-2xl p-4 pr-10 text-forest-green font-bold focus:ring-2 focus:ring-afrigari-gold outline-none appearance-none"
                   >
                     <option value="ARNAQUE">Arnaque / Fraude</option>
                     <option value="CONTREFAÇON">Produit non conforme / Contrefaçon</option>
                     <option value="OFFENSANT">Comportement inapproprié / Harcèlement</option>
                     <option value="RETARD">Retard abusif / Non livré</option>
                     <option value="AUTRE">Autre problème</option>
                   </select>
                   <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-forest-green/40">
                      ▼
                   </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-forest-green/60 mb-2">Description du problème</label>
                <textarea 
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Expliquez en détail ce qui s'est passé avec ce vendeur..."
                  className="w-full bg-forest-green/5 border-none rounded-2xl p-4 text-forest-green placeholder:text-forest-green/30 min-h-[120px] resize-none focus:ring-2 focus:ring-afrigari-gold outline-none text-sm font-medium"
                ></textarea>
              </div>

              <button 
                onClick={handleSubmitReport}
                disabled={isSubmittingReport || !reportDescription.trim()}
                className="w-full flex items-center justify-center gap-3 bg-red-500 text-white p-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/20"
              >
                {isSubmittingReport ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                Envoyer le signalement
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

