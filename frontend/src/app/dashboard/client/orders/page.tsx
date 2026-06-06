"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShoppingBag, Clock, CheckCircle2, Truck, Package, Search, Loader2, AlertOctagon, X, Send, Store, Star } from 'lucide-react';
import api from '@/lib/axios';
import { useAuth } from '@/features/auth/AuthContext';

export default function ClientOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedOrderToReport, setSelectedOrderToReport] = useState<any>(null);
  const [reportReason, setReportReason] = useState('ARNAQUE');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // States for reviews modal and confirmation
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewingOrder, setReviewingOrder] = useState<any>(null);
  const [reviewsState, setReviewsState] = useState<Record<string, { rating: number; comment: string }>>({});
  const [isSubmittingReviews, setIsSubmittingReviews] = useState(false);
  const [isReviewFocusHandled, setIsReviewFocusHandled] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'DELIVERED' | 'FAILED_CANCELLED'>('ALL');
  
  const searchParams = useSearchParams();
  const router = useRouter();

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
      console.error("Erreur lors de l'envoi du signalement", error);
      alert("Erreur lors de l'envoi du signalement.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleConfirmReceipt = async (order: any, received: boolean) => {
    if (!received) {
      if (!confirm("Confirmez-vous que vous n'avez pas reçu votre colis ? Cela signalera un échec de livraison aux administrateurs et au vendeur.")) {
        return;
      }
    }

    try {
      const newStatus = received ? 'DELIVERED' : 'FAILED';
      await api.patch(`/orders/${order.id}/status`, { status: newStatus });
      
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o));
      
      if (received) {
        const initialReviews: Record<string, { rating: number; comment: string }> = {};
        order.items?.forEach((item: any) => {
          initialReviews[item.productId] = { rating: 5, comment: '' };
        });
        setReviewsState(initialReviews);
        setReviewingOrder(order);
        setIsReviewModalOpen(true);
      } else {
        alert("Statut de livraison mis à jour : Échec de livraison de la commande signalé.");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de livraison", error);
      alert("Erreur lors de la confirmation du statut.");
    }
  };

  const handleSubmitReviews = async () => {
    setIsSubmittingReviews(true);
    try {
      const promises = Object.entries(reviewsState).map(([productId, state]) => 
        api.post(`/products/${productId}/reviews`, {
          rating: state.rating,
          comment: state.comment
        })
      );
      
      await Promise.all(promises);
      setIsReviewModalOpen(false);
      setReviewingOrder(null);
      alert("Merci pour vos avis ! Vos évaluations ont été enregistrées avec succès.");
    } catch (error) {
      console.error("Erreur lors de l'envoi des avis", error);
      alert("Une erreur est survenue lors de l'enregistrement de vos avis.");
    } finally {
      setIsSubmittingReviews(false);
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders');
        setOrders(res.data);

        if (searchParams?.get('focus') === 'review' && !isReviewFocusHandled) {
          const reviewableOrder = res.data.find((order: any) => order.status === 'DELIVERED');
          if (reviewableOrder) {
            const initialReviews: Record<string, { rating: number; comment: string }> = {};
            reviewableOrder.items?.forEach((item: any) => {
              initialReviews[item.productId] = { rating: 5, comment: '' };
            });
            setReviewsState(initialReviews);
            setReviewingOrder(reviewableOrder);
            setIsReviewModalOpen(true);
          }
          setIsReviewFocusHandled(true);
          router.replace('/dashboard/client/orders');
        }
      } catch (error) {
        console.error("Erreur chargement commandes", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) fetchOrders();
  }, [user, searchParams, isReviewFocusHandled, router]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock size={14} />;
      case 'PAID': return <CheckCircle2 size={14} />;
      case 'SHIPPED': return <Truck size={14} />;
      case 'DELIVERED': return <Package size={14} />;
      case 'FAILED': return <AlertOctagon size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'En attente';
      case 'PAID': return 'Confirmée';
      case 'SHIPPED': return 'En cours de livraison';
      case 'DELIVERED': return 'Livrée';
      case 'FAILED': return 'Échec de livraison';
      case 'CANCELLED': return 'Annulée';
      default: return status;
    }
  };

  const totalOrders = orders.length;
  const deliveredCount = orders.filter(o => o.status === 'DELIVERED').length;
  const shippedCount = orders.filter(o => o.status === 'SHIPPED').length;
  const pendingCount = orders.filter(o => o.status === 'PENDING' || o.status === 'PAID').length;
  const failedCount = orders.filter(o => o.status === 'FAILED' || o.status === 'CANCELLED').length;

  const filteredOrders = orders.filter(order => {
    if (filter === 'ACTIVE') {
      return ['PENDING', 'PAID', 'SHIPPED'].includes(order.status);
    }
    if (filter === 'DELIVERED') {
      return order.status === 'DELIVERED';
    }
    if (filter === 'FAILED_CANCELLED') {
      return ['FAILED', 'CANCELLED'].includes(order.status);
    }
    return true;
  });

  return (
    <div className="bg-[#FAF7F2] min-h-screen text-manioco-brown font-sans pb-16">
      
      {/* Sleek dashboard header */}
      <div className="bg-white border-b border-manioco-brown/5">
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-manioco-brown">Mes Commandes</h1>
              <p className="text-sm text-manioco-brown/60 mt-1">Suivez en temps réel la préparation et la livraison de vos achats.</p>
            </div>
            
            {/* Quick clean counters */}
            <div className="flex flex-wrap gap-3">
              <div className="bg-[#FAF7F2] px-4 py-2 rounded-2xl border border-manioco-brown/5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-manioco-terracotta/10 flex items-center justify-center text-manioco-terracotta">
                  <ShoppingBag size={15} />
                </div>
                <div>
                  <p className="text-[9px] text-manioco-brown/40 font-bold uppercase tracking-wider">Total</p>
                  <p className="text-sm font-extrabold text-manioco-brown leading-tight">{totalOrders}</p>
                </div>
              </div>
              
              <div className="bg-[#FAF7F2] px-4 py-2 rounded-2xl border border-manioco-brown/5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <Truck size={15} />
                </div>
                <div>
                  <p className="text-[9px] text-manioco-brown/40 font-bold uppercase tracking-wider">En cours</p>
                  <p className="text-sm font-extrabold text-manioco-brown leading-tight">{pendingCount + shippedCount}</p>
                </div>
              </div>

              <div className="bg-[#FAF7F2] px-4 py-2 rounded-2xl border border-manioco-brown/5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                  <CheckCircle2 size={15} />
                </div>
                <div>
                  <p className="text-[9px] text-manioco-brown/40 font-bold uppercase tracking-wider">Livrées</p>
                  <p className="text-sm font-extrabold text-manioco-brown leading-tight">{deliveredCount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 mt-8">
        
        {/* Navigation tabs */}
        <div className="flex border-b border-manioco-brown/10 mb-6 gap-6 overflow-x-auto pb-px scrollbar-hide">
          {[
            { id: 'ALL', label: 'Toutes', count: totalOrders },
            { id: 'ACTIVE', label: 'En cours', count: pendingCount + shippedCount },
            { id: 'DELIVERED', label: 'Livrées', count: deliveredCount },
            { id: 'FAILED_CANCELLED', label: 'Annulées & Échecs', count: failedCount },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`pb-4 px-1 text-sm font-bold transition-all relative shrink-0 flex items-center gap-2 ${
                filter === tab.id
                  ? 'text-manioco-terracotta border-b-2 border-manioco-terracotta'
                  : 'text-manioco-brown/50 hover:text-manioco-brown'
              }`}
            >
              {tab.label}
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                filter === tab.id
                  ? 'bg-manioco-terracotta/10 text-manioco-terracotta'
                  : 'bg-manioco-brown/5 text-manioco-brown/40'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 w-full">
            <Loader2 size={32} className="animate-spin text-manioco-terracotta" />
            <p className="text-xs text-manioco-brown/50 font-medium">Chargement de vos commandes...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-manioco-brown/5 shadow-sm p-8">
            <ShoppingBag size={48} className="mx-auto mb-4 text-manioco-brown/10" />
            <h3 className="text-lg font-bold mb-1">Aucune commande</h3>
            <p className="text-xs text-manioco-brown/50 mb-6 max-w-sm mx-auto">Vous n'avez pas de commande dans cette catégorie pour le moment.</p>
            <Link href="/produits" className="inline-block bg-manioco-terracotta text-white px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider hover:bg-manioco-brown transition-colors">
              Explorer nos produits
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredOrders.map(order => (
              <div key={order.id} className="bg-white rounded-3xl border border-manioco-brown/5 shadow-[0_2px_15px_rgba(92,45,35,0.02)] p-5 md:p-6 hover:shadow-[0_4px_25px_rgba(92,45,35,0.05)] transition-shadow">
                
                {/* Order Top Info */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-manioco-brown/5 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-manioco-cream flex items-center justify-center text-manioco-terracotta">
                      <Store size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-manioco-brown text-base leading-tight">{order.store?.name || 'Vendeur officiel'}</h3>
                      <p className="text-[11px] text-manioco-brown/40 font-medium mt-0.5">
                        Commande #{order.id.substring(0, 8).toUpperCase()} • {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                    order.status === 'PENDING' ? 'text-amber-700 bg-amber-50 border border-amber-100/50' :
                    order.status === 'PAID' ? 'text-blue-700 bg-blue-50 border border-blue-100/50' :
                    order.status === 'SHIPPED' ? 'text-orange-700 bg-orange-50 border border-orange-100/50' :
                    order.status === 'DELIVERED' ? 'text-green-700 bg-green-50 border border-green-100/50' :
                    'text-red-700 bg-red-50 border border-red-100/50'
                  }`}>
                    {getStatusIcon(order.status)}
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                {/* Items List */}
                <div className="space-y-4 py-2">
                  {order.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.productImage || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=100"}
                          alt={item.productName}
                          className="w-12 h-12 rounded-xl object-cover border border-manioco-brown/5 shrink-0"
                        />
                        <div>
                          <p className="font-semibold text-manioco-brown text-sm leading-tight">{item.productName}</p>
                          <p className="text-xs text-manioco-brown/40 font-medium mt-0.5">Quantité : {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-bold text-sm text-manioco-brown shrink-0">
                        {Number(item.price * item.quantity).toLocaleString()} FCFA
                      </p>
                    </div>
                  ))}
                </div>

                {/* Cancellation details */}
                {order.status === 'CANCELLED' && order.cancellationReason && (
                  <div className="mt-3 p-4 bg-red-50 rounded-2xl border border-red-100 text-xs text-red-700 flex gap-2">
                    <AlertOctagon size={16} className="shrink-0 text-red-500" />
                    <div>
                      <span className="font-bold">Motif de l'annulation : </span>
                      {order.cancellationReason}
                    </div>
                  </div>
                )}

                {/* Footer and Actions */}
                <div className="mt-4 pt-4 border-t border-manioco-brown/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <p className="text-sm font-bold text-manioco-brown">
                    Total : <span className="text-manioco-terracotta text-base ml-1">{Number(order.totalAmount).toLocaleString()} FCFA</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Report action button */}
                    <button
                      onClick={() => handleOpenReport(order)}
                      className="px-3.5 py-2 text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full border border-transparent hover:border-red-200 transition-colors flex items-center gap-1.5"
                    >
                      <AlertOctagon size={13} />
                      Signaler un problème
                    </button>

                    {/* Pending delivery buttons */}
                    {order.status === 'SHIPPED' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleConfirmReceipt(order, false)}
                          className="px-4 py-2 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-full transition-colors shadow-sm"
                        >
                          Colis non reçu
                        </button>
                        <button
                          onClick={() => handleConfirmReceipt(order, true)}
                          className="px-4 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-full transition-colors shadow-sm"
                        >
                          Colis reçu
                        </button>
                      </div>
                    )}

                    {/* Review delivered items */}
                    {order.status === 'DELIVERED' && (
                      <button
                        onClick={() => {
                          const initialReviews: Record<string, { rating: number; comment: string }> = {};
                          order.items?.forEach((item: any) => {
                            initialReviews[item.productId] = { rating: 5, comment: '' };
                          });
                          setReviewsState(initialReviews);
                          setReviewingOrder(order);
                          setIsReviewModalOpen(true);
                        }}
                        className="px-4 py-2 text-xs font-bold text-white bg-manioco-terracotta hover:bg-manioco-brown rounded-full transition-colors shadow-sm"
                      >
                        Donner mon avis
                      </button>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* Report Modal */}
      {isReportModalOpen && selectedOrderToReport && (
        <div className="fixed inset-0 z-[500] bg-manioco-brown/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-6 md:p-8 w-full max-w-md shadow-2xl relative border border-manioco-brown/5">
            <button 
              onClick={() => setIsReportModalOpen(false)}
              className="absolute top-6 right-6 w-8 h-8 bg-manioco-terracotta/10 text-manioco-terracotta rounded-full flex items-center justify-center hover:bg-manioco-terracotta/20 transition-colors"
            >
              <X size={16} />
            </button>
            
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 border border-red-100">
              <AlertOctagon size={24} />
            </div>
            
            <h3 className="text-xl font-bold text-manioco-brown mb-1">
              Signaler le vendeur
            </h3>
            <p className="text-xs text-manioco-brown/60 mb-6">
              Vendeur : <span className="font-bold text-manioco-terracotta">{selectedOrderToReport.store?.name || "inconnu"}</span> (Commande #{selectedOrderToReport.id.substring(0, 8).toUpperCase()})
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="reportReason" className="block text-[10px] font-bold uppercase tracking-wider text-manioco-brown/60 mb-2">Motif du signalement</label>
                <div className="relative">
                   <select 
                     id="reportReason"
                     value={reportReason}
                     onChange={(e) => setReportReason(e.target.value)}
                     className="w-full bg-manioco-cream border border-manioco-brown/5 rounded-xl p-3 pr-10 text-manioco-brown font-bold text-sm focus:ring-2 focus:ring-manioco-terracotta outline-none appearance-none"
                   >
                     <option value="ARNAQUE">Arnaque / Fraude</option>
                     <option value="CONTREFAÇON">Produit non conforme</option>
                     <option value="OFFENSANT">Comportement inapproprié</option>
                     <option value="RETARD">Retard abusif / Non livré</option>
                     <option value="AUTRE">Autre problème</option>
                   </select>
                   <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-manioco-brown/40 text-[10px]">
                      ▼
                   </div>
                </div>
              </div>

              <div>
                <label htmlFor="reportDescription" className="block text-[10px] font-bold uppercase tracking-wider text-manioco-brown/60 mb-2">Détails</label>
                <textarea 
                  id="reportDescription"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Veuillez décrire le problème rencontré avec ce vendeur..."
                  className="w-full bg-manioco-cream border border-manioco-brown/5 rounded-xl p-3 text-manioco-brown placeholder:text-manioco-brown/30 min-h-[100px] resize-none focus:ring-2 focus:ring-manioco-terracotta outline-none text-xs font-medium"
                ></textarea>
              </div>

              <button 
                onClick={handleSubmitReport}
                disabled={isSubmittingReport || !reportDescription.trim()}
                className="w-full flex items-center justify-center gap-2 bg-red-500 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {isSubmittingReport ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Envoyer le signalement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews Modal */}
      {isReviewModalOpen && reviewingOrder && (
         <div className="fixed inset-0 z-[500] bg-manioco-brown/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-[32px] p-6 md:p-8 w-full max-w-lg shadow-2xl relative border border-manioco-brown/5 my-8">
               <button 
                  onClick={() => { setIsReviewModalOpen(false); setReviewingOrder(null); }}
                  className="absolute top-6 right-6 w-8 h-8 bg-manioco-terracotta/10 text-manioco-terracotta rounded-full flex items-center justify-center hover:bg-manioco-terracotta/20 transition-colors"
               >
                  <X size={16} />
               </button>

               <div className="w-12 h-12 bg-manioco-terracotta/10 text-manioco-terracotta rounded-full flex items-center justify-center mb-4 border border-manioco-terracotta/10">
                  <CheckCircle2 size={24} />
               </div>

               <h3 className="text-xl font-bold text-manioco-brown mb-1">
                  Évaluez vos produits !
               </h3>
               <p className="text-xs text-manioco-brown/60 mb-6">
                  Commande #{reviewingOrder.id.substring(0, 8).toUpperCase()}. Aidez-nous à évaluer vos articles :
               </p>

               <div className="space-y-6 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar mb-6">
                  {reviewingOrder.items?.map((item: any) => {
                     const currentProductState = reviewsState[item.productId] || { rating: 5, comment: '' };
                     return (
                        <div key={item.productId} className="p-4 bg-manioco-cream rounded-2xl border border-manioco-brown/5 flex flex-col gap-3">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white border border-manioco-brown/5 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                 {item.productImage ? (
                                    <img src={item.productImage} className="w-full h-full object-cover" alt={item.productName} />
                                 ) : (
                                    <Package size={18} className="text-manioco-brown/20" />
                                 )}
                              </div>
                              <div className="flex-1 min-w-0">
                                 <h4 className="text-xs font-bold text-manioco-brown truncate">{item.productName}</h4>
                                 <p className="text-[10px] text-manioco-brown/40 font-bold uppercase mt-0.5">Quantité : {item.quantity}</p>
                              </div>
                           </div>

                           <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-manioco-brown/50 mb-1.5">Note</p>
                              <div className="flex gap-1">
                                 {[1, 2, 3, 4, 5].map((starValue) => (
                                    <button
                                       type="button"
                                       key={starValue}
                                       onClick={() => {
                                          setReviewsState(prev => ({
                                             ...prev,
                                             [item.productId]: {
                                                ...currentProductState,
                                                rating: starValue
                                             }
                                          }));
                                       }}
                                       className="transition-transform active:scale-90 hover:scale-105"
                                    >
                                       <Star 
                                          size={22} 
                                          className={`transition-colors ${
                                             starValue <= currentProductState.rating 
                                                ? 'fill-manioco-terracotta text-manioco-terracotta' 
                                                : 'text-slate-300'
                                          }`} 
                                       />
                                    </button>
                                 ))}
                              </div>
                           </div>

                           <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-manioco-brown/50 mb-1.5">
                                 Commentaire (Optionnel)
                              </label>
                              <textarea
                                 value={currentProductState.comment}
                                 onChange={(e) => {
                                    setReviewsState(prev => ({
                                       ...prev,
                                       [item.productId]: {
                                          ...currentProductState,
                                          comment: e.target.value
                                       }
                                    }));
                                 }}
                                 placeholder="Votre avis sur la qualité de ce produit..."
                                 className="w-full bg-white border border-manioco-brown/5 rounded-xl p-3 text-manioco-brown placeholder:text-manioco-brown/30 min-h-[60px] resize-none focus:ring-2 focus:ring-manioco-terracotta outline-none text-xs font-medium"
                              />
                           </div>
                        </div>
                     );
                  })}
               </div>

               <div className="flex gap-3 flex-col sm:flex-row">
                  <button 
                     onClick={() => { setIsReviewModalOpen(false); setReviewingOrder(null); }}
                     className="flex-1 py-3 bg-manioco-cream hover:bg-manioco-cream/80 text-manioco-brown text-xs font-bold rounded-xl border border-manioco-brown/5 transition-all uppercase tracking-wider"
                  >
                     Plus tard
                  </button>
                  <button 
                     onClick={handleSubmitReviews}
                     disabled={isSubmittingReviews}
                     className="flex-1 py-3 bg-manioco-terracotta hover:bg-manioco-brown text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50 transition-all uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                     {isSubmittingReviews ? <Loader2 size={14} className="animate-spin" /> : 'Soumettre'}
                  </button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
}
