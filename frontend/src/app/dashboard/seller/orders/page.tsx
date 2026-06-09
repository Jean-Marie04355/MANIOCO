"use client";
import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';
import OrderTable, { Order } from '../components/OrderTable';
import { 
  ShoppingBag, 
  Search, 
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  Loader2,
  XCircle
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import api from '@/lib/axios';
import Link from 'next/link';

export default function SellerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasStore, setHasStore] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [targetOrderId, setTargetOrderId] = useState<string | null>(null);

  useEffect(() => {
    const initializeOrders = async () => {
      const currentUserId = user?.id || (user as any)?.userId;
      if (!currentUserId) return;

      try {
        const storesResponse = await api.get('/stores');
        const myStore = storesResponse.data.find((s: any) => s.ownerId === currentUserId);
        
        if (myStore) {
          setHasStore(true);
          setStoreId(myStore.id);
          const response = await api.get(`/orders/store/${myStore.id}`);
          
          // Mapping backend orders to frontend Order interface
          const mappedOrders: Order[] = response.data.map((order: any) => ({
            id: order.id.split('-')[0].toUpperCase(), // Format court pour l'ID
            realId: order.id, // Pour les appels API
            customerId: order.customerId, // Pour le lien vers le chat
            realDate: order.createdAt, // On garde la date brute pour le filtrage
            client: order.customer ? order.customer.name : "Client Inconnu",
            date: new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
            amount: `${Number(order.totalAmount).toLocaleString()} FCFA`,
            status: mapStatus(order.status),
            itemCount: order.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0,
            items: order.items || [] // On garde les détails des produits
          }));
          
          setOrders(mappedOrders);
          
          // Mettre à jour le compteur de "vu" pour la sidebar
          localStorage.setItem(`lastSeenOrders_${myStore.id}`, response.data.length.toString());
        } else {
          setHasStore(false);
        }
      } catch (error) {
        console.error("Error fetching orders", error);
      } finally {
        setIsLoading(false);
      }
    };
    initializeOrders();
  }, [user]);

  const mapStatus = (status: string): Order['status'] => {
    switch (status) {
      case 'PENDING': return 'En attente';
      case 'PAID': return 'Confirmée';
      case 'SHIPPED': return 'Expédiée';
      case 'DELIVERED': return 'Expédiée avec succès';
      case 'FAILED': return "Échec d'expédition";
      case 'CANCELLED': return 'Annulée';
      default: return 'En attente';
    }
  };

  const mapStatusToBackend = (status: Order['status']): string => {
    switch (status) {
      case 'Confirmée': return 'PAID';
      case 'En attente': return 'PENDING';
      case 'Expédiée': return 'SHIPPED';
      case 'Annulée': return 'CANCELLED';
      default: return 'PENDING';
    }
  };

  const handleStatusChange = async (id: string, newStatus: Order['status']) => {
    const orderToUpdate = orders.find(o => o.id === id);
    if (!orderToUpdate) return;

    if (newStatus === 'Annulée') {
      setTargetOrderId(id);
      setShowCancelModal(true);
      return;
    }

    try {
      await api.patch(`/orders/${(orderToUpdate as any).realId}/status`, { 
        status: mapStatusToBackend(newStatus) 
      });
      
      setOrders(orders.map(order => 
        order.id === id ? { ...order, status: newStatus } : order
      ));
    } catch (error) {
      alert("Erreur lors du changement de statut");
    }
  };

  const confirmCancellation = async () => {
    if (!targetOrderId || !cancelReason.trim()) return;

    const orderToUpdate = orders.find(o => o.id === targetOrderId);
    if (!orderToUpdate) return;

    try {
      await api.patch(`/orders/${(orderToUpdate as any).realId}/status`, { 
        status: 'CANCELLED',
        reason: cancelReason
      });
      
      setOrders(orders.map(order => 
        order.id === targetOrderId ? { ...order, status: 'Annulée' as any } : order
      ));
      
      setShowCancelModal(false);
      setCancelReason("");
      setTargetOrderId(null);
    } catch (error) {
      alert("Erreur lors de l'annulation");
    }
  };

  const stats = [
    { label: "Total commandes", value: orders.length, icon: ShoppingBag, color: "bg-slate-100 text-slate-600" },
    { label: "En attente", value: orders.filter(o => o.status === "En attente").length, icon: Clock, color: "bg-blue-100 text-blue-600" },
    { label: "Confirmées", value: orders.filter(o => o.status === "Confirmée").length, icon: CheckCircle2, color: "bg-green-100 text-green-600" },
    { label: "Expédiées / Livrées", value: orders.filter(o => ["Expédiée", "Expédiée avec succès", "Échec d'expédition"].includes(o.status)).length, icon: Truck, color: "bg-manioco-terracotta-50 text-manioco-terracotta" },
  ];

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

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar mode="seller" />
      
      <main className="flex-1 ml-64">
        <TopNav title="Mes Commandes" isAdmin={false} />
        
        <div className="p-8">
          {!hasStore ? (
            <div className="h-[calc(100vh-140px)] flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm p-12 text-center">
               <ShoppingBag size={48} className="text-manioco-terracotta mb-6" />
               <h2 className="text-2xl font-black text-slate-900 mb-2">Boutique requise</h2>
               <p className="text-slate-500 mb-8 max-w-sm">Vous devez créer votre boutique avant de pouvoir recevoir et gérer des commandes.</p>
               <Link href="/dashboard/seller/settings/store" className="px-6 py-3 bg-manioco-terracotta text-white rounded-2xl font-bold hover:bg-manioco-brown transition-colors">Créer ma boutique</Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, i) => (
                  <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center`}>
                      <stat.icon size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                      <p className="text-xl font-black text-slate-900">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="relative flex-1 max-w-md w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Rechercher par ID ou client..." 
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-manioco-terracotta/20 focus:border-manioco-terracotta transition-all text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Filter size={18} />
                    </div>
                    <input 
                      type="date" 
                      className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-manioco-terracotta/20 focus:border-manioco-terracotta transition-all appearance-none cursor-pointer"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                    {selectedDate && (
                      <button 
                        onClick={() => setSelectedDate("")}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-red-500 transition-colors shadow-lg"
                        title="Réinitialiser le filtre"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <OrderTable 
                orders={orders.filter(o => {
                  const matchesSearch = o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                      o.client.toLowerCase().includes(searchTerm.toLowerCase());
                  
                  if (!selectedDate) return matchesSearch;
                  
                  const orderDate = new Date(o.realDate).toISOString().split('T')[0];
                  const matchesDate = orderDate === selectedDate;
                  
                  return matchesSearch && matchesDate;
                })} 
                onStatusChange={handleStatusChange}
              />

              {orders.length === 0 && (
                <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-200/60 mt-8">
                  <ShoppingBag size={48} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-400 font-medium">Aucune commande reçue pour le moment.</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center mb-6">
                <XCircle size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Annuler la commande</h3>
              <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
                Veuillez expliquer pourquoi vous annulez cette commande. Cette raison sera enregistrée pour le client et les administrateurs.
              </p>
              
              <textarea 
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ex: Problème logistique, stock endommagé..."
                className="w-full h-32 p-6 bg-slate-50 border-none rounded-[1.5rem] text-sm font-bold text-slate-600 placeholder:text-slate-300 focus:ring-2 focus:ring-red-500/20 transition-all outline-none resize-none"
              />
            </div>
            
            <div className="p-6 bg-slate-50 flex gap-4">
              <button 
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                  setTargetOrderId(null);
                }}
                className="flex-1 py-4 bg-white text-slate-600 text-sm font-black rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all"
              >
                RETOUR
              </button>
              <button 
                onClick={confirmCancellation}
                disabled={!cancelReason.trim()}
                className="flex-1 py-4 bg-red-500 text-white text-sm font-black rounded-2xl shadow-lg shadow-red-500/20 hover:bg-red-600 disabled:opacity-50 transition-all uppercase tracking-widest"
              >
                CONFIRMER
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
