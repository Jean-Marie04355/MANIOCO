"use client";
import { ShoppingCart, Search, Plus, Star, ArrowRight, Heart, Grid, Package, Wallet, UserCircle, Settings, HelpCircle, ChevronDown, Clock, ShieldCheck, MapPin, Sparkles, Filter, Store, PackageCheck, LogOut, Loader2, User, LayoutGrid, TrendingUp, ArrowUpRight, Activity as ActivityIcon, History, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useCart } from '@/context/CartContext';
import CartSidebar from '../../components/CartSidebar';
import Sidebar from '../components/Sidebar';

export default function ClientDashboard() {
  const { addToCart, itemCount } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [stats, setStats] = useState({ orders: 0, balance: 0, points: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [nearbyStores, setNearbyStores] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    const fetchData = async () => {
      try {
        const [prodRes, catRes, userRes] = await Promise.all([
          api.get('/products'),
          api.get('/product-categories'),
          api.get('/auth/me').catch(() => null)
        ]);
        
        setProducts(prodRes?.data || []);
        setCategories(catRes?.data || []);
        
        if (userRes?.data) {
          setUser(userRes.data);
          // Fetch real stats
          try {
             const ordersRes = await api.get('/orders');
             const orders = ordersRes.data || [];
             
             // Calculer le total dépensé réel
             const totalSpent = orders.reduce((acc: number, order: any) => {
                // On ne compte que les commandes payées ou livrées si nécessaire, 
                // mais ici on prend tout ce qui est validé
                return acc + Number(order.totalAmount || 0);
             }, 0);

             setStats({ 
                orders: orders.length, 
                balance: totalSpent, 
                points: Math.floor(totalSpent / 100) // Exemple: 1 point pour 100F dépensés
             });
             setRecentOrders(orders.slice(0, 5));
          } catch (e) {
             console.error("Erreur stats commandes", e);
          }
        }

        // Fetch nearby stores if geolocation is available
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(async (pos) => {
            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setUserLocation(loc);
            try {
              const nearbyRes = await api.get(`/stores/nearby?lat=${loc.lat}&lng=${loc.lng}&radius=50`);
              setNearbyStores(nearbyRes.data.slice(0, 3));
            } catch (e) {
              console.error("Erreur chargement boutiques proches", e);
            }
          });
        }
      } catch (error: any) {
        console.error("Erreur chargement données client", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="flex bg-slate-50 min-h-screen text-forest-night selection:bg-afrigari-gold selection:text-white font-sans">
      
      {/* 1. Fixed Sidebar */}
      <Sidebar mode="client" />

      <div className="flex-1 ml-64 flex flex-col min-h-screen">
         
         {/* 2. Top Navigation Bar */}
         <nav className={`sticky top-0 z-50 transition-all duration-500 px-8 py-4 ${scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-forest-night/5 shadow-sm' : 'bg-transparent'}`}>
            <div className="max-w-7xl mx-auto flex justify-between items-center">
               <div className="flex items-center gap-4">
                  <button onClick={() => window.history.back()} className="p-2 hover:bg-forest-night/5 rounded-xl transition-all mr-2">
                     <ArrowLeft size={20} />
                  </button>
                  <h1 className="text-xl font-black tracking-tighter uppercase italic text-forest-night">Dashboard <span className="text-afrigari-gold">Client</span></h1>
               </div>

               <div className="flex items-center gap-6">
                  <div className="relative hidden md:block group">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-forest-night/30 group-focus-within:text-afrigari-gold transition-colors" />
                    <input 
                      type="text"
                      placeholder="Rechercher une commande..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-white border border-forest-night/5 rounded-full py-2.5 pl-12 pr-6 text-xs font-bold w-64 focus:w-80 transition-all outline-none focus:ring-4 focus:ring-afrigari-gold/5"
                    />
                  </div>
                  
                  <div className="flex items-center gap-4 border-l border-forest-night/10 pl-6">
                     <button onClick={() => setIsCartOpen(true)} className="relative p-2 hover:bg-forest-night/5 rounded-xl transition-all">
                        <ShoppingCart size={20} />
                        {itemCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-afrigari-gold text-white text-[10px] flex items-center justify-center rounded-full font-black ring-2 ring-white">{itemCount}</span>}
                     </button>
                     <div className="relative">
                        <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white shadow-lg hover:scale-105 transition-transform">
                           <img src={`https://ui-avatars.com/api/?name=${user?.name || 'Client'}&background=random`} alt="Avatar" />
                        </button>
                        
                        {isProfileOpen && (
                          <div className="absolute top-14 right-0 w-64 bg-white rounded-3xl p-6 shadow-2xl border border-forest-night/5 animate-reveal">
                             <div className="flex items-center gap-4 mb-4 pb-4 border-b border-forest-night/5">
                                <div className="w-10 h-10 rounded-full bg-forest-night/5 flex items-center justify-center text-forest-night"><User size={20} /></div>
                                <div>
                                   <p className="text-[10px] font-black uppercase text-forest-night">{user?.name || 'Client'}</p>
                                   <p className="text-[9px] text-forest-night/40 font-bold">{user?.email}</p>
                                </div>
                             </div>
                             <div className="space-y-2">
                                <Link href="/dashboard/client/profile" className="flex items-center gap-3 p-3 rounded-xl hover:bg-forest-night/5 text-[10px] font-black uppercase tracking-widest text-forest-night/60 transition-colors"><Settings size={16} /> Paramètres</Link>
                                <button onClick={() => { localStorage.removeItem('token'); window.location.href = '/auth/login'; }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-[10px] font-black uppercase tracking-widest text-red-500 transition-colors w-full text-left"><LogOut size={16} /> Déconnexion</button>
                             </div>
                          </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>
         </nav>

         <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

         {/* 3. Main Dashboard Content */}
         <main className="flex-1 p-8 lg:p-12 space-y-10 animate-reveal">
            
            {/* Header: Welcome & Stats */}
            <div className="flex flex-col gap-8">
               <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div>
                     <h2 className="text-4xl font-black tracking-tighter text-forest-night">Ravi de vous revoir, <span className="text-afrigari-gold uppercase italic">{user?.name?.split(' ')[0] || 'Cher Client'}</span></h2>
                     <p className="text-xs font-bold text-forest-night/40 mt-1 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        Statut : Client Privilège • {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                     </p>
                  </div>
                  <div className="flex gap-4">
                     <Link href="/dashboard/client/shops" className="bg-forest-night text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:translate-y-[-2px] transition-all flex items-center gap-2">
                        <Plus size={14} /> Nouvelle Commande
                     </Link>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard icon={Wallet} label="Total Dépensé" value={`${stats.balance.toLocaleString()} F`} change="+2.5% ce mois" color="bg-forest-night text-white" />
                  <StatCard icon={Package} label="Commandes" value={stats.orders.toString().padStart(2, '0')} desc="Dernière commande : hier" color="bg-white border border-forest-night/5 shadow-sm" />
                  <StatCard icon={Star} label="Fidélité" value={`${stats.points.toLocaleString()} pts`} change="+150 ce mois" color="bg-white border border-forest-night/5 shadow-sm" />
                  <StatCard icon={ActivityIcon} label="Impact Social" value="Elevé" desc="Soutien local" color="bg-afrigari-gold text-white" />
               </div>
            </div>

            {/* Middle Section: Analytics & Traceability */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
               {/* Spending Graph */}
               <div className="lg:col-span-2 bg-white rounded-[40px] p-10 border border-forest-night/5 shadow-sm relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-10">
                     <div>
                        <h3 className="text-xl font-black tracking-tighter text-forest-night">Analyse des Dépenses</h3>
                        <p className="text-[10px] font-bold text-forest-night/30 uppercase tracking-widest">Évolution des 6 derniers mois</p>
                     </div>
                     <div className="flex gap-2">
                        <span className="flex items-center gap-1 text-[10px] font-black text-green-500 bg-green-50 px-3 py-1 rounded-full"><TrendingUp size={12} /> +12%</span>
                     </div>
                  </div>
                  
                  {/* Simulated Spending Graph */}
                  <div className="h-64 flex items-end justify-between gap-4 px-4 relative">
                     <div className="absolute inset-x-0 bottom-0 border-b border-forest-night/5"></div>
                     {[35, 55, 45, 85, 65, 95].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-4 group/bar">
                           <div className="relative w-full flex items-end justify-center">
                              <div 
                                 style={{ height: `${h}%` }} 
                                 className="w-full bg-forest-night/5 group-hover/bar:bg-afrigari-gold/20 rounded-2xl transition-all duration-700"
                              ></div>
                              <div 
                                 style={{ height: `${h * 0.4}%` }} 
                                 className="absolute bottom-0 w-full bg-forest-night rounded-2xl group-hover/bar:bg-afrigari-gold transition-all duration-500 shadow-lg"
                              ></div>
                              <div className="absolute bottom-full mb-2 opacity-0 group-hover/bar:opacity-100 transition-all bg-forest-night text-white text-[10px] font-black px-2 py-1 rounded-lg translate-y-2 group-hover/bar:translate-y-0">
                                 {Math.round(h * 1000).toLocaleString()} F
                              </div>
                           </div>
                           <span className="text-[9px] font-black text-forest-night/30 uppercase tracking-widest">{['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'][i]}</span>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Nearby Shops Widget - NEW LOCALIZATION FEATURE */}
               <div className="bg-white rounded-[40px] p-10 border border-forest-night/5 shadow-sm overflow-hidden relative">
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-xl font-black tracking-tighter text-forest-night italic uppercase">Proches de vous.</h3>
                     <MapPin size={20} className="text-afrigari-gold" />
                  </div>
                  
                  <div className="space-y-6">
                     {nearbyStores.length === 0 ? (
                        <div className="py-10 text-center space-y-4">
                           <div className="w-12 h-12 bg-luxury-cream rounded-full flex items-center justify-center mx-auto text-forest-night/10"><MapPin size={24} /></div>
                           <p className="text-[10px] font-black text-forest-night/30 uppercase tracking-widest">Recherche d&apos;artisans à proximité...</p>
                        </div>
                     ) : (
                        nearbyStores.map((store) => (
                           <Link href={`/dashboard/client/shops/${store.id}`} key={store.id} className="flex items-center gap-4 group p-2 hover:bg-slate-50 rounded-2xl transition-all">
                              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-md">
                                 <img src={store.profilePhoto || "https://via.placeholder.com/100"} className="w-full h-full object-cover" alt={store.name} />
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className="text-xs font-black text-forest-night truncate uppercase">{store.name}</p>
                                 <p className="text-[9px] font-bold text-afrigari-gold">{store.distance} km • {store.city}</p>
                              </div>
                              <ArrowRight size={14} className="text-forest-night/20 group-hover:translate-x-1 group-hover:text-forest-night transition-all" />
                           </Link>
                        ))
                     )}
                  </div>

                  <Link href="/dashboard/client/shops" className="mt-10 w-full py-4 bg-forest-night/5 hover:bg-forest-night hover:text-white rounded-2xl text-[9px] font-black uppercase tracking-widest text-center transition-all flex items-center justify-center gap-2">
                     Voir la carte <LayoutGrid size={14} />
                  </Link>
               </div>
            </div>

            {/* Bottom Section: Recent Orders & Discovery */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pb-20">
               {/* Recent Orders List */}
               <div className="lg:col-span-2 bg-white rounded-[40px] p-10 border border-forest-night/5 shadow-sm">
                  <div className="flex justify-between items-center mb-10">
                     <div>
                        <h3 className="text-xl font-black tracking-tighter text-forest-night italic">Dernières Commandes</h3>
                        <p className="text-[10px] font-bold text-forest-night/30 uppercase tracking-widest">Historique de vos achats</p>
                     </div>
                     <Link href="/dashboard/client/orders" className="p-3 bg-forest-night/5 rounded-xl hover:bg-forest-night hover:text-white transition-all"><History size={18} /></Link>
                  </div>

                  <div className="space-y-4">
                     {recentOrders.length === 0 ? (
                        <div className="text-center py-10 italic text-forest-night/20 text-sm border-2 border-dashed border-forest-night/5 rounded-3xl uppercase font-black tracking-widest">Aucune commande récente</div>
                     ) : recentOrders.map((order: any) => (
                        <div key={order.id} className="flex items-center justify-between p-5 rounded-3xl hover:bg-slate-50 transition-all group border border-transparent hover:border-forest-night/5">
                           <div className="flex items-center gap-5">
                              <div className="w-14 h-14 bg-forest-night/5 rounded-2xl flex items-center justify-center text-[10px] font-black text-forest-night/40 italic">#{order.id.slice(0, 5)}</div>
                              <div>
                                 <p className="font-black text-forest-night">{order.items?.[0]?.productName || "Commande"}</p>
                                 <p className="text-[9px] font-black text-forest-night/30 uppercase tracking-widest mt-1">{new Date(order.createdAt).toLocaleDateString('fr-FR')}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-8">
                              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                 order.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : 
                                 order.status === 'PENDING' ? 'bg-orange-100 text-orange-600' : 
                                 'bg-blue-100 text-blue-600'
                              }`}>{order.status}</span>
                              <p className="text-sm font-black text-forest-night">{Number(order.totalAmount).toLocaleString()} F</p>
                              <button className="p-2 text-forest-night/20 group-hover:text-afrigari-gold transition-colors"><ArrowUpRight size={20} /></button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Discovery Card */}
               <div className="bg-white rounded-[40px] p-10 border border-forest-night/5 shadow-sm flex flex-col justify-between group overflow-hidden relative">
                  <div className="relative z-10">
                     <h3 className="text-xl font-black tracking-tighter text-forest-night italic mb-2">Explorer le Marché.</h3>
                     <p className="text-[10px] font-bold text-forest-night/30 uppercase tracking-widest leading-relaxed">Découvrez les nouveautés de nos producteurs partenaires.</p>
                  </div>
                  <div className="py-8 relative z-10">
                     <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl transform group-hover:scale-105 transition-transform duration-700">
                        <img src="https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400" className="w-full h-full object-cover" alt="Market" />
                        <div className="absolute inset-0 bg-gradient-to-t from-forest-night/80 to-transparent flex items-end p-6">
                           <div className="flex items-center gap-2 text-white">
                              <Sparkles size={14} className="text-afrigari-gold" />
                              <p className="text-[10px] font-black uppercase tracking-widest">Nouveautés Terroir</p>
                           </div>
                        </div>
                     </div>
                  </div>
                  <Link href="/dashboard/client/shops" className="w-full bg-forest-night text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-center hover:bg-afrigari-gold transition-colors shadow-xl relative z-10">
                     Accéder à la Boutique
                  </Link>
                  <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-forest-night/5 rounded-full blur-3xl group-hover:bg-afrigari-gold/5 transition-all"></div>
               </div>
            </div>
         </main>
      </div>
    </div>
  );
}

// Internal Logic Components
function StatCard({ icon: Icon, label, value, change, desc, color = "bg-white text-forest-night" }: { icon: any; label: string; value: string; change?: string; desc?: string; color?: string }) {
  return (
    <div className={`${color} p-8 rounded-[32px] transition-all group hover:scale-[1.02] shadow-sm hover:shadow-xl`}>
       <div className="flex justify-between items-start mb-6">
          <div className={`p-3 rounded-2xl ${color.includes('forest-night') ? 'bg-white/10' : 'bg-forest-night/5'} group-hover:scale-110 transition-transform`}><Icon size={20} /></div>
          {change && <span className={`text-[9px] font-black px-2 py-1 rounded-full ${color.includes('forest-night') ? 'bg-white/10 text-white' : 'bg-green-50 text-green-500'}`}>{change}</span>}
       </div>
       <h4 className="text-3xl font-black tracking-tighter">{value}</h4>
       <div className="flex items-center justify-between mt-2">
          <p className={`text-[10px] font-black uppercase tracking-widest ${color.includes('forest-night') ? 'text-white/40' : 'text-forest-night/30'}`}>{label}</p>
          {desc && <span className={`text-[9px] font-black ${color.includes('forest-night') ? 'text-white/30' : 'text-forest-night/20'}`}>{desc}</span>}
       </div>
    </div>
  );
}
