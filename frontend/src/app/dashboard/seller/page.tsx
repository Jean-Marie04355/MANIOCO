"use client";
import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { 
  ShoppingBag, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  MessageSquare, 
  ArrowUpRight, 
  Loader2,
  Package
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import api from '@/lib/axios';
import { useAuth } from '@/features/auth/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
export default function SellerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && !user.isVerified) {
      router.push('/dashboard/seller/verification');
    }
  }, [user, router]);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    productCount: 0,
    clientCount: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const currentUserId = user?.id || (user as any)?.userId;
      if (!currentUserId) return;

      try {
        // 1. Récupérer la boutique
        const storesRes = await api.get('/stores');
        const myStore = storesRes.data.find((s: any) => s.ownerId === currentUserId);
        
        if (myStore) {
          // 2. Récupérer les produits
          const productsRes = await api.get(`/products?storeId=${myStore.id}`);
          const products = productsRes.data;

          // 3. Récupérer les commandes
          const ordersRes = await api.get(`/orders/store/${myStore.id}`);
          const orders = ordersRes.data;

          // 4. Récupérer les conversations
          const chatRes = await api.get('/chat/conversations');
          const conversations = chatRes.data;

          // Calculer les stats
          const successfulOrders = orders.filter((o: any) => ['PAID', 'SHIPPED', 'DELIVERED'].includes(o.status));
          const totalRevenue = successfulOrders.reduce((acc: number, o: any) => acc + Number(o.totalAmount), 0);
          const uniqueClients = new Set(orders.map((o: any) => o.customerId)).size;

          setStats({
            totalSales: successfulOrders.length,
            totalRevenue: totalRevenue,
            productCount: products.length,
            clientCount: uniqueClients
          });

          setRecentOrders(orders.slice(0, 5));
          setRecentMessages(conversations.slice(0, 3));
          setTopProducts(products.slice(0, 4));

          // 5. Préparer les données du graphique (6 derniers mois)
          const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
          const last6Months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - (5 - i));
            return {
              month: d.getMonth(),
              year: d.getFullYear(),
              monthName: months[d.getMonth()],
              revenue: 0
            };
          });

          successfulOrders.forEach((order: any) => {
            const orderDate = new Date(order.createdAt);
            const monthEntry = last6Months.find(m => m.month === orderDate.getMonth() && m.year === orderDate.getFullYear());
            if (monthEntry) {
              monthEntry.revenue += Number(order.totalAmount);
            }
          });

          setChartData(last6Months);
        }
      } catch (error) {
        console.error("Erreur chargement dashboard vendeur", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

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
        <TopNav title="Gestion Boutique" isAdmin={true} />
        
        <div className="p-8 space-y-8">
          {/* Seller Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Ventes réussies" value={stats.totalSales} desc="Commandes" icon={ShoppingCart} color="bg-orange-50 text-orange-600" />
            <StatCard label="Revenus" value={stats.totalRevenue.toLocaleString('fr-FR')} suffix="FCFA" desc="Total encaissé" icon={TrendingUp} color="bg-green-50 text-green-600" />
            <StatCard label="Produits" value={stats.productCount} desc="En catalogue" icon={ShoppingBag} color="bg-blue-50 text-blue-600" />
            <StatCard label="Clients" value={stats.clientCount} desc="Clients uniques" icon={Users} color="bg-red-50 text-red-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Simple visual placeholders for charts as they were mock in original */}
             <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm min-h-[300px]">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-lg font-bold text-slate-900">Évolution des revenus</h3>
                   <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenus (FCFA)</span>
                   </div>
                </div>
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="monthName" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                        dy={10}
                      />
                      <YAxis 
                        hide={true} 
                        domain={['auto', 'auto']}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '16px', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                        formatter={(value: any) => [`${value.toLocaleString()} FCFA`, 'Revenu']}
                        labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#f97316" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorRev)" 
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
             </div>

             <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-8">Statut des commandes</h3>
                <div className="space-y-4">
                   <StatusLegend color="bg-orange-500" label="En attente" value={recentOrders.filter(o => o.status === 'PENDING').length} />
                   <StatusLegend color="bg-green-500" label="Livrées" value={recentOrders.filter(o => o.status === 'DELIVERED').length} />
                   <StatusLegend color="bg-blue-500" label="Payées" value={recentOrders.filter(o => o.status === 'PAID').length} />
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {/* Recent Orders List */}
             <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-lg font-bold text-slate-900">Commandes récentes</h3>
                   <Link href="/dashboard/seller/orders" className="text-orange-500 text-xs font-bold hover:underline">Voir toutes</Link>
                </div>
                <div className="space-y-4">
                   {recentOrders.length === 0 ? (
                      <p className="text-center py-10 text-slate-400 text-sm italic">Aucune commande pour le moment</p>
                   ) : recentOrders.map((order, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-all group">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">#{order.id.slice(0, 5)}</div>
                            <div>
                               <p className="text-sm font-bold text-slate-800">{order.customer?.firstName || 'Client'} {order.customer?.lastName || ''}</p>
                               <p className="text-[10px] text-slate-400 font-bold">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              order.status === 'DELIVERED' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                            }`}>{order.status}</span>
                            <span className="text-sm font-black text-slate-900">{Number(order.totalAmount).toLocaleString()} FCFA</span>
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             {/* Top Products */}
             <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-lg font-bold text-slate-900">Vos produits</h3>
                   <Link href="/dashboard/seller/products" className="text-orange-500 text-xs font-bold hover:underline">Gérer</Link>
                </div>
                <div className="space-y-4">
                   {topProducts.length === 0 ? (
                      <p className="text-center py-10 text-slate-400 text-sm italic">Aucun produit en catalogue</p>
                   ) : topProducts.map((p, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-2xl group cursor-pointer hover:bg-orange-50/30 transition-colors">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden relative">
                               {p.profilePhoto ? (
                                 <img src={p.profilePhoto} className="w-full h-full object-cover" />
                               ) : (
                                 <div className="w-full h-full flex items-center justify-center text-slate-300"><Package size={20} /></div>
                               )}
                            </div>
                            <div>
                               <p className="text-sm font-bold text-slate-800">{p.name}</p>
                               <p className="text-xs text-slate-400 font-black">{Number(p.price).toLocaleString()} FCFA</p>
                            </div>
                         </div>
                         <ArrowUpRight size={18} className="text-slate-300 group-hover:text-orange-500 transition-all" />
                      </div>
                   ))}
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-8">
             {/* Recent Messages */}
             <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-lg font-bold text-slate-900">Messages récents</h3>
                   <Link href="/dashboard/seller/messages" className="text-orange-500 text-xs font-bold hover:underline">Voir tout</Link>
                </div>
                <div className="space-y-6">
                   {recentMessages.length === 0 ? (
                      <p className="text-center py-10 text-slate-400 text-sm italic">Aucun message pour le moment</p>
                   ) : recentMessages.map((conv, i) => (
                      <div key={i} className="flex gap-4">
                         <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 font-bold text-xs uppercase">
                            {conv.customer?.firstName?.[0] || 'C'}{conv.customer?.lastName?.[0] || ''}
                         </div>
                         <div className="flex-1">
                            <div className="flex justify-between items-center">
                               <p className="text-sm font-bold text-slate-800">{conv.customer?.firstName} {conv.customer?.lastName}</p>
                               <span className="text-[10px] text-slate-400 font-bold">{new Date(conv.lastMessageAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">{conv.lastMessageText}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             <div className="bg-orange-500 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-orange-500/20">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                <h4 className="text-xl font-black mb-2 relative z-10">Booster votre visibilité</h4>
                <p className="text-orange-100 text-sm mb-6 relative z-10 leading-relaxed">Mettez vos produits en avant sur la page d'accueil pour atteindre plus de clients ce mois-ci.</p>
                <button className="bg-white text-orange-500 px-6 py-3 rounded-2xl font-black text-sm hover:bg-orange-50 transition-all shadow-lg active:scale-95">Créer une publicité</button>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, desc, icon: Icon, color, suffix = "" }: any) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm hover:shadow-md transition-all group">
       <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-2xl ${color} group-hover:scale-110 transition-transform`}><Icon size={20} /></div>
       </div>
       <h4 className="text-2xl font-black text-slate-900">{value} <span className="text-xs font-bold text-slate-400">{suffix}</span></h4>
       <div className="flex items-center justify-between mt-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
          <span className="text-[10px] font-bold text-slate-400">{desc}</span>
       </div>
    </div>
  );
}

function StatusLegend({ color, label, value }: any) {
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
       <div className={`w-3 h-3 rounded-full ${color} shadow-sm`}></div>
       <div className="flex-1">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{label}</p>
       </div>
       <p className="text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}
