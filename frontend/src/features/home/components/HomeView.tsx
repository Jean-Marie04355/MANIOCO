"use client";
/* eslint-disable react/no-unescaped-entities */
import { ShoppingCart, Search, Plus, ArrowRight, Package, Clock, Store, PackageCheck, LogOut, Loader2, MessageSquare, X, Leaf, TrendingUp, Bell, Settings, MapPin, ChevronDown, User as UserIcon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import { useAuth } from '@/features/auth/AuthContext';
import { useCart } from '@/features/cart/CartContext';
import { useSocket } from '@/features/realtime/SocketContext';
import CartDrawer from '@/components/CartDrawer';

interface Category {
   id: string | number;
   name: string;
}

interface ProductStore {
   id?: string | number;
   name?: string;
   profilePhoto?: string;
   city?: string;
}

interface ProductCategory {
   name?: string;
}

interface Product {
   id: string | number;
   name: string;
   image?: string;
   price: number | string;
   unit?: string;
   categoryId?: string | number | null;
   category?: ProductCategory;
   storeId?: string | number | null;
   store?: ProductStore;
}

export default function HomeView() {
   const { user, logout, isLoading: isAuthLoading } = useAuth();
   const { addToCart, totalItems } = useCart();
   const { socket } = useSocket();
   const router = useRouter();
   const [scrolled, setScrolled] = useState(false);
   const [isProfileOpen, setIsProfileOpen] = useState(false);
   const [isExploreOpen, setIsExploreOpen] = useState(false);
   const [isCartOpen, setIsCartOpen] = useState(false);
   const [showSuccessOrder, setShowSuccessOrder] = useState(false);

   const [products, setProducts] = useState<Product[]>([]);
   const [categories, setCategories] = useState<Category[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
   const [activeCity, setActiveCity] = useState<string | null>(null);
   const [searchQuery, setSearchQuery] = useState('');
   const [visibleCount, setVisibleCount] = useState(8);
   const [stores, setStores] = useState<any[]>([]);

   const [notifications, setNotifications] = useState<any[]>([]);
   const [unreadCount, setUnreadCount] = useState(0);
   const [unreadMessages, setUnreadMessages] = useState(0);
   const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
   const notificationsRef = useRef<HTMLDivElement>(null);
   const profileRef = useRef<HTMLDivElement>(null);
   const [isNotificationLoading, setIsNotificationLoading] = useState(false);
   const [isCityFilterOpen, setIsCityFilterOpen] = useState(false);
   const cityFilterRef = useRef<HTMLDivElement>(null);

    const getRealInternetLink = (product: Pick<Product, 'name' | 'image'>) => {
       const dbPath = product.image;
       const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
 
       if (!dbPath || String(dbPath).trim() === '' || dbPath === 'null') {
          return "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&q=80&w=800";
       }
 
       if (dbPath.startsWith('http') || dbPath.startsWith('data:')) {
          return dbPath;
       }
 
       if (dbPath.includes('uploads/')) {
          const cleanPath = dbPath.startsWith('/') ? dbPath : `/${dbPath}`;
          return `${apiUrl}${cleanPath}`;
       }
 
       const cleanPath = dbPath.startsWith('/') ? dbPath : `/${dbPath}`;
       return `${apiUrl}/uploads${cleanPath}`;
    };

   useEffect(() => {
      const handleScroll = () => setScrolled(window.scrollY > 50);
      window.addEventListener('scroll', handleScroll);

      const fetchDynamicData = async () => {
         try {
            const [prodRes, catRes, storeRes] = await Promise.all([
               api.get('/products'),
               api.get('/product-categories'),
               api.get('/stores')
            ]);
            setProducts((prodRes?.data || []) as Product[]);
            setCategories((catRes?.data || []) as Category[]);
            setStores((storeRes?.data || []).slice(0, 4));
         } catch (error) {
            console.error("Erreur de chargement");
         } finally {
            setIsLoading(false);
         }
      };

      fetchDynamicData();

      // Logic only for logged-in users
      if (user && user.role === 'client') {
          const fetchInitialData = async () => {
             try {
                setIsNotificationLoading(true);
                const [notifRes, unreadNotifRes, unreadChatRes] = await Promise.all([
                   api.get('/notifications'),
                   api.get('/notifications/unread/count'),
                   api.get('/chat/unread-count')
                ]);
                setNotifications(notifRes.data);
                setUnreadCount(typeof unreadNotifRes.data === 'object' ? unreadNotifRes.data.count : unreadNotifRes.data);
                setUnreadMessages(typeof unreadChatRes.data === 'object' ? unreadChatRes.data.count : unreadChatRes.data);
             } catch (error) {
                console.error("Erreur lors du chargement initial des données");
             } finally {
                setIsNotificationLoading(false);
             }
          };

          fetchInitialData();
      }

      return () => window.removeEventListener('scroll', handleScroll);
   }, [user]);

   // WebSocket Listeners
   useEffect(() => {
      if (!socket) return;

      socket.on('new_notification', (notification) => {
         setNotifications(prev => [notification, ...prev]);
         setUnreadCount(prev => prev + 1);
      });

      socket.on('new_message', () => {
         setUnreadMessages(prev => prev + 1);
      });

      socket.on('catalog_updated', () => {
         // Silent refresh of catalog
         api.get('/products').then(res => setProducts(res.data));
         api.get('/stores').then(res => api.get('/stores').then(sRes => setStores((sRes.data || []).slice(0, 4))));
      });

      return () => {
         socket.off('new_notification');
         socket.off('new_message');
         socket.off('catalog_updated');
      };
   }, [socket]);

   const markAllAsRead = async () => {
      try {
         await api.patch('/notifications/read-all');
         setNotifications(notifications.map(n => ({ ...n, isRead: true })));
         setUnreadCount(0);
      } catch (error) {
         console.error("Erreur lors du marquage des notifications");
      }
   };

   const markAsRead = async (id: string) => {
      try {
         await api.patch(`/notifications/${id}/read`);
         setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
         setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
         console.error("Erreur lors du marquage de la notification");
      }
   };

   const timeAgo = (date: string) => {
      const now = new Date();
      const past = new Date(date);
      const diffInMs = now.getTime() - past.getTime();
      const diffInMins = Math.floor(diffInMs / 60000);
      const diffInHours = Math.floor(diffInMins / 60);
      const diffInDays = Math.floor(diffInHours / 24);

      if (diffInMins < 1) return 'À l\'instant';
      if (diffInMins < 60) return `Il y a ${diffInMins} min`;
      if (diffInHours < 24) return `Il y a ${diffInHours}h`;
      return `Il y a ${diffInDays}j`;
   };

   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
         if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
            setIsNotificationsOpen(false);
         }
         if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
            setIsProfileOpen(false);
         }
         if (cityFilterRef.current && !cityFilterRef.current.contains(event.target as Node)) {
            setIsCityFilterOpen(false);
         }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
   }, []);

   const filteredProducts = products.filter(p => {
      const matchesCategory = activeCategoryId ? p.categoryId === activeCategoryId : true;
      const matchesCity = activeCity ? p.store?.city === activeCity : true;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         p.category?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         p.store?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesCity && matchesSearch;
   });

   const uniqueCities = Array.from(new Set(products.map(p => p.store?.city).filter(Boolean))) as string[];

   const handleActionClick = (e: React.MouseEvent, action: () => void) => {
      if (!user) {
         e.preventDefault();
         router.push('/auth/login');
         return;
      }
      action();
   };

   return (
      <div className="bg-[#fcfbf7] min-h-screen text-[#1a2e22] selection:bg-[#c5a059] selection:text-white font-sans overflow-x-hidden">

         {/* Premium Background Decor */}
         <div className="fixed top-0 right-0 w-1/2 h-screen bg-gradient-to-l from-[#f4f1ea] to-transparent pointer-events-none -z-10 opacity-50"></div>

         {/* 1. Header & Navigation */}
         <nav className={`fixed top-0 left-0 right-0 z-[200] transition-all duration-1000 px-8 ${scrolled ? 'py-4' : 'py-12'}`}>
            <div className={`max-w-[1400px] mx-auto flex justify-between items-center px-12 py-6 transition-all duration-700 ${scrolled ? 'bg-white/80 backdrop-blur-2xl rounded-full shadow-[0_20px_50px_rgba(26,46,34,0.1)] border border-white' : ''}`}>
               <div className="flex items-center gap-16">
                  <Link href="/" className="flex items-center gap-3 group">
                     <div className="w-10 h-10 rounded-xl bg-[#1a2e22] flex items-center justify-center text-[#c5a059] rotate-3 group-hover:rotate-12 transition-transform shadow-lg">
                        <Leaf size={20} />
                     </div>
                     <span className="font-black text-3xl tracking-[-0.05em] uppercase font-serif italic text-[#1a2e22]">AFRIGARI</span>
                  </Link>
                  <div className="hidden lg:flex gap-12 text-[11px] font-black uppercase tracking-[0.3em]">
                     <Link href="/shops" className="hover:text-[#c5a059] transition-colors">Nos Producteurs</Link>
                     <button onClick={() => document.getElementById('arrivages')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-[#c5a059] transition-colors text-[#c5a059]">Catalogue Complet</button>
                  </div>
               </div>

               <div className="flex items-center gap-10">
                  <div className="flex gap-8 items-center border-r border-[#1a2e22]/10 pr-10">
                     <div className="relative group hidden xl:block">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1a2e22]/20 group-focus-within:text-[#c5a059] transition-colors" />
                        <input
                           type="text"
                           placeholder="Rechercher..."
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                           className="bg-[#1a2e22]/5 border-none rounded-full py-3.5 pl-12 pr-8 text-[11px] font-black uppercase tracking-widest focus:ring-2 focus:ring-[#c5a059] outline-none w-48 transition-all focus:w-80"
                        />
                     </div>

                     {user ? (
                        <>
                           {/* Messages */}
                           <Link href="/dashboard/client/messages" className="relative cursor-pointer group p-3 hover:bg-[#1a2e22]/5 rounded-2xl transition-all">
                              <MessageSquare size={22} className="group-hover:scale-110 transition-transform" />
                              {unreadMessages > 0 && (
                                 <>
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full animate-ping opacity-75"></span>
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-black shadow-lg border-2 border-white animate-pulse">
                                       {unreadMessages}
                                    </span>
                                 </>
                              )}
                           </Link>

                           {/* Notifications */}
                           <div className="relative" ref={notificationsRef}>
                              <div
                                 onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                 className="relative cursor-pointer group p-3 hover:bg-[#1a2e22]/5 rounded-2xl transition-all"
                              >
                                 <Bell size={22} className="group-hover:scale-110 transition-transform" />
                                 {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-black shadow-lg border-2 border-white animate-bounce">
                                       {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                 )}
                              </div>

                              {isNotificationsOpen && (
                                 <div className="absolute right-0 mt-4 w-80 bg-white rounded-[2rem] shadow-2xl border border-[#1a2e22]/5 py-6 z-[300] animate-reveal overflow-hidden">
                                    <div className="px-8 pb-4 border-b border-[#1a2e22]/5 flex justify-between items-center">
                                       <h3 className="text-xs font-black text-[#1a2e22] uppercase tracking-widest">Notifications</h3>
                                       {unreadCount > 0 && (
                                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-[#c5a059] bg-[#c5a059]/10">{unreadCount} NOUVELLES</span>
                                       )}
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                       {isNotificationLoading && notifications.length === 0 ? (
                                          <div className="px-8 py-8 text-center text-[#1a2e22]/40 text-[10px] font-black uppercase tracking-widest">Chargement...</div>
                                       ) : notifications.length === 0 ? (
                                          <div className="px-8 py-8 text-center text-[#1a2e22]/40 text-[10px] font-black uppercase tracking-widest">Aucune notification</div>
                                       ) : (
                                          notifications.map((notif) => (
                                             <div 
                                                key={notif.id} 
                                                onClick={() => markAsRead(notif.id)}
                                                className={`px-8 py-5 hover:bg-[#1a2e22]/5 transition-colors cursor-pointer border-b border-[#1a2e22]/5 last:border-0 ${!notif.isRead ? 'bg-[#c5a059]/5' : ''}`}
                                             >
                                                <div className="flex justify-between items-start mb-1">
                                                   <p className={`text-[11px] font-black uppercase tracking-tight ${!notif.isRead ? 'text-[#1a2e22]' : 'text-[#1a2e22]/40'}`}>{notif.title}</p>
                                                   <span className="text-[9px] font-black text-[#c5a059]">{timeAgo(notif.createdAt)}</span>
                                                </div>
                                                <p className={`text-[12px] font-medium leading-relaxed ${!notif.isRead ? 'text-[#1a2e22]/70' : 'text-[#1a2e22]/30'}`}>{notif.message}</p>
                                             </div>
                                          ))
                                       )}
                                    </div>
                                    <div className="px-8 pt-4 text-center">
                                       <button 
                                          onClick={markAllAsRead}
                                          disabled={unreadCount === 0}
                                          className="text-[10px] font-black text-[#1a2e22]/40 uppercase tracking-[0.2em] transition-colors disabled:opacity-30 hover:text-[#c5a059]"
                                       >
                                          Tout marquer comme lu
                                       </button>
                                    </div>
                                 </div>
                              )}
                           </div>

                           <div
                              onClick={() => setIsCartOpen(true)}
                              className="relative cursor-pointer group p-3 hover:bg-[#1a2e22]/5 rounded-2xl transition-all"
                           >
                              <ShoppingCart size={22} className="group-hover:scale-110 transition-transform" />
                              {totalItems > 0 && (
                                 <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#c5a059] text-white text-[10px] flex items-center justify-center rounded-full font-black shadow-lg border-2 border-white animate-bounce">
                                    {totalItems}
                                 </span>
                              )}
                           </div>
                        </>
                     ) : (
                        <Link href="/auth/login" className="flex items-center gap-4 bg-[#1a2e22] text-[#c5a059] px-8 py-3 rounded-full hover:bg-[#c5a059] hover:text-[#1a2e22] transition-all group shadow-lg">
                           <UserIcon size={18} />
                           <div className="flex flex-col items-start leading-none">
                              <span className="text-[10px] font-black uppercase tracking-wider">Mon Espace</span>
                              <span className="text-[8px] font-bold opacity-60">Client ou Vendeur</span>
                           </div>
                        </Link>
                     )}
                  </div>
                  
                  {user && (
                     <div className="relative" ref={profileRef}>
                        <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="w-12 h-12 rounded-full border-2 border-white shadow-2xl hover:scale-110 transition-all overflow-hidden relative bg-[#1a2e22]/5 flex items-center justify-center text-[#1a2e22] font-black text-sm uppercase ring-4 ring-[#1a2e22]/5">
                           {user?.profilePhoto ? (
                              <img src={getRealInternetLink({ name: 'user', image: user.profilePhoto })} alt="Photo de profil" className="w-full h-full object-cover" />
                           ) : (
                              <span>{user?.name?.[0] || 'U'}</span>
                           )}
                        </button>

                        {isProfileOpen && (
                           <div className="absolute top-20 right-0 w-72 bg-white shadow-2xl rounded-[40px] p-6 z-[300] border border-white animate-reveal">
                              <div className="flex flex-col items-center mb-6">
                                 <div className="w-16 h-16 rounded-full border-4 border-[#c5a059]/20 p-1 mb-3 overflow-hidden bg-[#1a2e22]/5 flex items-center justify-center text-[#1a2e22] text-xl font-black uppercase">
                                    {user?.profilePhoto ? (
                                       <img src={getRealInternetLink({ name: 'user', image: user.profilePhoto })} alt="Photo de profil" className="w-full h-full object-cover rounded-full" />
                                    ) : (
                                       <span>{user?.name?.[0] || 'U'}</span>
                                    )}
                                 </div>
                                 <h4 className="font-black text-xl text-[#1a2e22] text-center tracking-tight">{user?.name || 'Utilisateur'}</h4>
                                 <p className="text-[9px] font-black text-[#c5a059] uppercase tracking-[0.4em] mt-1">{user?.role || 'Client Privilège'}</p>
                              </div>
                              <div className="space-y-1">
                                 <Link href="/dashboard/client/messages" className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-[#1a2e22]/5 transition-all group">
                                    <div className="flex items-center gap-4">
                                       <MessageSquare size={18} className="text-[#1a2e22]/40 group-hover:text-[#1a2e22]" />
                                       <span className="text-[10px] font-black uppercase tracking-widest text-[#1a2e22]/60 group-hover:text-[#1a2e22]">Conversations</span>
                                    </div>
                                 </Link>
                                 <Link href="/dashboard/client/orders" className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-[#1a2e22]/5 transition-all group">
                                    <div className="flex items-center gap-4">
                                       <Clock size={18} className="text-[#1a2e22]/40 group-hover:text-[#1a2e22]" />
                                       <span className="text-[10px] font-black uppercase tracking-widest text-[#1a2e22]/60 group-hover:text-[#1a2e22]">Commandes</span>
                                    </div>
                                 </Link>
                                 <Link href="/dashboard/client/settings" className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-[#1a2e22]/5 transition-all group">
                                    <div className="flex items-center gap-4">
                                       <Settings size={18} className="text-[#1a2e22]/40 group-hover:text-[#1a2e22]" />
                                       <span className="text-[10px] font-black uppercase tracking-widest text-[#1a2e22]/60 group-hover:text-[#1a2e22]">Paramètres</span>
                                    </div>
                                 </Link>
                                 <div className="h-px bg-[#1a2e22]/5 my-4 mx-4"></div>
                                 <button onClick={() => logout()} className="w-full flex items-center gap-4 p-3.5 rounded-2xl hover:bg-red-50 text-red-500 transition-all font-black text-[10px] uppercase tracking-widest">
                                    <LogOut size={18} />
                                    <span>Déconnexion</span>
                                 </button>
                              </div>
                           </div>
                        )}
                     </div>
                  )}
               </div>
            </div>
         </nav>

         <main className="max-w-[1400px] mx-auto pt-48 px-12 pb-32">

            {/* Hero Section */}
            <section className="relative grid grid-cols-1 lg:grid-cols-2 gap-24 mb-60 items-center animate-reveal">
               <div className="z-20">
                  <div className="flex items-center gap-4 mb-8">
                     <span className="w-12 h-[2px] bg-[#c5a059]"></span>
                     <span className="text-xs font-black uppercase tracking-[0.5em] text-[#c5a059]">Héritage Agro-Alimentaire</span>
                  </div>

                  <div className="relative z-10 space-y-10">
                     <h2 className="text-7xl md:text-[110px] font-black leading-[0.85] tracking-[-0.06em] text-[#1a2e22]">
                        L&apos;Or Blanc <br />
                        <span className="text-[#c5a059] italic font-serif lowercase tracking-normal">du</span> <br />
                        Manioc.
                     </h2>
                     <p className="text-lg font-medium text-[#1a2e22]/60 max-w-lg leading-relaxed">
                        Le Gari de luxe, transformé à la main par nos maîtres artisans. Une finesse incomparable pour une expérience gastronomique authentique.
                     </p>
                     <div className="flex gap-8 items-center pt-6">
                        <button
                           onClick={() => document.getElementById('arrivages')?.scrollIntoView({ behavior: 'smooth' })}
                           className="bg-[#1a2e22] text-white px-16 py-7 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#c5a059] transition-all shadow-xl flex items-center gap-4 group"
                        >
                           Explorer le Catalogue <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                        </button>
                     </div>
                  </div>
               </div>

               <div className="relative">
                  <div className="relative w-full aspect-[4/5] rounded-[80px] overflow-hidden shadow-2xl border-[16px] border-white bg-white">
                     <img
                        src="https://res.cloudinary.com/hv9ssmzrz/image/fetch/c_fill,f_auto,h_675,q_auto:eco,w_1200/https://images-ca-1-0-1-eu.s3-eu-west-1.amazonaws.com/photos/original/1980/manioc-produit-AdobeStock_230338430.jpeg" className="w-full h-full object-cover block"
                        alt="Afrigari Premium"
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-[#1a2e22]/20 to-transparent"></div>
                  </div>
                </div>
            </section>

            {/* Category Showcase */}
            <section className="mb-60 scroll-mt-40">
               <div className="text-center mb-16">
                  <p className="text-[11px] font-black uppercase tracking-[0.6em] text-[#c5a059] mb-4 text-center">Sélections du moment</p>
                  <h3 className="text-5xl font-black tracking-tighter text-[#1a2e22] text-center uppercase">Nos Filières <span className="text-[#c5a059] font-serif italic font-normal lowercase">Sélectives</span></h3>
               </div>
               
               <div className="flex flex-wrap justify-center gap-8 md:gap-12">
                  <div onClick={() => setActiveCategoryId(null)} className="cursor-pointer">
                     <LuxuryCategoryBubble label="Tout" active={activeCategoryId === null} icon="🌍" />
                  </div>
                  {categories.slice(0, isExploreOpen ? categories.length : 8).map(cat => (
                      <div key={cat.id} onClick={() => {
                         const categoryId = String(cat.id);
                         setActiveCategoryId(categoryId === activeCategoryId ? null : categoryId);
                         document.getElementById('arrivages')?.scrollIntoView({ behavior: 'smooth' });
                      }} className="cursor-pointer">
                        <LuxuryCategoryBubble 
                           label={cat.name} 
                           active={activeCategoryId === String(cat.id)} 
                           icon={cat.name.toLowerCase().includes('manioc') ? '🥔' : cat.name.toLowerCase().includes('maïs') ? '🌽' : '🌾'} 
                        />
                     </div>
                  ))}
               </div>

               {categories.length > 8 && (
                  <div className="flex justify-center mt-12">
                     <button 
                        onClick={() => setIsExploreOpen(!isExploreOpen)}
                        className="text-[10px] font-black uppercase tracking-widest text-[#c5a059] border-b-2 border-[#c5a059]/20 hover:border-[#c5a059] pb-1 transition-all"
                     >
                        {isExploreOpen ? 'Réduire les catégories' : 'Voir toutes les catégories'}
                     </button>
                  </div>
               )}
            </section>

            {/* Products Grid */}
            <section id="arrivages" className="mb-60 scroll-mt-40">
               <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-8">
                  <h3 className="text-4xl font-black tracking-tight text-[#1a2e22] uppercase">
                     {activeCity ? `Boutiques à ${activeCity}` : activeCategoryId ? `Produits : ${categories.find(c => c.id === activeCategoryId)?.name}` : 'Le Catalogue Complet'}
                  </h3>
                  <div className="flex items-center gap-3">
                     {activeCategoryId && (
                        <button onClick={() => setActiveCategoryId(null)} className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 flex items-center gap-2 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-all">
                           <X size={12} /> Catégorie
                        </button>
                     )}
                     {activeCity && (
                        <button onClick={() => setActiveCity(null)} className="text-[10px] font-black uppercase tracking-widest text-[#c5a059] hover:text-[#1a2e22] flex items-center gap-2 border border-[#c5a059]/30 px-4 py-2 rounded-xl hover:bg-[#c5a059]/5 transition-all">
                           <X size={12} /> {activeCity}
                        </button>
                     )}
                  </div>
               </div>

               {/* Location Filter */}
               {uniqueCities.length > 0 && (
                  <div className="mb-16 relative" ref={cityFilterRef}>
                     <div className="flex items-center gap-4">
                        <button 
                           onClick={() => setIsCityFilterOpen(!isCityFilterOpen)}
                           className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all border shadow-sm ${
                              isCityFilterOpen || activeCity 
                              ? 'bg-[#1a2e22] text-white border-[#1a2e22]' 
                              : 'bg-white text-[#1a2e22] border-[#1a2e22]/10 hover:border-[#c5a059]'
                           }`}
                        >
                           <MapPin size={16} className={activeCity ? 'text-[#c5a059]' : ''} />
                           {activeCity ? `Ville : ${activeCity}` : 'Filtrer par Emplacement'}
                           <ChevronDown size={14} className={`ml-2 transition-transform duration-500 ${isCityFilterOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {activeCity && (
                           <button 
                              onClick={() => setActiveCity(null)}
                              className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors"
                           >
                              Effacer
                           </button>
                        )}
                     </div>

                     {isCityFilterOpen && (
                        <div className="absolute top-full left-0 mt-4 w-72 bg-white rounded-[2rem] shadow-[0_30px_60px_rgba(26,46,34,0.15)] border border-[#1a2e22]/5 p-4 z-[100] animate-reveal">
                           <div className="space-y-1">
                              <button
                                 onClick={() => { setActiveCity(null); setIsCityFilterOpen(false); }}
                                 className={`w-full flex items-center gap-4 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${!activeCity ? 'bg-[#1a2e22] text-[#c5a059]' : 'hover:bg-[#1a2e22]/5 text-[#1a2e22]/60'}`}
                              >
                                 <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${!activeCity ? 'bg-[#c5a059]/10' : 'bg-slate-100'}`}>
                                    <MapPin size={12} />
                                 </div>
                                 Toutes les villes
                              </button>
                              
                              {uniqueCities.map(city => (
                                 <button
                                    key={city}
                                    onClick={() => { setActiveCity(city); setIsCityFilterOpen(false); }}
                                    className={`w-full flex items-center gap-4 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCity === city ? 'bg-[#c5a059] text-white shadow-md' : 'hover:bg-[#c5a059]/10 text-[#1a2e22]/60 hover:text-[#c5a059]'}`}
                                 >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeCity === city ? 'bg-white/20' : 'bg-slate-100 text-[#1a2e22]/20'}`}>
                                       <MapPin size={12} />
                                    </div>
                                    {city}
                                 </button>
                              ))}
                           </div>
                        </div>
                     )}
                  </div>
               )}

               {isLoading ? (
                  <div className="py-40 flex justify-center w-full">
                     <Loader2 className="w-12 h-12 text-[#c5a059] animate-spin" />
                  </div>
               ) : (
                  <>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
                        {filteredProducts.slice(0, visibleCount).map((product) => (
                           <AfrigariAgroCard
                              key={product.id}
                              product={product}
                              addToCart={addToCart}
                              handleActionClick={handleActionClick}
                              storeId={product.storeId || product.store?.id}
                              name={product.name}
                              unit={product.unit || 'Kg'}
                              producer={product.store?.name || 'Artisan Certifié'}
                              price={`${Number(product.price).toLocaleString('fr-FR')} FCFA`}
                              img={getRealInternetLink(product)}
                              badge={product.category?.name}
                           />
                        ))}
                     </div>

                     {visibleCount < filteredProducts.length && (
                        <div className="flex justify-center mt-24">
                           <button
                              onClick={() => setVisibleCount(prev => prev + 8)}
                              className="group flex items-center gap-4 bg-white border-2 border-[#1a2e22] text-[#1a2e22] px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#1a2e22] hover:text-white transition-all shadow-xl"
                           >
                              Voir plus de produits
                              <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                           </button>
                        </div>
                     )}
                  </>
               )}
            </section>

             {/* Producers Showcase Section */}
            {stores.length > 0 && (
               <section className="mb-60">
                  <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                     <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.6em] text-[#c5a059] mb-4">Artisans du Terroir</p>
                        <h3 className="text-5xl font-black tracking-tighter text-[#1a2e22] uppercase">Producteurs <span className="text-[#c5a059] font-serif italic font-normal lowercase tracking-normal">d&apos;exception</span></h3>
                     </div>
                     <Link href="/shops" className="text-[10px] font-black uppercase tracking-widest text-[#1a2e22] border-b-2 border-[#c5a059] pb-1 hover:text-[#c5a059] transition-all">
                        Voir tous les artisans
                     </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                     {stores.map((store) => (
                        <Link href={`/shops/${store.id}`} key={store.id} className="group">
                           <div className="relative h-96 rounded-[40px] overflow-hidden shadow-2xl border-4 border-white mb-6 group-hover:-translate-y-3 transition-all duration-700">
                              <img 
                                 src={store.profilePhoto ? (store.profilePhoto.startsWith('http') ? store.profilePhoto : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/uploads${store.profilePhoto.startsWith('/') ? '' : '/'}${store.profilePhoto}`) : "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800"} 
                                 className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s]" 
                                 alt={store.name} 
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#1a2e22] via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                              <div className="absolute bottom-8 left-8 right-8">
                                 <p className="text-[10px] font-black text-[#c5a059] uppercase tracking-widest mb-1">{store.city || 'Bénin'}</p>
                                 <h4 className="text-xl font-black text-white uppercase tracking-tight truncate">{store.name}</h4>
                              </div>
                           </div>
                           <div className="flex items-center justify-between px-4">
                              <p className="text-[10px] font-bold text-[#1a2e22]/40 uppercase tracking-widest">Maître Artisan</p>
                              <div className="w-8 h-8 rounded-full bg-[#1a2e22] text-[#c5a059] flex items-center justify-center group-hover:rotate-45 transition-transform">
                                 <ArrowRight size={14} />
                              </div>
                           </div>
                        </Link>
                     ))}
                  </div>
               </section>
            )}

            {/* Transformation Section */}
            <section className="mb-60">
               <div className="text-center mb-24">
                  <div className="w-20 h-20 bg-[#1a2e22] text-[#c5a059] rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                     <TrendingUp size={32} />
                  </div>
                  <p className="text-xs font-black uppercase tracking-[0.6em] text-[#c5a059] mb-4">Maîtrise de la Filière</p>
                  <h3 className="text-6xl font-black tracking-tighter uppercase leading-none">De la Terre à l'Or Blanc</h3>
               </div>

               <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-32">
                  <div className="flex-1 w-full max-w-md group text-center">
                     <div className="relative aspect-square rounded-[60px] overflow-hidden mb-8 border-[12px] border-white shadow-2xl group-hover:scale-105 transition-transform duration-700 bg-white">
                         <img
                           src="https://magoerevision.com/imgUpload/imageExosMatiereurl_copy_chapitre_temps1697537870.png"
                           className="w-full h-full object-cover block"
                           alt="Racines de manioc"
                         />
                        <div className="absolute top-8 left-8 bg-[#1a2e22] text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">Étape 01 : Récolte</div>
                     </div>
                     <h4 className="text-3xl font-black mb-4 tracking-tight">Racines de Manioc</h4>
                     <p className="text-[#1a2e22]/60 text-sm font-medium leading-relaxed">Sélection rigoureuse des meilleurs tubercules.</p>
                  </div>

                  <div className="flex w-24 h-24 bg-[#1a2e22] text-[#c5a059] rounded-full items-center justify-center shadow-2xl z-10 shrink-0 rotate-90 lg:rotate-0">
                     <ArrowRight size={40} />
                  </div>

                  <div className="flex-1 w-full max-w-md group text-center">
                     <div className="relative aspect-square rounded-[60px] overflow-hidden mb-8 border-[12px] border-white shadow-2xl group-hover:scale-105 transition-transform duration-700 bg-white">
                         <img
                           src="https://www.elviadelices.fr/cdn/shop/files/Farine_de_gari.jpg?v=1743090440&width=416"
                           className="w-full h-full object-cover block"
                           alt="Farine de gari"
                         />
                        <div className="absolute top-8 left-8 bg-[#c5a059] text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">Étape Finale : Excellence</div>
                     </div>
                     <h4 className="text-3xl font-black mb-4 tracking-tight text-[#c5a059]">Gari Fini Premium</h4>
                     <p className="text-[#1a2e22]/60 text-sm font-medium leading-relaxed">Le résultat d'un savoir-faire ancestral préservé.</p>
                  </div>
               </div>
            </section>

            {/* Engagement Section */}
            <section className="mb-40">
               <div className="bg-gradient-to-br from-[#f2e6d0] via-[#f9f3e5] to-[#f4d081]/30 rounded-[60px] py-24 px-12 md:px-20 relative overflow-hidden shadow-[0_40px_80px_-20px_rgba(197,160,89,0.2)] border border-[#c5a059]/20">
                  <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#c5a059]/30 rounded-full blur-[150px] -z-0 animate-pulse"></div>
                  <div className="absolute -bottom-40 -left-20 w-96 h-96 bg-[#1a2e22]/20 rounded-full blur-[120px] -z-0"></div>
                  
                  <div className="flex flex-col lg:flex-row gap-24 items-start relative z-10">
                     <div className="lg:w-1/3">
                        <div className="w-20 h-2 bg-[#1a2e22] mb-12 rounded-full"></div>
                        <h3 className="text-7xl font-black tracking-tighter leading-[0.85] text-[#1a2e22] mb-12">Notre <br /> <span className="text-[#c5a059] font-serif italic font-normal lowercase tracking-normal">manifeste</span>.</h3>
                        <p className="text-[#1a2e22] text-sm font-black leading-relaxed max-w-xs opacity-80">Une vision ancrée dans le terroir béninois, tournée vers l'excellence mondiale.</p>
                     </div>
                     
                     <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-16 relative">
                        <div className="relative pt-16 group">
                           <span className="absolute top-0 left-0 text-9xl font-serif italic text-[#c5a059]/30 font-light group-hover:text-[#c5a059]/50 group-hover:-translate-y-4 transition-all duration-700">01</span>
                           <div className="relative">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#1a2e22] mb-8">Éthique Pure</h4>
                              <h5 className="text-2xl font-black mb-6 tracking-tight text-[#1a2e22]">Rémunération Juste</h5>
                              <p className="text-[#1a2e22] text-[13px] leading-relaxed font-bold border-l-4 border-[#1a2e22]/20 pl-8 group-hover:border-[#c5a059] transition-colors duration-700 opacity-70">Nous garantissons que l'essentiel de la valeur ajoutée profite directement à nos artisans locaux.</p>
                           </div>
                        </div>

                        <div className="relative pt-16 group">
                           <span className="absolute top-0 left-0 text-9xl font-serif italic text-[#c5a059]/30 font-light group-hover:text-[#c5a059]/50 group-hover:-translate-y-4 transition-all duration-700">02</span>
                           <div className="relative">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#1a2e22] mb-8">Excellence</h4>
                              <h5 className="text-2xl font-black mb-6 tracking-tight text-[#1a2e22]">Qualité Artisanale</h5>
                              <p className="text-[#1a2e22] text-[13px] leading-relaxed font-bold border-l-4 border-[#1a2e22]/20 pl-8 group-hover:border-[#c5a059] transition-colors duration-700 opacity-70">Un protocole de sélection rigoureux garantissant une pureté et un goût d'exception.</p>
                           </div>
                        </div>

                        <div className="relative pt-16 group">
                           <span className="absolute top-0 left-0 text-9xl font-serif italic text-[#c5a059]/30 font-light group-hover:text-[#c5a059]/50 group-hover:-translate-y-4 transition-all duration-700">03</span>
                           <div className="relative">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#1a2e22] mb-8">Héritage</h4>
                              <h5 className="text-2xl font-black mb-6 tracking-tight text-[#1a2e22]">Impact Durable</h5>
                              <p className="text-[#1a2e22] text-[13px] leading-relaxed font-bold border-l-4 border-[#1a2e22]/20 pl-8 group-hover:border-[#c5a059] transition-colors duration-700 opacity-70">Préserver les méthodes ancestrales tout en les modernisant pour un futur durable.</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </section>

         </main>

         {user && (
            <CartDrawer
               isOpen={isCartOpen}
               onClose={() => setIsCartOpen(false)}
               onSuccess={() => { setShowSuccessOrder(true); setIsCartOpen(false); }}
            />
         )}

         {/* Success Notification */}
         {showSuccessOrder && (
            <div className="fixed inset-0 z-[500] bg-[#1a2e22]/80 backdrop-blur-sm flex items-center justify-center p-8 animate-reveal">
               <div className="bg-white rounded-[60px] p-16 text-center max-w-xl shadow-3xl">
                  <div className="w-20 h-20 bg-[#1a2e22] text-[#c5a059] rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl animate-bounce">
                     <PackageCheck size={40} />
                  </div>
                  <h3 className="text-4xl font-black mb-4">Commande Confirmée !</h3>
                  <p className="text-slate-500 mb-10 font-medium">Votre commande a été transmise au producteur. Un SMS de confirmation vous sera envoyé.</p>
                  <button onClick={() => setShowSuccessOrder(false)} className="bg-[#1a2e22] text-white px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl">Génial !</button>
               </div>
            </div>
         )}
      </div>
   );
}

// Sub-components
function LuxuryCategoryBubble({ label, active = false, icon }: { label: string; active?: boolean; icon: string }) {
   return (
      <div className="flex flex-col items-center gap-6 group">
         <div className={`w-28 h-28 rounded-full flex items-center justify-center text-4xl transition-all duration-700 shadow-xl border-4 ${active ? 'bg-[#1a2e22] border-[#c5a059] scale-110 rotate-12' : 'bg-white border-white group-hover:border-[#c5a059]/30 group-hover:-translate-y-3 group-hover:shadow-2xl'}`}>
            <span className="group-hover:scale-125 transition-transform duration-700">{icon}</span>
         </div>
         <div className="text-center">
            <h5 className={`text-[11px] font-black uppercase tracking-[0.3em] transition-colors duration-500 ${active ? 'text-[#c5a059]' : 'text-[#1a2e22]/60 group-hover:text-[#1a2e22]'}`}>{label}</h5>
            {active && <div className="w-1 h-1 bg-[#c5a059] rounded-full mx-auto mt-2 animate-ping"></div>}
         </div>
      </div>
   );
}

function AfrigariAgroCard({ product, addToCart, handleActionClick, storeId, name, unit, producer, price, img, badge }: any) {
   return (
      <div className="block group animate-reveal">
         <div className="relative aspect-square rounded-[40px] overflow-hidden mb-8 shadow-2xl group-hover:-translate-y-4 transition-all duration-1000 ring-1 ring-[#1a2e22]/5 border-[8px] border-white bg-white">
             <img src={img} alt={name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[4s] block" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a2e22]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            {badge && <span className="absolute top-10 left-10 bg-[#c5a059] text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl border border-white/20 z-20">{badge}</span>}

            <Link href={storeId ? `/shops/${storeId}` : '#'} className="absolute inset-0 z-10"></Link>
         </div>
         <div className="px-6">
            <div className="flex items-center gap-3 mb-3">
               <div className="w-5 h-5 rounded-md bg-[#c5a059]/10 flex items-center justify-center text-[#c5a059]"><Package size={12} /></div>
               <p className="text-[10px] font-black text-[#c5a059] uppercase tracking-[0.4em]">{unit}</p>
            </div>
            <Link href={storeId ? `/shops/${storeId}` : '#'}>
               <h4 className="text-[20px] font-black mb-4 tracking-[-0.03em] text-[#1a2e22] group-hover:text-[#c5a059] transition-colors uppercase leading-none truncate cursor-pointer">{name}</h4>
            </Link>
            <div className="flex items-center gap-4 text-[10px] font-bold text-[#1a2e22]/30 uppercase tracking-[0.1em] mb-4">
               <Store size={12} />
               <span>{producer}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
               <span className="text-xl font-black text-[#1a2e22]">{price}</span>
               <div className="flex gap-2">
                  <button
                     onClick={(e) => handleActionClick(e, () => { window.location.href = storeId ? `/dashboard/client/messages?sellerId=${storeId}` : "/dashboard/client/messages"; })}
                     className="w-10 h-10 rounded-full bg-[#f4f1ea] flex items-center justify-center text-[#1a2e22] cursor-pointer hover:bg-[#c5a059] hover:text-white transition-all shadow-sm"
                  >
                     <MessageSquare size={16} />
                  </button>
                  <button
                     onClick={(e) => handleActionClick(e, () => addToCart(product))}
                     className="w-10 h-10 rounded-full bg-[#1a2e22] text-[#c5a059] flex items-center justify-center cursor-pointer hover:bg-[#c5a059] hover:text-white transition-all shadow-md"
                  >
                     <ShoppingCart size={16} />
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
}
