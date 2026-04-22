"use client";
import { 
  LayoutDashboard, Users, ShoppingBag, ShoppingCart, FolderTree, 
  Megaphone, Bell, Flag, Clock, Image as ImageIcon, Settings, 
  ShieldCheck, Database, Terminal, Activity, Server, Shield, Leaf,
  Heart, MessageSquare, Star, MapPin, CreditCard, HelpCircle, LogOut,
  Gift, BarChart3, Store, UserCheck
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  mode: 'admin' | 'super-admin' | 'client' | 'seller';
}

export default function Sidebar({ mode }: SidebarProps) {
  const pathname = usePathname();
  
  const isActive = (href: string) => {
    if (href === '#') return false;
    // Correspondance exacte uniquement pour la page d'accueil du dashboard (pour éviter d'être actif sur les sous-pages)
    if (['/dashboard/super-admin', '/dashboard/admin', '/dashboard/client', '/dashboard/seller'].includes(href)) {
      return pathname === href;
    }
    // Pour les autres onglets, on reste actif même si on est sur une sous-page
    return pathname === href || pathname.startsWith(href + '/');
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
          { icon: ShieldCheck, label: 'Admins & Rôles', href: '#' },
          { icon: Shield, label: 'Permissions', href: '#' },
          { icon: ShoppingBag, label: 'Produits', href: '#' },
          { icon: ShoppingCart, label: 'Commandes', href: '#' },
          { icon: FolderTree, label: 'Catégories', href: '#' },
          { icon: Megaphone, label: 'Annonces', href: '#' },
          { icon: Terminal, label: 'Tâches (BullMQ)', href: '#' },
          { icon: Database, label: 'Logs système', href: '#' },
          { icon: Server, label: 'Monitoring', href: '#' },
          { icon: Database, label: 'Stockage (S3)', href: '#' },
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
          { icon: LayoutDashboard, label: 'Tableau de bord', active: true },
          { icon: ShoppingBag, label: 'Mes produits' },
          { icon: ShoppingCart, label: 'Commandes', badge: "5" },
          { icon: MessageSquare, label: 'Messages', badge: "3" },
          { icon: Users, label: 'Clients' },
          { icon: Gift, label: 'Promotions' },
          { icon: BarChart3, label: 'Statistiques' },
          { icon: CreditCard, label: 'Revenus' },
          { icon: Store, label: 'Paramètres boutique' },
          { icon: UserCheck, label: 'Abonnement' },
          { icon: Settings, label: 'Paramètres' },
        ];
    }
  };

  const menuItems = getMenuItems();
  const isAdminOrSuper = mode === 'admin' || mode === 'super-admin';

  return (
    <aside className={`w-64 h-screen fixed left-0 top-0 flex flex-col border-r transition-colors duration-300 ${
      isAdminOrSuper ? (mode === 'admin' ? 'bg-slate-900' : 'bg-[#0f111a]') : 'bg-white'
    } border-slate-200 dark:border-slate-800`}>
      <div className="p-6 flex items-center gap-3">
        <div className="relative w-10 h-10 flex items-center justify-center">
          <Leaf className="text-green-500 fill-green-500 absolute -rotate-12 translate-x-[-4px] translate-y-[2px]" size={22} />
          <Leaf className="text-green-400 fill-green-400 absolute rotate-12 translate-x-[4px] translate-y-[2px]" size={22} />
          <Leaf className="text-green-600 fill-green-600 absolute -translate-y-[4px]" size={24} />
        </div>
        <span className={`${isAdminOrSuper ? 'text-white' : 'text-slate-900'} font-black text-2xl tracking-tighter`}>Afrigari</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
        {menuItems.map((item: any, index: number) => {
          const isItemActive = item.href ? isActive(item.href) : item.active;
          return (
            <Link
              key={index}
              href={item.href || "#"}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isItemActive 
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
                 <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isItemActive ? 'bg-white text-green-600' : 'bg-green-500 text-white'}`}>
                   {item.badge}
                 </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className={`p-4 mt-auto border-t border-slate-100 dark:border-slate-800`}>
        <button className="w-full flex items-center gap-3 px-3 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-bold text-sm">
           <LogOut size={18} />
           Déconnexion
        </button>
      </div>
    </aside>
  );
}
