"use client";
import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';
import { 
  CreditCard, 
  ArrowUpRight, 
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Calendar,
  Loader2
} from 'lucide-react';
import api from '@/lib/axios';
import { useAuth } from '@/features/auth/AuthContext';

interface Transaction {
  id: string;
  orderId: string;
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
  status: 'COMPLETED' | 'PENDING' | 'DECLINED';
  date: string;
}

export default function SellerRevenues() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFedaPay, setHasFedaPay] = useState(false);

  useEffect(() => {
    const fetchRevenues = async () => {
      const currentUserId = user?.id || (user as any)?.userId;
      if (!currentUserId) return;

      try {
        const storesRes = await api.get('/stores');
        const myStore = storesRes.data.find((s: any) => s.ownerId === currentUserId);
        
        if (myStore) {
          setHasFedaPay(!!myStore.payoutAccountId);

          const ordersRes = await api.get(`/orders/store/${myStore.id}`);
          const orders = ordersRes.data;

          const mappedTransactions: Transaction[] = orders.map((order: any) => {
            const gross = Number(order.totalAmount);
            // On utilise la commission enregistrée ou 10% par défaut
            const commission = Number(order.commissionAmount) || (gross * 0.10);
            const net = gross - commission;

            return {
              id: `TX-${order.id.split('-')[0].toUpperCase()}`,
              orderId: order.id.split('-')[0].toUpperCase(),
              grossAmount: gross,
              commissionAmount: commission,
              netAmount: net,
              status: mapOrderStatusToTxStatus(order.status),
              date: new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
            };
          });

          setTransactions(mappedTransactions);
        }
      } catch (error) {
        console.error("Erreur chargement revenus", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRevenues();
  }, [user]);

  const mapOrderStatusToTxStatus = (status: string): Transaction['status'] => {
    switch (status) {
      case 'PAID':
      case 'SHIPPED':
      case 'DELIVERED':
        return 'COMPLETED';
      case 'PENDING':
        return 'PENDING';
      case 'CANCELLED':
        return 'DECLINED';
      default:
        return 'PENDING';
    }
  };

  // Calculs globaux
  const completedTxs = transactions.filter(t => t.status === 'COMPLETED');
  const totalNet = completedTxs.reduce((acc, t) => acc + t.netAmount, 0);
  const totalGross = completedTxs.reduce((acc, t) => acc + t.grossAmount, 0);
  const totalCommission = completedTxs.reduce((acc, t) => acc + t.commissionAmount, 0);

  const pendingRevenue = transactions
    .filter(t => t.status === 'PENDING')
    .reduce((acc, t) => acc + t.netAmount, 0);

  const successfulSalesCount = completedTxs.length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <span className="px-2.5 py-1 rounded-full bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-fit"><CheckCircle2 size={12}/> Payé</span>;
      case 'PENDING': return <span className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-fit"><TrendingUp size={12}/> En cours</span>;
      case 'DECLINED': return <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-fit"><AlertCircle size={12}/> Échoué</span>;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex bg-slate-50 min-h-screen">
        <Sidebar mode="seller" />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar mode="seller" />
      
      <main className="flex-1 ml-64">
        <TopNav title="Historique des Revenus" isAdmin={false} />
        
        <div className="p-8 max-w-6xl mx-auto space-y-8">
          
          {/* Header & Balance Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Net Balance Card */}
            <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-slate-900/20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end h-full">
                <div>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2 italic">Votre Revenu Net Total</p>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-5xl font-black">{totalNet.toLocaleString('fr-FR')}</h2>
                    <span className="text-xl text-slate-400 font-bold">FCFA</span>
                  </div>
                  <div className="mt-6 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <span className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500"></span>
                      Ventes brutes : {totalGross.toLocaleString('fr-FR')} FCFA
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <span className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500"></span>
                      Commissions prélevées (-10%) : {totalCommission.toLocaleString('fr-FR')} FCFA
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 md:mt-0 p-4 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md">
                   <div className="flex items-center gap-3">
                      <CreditCard className="text-orange-400" />
                      <div>
                         <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Paiement direct</p>
                         <p className="text-sm font-black text-white">{hasFedaPay ? 'Actif via FedaPay' : 'Non configuré'}</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>

            {/* Side Stats */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">En attente (Net)</p>
                  <p className="text-xl font-black text-slate-900">{pendingRevenue.toLocaleString('fr-FR')} <span className="text-xs text-slate-400">FCFA</span></p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
                  <Calendar size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ventes réussies</p>
                  <p className="text-xl font-black text-slate-900">
                    {successfulSalesCount} <span className="text-xs text-slate-400 font-bold">ventes</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {!hasFedaPay && (
            <div className="p-6 bg-red-50 border border-red-100 rounded-[2rem] flex gap-4 animate-in fade-in slide-in-from-bottom-4">
              <AlertCircle className="text-red-500 shrink-0 mt-1" size={24} />
              <div>
                <h4 className="text-sm font-black text-red-900">Configuration FedaPay Requise</h4>
                <p className="text-xs font-medium text-red-700/80 leading-relaxed mt-1 max-w-3xl">
                  Pour recevoir vos paiements, vous devez configurer votre compte FedaPay dans les paramètres. Afrigari prélève une commission de 10% sur chaque transaction.
                </p>
              </div>
            </div>
          )}

          {/* Transactions History */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-slate-900">Détails des gains par vente</h3>
                <p className="text-xs text-slate-500 mt-1 italic">Transparence totale sur vos revenus et commissions</p>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              {transactions.length === 0 ? (
                <div className="p-20 text-center text-slate-400">
                   <p className="font-bold italic uppercase tracking-widest text-[10px]">Aucune transaction enregistrée</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date / ID</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Prix Client (Brut)</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Commission (-10%)</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Votre Gain (Net)</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-5">
                          <p className="text-sm font-bold text-slate-700">{tx.date}</p>
                          <p className="text-[10px] font-black text-slate-400">#{tx.orderId}</p>
                        </td>
                        <td className="px-6 py-5 text-sm font-bold text-slate-600">
                          {tx.grossAmount.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="px-6 py-5 text-sm font-bold text-red-500">
                          - {tx.commissionAmount.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                             <span className="text-sm font-black text-green-600">{tx.netAmount.toLocaleString('fr-FR')} FCFA</span>
                             {tx.status === 'COMPLETED' && <ArrowUpRight size={14} className="text-green-500" />}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end">
                            {getStatusBadge(tx.status)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
