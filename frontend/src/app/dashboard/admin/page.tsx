import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { Users, ShoppingBag, ShoppingCart, TrendingUp, MoreVertical, ExternalLink } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar mode="admin" />
      
      <main className="flex-1 ml-64">
        <TopNav title="Tableau de bord" isAdmin={true} />
        
        <div className="p-8 space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={Users} label="Utilisateurs" value="1,248" change="+12%" color="blue" />
            <StatCard icon={ShoppingBag} label="Produits" value="532" change="+8%" color="green" />
            <StatCard icon={ShoppingCart} label="Commandes" value="2,156" change="+15%" color="orange" />
            <StatCard icon={TrendingUp} label="Revenus" value="12.450.000" suffix="FCFA" change="+20%" color="emerald" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Orders Chart Mockup */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-900 text-lg">Commandes <span className="text-slate-400 font-medium text-sm ml-2">(30 derniers jours)</span></h3>
                <button className="text-slate-400 hover:text-slate-900 transition-colors"><MoreVertical size={20} /></button>
              </div>
              <div className="h-64 flex items-end justify-between gap-2 px-2">
                {[40, 60, 30, 80, 50, 90, 70, 60, 85, 45, 95, 60, 40].map((h, i) => (
                  <div key={i} className="flex-1 bg-green-500/10 rounded-t-lg relative group transition-all hover:bg-green-500/30">
                    <div style={{ height: `${h}%` }} className="absolute bottom-0 left-0 right-0 bg-green-500 rounded-t-lg transition-all"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Donut Chart Mockup */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg mb-6">Répartition des commandes</h3>
              <div className="flex flex-col items-center">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-[15px] border-slate-50"></div>
                  <div className="absolute inset-0 rounded-full border-[15px] border-green-500 border-t-orange-400 border-r-blue-400 transform -rotate-45"></div>
                  <div className="text-center z-10">
                    <p className="text-2xl font-black text-slate-900">2,156</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Total</p>
                  </div>
                </div>
                <div className="mt-8 w-full space-y-3">
                  <LegendItem color="bg-blue-400" label="En attente" percentage="35%" />
                  <LegendItem color="bg-green-500" label="Confirmées" percentage="45%" />
                  <LegendItem color="bg-orange-400" label="Expédiées" percentage="15%" />
                  <LegendItem color="bg-red-400" label="Annulées" percentage="5%" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <ListCard title="Activités récentes" items={activities} />
             <ListCard title="Top produits" items={topProducts} />
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, change, color, suffix = "" }: any) {
  const colors: any = {
    blue: 'text-blue-500 bg-blue-50',
    green: 'text-emerald-500 bg-emerald-50',
    orange: 'text-orange-500 bg-orange-50',
    emerald: 'text-green-500 bg-green-50',
  };
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-2xl ${colors[color]}`}><Icon size={22} /></div>
        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">{label}</p>
      </div>
      <div className="flex items-baseline gap-2">
        <h4 className="text-2xl font-black text-slate-900">{value} <span className="text-sm font-bold text-slate-400">{suffix}</span></h4>
        <span className="text-xs font-bold text-green-500">{change} ce mois</span>
      </div>
    </div>
  );
}

function LegendItem({ color, label, percentage }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${color}`}></div>
        <span className="text-slate-500 text-sm font-medium">{label}</span>
      </div>
      <span className="text-slate-900 text-sm font-bold">{percentage}</span>
    </div>
  );
}

function ListCard({ title, items }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-slate-900 text-lg">{title}</h3>
        <button className="text-green-500 text-xs font-bold hover:underline flex items-center gap-1">
          Voir tout <ExternalLink size={12} />
        </button>
      </div>
      <div className="space-y-6">
        {items.map((item: any, i: number) => (
          <div key={i} className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white bg-slate-100`}>
               {item.img ? <img src={item.img} className="w-full h-full rounded-full object-cover" /> : item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{item.title}</p>
              <p className="text-xs text-slate-400">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const activities = [
  { title: "Nouvelle commande #CMD-1258", desc: "il y a 2 minutes", icon: "📦" },
  { title: "Utilisateur John Doe inscrit", desc: "il y a 10 minutes", icon: "👤" },
  { title: "Produit 'Riz local' ajouté", desc: "il y a 1 heure", icon: "🏷️" },
];

const topProducts = [
  { title: "Riz local", desc: "1,245 ventes", img: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=100" },
  { title: "Huile rouge", desc: "854 ventes", img: "https://images.unsplash.com/photo-1474979266404-7eaacbadb8c5?auto=format&fit=crop&q=80&w=100" },
  { title: "Maïs", desc: "745 ventes", img: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80&w=100" },
];
