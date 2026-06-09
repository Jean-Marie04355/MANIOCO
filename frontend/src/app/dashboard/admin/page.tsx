"use client";
import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { 
  Users, ShoppingCart, TrendingUp,
  Loader2, ShieldCheck, MessageSquare 
} from 'lucide-react';
import api from '@/lib/axios';

interface Stats {
  totalRevenue: number;
  totalSalesCount: number;
  customersCount: number;
  sellersCount: number;
  pendingKycCount: number;
  activeTicketsCount: number;
  totalUsers: number;
  revenueHistory: { date: string, amount: number }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/orders/stats/admin');
        setStats(res.data);
      } catch (error) {
        console.error("Erreur lors de la récupération des stats admin", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex bg-slate-50 min-h-screen">
        <Sidebar mode="admin" />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-manioco-terracotta-500 animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar mode="admin" />
      
      <main className="flex-1 ml-64">
        <TopNav title="Tableau de bord" isAdmin={true} />
        
        <div className="p-8 space-y-8">
          {/* Main Info Banner */}
          <div className="bg-manioco-terracotta rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl shadow-manioco-terracotta/20">
             <div className="relative z-10">
                <h2 className="text-3xl font-black mb-2">Bonjour, Admin !</h2>
                <p className="text-manioco-terracotta-100 font-medium">Voici l'état actuel de votre plateforme Manioco aujourd'hui.</p>
             </div>
             <div className="absolute right-[-20px] top-[-20px] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          </div>

          {/* Real Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              icon={Users} 
              label="Utilisateurs" 
              value={stats?.totalUsers.toLocaleString() || "0"} 
              change={`${stats?.customersCount} clients`} 
              color="blue" 
            />
            <StatCard 
              icon={ShieldCheck} 
              label="Vendeurs" 
              value={stats?.sellersCount.toLocaleString() || "0"} 
              change={`${stats?.pendingKycCount} à vérifier`} 
              color="orange" 
              urgent={stats ? stats.pendingKycCount > 0 : false}
            />
            <StatCard 
              icon={ShoppingCart} 
              label="Ventes Totales" 
              value={stats?.totalSalesCount.toLocaleString() || "0"} 
              change="Total validés" 
              color="green" 
            />
            <StatCard 
              icon={TrendingUp} 
              label="Revenu (Commissions)" 
              value={stats?.totalRevenue.toLocaleString() || "0"} 
              suffix="FCFA" 
              change="Cumul plateforme" 
              color="emerald" 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Revenue Overview */}
            <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="font-black text-slate-900 text-xl tracking-tight">Performance Financière</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Revenus cumulés sur les ventes</p>
                </div>
                 <div className="flex gap-2">
                    <div className="px-4 py-2 bg-manioco-terracotta-50 text-manioco-terracotta-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-manioco-terracotta-100">Taux: 10%</div>
                 </div>
              </div>
              
              <div className="h-64 flex items-end justify-between gap-2 px-2 relative border-b border-slate-100 pb-6">
                {(!stats?.revenueHistory || stats.revenueHistory.length === 0) ? (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-bold text-[10px] uppercase tracking-widest">
                    Synchronisation des flux...
                  </div>
                ) : (
                  stats.revenueHistory.map((day: any, i: number) => {
                    const maxRevenue = Math.max(...stats.revenueHistory.map((d: any) => d.amount), 5000);
                    const height = (day.amount / maxRevenue) * 100;
                    const dateObj = new Date(day.date);
                    const dayNum = dateObj.getDate();
                    
                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <div className="w-full bg-slate-100/50 rounded-t-lg relative transition-all hover:bg-slate-200/50 flex-1 flex items-end">
                          <div 
                            style={{ height: `${Math.max(height, day.amount > 0 ? 8 : 0)}%` }} 
                            className={`w-full rounded-t-lg transition-all duration-500 ${day.amount > 0 ? 'bg-gradient-to-t from-manioco-terracotta-600 to-manioco-terracotta-400 shadow-[0_-4px_12px_rgba(158,78,59,0.3)]' : 'h-0'}`}
                          ></div>
                          
                          {/* Tooltip */}
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-20 font-black shadow-xl">
                            {day.amount.toLocaleString()} FCFA
                          </div>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 group-hover:text-slate-900 transition-colors">
                          {dayNum}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick Actions / Alerts */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col">
              <h3 className="font-black text-slate-900 text-xl mb-8 tracking-tight">Actions Prioritaires</h3>
              <div className="space-y-4 flex-1">
                <ActionItem 
                  icon={ShieldCheck} 
                  label="Vérifications KYC" 
                  count={stats?.pendingKycCount || 0} 
                  color="bg-manioco-terracotta" 
                  href="/dashboard/admin/users"
                />
                <ActionItem 
                  icon={MessageSquare} 
                  label="Tickets Support" 
                  count={stats?.activeTicketsCount || 0} 
                  color="bg-blue-500" 
                  href="/dashboard/admin/support"
                />
                 <ActionItem 
                  icon={ShoppingCart} 
                  label="Commandes en cours" 
                  count={0} // To be implemented later if needed
                  color="bg-manioco-terracotta" 
                  href="/dashboard/admin/orders"
                />
              </div>
              <button className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all">
                Optimiser la plateforme
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, change, color, suffix = "", urgent = false }: any) {
  const colors: any = {
    blue: 'text-blue-500 bg-blue-50',
    orange: 'text-manioco-terracotta-500 bg-manioco-terracotta-50',
    green: 'text-manioco-terracotta-600 bg-manioco-terracotta-50',
    emerald: 'text-manioco-brown-500 bg-manioco-brown-50',
  };
  return (
    <div className={`bg-white p-7 rounded-[2rem] shadow-sm border ${urgent ? 'border-manioco-terracotta-200 ring-2 ring-manioco-terracotta-500/5' : 'border-slate-100'} hover:shadow-md transition-all duration-300`}>
      <div className="flex items-center gap-4 mb-5">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color]}`}><Icon size={22} /></div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-tight">{label}</p>
      </div>
      <div>
        <h4 className="text-2xl font-black text-slate-900 flex items-baseline gap-1">
          {value} <span className="text-[10px] font-bold text-slate-400 tracking-normal">{suffix}</span>
        </h4>
        <span className={`text-[10px] font-black uppercase tracking-wider ${urgent ? 'text-manioco-terracotta-500' : 'text-slate-400 opacity-60'}`}>{change}</span>
      </div>
    </div>
  );
}

function ActionItem({ icon: Icon, label, count, color, href }: any) {
  const shadowClass = color.includes('manioco-terracotta') 
    ? 'shadow-manioco-terracotta/20' 
    : (color.split('-')[1] ? `shadow-${color.split('-')[1]}-500/20` : 'shadow-slate-500/20');
  return (
    <a href={href} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all cursor-pointer group">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${color} shadow-lg ${shadowClass}`}>
          <Icon size={18} />
        </div>
        <span className="text-sm font-bold text-slate-700">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`px-2.5 py-1 rounded-full text-white text-[10px] font-black ${count > 0 ? color : 'bg-slate-300'}`}>
          {count}
        </span>
      </div>
    </a>
  );
}
