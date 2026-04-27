"use client";
import { useCart } from '@/context/CartContext';
import { X, Minus, Plus, ShoppingBag, ArrowRight, Loader2, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import api from '@/lib/axios';

export default function CartSidebar({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { items, removeFromCart, updateQuantity, total, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [orderStatus, setOrderStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setIsLoading(true);
    setOrderStatus('idle');

    try {
      // 1. Get current user
      const userRes = await api.get('/auth/me');
      const user = userRes.data;

      // 2. Prepare Order Data
      // For simplicity, we assume all items belong to a primary store or use the first item's storeId
      const orderData = {
        customerId: user.id,
        storeId: items[0].storeId || 'default-store-id',
        totalAmount: total,
        items: items.map(item => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      };

      // 3. Post Order
      const response = await api.post('/orders', orderData);
      const { paymentUrl } = response.data;
      
      setOrderStatus('success');
      
      if (paymentUrl) {
        // Rediriger vers FedaPay après 1.5s pour laisser voir le succès
        setTimeout(() => {
          window.location.href = paymentUrl;
        }, 1500);
      } else {
        setTimeout(() => {
          clearCart();
          setOrderStatus('idle');
          onClose();
        }, 2000);
      }

    } catch (err) {
      console.error("Erreur commande:", err);
      setOrderStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] overflow-hidden">
      <div className="absolute inset-0 bg-forest-night/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md bg-white shadow-[0_0_100px_rgba(0,0,0,0.2)] animate-slide-in">
          <div className="h-full flex flex-col p-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-12">
               <div className="flex flex-col">
                  <h2 className="text-3xl font-black tracking-tighter text-forest-night">VOTRE PANIER</h2>
                  <p className="text-[10px] font-black text-afrigari-gold uppercase tracking-[0.3em] mt-1 italic">Sélection Exclusive</p>
               </div>
               <button onClick={onClose} className="w-10 h-10 border border-forest-night/10 flex items-center justify-center rounded-full hover:bg-forest-night hover:text-white transition-all">
                 <X size={20} />
               </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-10">
              {orderStatus === 'success' ? (
                <div className="h-full flex flex-col items-center justify-center text-center animate-reveal">
                   <div className="w-24 h-24 bg-soft-mint rounded-full flex items-center justify-center text-forest-night mb-8 shadow-xl">
                      <CheckCircle size={48} className="text-afrigari-gold" />
                   </div>
                   <h3 className="text-2xl font-black text-forest-night mb-4">COMMANDE PASSÉE !</h3>
                   <p className="text-sm font-bold text-forest-night/60 px-10">Votre commande est en cours de préparation par nos producteurs.</p>
                </div>
              ) : orderStatus === 'error' ? (
                <div className="h-full flex flex-col items-center justify-center text-center animate-reveal">
                   <AlertCircle size={48} className="text-red-500 mb-6" />
                   <h3 className="text-xl font-black text-forest-night mb-4">ERREUR DE COMMANDE</h3>
                   <button onClick={() => setOrderStatus('idle')} className="text-[10px] font-black text-afrigari-gold underline tracking-widest uppercase">Réessayer</button>
                </div>
              ) : items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <ShoppingBag size={64} className="mb-6 opacity-20" />
                  <p className="text-xs font-black uppercase tracking-[0.3em]">Le panier est vide</p>
                </div>
              ) : (
                <div className="space-y-8">
                   {items.map((item) => (
                     <div key={item.id} className="flex gap-6 group relative">
                       <button 
                         onClick={() => removeFromCart(item.id)}
                         className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-10 flex items-center justify-center shadow-lg"
                       >
                         <X size={12} />
                       </button>
                       <div className="w-28 h-28 bg-luxury-cream rounded-[32px] overflow-hidden border border-forest-night/5 shadow-sm">
                         <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.name} />
                       </div>
                       <div className="flex-1 flex flex-col justify-between py-2">
                         <div>
                           <h4 className="font-black text-sm uppercase tracking-tight text-forest-night">{item.name}</h4>
                           <p className="text-[9px] font-black text-afrigari-gold uppercase tracking-[0.4em] mt-1 italic">{item.storeName || 'Origine Local'}</p>
                         </div>
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 bg-luxury-cream px-3 py-2 rounded-2xl border border-forest-night/5">
                               <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-forest-night/40 hover:text-afrigari-gold transition-colors"><Minus size={14} /></button>
                               <span className="text-xs font-black w-4 text-center text-forest-night">{item.quantity}</span>
                               <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-forest-night/40 hover:text-afrigari-gold transition-colors"><Plus size={14} /></button>
                            </div>
                            <p className="font-black text-base text-forest-night">{(item.price * item.quantity).toLocaleString()} F</p>
                         </div>
                       </div>
                     </div>
                   ))}
                </div>
              )}
            </div>

            {/* Footer Summary */}
            {(items.length > 0 && orderStatus === 'idle') && (
              <div className="pt-10 mt-10 border-t-2 border-forest-night/5">
                <div className="flex justify-between items-end mb-10">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-forest-night/40 tracking-[0.4em]">Total TTC</p>
                      <p className="text-xs font-black italic text-afrigari-gold">Livraison incluse</p>
                   </div>
                   <p className="text-4xl font-black text-forest-night">{total.toLocaleString()} FCFA</p>
                </div>
                <button 
                  onClick={handleCheckout}
                  disabled={isLoading}
                  className="w-full bg-forest-night text-white h-20 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] hover:bg-afrigari-gold hover:text-forest-night transition-all shadow-2xl flex items-center justify-center gap-4 group active:scale-95"
                >
                  {isLoading ? <Loader2 className="animate-spin text-afrigari-gold" /> : (
                     <>Confirmer la commande <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" /></>
                  )}
                </button>
                <div className="flex items-center justify-center gap-3 mt-8 opacity-30">
                   <ShieldCheck size={14} />
                   <p className="text-[9px] font-black uppercase tracking-widest">Transaction Sécurisée</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
