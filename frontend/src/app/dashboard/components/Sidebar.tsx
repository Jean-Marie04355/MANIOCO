"use client";
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, ShoppingBag, ShoppingCart, FolderTree,
  Megaphone, Bell, Flag, Clock, Image as ImageIcon, Settings,
  ShieldCheck, Database, Terminal, Activity, Server, Shield, Leaf,
  Heart, MessageSquare, Star, MapPin, CreditCard, HelpCircle, LogOut,
  Gift, BarChart3, Store, UserCheck, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuth } from '@/features/auth/AuthContext';

interface SidebarProps {
  mode: 'admin' | 'super-admin' | 'client' | 'seller';
}

export default function Sidebar({ mode }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [chatCount, setChatCount] = useState<number | null>(null);

  useEffect(() => {
    if (mode === 'seller' && user) {
      const fetchCounts = async () => {
        try {
          // Récupérer le storeId d'abord
          const storesRes = await api.get('/stores');
          const currentUserId = user.id || (user as any).userId;
          const myStore = storesRes.data.find((s: any) => s.ownerId === currentUserId);
          
          if (myStore) {
            // Compter les commandes
            const ordersRes = await api.get(`/orders/store/${myStore.id}`);
            setOrderCount(ordersRes.data.length);

            // Compter les conversations
            const chatRes = await api.get('/chat/conversations');
            setChatCount(chatRes.data.length);
          }
        } catch (error) {
          console.error("Erreur récupération des compteurs sidebar", error);
        }
      };
      fetchCounts();
    }
  }, [mode, user]);
  const isActive = (href: string) => {
    if (href === '#') return false;
    if (['/dashboard/super-admin', '/dashboard/admin', '/dashboard/client', '/dashboard/seller'].includes(href)) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const getMenuItems = () => {
    switch (mode) {
      case 'admin':
        return [
          { icon: LayoutDashboard, label: 'Tableau de bord', active: true },
          { icon: Users, label: 'Utilisateurs' },
          { icon: ShoppingBag, label: 'Produits' },
          { icon: ShoppingCart, label: 'Commandes' },
          { icon: FolderTree, label: 'Catégories' },
          { icon: Megaphone, label: 'Annonces' },
          { icon: Bell, label: 'Notifications' },
          { icon: Flag, label: 'Signalements' },
          { icon: Clock, label: 'Tâches en attente' },
          { icon: ImageIcon, label: 'Médias' },
          { icon: Settings, label: 'Paramètres' },
        ];
      case 'super-admin':
        return [
          { icon: LayoutDashboard, label: 'Tableau de bord', active: true, href: '/dashboard/super-admin' },
          { icon: Users, label: 'Utilisateurs', href: '/dashboard/super-admin/users' },
          { icon: ShieldCheck, label: 'Admins & Rôles', href: '/dashboard/super-admin/admins' },
          { icon: Shield, label: 'Permissions', href: '/dashboard/super-admin/permissions' },
          { icon: Database, label: 'Logs système', href: '/dashboard/super-admin/logs' },
        ];
      case 'client':
        return [
          { icon: LayoutDashboard, label: 'Tableau de bord', active: true },
          { icon: ShoppingBag, label: 'Mes commandes' },
          { icon: Heart, label: 'Mes favoris' },
          { icon: MessageSquare, label: 'Messages', badge: "2" },
          { icon: Star, label: 'Mes avis' },
          { icon: MapPin, label: 'Mes adresses' },
          { icon: CreditCard, label: 'Mes paiements' },
          { icon: Bell, label: 'Notifications' },
          { icon: Settings, label: 'Paramètres' },
          { icon: HelpCircle, label: 'Aide & support' },
        ];
      case 'seller':
        return [
          { icon: LayoutDashboard, label: 'Tableau de bord', href: '/dashboard/seller' },
          { icon: ShoppingBag, label: 'Mes produits', href: '/dashboard/seller/products' },
          { icon: FolderTree, label: 'Mes catégories', href: '/dashboard/seller/categories' },
          { icon: ShoppingCart, label: 'Commandes', href: '/dashboard/seller/orders', badge: orderCount && orderCount > 0 ? orderCount.toString() : null },
          { icon: MessageSquare, label: 'Messages', href: '/dashboard/seller/messages', badge: chatCount && chatCount > 0 ? chatCount.toString() : null },
          { icon: CreditCard, label: 'Revenus', href: '/dashboard/seller/revenues' },
          { icon: Store, label: 'Paramètres boutique', href: '/dashboard/seller/settings/store' },
          { icon: Settings, label: 'Paramètres compte', href: '/dashboard/seller/settings/account' },
        ];
    }
  };

  const menuItems = getMenuItems();
  const isAdminOrSuper = mode === 'admin' || mode === 'super-admin';

  return (
    <aside className={`w-64 h-screen fixed left-0 top-0 flex flex-col border-r transition-colors duration-300 ${isAdminOrSuper ? (mode === 'admin' ? 'bg-slate-900' : 'bg-[#0f111a]') : 'bg-white'
      } border-slate-200 dark:border-slate-800`}>
      <div className="p-6 flex items-center gap-3">
        <div className="relative w-10 h-10 flex items-center justify-center">
          <Leaf className="text-green-500 fill-green-500 absolute -rotate-12 translate-x-[-4px] translate-y-[2px]" size={22} />
          <Leaf className="text-green-400 fill-green-400 absolute rotate-12 translate-x-[4px] translate-y-[2px]" size={22} />
          <Leaf className="text-green-600 fill-green-600 absolute -translate-y-[4px]" size={24} />
        </div>
        <span className={`${isAdminOrSuper ? 'text-white' : 'text-slate-900'} font-black text-2xl tracking-tighter`}>Afrigari</span>
      </div>

      {mode === 'super-admin' && (
        <div className="px-4 mb-6">
          <Link href="/dashboard/super-admin/profile" className="flex items-center gap-4 bg-white/40 p-4 rounded-[30px] border border-white hover:bg-white hover:shadow-xl transition-all group">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black italic shadow-lg shadow-indigo-100 group-hover:rotate-12 transition-transform">
              SA
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic group-hover:text-indigo-600 transition-colors">Super_Admin</p>
              <p className="text-xs font-black text-slate-800 italic uppercase">Maître Administrateur</p>
            </div>
            <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
        {menuItems.map((item: any, index: number) => {
          const isItemActive = item.href ? isActive(item.href) : item.active;
          return (
            <Link
              key={index}
              href={item.href || "#"}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isItemActive
                  ? (mode === 'client' ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' :
                    mode === 'seller' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' :
                      mode === 'admin' ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' :
                        'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20')
                  : (isAdminOrSuper ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50')
                }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} />
                {item.label}
              </div>
              {item.badge && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isItemActive ? 'bg-white text-indigo-600' : 'bg-indigo-500 text-white'}`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className={`p-4 mt-auto border-t border-slate-100 dark:border-slate-800`}>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-bold text-sm"
        >
           <LogOut size={18} />
           Déconnexion
        </button>
      </div>
    </aside>
  );
}
