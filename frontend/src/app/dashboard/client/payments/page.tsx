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
  Loader2,
  Wallet,
  ArrowDownLeft,
  History,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import api from '@/lib/axios';
import { useAuth } from '@/features/auth/AuthContext';

interface Transaction {
  id: string;
  orderId: string;
  amount: number;
  status: 'COMPLETED' | 'PENDING' | 'DECLINED';
  date: string;
  method: string;
}

export default function ClientPayments() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ totalSpent: 0, pending: 0, points: 0 });

  useEffect(() => {
    const fetchPayments = async () => {
      const currentUserId = user?.id || (user as any)?.userId;
      if (!currentUserId) return;

      try {
        // 1. Récupérer les commandes du client
        const ordersRes = await api.get('/orders');
        const orders = ordersRes.data;

        // 2. Mapper les commandes en transactions de paiement
        const mappedTransactions: Transaction[] = orders.map((order: any) => ({
          id: `PAY-${order.id.split('-')[0].toUpperCase()}`,
          orderId: order.id.split('-')[0].toUpperCase(),
          amount: Number(order.totalAmount),
          status: mapOrderStatusToTxStatus(order.status),
          date: new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
          method: 'FedaPay / Mobile Money'
        }));

        setTransactions(mappedTransactions);
        
        // 3. Calculer les stats
        const spent = mappedTransactions
            .filter(t => t.status === 'COMPLETED')
            .reduce((acc, t) => acc + t.amount, 0);
        const pending = mappedTransactions
            .filter(t => t.status === 'PENDING')
            .reduce((acc, t) => acc + t.amount, 0);
            
        setStats({ 
            totalSpent: spent, 
            pending,
            points: Math.floor(spent / 100) 
        });

      } catch (error) {
        console.error("Erreur chargement paiements client", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, [user]);

  const mapOrderStatusToTxStatus = (status: string): Transaction['status'] => {
    switch (status) {
      case 'PAID':
      case 'SHIPPED':
      case 'DELIVERED':
      case 'COMPLETED':
        return 'COMPLETED';
      case 'PENDING':
        return 'PENDING';
      case 'CANCELLED':
      case 'DECLINED':
        return 'DECLINED';
      default:
        return 'PENDING';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <span className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 w-fit"><CheckCircle2 size={12}/> Confirmé</span>;
      case 'PENDING': return <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 w-fit"><Clock size={12} className="animate-pulse" /> En attente</span>;
      case 'DECLINED': return <span className="px-3 py-1 rounded-full bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 w-fit"><AlertCircle size={12}/> Échoué</span>;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex bg-luxury-cream/30 min-h-screen font-sans">
        <Sidebar mode="client" />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-afrigari-gold animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex bg-luxury-cream/30 min-h-screen font-sans text-forest-night selection:bg-afrigari-gold selection:text-white">
      <Sidebar mode="client" />
      
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        <TopNav title="Mes Paiements & Transactions" isAdmin={false} />
        
        <div className="p-8 lg:p-12 max-w-7xl mx-auto w-full space-y-12 animate-reveal">
          
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
            <div>
               <h1 className="text-5xl font-black tracking-tighter text-forest-night italic uppercase">Mes Finances.</h1>
               <p className="text-[10px] font-black text-forest-night/40 uppercase tracking-[0.4em] mt-2">Gestion de vos transactions sécurisées</p>
            </div>
            <div className="flex gap-4">
               <div className="bg-white p-6 rounded-3xl border border-forest-night/5 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-afrigari-gold/10 flex items-center justify-center text-afrigari-gold"><ShieldCheck size={20} /></div>
                  <div>
                     <p className="text-[8px] font-black text-forest-night/30 uppercase tracking-widest">Sécurité</p>
                     <p className="text-[10px] font-black text-forest-night">SSL 256-bit</p>
                  </div>
               </div>
            </div>
          </div>

          {/* Wallet & Stats Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Balance Card */}
            <div className="lg:col-span-2 bg-forest-night rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl group hover:scale-[1.01] transition-transform duration-500">
               <div className="absolute top-0 right-0 w-96 h-96 bg-afrigari-gold rounded-full blur-[140px] opacity-20 -translate-y-1/2 translate-x-1/2 group-hover:opacity-30 transition-opacity"></div>
               
               <div className="relative z-10 flex flex-col justify-between h-full space-y-12">
                 <div className="flex justify-between items-start">
                    <div>
                       <p className="text-white/40 font-black uppercase tracking-[0.3em] text-[10px] mb-2">Total Dépensé</p>
                       <div className="flex items-baseline gap-3">
                         <h2 className="text-6xl font-black tracking-tighter">{stats.totalSpent.toLocaleString('fr-FR')}</h2>
                         <span className="text-xl text-afrigari-gold font-black italic">FCFA</span>
                       </div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl">
                       <CreditCard size={32} className="text-afrigari-gold" />
                    </div>
                 </div>
                 
                 <div className="flex flex-wrap gap-10 border-t border-white/5 pt-8">
                    <div>
                       <p className="text-white/30 font-black uppercase tracking-widest text-[9px] mb-1">Points Fidélité</p>
                       <p className="text-xl font-black text-afrigari-gold">{stats.points.toLocaleString()} <span className="text-[10px] text-white/50">pts</span></p>
                    </div>
                    <div>
                       <p className="text-white/30 font-black uppercase tracking-widest text-[9px] mb-1">Prochain Statut</p>
                       <p className="text-xl font-black text-white italic">Premium Plus</p>
                    </div>
                 </div>
               </div>
            </div>

            {/* Side Stats */}
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-forest-night/5 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all">
                <div className="w-16 h-16 rounded-3xl bg-orange-50 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                  <TrendingUp size={28} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-forest-night/30 uppercase tracking-widest mb-1">En cours</p>
                  <p className="text-2xl font-black text-forest-night">{stats.pending.toLocaleString('fr-FR')} <span className="text-xs text-forest-night/40 font-bold">F</span></p>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-forest-night/5 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all">
                <div className="w-16 h-16 rounded-3xl bg-soft-mint flex items-center justify-center text-forest-night group-hover:scale-110 transition-transform">
                  <Calendar size={28} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-forest-night/30 uppercase tracking-widest mb-1">Transactions</p>
                  <p className="text-2xl font-black text-forest-night">
                    {transactions.length} <span className="text-xs text-forest-night/40 font-bold">Total</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-white rounded-[3.5rem] border border-forest-night/5 shadow-xl overflow-hidden">
            <div className="p-10 border-b border-forest-night/5 flex justify-between items-center bg-slate-50/30">
              <div>
                <h3 className="text-2xl font-black tracking-tighter text-forest-night italic uppercase">Historique Complet.</h3>
                <p className="text-[10px] font-black text-forest-night/30 uppercase tracking-[0.3em] mt-1">Vos transactions des 12 derniers mois</p>
              </div>
              <button className="flex items-center gap-2 text-[10px] font-black text-afrigari-gold uppercase tracking-widest hover:text-forest-night transition-colors">
                 Télécharger le rapport <ArrowDownLeft size={16} />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              {transactions.length === 0 ? (
                <div className="p-32 text-center">
                   <div className="w-20 h-20 bg-forest-night/5 rounded-full flex items-center justify-center mx-auto mb-6">
                      <History size={32} className="text-forest-night/20" />
                   </div>
                   <p className="font-black italic uppercase tracking-[0.5em] text-forest-night/20 text-xs">Aucune transaction trouvée</p>
                </div>
              ) : (
                <div className="p-6">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-forest-night/5">
                        <th className="px-8 py-6 text-[9px] font-black text-forest-night/30 uppercase tracking-widest">Référence / Date</th>
                        <th className="px-6 py-6 text-[9px] font-black text-forest-night/30 uppercase tracking-widest">Type de Transaction</th>
                        <th className="px-6 py-6 text-[9px] font-black text-forest-night/30 uppercase tracking-widest">Montant</th>
                        <th className="px-6 py-6 text-[9px] font-black text-forest-night/30 uppercase tracking-widest">Méthode</th>
                        <th className="px-6 py-6 text-[9px] font-black text-forest-night/30 uppercase tracking-widest text-center">Statut</th>
                        <th className="px-8 py-6 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-forest-night/5">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-luxury-cream/20 transition-all group">
                          <td className="px-8 py-8">
                             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-forest-night/5 rounded-2xl flex items-center justify-center text-[10px] font-black text-forest-night/30 italic">#{tx.orderId}</div>
                                <span className="text-xs font-black text-forest-night/60 uppercase">{tx.date}</span>
                             </div>
                          </td>
                          <td className="px-6 py-8">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tx.status === 'COMPLETED' ? 'bg-green-50 text-green-500' : 'bg-orange-50 text-orange-500'}`}>
                                <ArrowUpRight size={16}/>
                              </div>
                              <span className="text-xs font-black text-forest-night uppercase tracking-tighter">Achat Marketplace</span>
                            </div>
                          </td>
                          <td className="px-6 py-8">
                             <p className="text-base font-black text-forest-night">{tx.amount.toLocaleString('fr-FR')} <span className="text-[10px] opacity-40">FCFA</span></p>
                          </td>
                          <td className="px-6 py-8">
                             <p className="text-[10px] font-black text-forest-night/40 uppercase tracking-widest">{tx.method}</p>
                          </td>
                          <td className="px-6 py-8">
                             <div className="flex justify-center">{getStatusBadge(tx.status)}</div>
                          </td>
                          <td className="px-8 py-8 text-right">
                             <button className="p-3 bg-forest-night/5 rounded-xl text-forest-night/20 group-hover:bg-forest-night group-hover:text-white transition-all">
                                <ChevronRight size={18} />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          
          {/* Footer Card */}
          <div className="bg-afrigari-gold rounded-[3rem] p-10 flex flex-col md:flex-row justify-between items-center text-forest-night group overflow-hidden relative">
             <div className="relative z-10">
                <h3 className="text-3xl font-black tracking-tighter italic uppercase leading-none">Besoin d&apos;assistance ?</h3>
                <p className="text-xs font-bold mt-2 uppercase tracking-widest opacity-60">Notre support financier est disponible 24/7 pour vos transactions.</p>
             </div>
             <button className="mt-8 md:mt-0 px-10 py-5 bg-forest-night text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl relative z-10">
                Ouvrir un ticket support
             </button>
             <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Sub-component for clocks
function Clock({ size, className }: { size: number; className?: string }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
}
