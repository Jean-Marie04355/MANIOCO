"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, ShoppingBag } from 'lucide-react';

export default function PaymentCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      router.push('/dashboard/client/orders');
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-organic-cream flex items-center justify-center px-6">
      <div className="w-full max-w-xl bg-white rounded-[3rem] shadow-2xl border border-forest-green/5 p-10 md:p-14 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-forest-green/5 flex items-center justify-center text-forest-green mb-8">
          <CheckCircle2 size={38} />
        </div>

        <h1 className="text-3xl md:text-4xl font-black text-forest-green mb-4 uppercase tracking-tight">
          Paiement en cours de validation
        </h1>
        <p className="text-sm text-forest-green/60 font-medium leading-relaxed mb-8">
          {orderId
            ? `Votre commande ${orderId} a bien ete envoyee. Des que FedaPay confirme le paiement, le statut passera a "En cours".`
            : 'Votre commande a bien ete envoyee. Des que FedaPay confirme le paiement, le statut passera a "En cours".'}
        </p>

        <div className="flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-forest-green/40">
          <Loader2 className="animate-spin" size={16} />
          Retour automatique vers vos commandes
        </div>

        <button
          onClick={() => router.push('/dashboard/client/orders')}
          className="mt-10 inline-flex items-center gap-3 bg-forest-green text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-afrigari-gold transition-all"
        >
          <ShoppingBag size={16} />
          Voir mes commandes
        </button>
      </div>
    </div>
  );
}
