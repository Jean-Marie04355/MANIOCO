"use client";
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { useCart } from '@/features/cart/CartContext';
import { useAuth } from '@/features/auth/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useState } from 'react';

export default function CartDrawer({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess?: () => void }) {
  const { items, removeFromCart, updateQuantity, totalPrice, totalItems, toggleSelection, clearSelected } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const getImageUrl = (path?: string) => {
    if (!path) return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=100";
    if (path.startsWith('http') || path.startsWith('data:image')) return path;
    if (path.startsWith('/') || path.startsWith('uploads/')) {
      return `${apiUrl}${path.startsWith('/') ? '' : '/'}${path}`;
    }
    return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=100";
  };

  const getErrorMessage = (error: any) => {
    const responseMessage = error?.response?.data?.message;

    if (Array.isArray(responseMessage)) {
      return responseMessage.join(', ');
    }

    if (typeof responseMessage === 'string' && responseMessage.length > 0) {
      return responseMessage;
    }

    if (typeof error?.message === 'string' && error.message.length > 0) {
      return error.message;
    }

    return "Erreur lors de la validation de la commande. Verifiez que la boutique peut recevoir des paiements.";
  };

  const handleCheckout = async () => {
    const selectedItems = items.filter(item => item.selected);
    
    if (!user) {
      alert("Veuillez vous connecter pour passer commande.");
      router.push('/auth/login');
      return;
    }

    if (selectedItems.length === 0) {
      alert("Veuillez sélectionner au moins un produit à commander.");
      return;
    }

    const customerId = user.id;
    if (!customerId) {
      alert("Impossible de confirmer la commande: identifiant client manquant.");
      return;
    }

    const allowedUnits = new Set(['Sac', 'Demi-sac', 'Kg', 'Demi-kg']);

    setIsSubmitting(true);
    try {
      const storesMap: Record<string, any[]> = {};
      selectedItems.forEach(item => {
        if (!item.storeId) return;
        if (!storesMap[item.storeId]) storesMap[item.storeId] = [];
        storesMap[item.storeId].push(item);
      });

      const orderPromises = Object.entries(storesMap).map(([storeId, storeItems]) => {
        const orderData = {
          customerId,
          storeId,
          totalAmount: storeItems.reduce((acc, item) => acc + (item.price * item.quantity), 0),
          items: storeItems.map(item => ({
            productId: item.id,
            productName: item.name,
            quantity: item.quantity,
            price: item.price,
            unit: allowedUnits.has(item.unit || '') ? item.unit : 'Kg'
          }))
        };
        return api.post('/orders', orderData);
      });

      const responses = await Promise.all(orderPromises);
      const paymentUrl = responses[0]?.data?.paymentUrl;

      clearSelected();

      if (paymentUrl && paymentUrl !== '#success-demo') {
        window.location.href = paymentUrl;
        return;
      }

      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
        alert("Commande confirmee !");
      }

      router.push('/dashboard/client/orders');
    } catch (error: any) {
      console.error("Erreur commande", error);
      alert(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] overflow-hidden">
      <div className="absolute inset-0 bg-forest-green/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl animate-slide-in-right flex flex-col">
        <div className="p-8 border-b border-forest-green/5 flex justify-between items-center bg-organic-cream">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-forest-green flex items-center justify-center text-white">
               <ShoppingBag size={20} />
            </div>
            <div>
               <h2 className="text-xl font-black tracking-tighter uppercase">Votre Panier</h2>
               <p className="text-[10px] font-black text-forest-green/40 uppercase tracking-widest">{totalItems} articles</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white border border-forest-green/10 flex items-center justify-center hover:bg-forest-green hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
               <ShoppingBag size={64} className="text-forest-green/5 mb-6" />
               <p className="text-xs font-black text-forest-green/30 uppercase tracking-widest">Votre panier est vide</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 group items-center">
                <input 
                  type="checkbox" 
                  checked={item.selected} 
                  onChange={() => toggleSelection(item.id)}
                  className="w-5 h-5 rounded border-forest-green/20 text-forest-green focus:ring-forest-green cursor-pointer"
                />
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-forest-green/5 shrink-0 border border-forest-green/5">
                  <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-tight line-clamp-1">{item.name}</h4>
                    <p className="text-[10px] font-bold text-afrigari-gold uppercase tracking-widest">{item.unit || 'Unité'}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center bg-forest-green/5 rounded-lg px-2">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:text-afrigari-gold transition-colors"><Minus size={12} /></button>
                      <span className="w-8 text-center text-xs font-black">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:text-afrigari-gold transition-colors"><Plus size={12} /></button>
                    </div>
                    <span className="text-sm font-black">{(item.price * item.quantity).toLocaleString()} FCFA</span>
                  </div>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                   <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-8 bg-organic-cream border-t border-forest-green/5 space-y-6">
            <div className="flex justify-between items-center font-black">
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-forest-green/40">Total sélectionné</span>
                <p className="text-[10px] text-forest-green/30 italic">({items.filter(i => i.selected).length} articles)</p>
              </div>
              <span className="text-2xl tracking-tighter">{totalPrice.toLocaleString()} FCFA</span>
            </div>
            <button 
              onClick={handleCheckout}
              disabled={isSubmitting || items.filter(i => i.selected).length === 0}
              className="w-full bg-forest-green text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-afrigari-gold transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : `Commander (${items.filter(i => i.selected).length})`} <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
