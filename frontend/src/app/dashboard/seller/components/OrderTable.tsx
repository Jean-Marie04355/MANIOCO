"use client";
import { useState } from 'react';
import { 
  Eye, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  Truck, 
  XCircle,
  X,
  MessageSquare,
  Package,
  User,
  Calendar,
  CreditCard
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface OrderItem {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  unit?: string;
}

export interface Order {
  id: string;
  realId: string;
  customerId: string;
  realDate: string;
  client: string;
  date: string;
  amount: string;
  status: 'En attente' | 'Confirmée' | 'Expédiée' | 'Expédiée avec succès' | "Échec d'expédition" | 'Annulée';
  itemCount: number;
  items: OrderItem[];
}

interface OrderTableProps {
  orders: Order[];
  onStatusChange: (id: string, newStatus: Order['status']) => void;
}

export default function OrderTable({ orders, onStatusChange }: OrderTableProps) {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const handleContactClient = (order: Order) => {
    // Rediriger vers la messagerie en passant l'ID du client
    router.push(`/dashboard/seller/messages?contact=${order.customerId}`);
  };

  const getStatusStyle = (status: Order['status']) => {
    switch (status) {
      case 'Confirmée':
        return 'bg-green-50 text-green-600 border-green-100';
      case 'En attente':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Expédiée':
        return 'bg-manioco-terracotta-50 text-manioco-terracotta border-manioco-terracotta-100';
      case 'Expédiée avec succès':
        return 'bg-green-50 text-green-600 border-green-100 font-bold';
      case "Échec d'expédition":
        return 'bg-rose-50 text-rose-600 border-rose-100 font-bold';
      case 'Annulée':
        return 'bg-red-50 text-red-600 border-red-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'Confirmée': return <CheckCircle2 size={14} />;
      case 'En attente': return <Clock size={14} />;
      case 'Expédiée': return <Truck size={14} />;
      case 'Expédiée avec succès': return <CheckCircle2 size={14} className="text-green-600" />;
      case "Échec d'expédition": return <XCircle size={14} className="text-rose-600" />;
      case 'Annulée': return <XCircle size={14} />;
    }
  };

  return (
    <>
      <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm">
        <div className="overflow-x-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Commande</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Statut</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-900">#{order.id}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{order.itemCount} articles</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-manioco-terracotta-50 flex items-center justify-center text-[10px] font-black text-manioco-terracotta">
                        {order.client.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm font-bold text-slate-700">{order.client}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm font-medium text-slate-500">
                    {order.date}
                  </td>
                  <td className="px-6 py-5 text-sm font-black text-slate-900">
                    {order.amount}
                  </td>
                  <td className="px-6 py-5">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${getStatusStyle(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right relative">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleContactClient(order)}
                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                        title="Contacter le client"
                      >
                        <MessageSquare size={18} />
                      </button>
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 text-slate-400 hover:text-manioco-terracotta hover:bg-manioco-terracotta-50 rounded-xl transition-all"
                        title="Détails"
                      >
                        <Eye size={18} />
                      </button>
                      {!['Annulée', 'Expédiée avec succès', "Échec d'expédition"].includes(order.status) && (
                        <div className="relative">
                          <button 
                            onClick={() => setActiveMenu(activeMenu === order.id ? null : order.id)}
                            className={`p-2 rounded-xl transition-all ${activeMenu === order.id ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                          >
                            <MoreVertical size={18} />
                          </button>
                          
                          {activeMenu === order.id && (
                            <>
                              <button 
                                type="button"
                                aria-label="Fermer le menu"
                                className="fixed inset-0 z-[60] bg-transparent border-none w-full h-full cursor-default" 
                                onClick={() => setActiveMenu(null)}
                                onKeyDown={(e) => { if (e.key === 'Escape') setActiveMenu(null); }}
                              ></button>
                              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-[70] animate-in fade-in slide-in-from-top-2 duration-200">
                                <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Changer statut</p>
                                <button onClick={() => { onStatusChange(order.id, 'Confirmée'); setActiveMenu(null); }} className="w-full px-4 py-2 text-left text-xs font-bold text-slate-600 hover:bg-green-50 hover:text-green-600 transition-colors flex items-center gap-2">
                                  <CheckCircle2 size={14} /> Confirmer
                                </button>
                                <button onClick={() => { onStatusChange(order.id, 'Expédiée'); setActiveMenu(null); }} className="w-full px-4 py-2 text-left text-xs font-bold text-slate-600 hover:bg-manioco-terracotta-50 hover:text-manioco-terracotta transition-colors flex items-center gap-2">
                                  <Truck size={14} /> Expédier
                                </button>
                                <button onClick={() => { onStatusChange(order.id, 'Annulée'); setActiveMenu(null); }} className="w-full px-4 py-2 text-left text-xs font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-2">
                                  <XCircle size={14} /> Annuler
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button 
            type="button"
            aria-label="Fermer les détails"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm border-none w-full h-full cursor-default" 
            onClick={() => setSelectedOrder(null)}
            onKeyDown={(e) => { if (e.key === 'Escape') setSelectedOrder(null); }}
          ></button>
          <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in fade-in duration-300">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900">Détails de la Commande</h3>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-900 shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Info */}
              <div className="space-y-6">
                <div>
                  <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    <User size={14} className="text-manioco-terracotta" /> Client
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-sm font-black text-slate-900">{selectedOrder.client}</p>
                    <p className="text-xs text-slate-500 mt-1 font-medium italic">Client vérifié via FedaPay</p>
                  </div>
                </div>

                <div>
                  <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    <Calendar size={14} className="text-manioco-terracotta" /> Date & Statut
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium">Passée le :</span>
                      <span className="font-bold text-slate-900">{selectedOrder.date}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium">Statut :</span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${getStatusStyle(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    <CreditCard size={14} className="text-manioco-terracotta" /> Paiement
                  </h4>
                  <div className="bg-manioco-terracotta-50/50 p-4 rounded-2xl border border-manioco-terracotta-100 flex justify-between items-center">
                    <span className="text-sm font-bold text-manioco-terracotta">Montant Total</span>
                    <span className="text-lg font-black text-manioco-terracotta">{selectedOrder.amount}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Items */}
              <div>
                <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  <Package size={14} className="text-manioco-terracotta" /> Articles ({selectedOrder.itemCount})
                </h4>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedOrder.items && selectedOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden">
                        {item.productImage ? (
                          <img src={item.productImage} className="w-full h-full object-cover" alt={item.productName} />
                        ) : (
                          <Package size={20} className="text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-black text-slate-900 uppercase">{item.productName || 'Produit'}</p>
                        <p className="text-[10px] text-slate-400 font-bold">
                          Quantité : {item.quantity} {item.unit ? (item.quantity > 1 ? `${item.unit}s` : item.unit) : ''}
                        </p>
                      </div>
                      <p className="text-xs font-black text-slate-900">{Number(item.price).toLocaleString()} FCFA</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
              >
                Fermer
              </button>
              {selectedOrder.status === 'Confirmée' && (
                <button 
                  onClick={() => { onStatusChange(selectedOrder.id, 'Expédiée'); setSelectedOrder(null); }}
                  className="flex-1 py-3 bg-manioco-terracotta text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-manioco-brown shadow-lg shadow-manioco-terracotta/20 transition-all"
                >
                  Expédier la commande
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
