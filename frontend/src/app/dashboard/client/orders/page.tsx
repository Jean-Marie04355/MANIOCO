"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShoppingBag, ChevronLeft, Clock, CheckCircle2, Truck, Package, Search, Loader2, AlertOctagon, X, Send, Store, Star } from 'lucide-react';
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

  // States for reviews modal and confirmation
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewingOrder, setReviewingOrder] = useState<any>(null);
  const [reviewsState, setReviewsState] = useState<Record<string, { rating: number; comment: string }>>({});
  const [isSubmittingReviews, setIsSubmittingReviews] = useState(false);
  const [isReviewFocusHandled, setIsReviewFocusHandled] = useState(false);
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
      
      // Mettre à jour l'état local
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o));
      
      if (received) {
        // Initialiser l'état des avis pour chaque produit de la commande
        const initialReviews: Record<string, { rating: number; comment: string }> = {};
        order.items?.forEach((item: any) => {
          initialReviews[item.productId] = { rating: 5, comment: '' };
        });
        setReviewsState(initialReviews);
        setReviewingOrder(order);
        setIsReviewModalOpen(true);
      } else {
        alert("Statut de livraison mis à jour : Échec de livraison signalé.");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de livraison", error);
      alert("Erreur lors de la confirmation du statut.");
    }
  };

  const handleSubmitReviews = async () => {
    setIsSubmittingReviews(true);
    try {
      // Envoyer un avis pour chaque produit
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
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
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
    return () => window.removeEventListener('scroll', handleScroll);
  }, [user, searchParams, isReviewFocusHandled, router]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="text-amber-500" size={16} />;
      case 'PAID': return <CheckCircle2 className="text-blue-500" size={16} />;
      case 'SHIPPED': return <Truck className="text-orange-500" size={16} />;
      case 'DELIVERED': return <Package className="text-green-500" size={16} />;
      case 'FAILED': return <AlertOctagon className="text-red-500" size={16} />;
      default: return <Clock className="text-slate-400" size={16} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'En attente';
      case 'PAID': return 'En cours';
      case 'SHIPPED': return 'En route';
      case 'DELIVERED': return 'Livrée avec succès';
      case 'FAILED': return 'Échec de livraison';
      case 'CANCELLED': return 'Annulée';
      default: return status;
    }
  };

  const totalOrders = orders.length;
  const deliveredCount = orders.filter(o => o.status === 'DELIVERED').length;
  const shippedCount = orders.filter(o => o.status === 'SHIPPED').length;
  const pendingCount = orders.filter(o => o.status === 'PENDING' || o.status === 'PAID').length;
  const failedCount = orders.filter(o => o.status === 'FAILED').length;

   return (
      <div className="bg-[#fefaf2] min-h-screen text-manioco-brown font-sans overflow-x-hidden">
      
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-[200] transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(92,45,35,0.12)]' : 'bg-white/80 backdrop-blur-xl'}`}>
         <div className="max-w-[1400px] mx-auto flex items-center justify-between px-6 lg:px-12 py-4">
            <Link href="/dashboard/client" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.35em] text-manioco-brown/70 hover:text-manioco-brown transition-all">
               <ChevronLeft size={16} />
               Retour
            </Link>

            <div className="flex items-center gap-4">
               <div className="flex items-center gap-1">
                  <span className="text-2xl font-black tracking-tight text-manioco-brown">Mani</span>
                  <span className="relative inline-flex items-center justify-center w-7 h-7 rounded-full bg-manioco-terracotta border-[2px] border-manioco-brown text-manioco-brown text-sm font-black">o</span>
                  <span className="text-2xl font-black tracking-tight text-manioco-brown">c</span>
                  <span className="relative inline-flex items-center justify-center w-7 h-7 rounded-full bg-manioco-terracotta border-[2px] border-manioco-brown text-manioco-brown text-sm font-black">o</span>
               </div>
               <span className="hidden md:inline-flex text-[10px] uppercase tracking-[0.35em] font-black text-manioco-brown/40">Vue premium</span>
            </div>

            <div className="w-11 h-11 rounded-full border border-manioco-brown/10 bg-white shadow-[0_14px_30px_rgba(92,45,35,0.12)] flex items-center justify-center overflow-hidden">
               <UserProfilePhoto user={user} />
            </div>
         </div>
      </nav>

      <main className="pt-28">
         <section className="relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top_right,_rgba(244,162,97,0.18),_transparent_40%)] pointer-events-none" />
            <div className="bg-[radial-gradient(circle_1200px_at_top_right,_rgba(244,162,97,0.18),transparent_35%),radial-gradient(circle_800px_at_10%_20%,rgba(92,45,35,0.08),transparent_30%),#fff7ed] rounded-b-[4rem] pt-28 pb-20 px-6 lg:px-12 shadow-[0_40px_100px_rgba(92,45,35,0.1)]">
               <div className="max-w-[1400px] mx-auto grid gap-12 lg:grid-cols-[1.4fr_0.9fr] items-center">
                  <div className="space-y-8">
                     <p className="text-[10px] font-black uppercase tracking-[0.35em] text-manioco-terracotta/90">Espace commandes · Manioco</p>
                     <h1 className="max-w-3xl text-5xl md:text-[56px] font-black tracking-tight text-manioco-brown leading-tight">Un suivi ultra stylé de vos achats, du panier à la livraison.</h1>
                     <p className="max-w-2xl text-base md:text-lg text-manioco-brown/75 leading-8">Découvrez un tableau de bord premium avec des statuts clairs, des actions rapides et des commandes organisées dans un univers élégant et chaleureux.</p>
                     <div className="flex flex-wrap gap-3">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-3 text-xs font-black uppercase tracking-[0.32em] text-manioco-brown shadow-sm border border-manioco-brown/10">{deliveredCount} livrées</span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-manioco-terracotta/10 px-4 py-3 text-xs font-black uppercase tracking-[0.32em] text-manioco-terracotta shadow-sm border border-manioco-terracotta/20">{shippedCount} en transit</span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-manioco-cream px-4 py-3 text-xs font-black uppercase tracking-[0.32em] text-manioco-brown shadow-sm border border-manioco-brown/10">{totalOrders} commandes</span>
                     </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                     <div className="rounded-[2.5rem] bg-white/95 p-7 border border-white/80 shadow-[0_25px_65px_rgba(92,45,35,0.09)] backdrop-blur-xl">
                        <p className="text-[10px] uppercase tracking-[0.35em] text-manioco-brown/40 mb-3">Commandes totales</p>
                        <p className="text-5xl font-black text-manioco-terracotta">{totalOrders}</p>
                        <p className="mt-4 text-sm text-manioco-brown/60">Un aperçu rapide de votre activité d’achat.</p>
                     </div>
                     <div className="rounded-[2.5rem] bg-white/95 p-7 border border-white/80 shadow-[0_25px_65px_rgba(92,45,35,0.09)] backdrop-blur-xl">
                        <p className="text-[10px] uppercase tracking-[0.35em] text-manioco-brown/40 mb-3">Livrées</p>
                        <p className="text-5xl font-black text-manioco-brown">{deliveredCount}</p>
                        <p className="mt-4 text-sm text-manioco-brown/60">Les colis arrivés et prêts pour vos avis.</p>
                     </div>
                     <div className="rounded-[2.5rem] bg-white/95 p-7 border border-white/80 shadow-[0_25px_65px_rgba(92,45,35,0.09)] backdrop-blur-xl">
                        <p className="text-[10px] uppercase tracking-[0.35em] text-manioco-brown/40 mb-3">En transit</p>
                        <p className="text-5xl font-black text-manioco-terracotta">{shippedCount}</p>
                        <p className="mt-4 text-sm text-manioco-brown/60">Vos achats sont en route vers chez vous.</p>
                     </div>
                     <div className="rounded-[2.5rem] bg-white/95 p-7 border border-white/80 shadow-[0_25px_65px_rgba(92,45,35,0.09)] backdrop-blur-xl">
                        <p className="text-[10px] uppercase tracking-[0.35em] text-manioco-brown/40 mb-3">À vérifier</p>
                        <p className="text-5xl font-black text-manioco-brown">{failedCount}</p>
                        <p className="mt-4 text-sm text-manioco-brown/60">Commandes nécessitant votre attention.</p>
                     </div>
                  </div>
               </div>
            </div>
         </section>

         <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-12">

         {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 w-full">
               <Loader2 size={40} className="animate-spin text-manioco-terracotta" />
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-manioco-brown/40">Chargement de vos commandes...</p>
            </div>
         ) : orders.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-[20px] border border-manioco-brown/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
               <ShoppingBag size={64} className="mx-auto mb-6 text-manioco-brown/10" />
               <h3 className="text-xl font-black mb-2">Aucune commande</h3>
               <p className="text-xs text-manioco-brown/40 font-medium mb-8">Il semblerait que vous n'ayez pas encore passé de commande.</p>
               <Link href="/dashboard/client" className="bg-manioco-terracotta text-white px-10 py-4 rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all">
                  Commencer mes achats
               </Link>
            </div>
         ) : (
            <div className="grid grid-cols-1 gap-6">
               {orders.map((order) => (
                  <div key={order.id} className="relative rounded-[2.5rem] border border-white/80 bg-white/95 p-6 shadow-[0_25px_80px_rgba(92,45,35,0.08)] transition-all hover:shadow-[0_35px_90px_rgba(92,45,35,0.12)]">
                     <div className="absolute inset-x-6 top-0 h-16 rounded-b-[2rem] bg-gradient-to-r from-manioco-terracotta/25 via-manioco-cream/80 to-manioco-brown/15" />
                     <div className="relative flex flex-col gap-6 pt-8">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                           <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-3 mb-3">
                                 <span className="inline-flex items-center gap-2 rounded-full bg-manioco-cream px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-manioco-brown shadow-sm border border-manioco-brown/10">
                                    {getStatusIcon(order.status)}
                                    {getStatusLabel(order.status)}
                                 </span>
                                 <span className="inline-flex items-center gap-2 rounded-full bg-manioco-terracotta/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-manioco-terracotta shadow-sm border border-manioco-terracotta/10">
                                    <Star size={14} />
                                    {order.items?.length || 0} articles
                                 </span>
                              </div>
                              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-manioco-brown/40 mb-2">Commande #{order.id.substring(0, 8).toUpperCase()}</p>
                              <h2 className="text-2xl font-black text-manioco-brown truncate">{order.store?.name || 'Commande exclusive'}</h2>
                              <p className="text-sm text-manioco-brown/70 mt-2">{new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                           </div>
                           <div className="flex flex-col gap-3 w-full sm:w-auto text-right">
                              <div className="rounded-full bg-manioco-cream/95 px-5 py-3 text-xs font-black uppercase tracking-[0.25em] text-manioco-brown border border-manioco-brown/10 shadow-sm">Total {Number(order.totalAmount).toLocaleString()} FCFA</div>
                              <button 
                                 onClick={() => handleOpenReport(order)}
                                 title="Signaler un problème avec ce vendeur"
                                 className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-red-100 bg-red-50 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-red-600 hover:bg-red-100 transition-all shadow-sm"
                              >
                                 <AlertOctagon size={18} />
                                 Signaler
                              </button>
                           </div>
                        </div>

                        {order.status === 'CANCELLED' && order.cancellationReason && (
                           <div className="rounded-[2rem] bg-red-50 border border-red-100 p-5 flex items-start gap-3 text-sm text-red-600">
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-500">
                                 <AlertOctagon size={18} />
                              </div>
                              <div>
                                 <p className="text-[10px] font-black uppercase tracking-[0.25em] text-red-400 mb-2">Motif d'annulation</p>
                                 <p className="font-bold">{order.cancellationReason}</p>
                              </div>
                           </div>
                        )}

                        <div className="grid gap-5 lg:grid-cols-[1.2fr_auto] lg:items-center">
                           <div className="space-y-5">
                              <div className="flex -space-x-3 items-center">
                                 {order.items?.slice(0, 4).map((item: any, i: number) => (
                                    <div key={i} className="relative z-[1] h-14 w-14 rounded-3xl border-[3px] border-white overflow-hidden shadow-sm" title={item.productName}>
                                       <img src={item.productImage || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=100"} alt={item.productName} className="h-full w-full object-cover" />
                                    </div>
                                 ))}
                                 {order.items?.length > 4 && (
                                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl border-[3px] border-white bg-slate-100 text-[10px] font-black text-slate-500 shadow-sm">+{order.items.length - 4}</div>
                                 )}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                 {order.items?.map((item: any, i: number) => (
                                    <span key={i} className="text-[10px] font-black uppercase tracking-[0.25em] text-manioco-brown/70 bg-manioco-cream px-3 py-2 rounded-full border border-manioco-brown/10">{item.productName}{item.quantity > 1 ? ` ×${item.quantity}` : ''}</span>
                                 ))}
                              </div>
                              <div className="rounded-[2rem] bg-manioco-cream p-5 border border-manioco-brown/10 shadow-sm">
                                 <div className="flex items-center justify-between gap-4">
                                    <p className="text-[10px] uppercase tracking-[0.25em] text-manioco-brown/50">Résumé</p>
                                    <span className="text-xs uppercase tracking-[0.3em] text-manioco-brown/40">{order.status === 'DELIVERED' ? 'Terminé' : 'En cours'}</span>
                                 </div>
                                 <p className="mt-3 text-sm text-manioco-brown/70">Suivez votre colis, notez vos articles et contactez le support en un clic.</p>
                              </div>
                           </div>
                           <div className="grid gap-3">
                              {order.status === 'SHIPPED' && (
                                 <div className="grid gap-3 sm:grid-cols-2">
                                    <button
                                       onClick={() => handleConfirmReceipt(order, true)}
                                       className="rounded-full bg-manioco-terracotta px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-manioco-terracotta/20 hover:bg-manioco-brown transition-all"
                                    >
                                       Oui, reçu
                                    </button>
                                    <button
                                       onClick={() => handleConfirmReceipt(order, false)}
                                       className="rounded-full bg-red-500 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
                                    >
                                       Non reçu
                                    </button>
                                 </div>
                              )}
                              <div className="rounded-[2rem] bg-white/80 p-4 border border-manioco-brown/10 shadow-sm">
                                 <p className="text-[10px] uppercase tracking-[0.25em] text-manioco-brown/50">Livraison</p>
                                 <div className="mt-3 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-manioco-brown/70">
                                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-manioco-terracotta"></span>
                                    {order.status === 'PENDING' ? 'En attente' : order.status === 'PAID' ? 'Paiement confirmé' : order.status === 'SHIPPED' ? 'En route' : order.status === 'DELIVERED' ? 'Livrée' : order.status === 'FAILED' ? 'Échec' : order.status}
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>
      </main>

      {/* Modal de Signalement */}
      {isReportModalOpen && selectedOrderToReport && (
        <div className="fixed inset-0 z-[500] bg-manioco-brown/10 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-reveal">
          <div className="bg-white rounded-[40px] p-8 md:p-12 w-full max-w-lg shadow-2xl relative border border-manioco-brown/10">
            <button 
              onClick={() => setIsReportModalOpen(false)}
              className="absolute top-8 right-8 w-10 h-10 bg-manioco-terracotta/10 text-manioco-terracotta rounded-full flex items-center justify-center hover:bg-manioco-terracotta/20 transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-sm border border-red-100">
              <AlertOctagon size={32} />
            </div>
            
            <h3 className="text-2xl font-black text-manioco-brown uppercase tracking-tight mb-2">
              Signaler le vendeur <span className="text-manioco-terracotta italic">{selectedOrderToReport.store?.name || selectedOrderToReport.seller?.name || selectedOrderToReport.sellerName || "lié à cette commande"}</span>
            </h3>
            <p className="text-xs font-bold text-manioco-brown/60 uppercase tracking-widest mb-8">
              Commande #{selectedOrderToReport.id.substring(0, 8).toUpperCase()}
            </p>

            <div className="space-y-6">
              <div>
                <label htmlFor="reportReason" className="block text-[10px] font-black uppercase tracking-widest text-manioco-brown/60 mb-2">Motif du signalement</label>
                <div className="relative">
                   <select 
                     id="reportReason"
                     value={reportReason}
                     onChange={(e) => setReportReason(e.target.value)}
                     className="w-full bg-manioco-cream border-none rounded-2xl p-4 pr-10 text-manioco-brown font-bold focus:ring-2 focus:ring-manioco-terracotta outline-none appearance-none"
                   >
                     <option value="ARNAQUE">Arnaque / Fraude</option>
                     <option value="CONTREFAÇON">Produit non conforme / Contrefaçon</option>
                     <option value="OFFENSANT">Comportement inapproprié / Harcèlement</option>
                     <option value="RETARD">Retard abusif / Non livré</option>
                     <option value="AUTRE">Autre problème</option>
                   </select>
                   <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-manioco-brown/40">
                      ▼
                   </div>
                </div>
              </div>

              <div>
                <label htmlFor="reportDescription" className="block text-[10px] font-black uppercase tracking-widest text-manioco-brown/60 mb-2">Description du problème</label>
                <textarea 
                  id="reportDescription"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Expliquez en détail ce qui s'est passé avec ce vendeur..."
                  className="w-full bg-manioco-cream border-none rounded-2xl p-4 text-manioco-brown placeholder:text-manioco-brown/30 min-h-[120px] resize-none focus:ring-2 focus:ring-manioco-terracotta outline-none text-sm font-medium"
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

      {/* Modal d'évaluation des produits */}
      {isReviewModalOpen && reviewingOrder && (
         <div className="fixed inset-0 z-[500] bg-manioco-brown/10 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 overflow-y-auto animate-reveal">
            <div className="bg-white rounded-[40px] p-8 md:p-12 w-full max-w-2xl shadow-2xl relative border border-manioco-brown/10 my-8">
               <button 
                  onClick={() => { setIsReviewModalOpen(false); setReviewingOrder(null); }}
                  className="absolute top-8 right-8 w-10 h-10 bg-manioco-terracotta/10 text-manioco-terracotta rounded-full flex items-center justify-center hover:bg-manioco-terracotta/20 transition-colors"
               >
                  <X size={20} />
               </button>

               <div className="w-16 h-16 bg-manioco-terracotta/10 text-manioco-terracotta rounded-full flex items-center justify-center mb-6 shadow-sm border border-manioco-terracotta/10">
                  <CheckCircle2 size={32} />
               </div>

               <h3 className="text-2xl font-black text-manioco-brown uppercase tracking-tight mb-2">
                  Évaluez vos produits !
               </h3>
               <p className="text-xs font-bold text-manioco-brown/60 uppercase tracking-widest mb-8">
                  Votre colis pour la commande #{reviewingOrder.id.substring(0, 8).toUpperCase()} a été livré. Aidez-nous à noter la qualité de vos articles :
               </p>

               <div className="space-y-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar mb-8">
                  {reviewingOrder.items?.map((item: any) => {
                     const currentProductState = reviewsState[item.productId] || { rating: 5, comment: '' };
                     return (
                        <div key={item.productId} className="p-5 bg-manioco-cream rounded-3xl border border-manioco-brown/10 flex flex-col gap-4">
                           <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-2xl bg-white border border-manioco-brown/10 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                 {item.productImage ? (
                                    <img src={item.productImage} className="w-full h-full object-cover" alt={item.productName} />
                                 ) : (
                                    <Package size={24} className="text-manioco-brown/20" />
                                 )}
                              </div>
                              <div className="flex-1 min-w-0">
                                 <h4 className="text-xs font-black text-manioco-brown uppercase tracking-tight truncate">{item.productName}</h4>
                                 <p className="text-[10px] text-manioco-brown/40 font-bold uppercase tracking-wider mt-0.5">Quantité : {item.quantity}</p>
                              </div>
                           </div>

                           <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-manioco-brown/60 mb-2">Note sur 5 étoiles</p>
                              <div className="flex gap-2">
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
                                       className="transition-transform active:scale-90 hover:scale-110"
                                    >
                                       <Star 
                                          size={28} 
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
                              <label className="block text-[10px] font-black uppercase tracking-widest text-manioco-brown/60 mb-2">
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
                                 placeholder="Laisser un avis sur la qualité ou le goût de ce produit..."
                                 className="w-full bg-white border border-manioco-brown/10 rounded-2xl p-4 text-manioco-brown placeholder:text-manioco-brown/30 min-h-[80px] resize-none focus:ring-2 focus:ring-manioco-terracotta outline-none text-xs font-medium"
                              />
                           </div>
                        </div>
                     );
                  })}
               </div>

               <div className="flex gap-4 flex-col sm:flex-row">
                  <button 
                     onClick={() => { setIsReviewModalOpen(false); setReviewingOrder(null); }}
                     className="flex-1 py-4 bg-manioco-cream text-manioco-brown text-xs font-black rounded-2xl border border-manioco-brown/10 hover:bg-manioco-cream/90 transition-all uppercase tracking-widest"
                  >
                     Plus tard
                  </button>
                  <button 
                     onClick={handleSubmitReviews}
                     disabled={isSubmittingReviews}
                     className="flex-1 py-4 bg-manioco-terracotta hover:bg-manioco-brown text-white text-xs font-black rounded-2xl shadow-lg shadow-manioco-terracotta/20 disabled:opacity-50 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                     {isSubmittingReviews ? <Loader2 size={16} className="animate-spin" /> : 'Soumettre mes avis'}
                  </button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
}

function UserProfilePhoto({ user }: { readonly user: any }) {
    if (user?.profilePhoto) {
        return <img src={user.profilePhoto} alt="Profil" className="w-full h-full object-cover" />;
    }
    return <span>{user?.name?.[0] || 'U'}</span>;
}
