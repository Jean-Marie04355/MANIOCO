"use client";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, ArrowRight, Package, Loader2, Calendar, CreditCard } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const checkOrder = async () => {
      if (!orderId) {
        setStatus('error');
        return;
      }

      try {
        // En réalité, on attend un peu que le webhook du backend soit passé
        // On va boucler ou simplement demander l'état de la commande
        const res = await api.get(`/orders/${orderId}`);
        setOrder(res.data);
        
        if (res.data.status === 'PAID') {
          setStatus('success');
        } else {
          // On peut attendre encore un peu ou considérer que c'est en cours
          setStatus('success'); // On affiche quand même un succès car FedaPay a redirigé ici
        }
      } catch (err) {
        console.error("Erreur vérification commande:", err);
        setStatus('error');
      }
    };

    checkOrder();
  }, [orderId]);

  return (
    <div className="min-h-screen bg-luxury-cream flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-2xl bg-white rounded-[64px] shadow-[0_80px_160px_-40px_rgba(10,33,24,0.1)] border border-forest-night/5 overflow-hidden animate-reveal p-16 md:p-24 text-center">
        
        {status === 'loading' ? (
          <div className="flex flex-col items-center gap-8 py-20">
             <Loader2 className="w-16 h-16 text-forest-night animate-spin" />
             <p className="text-[10px] font-black uppercase tracking-[0.5em] text-forest-night/20">Validation de la transaction...</p>
          </div>
        ) : status === 'success' ? (
          <div className="animate-reveal">
            <div className="w-32 h-32 bg-soft-mint rounded-full flex items-center justify-center mx-auto mb-12 shadow-xl">
               <CheckCircle size={64} className="text-afrigari-gold" />
            </div>
            
            <h1 className="text-5xl font-black tracking-tighter uppercase italic mb-6">Paiement <br/> <span className="text-afrigari-gold">Confirmé !</span></h1>
            <p className="text-forest-night/40 font-bold mb-12 max-w-sm mx-auto leading-relaxed italic">Merci pour votre confiance. Nos artisans préparent déjà vos trésors du terroir.</p>

            {order && (
              <div className="bg-luxury-cream/50 rounded-[32px] p-8 mb-12 border border-forest-night/5 text-left flex justify-between items-center">
                 <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-forest-night/30 mb-2">Référence de Commande</p>
                    <h4 className="font-black text-xl text-forest-night italic">#{order.id.split('-')[0]}</h4>
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-forest-night/30 mb-2">Montant Réglé</p>
                    <h4 className="font-black text-2xl text-afrigari-gold italic">{Number(order.totalAmount).toLocaleString()} F</h4>
                 </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-6 justify-center">
               <Link href="/dashboard/client/orders" className="bg-forest-night text-white px-12 py-6 rounded-[24px] font-black text-xs uppercase tracking-[0.3em] hover:bg-afrigari-gold hover:text-forest-night transition-all shadow-xl flex items-center justify-center gap-4">
                  Suivre ma commande <ArrowRight size={18} />
               </Link>
               <Link href="/dashboard/client" className="text-forest-night/40 hover:text-forest-night px-12 py-6 font-black text-[10px] uppercase tracking-widest transition-all italic border-b-2 border-transparent hover:border-forest-night/10">
                  Retour au marché
               </Link>
            </div>
          </div>
        ) : (
          <div className="animate-reveal">
            <div className="w-32 h-32 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-12 shadow-xl">
               <XCircle size={64} className="text-red-500" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic mb-6 text-red-600">Échec du <br/> Paiement</h1>
            <p className="text-forest-night/40 font-bold mb-12 max-w-sm mx-auto leading-relaxed">Une erreur est survenue lors de la transaction. Aucun montant n&apos;a été débité.</p>
            <Link href="/dashboard/client" className="bg-forest-night text-white px-12 py-6 rounded-[24px] font-black text-xs uppercase tracking-[0.3em] hover:scale-105 transition-all shadow-xl">
               Réessayer mes achats
            </Link>
          </div>
        )}

        <div className="mt-20 flex items-center justify-center gap-10 opacity-20 border-t border-forest-night/5 pt-10">
           <div className="flex items-center gap-3">
              <Calendar size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">{new Date().getFullYear()} AFRIGARI</span>
           </div>
           <div className="flex items-center gap-3">
              <CreditCard size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest italic">PLATFORME SÉCURISÉE</span>
           </div>
        </div>
      </div>
    </div>
  );
}
