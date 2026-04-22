import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { ShoppingBag, Users, ShoppingCart, TrendingUp, MoreVertical, MessageSquare, Star, ArrowUpRight, Store } from 'lucide-react';

export default function SellerDashboard() {
  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar mode="seller" />
      
      <main className="flex-1 ml-64">
        <TopNav title="Gestion Boutique" isAdmin={true} />
        
        <div className="p-8 space-y-8">
          {/* Seller Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Ventes totales" value="125" desc="Commandes" change="+18% ce mois" icon={ShoppingCart} color="bg-orange-50 text-orange-600" />
            <StatCard label="Revenus" value="950.000" suffix="FCFA" desc="Ce mois" change="+22% ce mois" icon={TrendingUp} color="bg-green-50 text-green-600" />
            <StatCard label="Produits" value="32" desc="En ligne" icon={ShoppingBag} color="bg-blue-50 text-blue-600" />
            <StatCard label="Clients" value="278" desc="Clients actifs" change="+15% ce mois" icon={Users} color="bg-red-50 text-red-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Sales Evolution Line Chart Mockup */}
             <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                   <div>
                      <h3 className="text-lg font-bold text-slate-900">Évolution des ventes</h3>
                      <p className="text-xs text-slate-400">Suivi des 6 derniers mois</p>
                   </div>
                   <select className="text-xs bg-slate-50 border-none rounded-lg py-1 px-3 font-bold text-slate-500 outline-none">
                      <option>6 derniers mois</option>
                   </select>
                </div>
                <div className="h-64 relative flex items-end">
                   {/* Simulated Line Chart with dots and lines */}
                   <svg className="w-full h-full overflow-visible">
                      <path d="M0,180 L100,140 L200,160 L300,100 L400,80 L500,40" fill="none" stroke="#f97316" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                      {[0, 100, 200, 300, 400, 500].map((x, i) => (
                        <circle key={i} cx={x} cy={[180, 140, 160, 100, 80, 40][i]} r="6" fill="white" stroke="#f97316" strokeWidth="3" />
                      ))}
                   </svg>
                   <div className="absolute bottom-[-20px] left-0 right-0 flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                      <span>Déc</span><span>Jan</span><span>Fév</span><span>Mar</span><span>Avr</span><span>Mai</span>
                   </div>
                </div>
             </div>

             {/* Order Status Donut */}
             <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-8">Statut des commandes</h3>
                <div className="flex flex-col items-center">
                   <div className="relative w-44 h-44">
                      <svg className="w-full h-full transform -rotate-90">
                         <circle cx="88" cy="88" r="70" stroke="currentColor" strokeWidth="15" fill="transparent" className="text-slate-50" />
                         <circle cx="88" cy="88" r="70" stroke="currentColor" strokeWidth="15" fill="transparent" strokeDasharray="440" strokeDashoffset="110" className="text-orange-500" />
                         <circle cx="88" cy="88" r="70" stroke="currentColor" strokeWidth="15" fill="transparent" strokeDasharray="440" strokeDashoffset="280" className="text-blue-500" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                         <p className="text-2xl font-black text-slate-900">125</p>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Commandes</p>
                      </div>
                   </div>
                   <div className="mt-8 w-full grid grid-cols-2 gap-4">
                      <StatusLegend color="bg-orange-500" label="En attente" value="8" percent="16%" />
                      <StatusLegend color="bg-blue-500" label="Confirmées" value="15" percent="30%" />
                      <StatusLegend color="bg-orange-300" label="En cours" value="18" percent="36%" />
                      <StatusLegend color="bg-green-500" label="Livrées" value="9" percent="18%" />
                   </div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {/* Recent Orders List */}
             <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-lg font-bold text-slate-900">Commandes récentes</h3>
                   <button className="text-orange-500 text-xs font-bold hover:underline">Voir toutes</button>
                </div>
                <div className="space-y-4">
                   {sellerOrders.map((order, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-all group">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">#{order.id}</div>
                            <div>
                               <p className="text-sm font-bold text-slate-800">{order.client}</p>
                               <p className="text-[10px] text-slate-400 font-bold">{order.date}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${order.statusColor}`}>{order.status}</span>
                            <span className="text-sm font-black text-slate-900">{order.price}</span>
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             {/* Top Products */}
             <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-lg font-bold text-slate-900">Produits les plus vendus</h3>
                   <button className="text-orange-500 text-xs font-bold hover:underline">Voir tout</button>
                </div>
                <div className="space-y-4">
                   {sellerTopProducts.map((p, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-2xl group cursor-pointer hover:bg-orange-50/30 transition-colors">
                         <div className="flex items-center gap-4">
                            <img src={p.img} className="w-12 h-12 rounded-xl object-cover" />
                            <div>
                               <p className="text-sm font-bold text-slate-800">{p.name}</p>
                               <p className="text-xs text-slate-400 font-medium">{p.sales} ventes</p>
                            </div>
                         </div>
                         <button className="p-2 rounded-lg text-slate-400 hover:text-orange-500 opacity-0 group-hover:opacity-100 transition-all"><ArrowUpRight size={18} /></button>
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
                   <button className="text-orange-500 text-xs font-bold hover:underline">Voir tout</button>
                </div>
                <div className="space-y-6">
                   {sellerMessages.map((msg, i) => (
                      <div key={i} className="flex gap-4">
                         <img src={msg.img} className="w-10 h-10 rounded-full" />
                         <div className="flex-1">
                            <div className="flex justify-between items-center">
                               <p className="text-sm font-bold text-slate-800">{msg.user}</p>
                               <span className="text-[10px] text-slate-400 font-bold">{msg.time}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">{msg.text}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             {/* Revenue Bar Chart */}
             <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-lg font-bold text-slate-900">Aperçu des revenus</h3>
                   <select className="text-xs bg-slate-50 border-none rounded-lg py-1 px-2 font-bold text-slate-500">
                      <option>6 derniers mois</option>
                   </select>
                </div>
                <div className="h-44 flex items-end gap-3 px-2">
                   {[40, 70, 60, 85, 95, 100].map((h, i) => (
                     <div key={i} className="flex-1 bg-orange-100 rounded-t-xl group relative">
                        <div style={{ height: `${h}%` }} className="absolute bottom-0 left-0 right-0 bg-orange-500 rounded-t-xl transition-all group-hover:bg-orange-600"></div>
                     </div>
                   ))}
                </div>
                <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
                   <span>Déc</span><span>Jan</span><span>Fév</span><span>Mar</span><span>Avr</span><span>Mai</span>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, desc, change, icon: Icon, color, suffix = "" }: any) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm hover:shadow-md transition-all group">
       <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-2xl ${color} group-hover:scale-110 transition-transform`}><Icon size={20} /></div>
       </div>
       <h4 className="text-2xl font-black text-slate-900">{value} <span className="text-xs font-bold text-slate-400">{suffix}</span></h4>
       <div className="flex items-center justify-between mt-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
          {change && <span className="text-[10px] font-black text-green-500">{change}</span>}
       </div>
    </div>
  );
}

function StatusLegend({ color, label, value, percent }: any) {
  return (
    <div className="flex items-center gap-2">
       <div className={`w-2.5 h-2.5 rounded-full ${color}`}></div>
       <div className="flex-1">
          <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{label}</p>
          <p className="text-xs font-black text-slate-800">{value} <span className="text-[10px] text-slate-400">({percent})</span></p>
       </div>
    </div>
  );
}

const sellerOrders = [
  { id: "CMD-1258", client: "Marie KO.", date: "28 Mai 2024", price: "25.000 FCFA", status: "En cours", statusColor: "bg-orange-50 text-orange-600" },
  { id: "CMD-1257", client: "Pierre AD.", date: "28 Mai 2024", price: "45.000 FCFA", status: "Confirmée", statusColor: "bg-green-50 text-green-600" },
  { id: "CMD-1256", client: "Aïssata T.", date: "27 Mai 2024", price: "35.000 FCFA", status: "En attente", statusColor: "bg-blue-50 text-blue-600" },
];

const sellerTopProducts = [
  { name: "Montre intelligente", sales: "45", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=100" },
  { name: "Casque sans fil", sales: "32", img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=100" },
];

const sellerMessages = [
  { user: "Jean Paul", time: "il y a 3h", text: "Bonjour, mon colis n'est pas encore arrivé.", img: "https://ui-avatars.com/api/?name=Jean+Paul&background=random" },
  { user: "Marie KO.", time: "il y a 5h", text: "Merci pour la livraison rapide !", img: "https://ui-avatars.com/api/?name=Marie+KO&background=random" },
];
