"use client";
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { useCart } from '@/features/cart/CartContext';
import { useAuth } from '@/features/auth/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useState, useEffect } from 'react';

export default function CartDrawer({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess?: () => void }) {
  const { items, removeFromCart, updateQuantity, updateUnit, totalPrice, totalItems, toggleSelection, clearSelected } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';



  const getImageUrl = (path?: string) => {
    if (!path) return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=100";
    if (path.startsWith('http') || path.startsWith('data:image')) return path;
    if (path.startsWith('/') || path.startsWith('uploads/')) {
      return `${apiUrl}${path.startsWith('/') ? '' : '/'}${path}`;
    }
    return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=100";
  };

  const isItemStockInsufficient = (item: any) => {
    if (item.stock === undefined || item.stock === null) return false;

    const UNIT_FACTORS: Record<string, number> = {
      'Sac': 50,
      'Demi-sac': 25,
      'Kg': 1,
      'Demi-kg': 0.5,
    };

    const baseUnit = item.baseUnit || 'Kg';
    const currentUnit = item.unit || 'Kg';

    const baseFactor = UNIT_FACTORS[baseUnit] || 1;
    const currentFactor = UNIT_FACTORS[currentUnit] || 1;

    const availableWeight = Number(item.stock) * baseFactor;
    const requestedWeight = Number(item.quantity) * currentFactor;

    return requestedWeight > availableWeight;
  };

  const hasInsufficientStock = items.some(item => item.selected && isItemStockInsufficient(item));

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
      <button 
        type="button"
        aria-label="Fermer le panier"
        className="absolute inset-0 bg-manioco-brown/40 backdrop-blur-sm transition-opacity border-none w-full h-full cursor-default" 
        onClick={onClose}
      ></button>
      
      <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl animate-slide-in-right flex flex-col">
        <div className="p-8 border-b border-manioco-brown/5 flex justify-between items-center bg-manioco-cream">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-manioco-terracotta flex items-center justify-center text-white">
               <ShoppingBag size={20} />
            </div>
            <div>
               <h2 className="text-xl font-black tracking-tighter uppercase text-manioco-brown">Votre Panier</h2>
               <p className="text-[10px] font-black text-manioco-brown/40 uppercase tracking-widest">{totalItems} articles</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white border border-manioco-brown/10 flex items-center justify-center hover:bg-manioco-terracotta hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
               <ShoppingBag size={64} className="text-manioco-brown/10 mb-6" />
               <p className="text-xs font-black text-manioco-brown/30 uppercase tracking-widest">Votre panier est vide</p>
            </div>
          ) : (
            items.map((item) => {
              const isInsufficient = isItemStockInsufficient(item);
              return (
                <div key={item.id} className="flex flex-col gap-2 pb-4 border-b border-manioco-brown/5">
                  <div className="flex gap-4 group items-center">
                    <input 
                      type="checkbox" 
                      checked={item.selected} 
                      onChange={() => toggleSelection(item.id)}
                      className="w-5 h-5 rounded border-manioco-brown/20 text-manioco-terracotta focus:ring-manioco-terracotta cursor-pointer accent-manioco-terracotta"
                    />
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-manioco-cream shrink-0 border border-manioco-brown/5">
                      <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-tight line-clamp-1 text-manioco-brown">{item.name}</h4>
                        <select 
                          value={item.unit || 'Kg'} 
                          onChange={(e) => updateUnit(item.id, e.target.value)}
                          className="text-[10px] font-black text-manioco-terracotta uppercase tracking-widest bg-transparent border-none focus:ring-0 cursor-pointer p-0"
                        >
                          <option value="Kg">Kg</option>
                          <option value="Sac">Sac</option>
                          <option value="Demi-sac">Demi-sac</option>
                          <option value="Demi-kg">Demi-kg</option>
                        </select>
                        <span className="text-[9px] font-black text-manioco-brown/30 ml-2 uppercase tracking-widest">
                           {item.price.toLocaleString()} FCFA / {item.unit || 'Kg'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center bg-manioco-cream rounded-lg px-2">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:text-manioco-terracotta transition-colors text-manioco-brown/60"><Minus size={12} /></button>
                          <span className="w-8 text-center text-xs font-black text-manioco-brown">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:text-manioco-terracotta transition-colors text-manioco-brown/60"><Plus size={12} /></button>
                        </div>
                        <span className="text-sm font-black text-manioco-brown">{(item.price * item.quantity).toLocaleString()} FCFA</span>
                      </div>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                       <Trash2 size={16} />
                    </button>
                  </div>
                  {isInsufficient && (
                    <div className="pl-28 text-[11px] font-bold text-red-500 flex items-center gap-1.5 animate-pulse mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span>
                      Stock insuffisant (Disponible : {item.stock} {item.baseUnit || 'Kg'})
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="p-8 bg-manioco-cream border-t border-manioco-brown/5 space-y-6">
            <div className="flex justify-between items-center font-black">
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-manioco-brown/40">Total sélectionné</span>
                <p className="text-[10px] text-manioco-brown/30 italic">({items.filter(i => i.selected).length} articles)</p>
              </div>
              <span className="text-2xl tracking-tighter text-manioco-brown">{totalPrice.toLocaleString()} FCFA</span>
            </div>
            <button 
              onClick={handleCheckout}
              disabled={isSubmitting || items.filter(i => i.selected).length === 0 || hasInsufficientStock}
              className="w-full bg-manioco-terracotta text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-manioco-brown transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : `Commander (${items.filter(i => i.selected).length})`} <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
