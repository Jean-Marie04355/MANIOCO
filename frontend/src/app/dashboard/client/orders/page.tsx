"use client";
import { ShoppingCart, Search, Package, User, ChevronDown, Clock, ShieldCheck, MapPin, ArrowRight, Loader2, PackageCheck, LogOut, ExternalLink, Calendar, CreditCard, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import CartSidebar from '../../../components/CartSidebar';
import { useCart } from '@/context/CartContext';

export default function OrderHistoryPage() {
  const { itemCount } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    const fetchData = async () => {
      try {
        const [ordersRes, userRes] = await Promise.all([
          api.get('/orders'),
          api.get('/auth/me').catch(() => null)
        ]);

        setOrders(ordersRes.data || []);
        if (userRes?.data) setUser(userRes.data);
      } catch (error) {
        console.error("Erreur chargement historiques", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-soft-mint text-forest-night border-forest-night/10';
      case 'PENDING': return 'bg-afrigari-gold/10 text-afrigari-gold border-afrigari-gold/20';
      case 'CANCELLED': return 'bg-red-50 text-red-600 border-red-100';
      case 'SHIPPED': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'DELIVERED': return 'bg-forest-night text-white';
      default: return 'bg-slate-50 text-slate-400';
    }
  };

  return (
    <div className="bg-luxury-cream min-h-screen text-forest-night font-sans h-f">
      
      {/* Header (Simplified) */}
      <nav className={`fixed top-0 left-0 right-0 z-[200] transition-all duration-700 px-8 ${scrolled ? 'py-4' : 'py-10'}`}>
         <div className={`max-w-7xl mx-auto flex justify-between items-center px-10 py-6 transition-all duration-500 ${scrolled ? 'bg-white/90 backdrop-blur-xl rounded-[32px] px-12 border border-forest-night/5 shadow-[0_20px_50px_rgba(10,33,24,0.1)]' : ''}`}>
            <div className="flex items-center gap-6">
               <button onClick={() => window.history.back()} className="p-2 hover:bg-forest-night/5 rounded-xl transition-all">
                  <ArrowLeft size={20} />
               </button>
               <Link href="/dashboard/client" className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-forest-night flex items-center justify-center text-afrigari-gold shadow-lg">
                     <PackageCheck size={20} />
                  </div>
                  <span className="font-black text-2xl tracking-tighter uppercase italic">AFRIGARI</span>
               </Link>
            </div>

            <div className="flex items-center gap-8">
               <Link href="/dashboard/client" className="text-[10px] font-black uppercase tracking-widest hover:text-afrigari-gold transition-colors">Boutique</Link>
               <div className="relative cursor-pointer group" onClick={() => setIsCartOpen(true)}>
                  <ShoppingCart size={22} className="text-forest-night group-hover:text-afrigari-gold transition-colors" />
                  <span className="absolute -top-3 -right-3 w-5 h-5 bg-afrigari-gold text-forest-night text-[10px] flex items-center justify-center rounded-full font-black">{itemCount}</span>
               </div>
               <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="w-12 h-12 rounded-2xl bg-forest-night text-white flex items-center justify-center border-2 border-afrigari-gold/20">
                  <User size={24} className="text-afrigari-gold" />
               </button>
            </div>
         </div>
      </nav>

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <main className="max-w-5xl mx-auto pt-48 pb-32 px-8 min-h-screen">
         
         <div className="mb-20 animate-reveal">
            <h1 className="text-7xl font-black tracking-tighter uppercase italic leading-none mb-6">Historique <br/> <span className="text-afrigari-gold">Des Commandes</span></h1>
            <p className="text-lg font-bold text-forest-night/40 italic flex items-center gap-4">
               <Clock size={20} /> Retrouvez tous vos trésors du terroir commandés.
            </p>
         </div>

         {isLoading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-6 opacity-20">
               <Loader2 className="w-12 h-12 animate-spin text-forest-night" />
               <p className="text-[10px] font-black uppercase tracking-[0.5em]">Synchronisation Territoriale...</p>
            </div>
         ) : orders.length === 0 ? (
            <div className="bg-white rounded-[64px] p-24 text-center border border-forest-night/5 shadow-2xl animate-reveal">
               <div className="w-24 h-24 bg-luxury-cream rounded-full flex items-center justify-center mx-auto mb-10">
                  <Package size={48} className="text-forest-night/10" />
               </div>
               <h3 className="text-3xl font-black mb-6">AUCUNE COMMANDE TROUVÉE</h3>
               <p className="text-forest-night/40 font-bold mb-10 max-w-sm mx-auto leading-relaxed">Il semblerai que vous n&apos;ayez pas encore goûté à l&apos;excellence du terroir Afrigari.</p>
               <Link href="/dashboard/client" className="inline-flex items-center gap-4 bg-forest-night text-white px-12 py-6 rounded-[24px] font-black text-xs uppercase tracking-[0.3em] hover:bg-afrigari-gold hover:text-forest-night transition-all">
                  Découvrir les Produits <ArrowRight size={18} />
               </Link>
            </div>
         ) : (
            <div className="space-y-10">
               {orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-[48px] p-10 border border-forest-night/5 shadow-xl hover:shadow-[0_40px_80px_-20px_rgba(10,33,24,0.1)] transition-all animate-reveal group">
                     <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-10 border-b border-forest-night/5 pb-10">
                        <div className="flex gap-6 items-center">
                           <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${getStatusColor(order.status)}`}>
                              <PackageCheck size={28} />
                           </div>
                           <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-forest-night/30 mb-1">Commande #{order.id.split('-')[0]}</p>
                              <div className="flex items-center gap-4">
                                 <h4 className="text-2xl font-black uppercase italic tracking-tighter">Statut: <span className="text-afrigari-gold">{order.status}</span></h4>
                                 <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                                    {order.status === 'PAID' ? '🔒 Payée' : '⏳ Attente'}
                                 </span>
                              </div>
                           </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                           <div className="flex items-center gap-3 text-forest-night/40 group-hover:text-forest-night transition-colors">
                              <Calendar size={14} />
                              <p className="text-[11px] font-black uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                           </div>
                           <p className="text-3xl font-black text-forest-night uppercase italic tracking-tighter">{Number(order.totalAmount).toLocaleString()} FCFA</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {order.items.map((item: any, idx: number) => (
                           <div key={idx} className="flex items-center gap-4 bg-luxury-cream/50 p-4 rounded-3xl border border-forest-night/5">
                              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-xs text-forest-night shadow-sm">
                                 {item.quantity}x
                              </div>
                              <div>
                                 <p className="text-[11px] font-black uppercase tracking-tight text-forest-night line-clamp-1">{item.productName}</p>
                                 <p className="text-[9px] font-black text-afrigari-gold uppercase tracking-[0.2em]">{Number(item.price).toLocaleString()} F / unité</p>
                              </div>
                           </div>
                        ))}
                     </div>

                     <div className="mt-10 flex justify-between items-center">
                        <div className="flex items-center gap-3 opacity-20">
                           <CreditCard size={16} />
                           <p className="text-[9px] font-black uppercase tracking-widest italic tracking-[0.2em]">Réglement via FedaPay</p>
                        </div>
                        <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-forest-night hover:text-afrigari-gold transition-colors">
                           Détails complets <ExternalLink size={14} />
                        </button>
                     </div>
                  </div>
               ))}
            </div>
         )}
      </main>

      {/* Profile Sidebar (Simplified copy) */}
      {isProfileOpen && (
          <div className="fixed top-24 right-8 w-72 bg-white border border-forest-night/5 rounded-[40px] p-8 z-[300] shadow-2xl animate-reveal">
             <div className="flex flex-col items-center mb-8">
                <div className="w-20 h-20 rounded-full border-4 border-afrigari-gold/20 p-1 mb-4 overflow-hidden bg-forest-night/10 flex items-center justify-center">
                   <User size={40} className="text-forest-night/20" />
                </div>
                <h4 className="font-black text-xl text-center">{user?.name || 'Client'}</h4>
                <p className="text-[10px] font-black text-afrigari-gold uppercase tracking-widest mt-1 opacity-60">Privilège Elite</p>
             </div>
             <div className="space-y-2">
                <Link href="/dashboard/client" className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-luxury-cream transition-all">
                   <PackageCheck size={20} className="text-forest-night/40" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Boutique</span>
                </Link>
                <div className="h-px bg-forest-night/5 my-4"></div>
                <button 
                  onClick={() => {
                    localStorage.removeItem('token');
                    window.location.href = '/auth/login';
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-lg"
                >
                   <LogOut size={20} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Déconnexion</span>
                </button>
             </div>
          </div>
      )}

    </div>
  );
}
