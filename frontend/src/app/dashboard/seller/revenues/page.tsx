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
  amount: number;
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
        // 1. Récupérer la boutique pour vérifier FedaPay
        const storesRes = await api.get('/stores');
        const myStore = storesRes.data.find((s: any) => s.ownerId === currentUserId);
        
        if (myStore) {
          setHasFedaPay(!!myStore.payoutAccountId);

          // 2. Récupérer les commandes pour calculer les revenus
          const ordersRes = await api.get(`/orders/store/${myStore.id}`);
          const orders = ordersRes.data;

          // 3. Mapper les commandes en transactions (montant brut pour l'historique)
          const mappedTransactions: Transaction[] = orders.map((order: any) => ({
            id: `TX-${order.id.split('-')[0].toUpperCase()}`,
            orderId: order.id.split('-')[0].toUpperCase(),
            amount: Number(order.totalAmount), // On affiche le montant total payé par le client
            status: mapOrderStatusToTxStatus(order.status),
            date: new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
          }));

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

  // Le total affiché dans la carte est le NET (90%)
  const totalRevenue = transactions
    .filter(t => t.status === 'COMPLETED')
    .reduce((acc, t) => acc + (t.amount * 0.9), 0);

  // Les ventes en cours sont affichées en BRUT (montant client) pour la traçabilité
  const pendingRevenue = transactions
    .filter(t => t.status === 'PENDING')
    .reduce((acc, t) => acc + t.amount, 0);

  const currentMonthSales = transactions.filter(t => {
    return t.status === 'COMPLETED';
  }).length;

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
        <TopNav title="Historique des Revenus" isAdmin={true} />
        
        <div className="p-8 max-w-6xl mx-auto space-y-8">
          
          {/* Header & Balance Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Balance Card */}
            <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-slate-900/20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end h-full">
                <div>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Revenus nets (après commission 10%)</p>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-5xl font-black">{totalRevenue.toLocaleString('fr-FR')}</h2>
                    <span className="text-xl text-slate-400 font-bold">FCFA</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-4 max-w-md">Vos revenus nets après déduction de la commission de service Afrigari.</p>
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

            {/* Secondary Stats */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ventes en cours</p>
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
                    {currentMonthSales} <span className="text-xs text-slate-400 font-bold">ventes</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {!hasFedaPay && (
            <div className="p-6 bg-red-50 border border-red-100 rounded-[2rem] flex gap-4 animate-in fade-in slide-in-from-bottom-4">
              <AlertCircle className="text-red-500 shrink-0 mt-1" size={24} />
              <div>
                <h4 className="text-sm font-black text-red-900">Configuration Incomplète</h4>
                <p className="text-xs font-medium text-red-700/80 leading-relaxed mt-1 max-w-3xl">
                  Pour que l'argent soit déposé automatiquement, assurez-vous d'avoir bien renseigné votre identifiant FedaPay dans les paramètres de la boutique.
                </p>
              </div>
            </div>
          )}

          {/* Transactions History */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-slate-900">Historique des ventes</h3>
                <p className="text-xs text-slate-500 mt-1">Traçabilité de vos revenus</p>
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
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Opération</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Statut</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Commande</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-5 text-sm font-bold text-slate-700">{tx.date}</td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.status === 'COMPLETED' ? 'bg-green-50 text-green-500' : 'bg-orange-50 text-orange-500'}`}>
                              <ArrowUpRight size={14}/>
                            </div>
                            <span className="text-sm font-bold text-slate-900">Paiement Client</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-sm font-black text-slate-900">
                          {tx.amount.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="px-6 py-5">
                          {getStatusBadge(tx.status)}
                        </td>
                        <td className="px-8 py-5 text-right text-xs font-bold text-slate-400">
                          <span className="px-2 py-1 bg-slate-100 rounded-md">#{tx.orderId}</span>
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
