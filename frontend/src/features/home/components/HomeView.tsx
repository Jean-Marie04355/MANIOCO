"use client";
/* eslint-disable react/no-unescaped-entities */
import { ShoppingCart, Search, ArrowUpRight, ArrowRight, ArrowLeft, Package, Clock, Store, PackageCheck, LogOut, Loader2, MessageSquare, TrendingUp, Bell, Settings, MapPin, ChevronDown, User as UserIcon, Star, Heart, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import { useAuth } from '@/features/auth/AuthContext';
import { useCart } from '@/features/cart/CartContext';
import { useSocket } from '@/features/realtime/SocketContext';
import CartDrawer from '@/components/CartDrawer';
import { useFavorites } from '@/features/favorites/FavoritesContext';

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

interface Review {
   id?: string;
   userName: string;
   rating: number;
   comment: string;
   productName?: string;
   createdAt?: string;
}

export default function HomeView() {
   const { user, logout, isLoading: isAuthLoading } = useAuth();
   const { addToCart, totalItems } = useCart();
   const { socket } = useSocket();
   const router = useRouter();
   const [scrolled, setScrolled] = useState(false);
   const [isProfileOpen, setIsProfileOpen] = useState(false);
   const [isCartOpen, setIsCartOpen] = useState(false);
   const { totalFavorites } = useFavorites();
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

   // Hero carousel state
   const heroCarouselRef = useRef<HTMLDivElement>(null);
   const [heroIndex, setHeroIndex] = useState(0);

   // Sellers carousel state
   const sellersCarouselRef = useRef<HTMLDivElement>(null);

   // Testimonials slider state
   const [testimonialIndex, setTestimonialIndex] = useState(0);
   const [reviews, setReviews] = useState<Review[]>([]);
   const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
   const [reviewRating, setReviewRating] = useState(5);
   const [reviewComment, setReviewComment] = useState('');
   const [isSubmittingReview, setIsSubmittingReview] = useState(false);

   const howItWorksSteps = [
      { num: '01', title: 'Choisissez vos produits', desc: 'Parcourez les produits de producteurs béninois vérifiés.', img: 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=600' },
      { num: '02', title: 'Passez commande', desc: 'Ajouter au panier et finaliser votre commande en quelques clics.', img: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=600' },
      { num: '03', title: "Payer via l'opérateur", desc: 'MTN Momo, Moov Money, Celtiis, paiement 100% sécurisé.', img: 'https://images.unsplash.com/photo-1556742111-a301076d9d18?auto=format&fit=crop&q=80&w=600' },
      { num: '04', title: 'Livraison au Bénin', desc: '24h à Cotonou/Calavi. 48h-72h dans les autres villes via nos transporteurs.', img: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&q=80&w=600' },
   ];

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
            const [prodRes, catRes, storeRes, reviewsRes] = await Promise.all([
               api.get('/products'),
               api.get('/product-categories'),
               api.get('/stores'),
               api.get('/products/reviews'),
            ]);
            setProducts((prodRes?.data || []) as Product[]);
            setCategories((catRes?.data || []) as Category[]);
            setStores((storeRes?.data || []).slice(0, 4));
            setReviews((reviewsRes?.data || []) as Review[]);
         } catch (error) {
            console.error("Erreur de chargement", error);
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
                console.error("Erreur lors du chargement initial des données", error);
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
         console.error("Erreur lors du marquage des notifications", error);
      }
   };

   const markAsRead = async (id: string) => {
      try {
         await api.patch(`/notifications/${id}/read`);
         setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
         setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
         console.error("Erreur lors du marquage de la notification", error);
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
      e.preventDefault();
      e.stopPropagation();
      if (!user) {
         router.push('/auth/login');
         return;
      }
      action();
   };

   // Hero carousel scroll
   const scrollHeroCarousel = useCallback((direction: 'left' | 'right') => {
      if (heroCarouselRef.current) {
         const scrollAmount = 320;
         heroCarouselRef.current.scrollBy({
            left: direction === 'right' ? scrollAmount : -scrollAmount,
            behavior: 'smooth'
         });
      }
   }, []);

   // Sellers carousel scroll
   const scrollSellersCarousel = useCallback((direction: 'left' | 'right') => {
      if (sellersCarouselRef.current) {
         const scrollAmount = 300;
         sellersCarouselRef.current.scrollBy({
            left: direction === 'right' ? scrollAmount : -scrollAmount,
            behavior: 'smooth'
         });
      }
   }, []);

   return (
      <div className="bg-manioco-cream min-h-screen text-manioco-brown selection:bg-manioco-terracotta selection:text-white font-sans overflow-x-hidden">

         {/* ============================================ */}
         {/* NAVBAR */}
         {/* ============================================ */}
         <nav className={`fixed top-0 left-0 right-0 z-[200] transition-all duration-500 ${scrolled ? 'bg-white/95 backdrop-blur-xl shadow-[0_4px_30px_rgba(92,45,35,0.08)]' : 'bg-transparent'}`}>
            <div className="max-w-[1400px] mx-auto flex justify-between items-center px-8 lg:px-12 py-5">
               {/* Logo Manioco */}
               <Link href="/" className="flex items-center gap-1 group">
                  <span className="text-2xl font-extrabold tracking-tight text-manioco-brown font-sans">
                     Mani
                  </span>
                  <span className="relative inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#F4A261] border-[2.5px] border-manioco-brown text-manioco-brown text-sm font-black group-hover:scale-110 transition-transform">
                     o
                  </span>
                  <span className="text-2xl font-extrabold tracking-tight text-manioco-brown font-sans">
                     c
                  </span>
                  <span className="relative inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#F4A261] border-[2.5px] border-manioco-brown text-manioco-brown text-sm font-black group-hover:scale-110 transition-transform">
                     o
                  </span>
               </Link>

               {/* Nav Links */}
               <div className="hidden lg:flex items-center gap-10 text-sm font-semibold text-manioco-brown/70">
                  <Link href="/" className="hover:text-manioco-terracotta transition-colors">Accueil</Link>
                  <Link href="/produits" className="hover:text-manioco-terracotta transition-colors">Nos produits</Link>
                  <button onClick={() => document.getElementById('sellers')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-manioco-terracotta transition-colors">Vendeurs</button>
               </div>

               {/* Right side actions */}
               <div className="flex items-center gap-4">
                  {user && (
                     <>
                        {/* Messages */}
                        <Link href="/dashboard/client/messages" className="relative cursor-pointer group p-2.5 hover:bg-manioco-terracotta/10 rounded-xl transition-all">
                           <MessageSquare size={20} className="text-manioco-brown/60 group-hover:text-manioco-terracotta transition-colors" />
                           {unreadMessages > 0 && (
                              <>
                                 <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full animate-ping opacity-75"></span>
                                 <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full font-bold shadow-sm border border-white">
                                    {unreadMessages}
                                 </span>
                              </>
                           )}
                        </Link>

                        {/* Notifications */}
                        <div className="relative" ref={notificationsRef}>
                           <button
                              type="button"
                              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                              className="relative cursor-pointer group p-2.5 hover:bg-manioco-terracotta/10 rounded-xl transition-all"
                           >
                              <Bell size={20} className="text-manioco-brown/60 group-hover:text-manioco-terracotta transition-colors" />
                              {unreadCount > 0 && (
                                 <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full font-bold shadow-sm border border-white animate-bounce">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                 </span>
                              )}
                           </button>

                           {isNotificationsOpen && (
                              <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-manioco-brown/5 py-5 z-[300] animate-fade-up overflow-hidden">
                                 <div className="px-6 pb-4 border-b border-manioco-brown/5 flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-manioco-brown">Notifications</h3>
                                    {unreadCount > 0 && (
                                       <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-manioco-terracotta bg-manioco-terracotta/10">{unreadCount} nouvelles</span>
                                    )}
                                 </div>
                                 <div className="max-h-[300px] overflow-y-auto">
                                    {isNotificationLoading && notifications.length === 0 ? (
                                       <div className="px-6 py-8 text-center text-manioco-brown/40 text-xs font-medium">Chargement...</div>
                                    ) : notifications.length === 0 ? (
                                       <div className="px-6 py-8 text-center text-manioco-brown/40 text-xs font-medium">Aucune notification</div>
                                    ) : (
                                       notifications.map((notif) => (
                                          <button 
                                             type="button"
                                             key={notif.id} 
                                             onClick={() => markAsRead(notif.id)} 
                                             className={`w-full text-left px-6 py-4 hover:bg-manioco-terracotta/5 transition-colors cursor-pointer border-b border-manioco-brown/5 last:border-0 ${notif.isRead ? '' : 'bg-manioco-terracotta/5'}`}
                                          >
                                             <div className="flex justify-between items-start mb-1">
                                                <p className={`text-xs font-bold ${notif.isRead ? 'text-manioco-brown/40' : 'text-manioco-brown'}`}>{notif.title}</p>
                                                <span className="text-[10px] font-medium text-manioco-terracotta ml-2 whitespace-nowrap">{timeAgo(notif.createdAt)}</span>
                                             </div>
                                             <p className={`text-xs leading-relaxed ${notif.isRead ? 'text-manioco-brown/30' : 'text-manioco-brown/60'}`}>{notif.message}</p>
                                          </button>
                                       ))
                                    )}
                                 </div>
                                 <div className="px-6 pt-3 text-center">
                                    <button 
                                       onClick={markAllAsRead}
                                       disabled={unreadCount === 0}
                                       className="text-xs font-semibold text-manioco-terracotta hover:underline transition-colors disabled:opacity-30"
                                    >
                                       Tout marquer comme lu
                                    </button>
                                 </div>
                              </div>
                           )}
                        </div>
                     </>
                  )}

                  {/* Favoris */}
                  <Link
                     href="/favoris"
                     className="relative cursor-pointer group p-2.5 hover:bg-manioco-terracotta/10 rounded-xl transition-all"
                     title="Mes Favoris"
                  >
                     <Heart size={20} className={`text-manioco-brown/60 group-hover:text-manioco-terracotta transition-colors ${totalFavorites > 0 ? 'fill-manioco-terracotta text-manioco-terracotta' : ''}`} />
                     {totalFavorites > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-manioco-terracotta text-white text-[9px] flex items-center justify-center rounded-full font-bold shadow-sm border border-white">
                           {totalFavorites}
                        </span>
                     )}
                  </Link>

                  {/* Cart */}
                  <button
                     type="button"
                     onClick={() => setIsCartOpen(true)}
                     className="relative cursor-pointer group p-2.5 hover:bg-manioco-terracotta/10 rounded-xl transition-all"
                  >
                     <ShoppingCart size={20} className="text-manioco-brown/60 group-hover:text-manioco-terracotta transition-colors" />
                     {totalItems > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-manioco-terracotta text-white text-[9px] flex items-center justify-center rounded-full font-bold shadow-sm border border-white">
                           {totalItems}
                        </span>
                     )}
                  </button>

                  {user ? (
                     /* Profile */
                     <div className="relative" ref={profileRef}>
                        <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="w-10 h-10 rounded-full border-2 border-manioco-terracotta/20 shadow-md hover:scale-105 transition-all overflow-hidden bg-manioco-cream flex items-center justify-center text-manioco-brown font-bold text-sm">
                           {user?.profilePhoto ? (
                              <img src={getRealInternetLink({ name: 'user', image: user.profilePhoto })} alt={user.name || "Profil"} className="w-full h-full object-cover" />
                           ) : (
                              <span>{user?.name?.[0] || 'U'}</span>
                           )}
                        </button>

                        {isProfileOpen && (
                           <div className="absolute top-14 right-0 w-64 bg-white shadow-2xl rounded-3xl p-5 z-[300] border border-manioco-brown/5 animate-fade-up">
                              <div className="flex flex-col items-center mb-5">
                                 <div className="w-14 h-14 rounded-full border-3 border-manioco-terracotta/20 p-0.5 mb-2 overflow-hidden bg-manioco-cream flex items-center justify-center text-manioco-brown text-lg font-bold">
                                    {user?.profilePhoto ? (
                                       <img src={getRealInternetLink({ name: 'user', image: user.profilePhoto })} alt={user.name || "Profil"} className="w-full h-full object-cover rounded-full" />
                                    ) : (
                                       <span>{user?.name?.[0] || 'U'}</span>
                                    )}
                                 </div>
                                 <h4 className="font-bold text-base text-manioco-brown text-center">{user?.name || 'Utilisateur'}</h4>
                                 <p className="text-[10px] font-semibold text-manioco-terracotta uppercase tracking-wider mt-0.5">{user?.role || 'Client'}</p>
                              </div>
                              <div className="space-y-1">
                                 <Link href="/dashboard/client/messages" className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-manioco-terracotta/5 transition-all group">
                                    <MessageSquare size={16} className="text-manioco-brown/30 group-hover:text-manioco-terracotta" />
                                    <span className="text-xs font-semibold text-manioco-brown/60 group-hover:text-manioco-brown">Conversations</span>
                                 </Link>
                                 <Link href="/dashboard/client/orders" className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-manioco-terracotta/5 transition-all group">
                                    <Clock size={16} className="text-manioco-brown/30 group-hover:text-manioco-terracotta" />
                                    <span className="text-xs font-semibold text-manioco-brown/60 group-hover:text-manioco-brown">Commandes</span>
                                 </Link>
                                 <Link href="/dashboard/client/settings" className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-manioco-terracotta/5 transition-all group">
                                    <Settings size={16} className="text-manioco-brown/30 group-hover:text-manioco-terracotta" />
                                    <span className="text-xs font-semibold text-manioco-brown/60 group-hover:text-manioco-brown">Paramètres</span>
                                 </Link>
                                 <div className="h-px bg-manioco-brown/5 my-3 mx-2"></div>
                                 <button onClick={() => logout()} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-red-500 transition-all">
                                    <LogOut size={16} />
                                    <span className="text-xs font-semibold">Déconnexion</span>
                                 </button>
                              </div>
                           </div>
                        )}
                     </div>
                  ) : (
                     <Link href="/auth/login" className="flex items-center gap-2 bg-manioco-terracotta text-white px-6 py-2.5 rounded-full hover:bg-manioco-brown transition-all text-sm font-semibold shadow-md hover:shadow-lg">
                        <UserIcon size={16} />
                        <span>Se connecter</span>
                     </Link>
                  )}
               </div>
            </div>
         </nav>

         <main>
            {/* ============================================ */}
            {/* HERO SECTION */}
            {/* ============================================ */}
            <section className="pt-28 pb-16 lg:pb-24">
               <div className="max-w-[1400px] mx-auto px-8 lg:px-12">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                     {/* Left: Text */}
                     <div className="animate-fade-up">
                        <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold text-manioco-brown leading-[1.1] tracking-tight mb-6">
                           Les meilleurs dérivés du manioc, rigoureusement sélectionnés{' '}
                           <span className="text-manioco-terracotta italic font-serif font-normal">pour vous.</span>
                        </h1>
                        <p className="text-base text-manioco-brown/50 leading-relaxed max-w-lg mb-8 font-medium">
                           Découvrez notre sélection de produits dérivés du manioc, soigneusement choisis auprès des meilleurs producteurs du Bénin.
                        </p>
                        <button
                           onClick={() => document.getElementById('best-sellers')?.scrollIntoView({ behavior: 'smooth' })}
                           className="inline-flex items-center gap-3 bg-manioco-terracotta text-white px-8 py-4 rounded-full font-semibold text-sm hover:bg-manioco-brown transition-all shadow-lg hover:shadow-xl group"
                        >
                           Explorer les produits
                           <ArrowUpRight size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                     </div>

                     {/* Right: Product Carousel */}
                     <div className="relative animate-fade-up delay-200">
                        <div
                           ref={heroCarouselRef}
                           className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
                           style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                           {products.slice(0, 8).map((product, i) => (
                              <div key={product.id} className="flex-shrink-0 w-[260px] snap-start">
                                 <div className="relative h-[340px] rounded-3xl overflow-hidden group cursor-pointer shadow-lg">
                                    {/* Rating badge */}
                                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1 shadow-md z-20">
                                       <Star size={12} className="fill-[#F4A261] text-[#F4A261]" />
                                       <span className="text-xs font-bold text-manioco-brown">
                                          {product.rating && Number(product.rating) > 0
                                             ? Number(product.rating).toFixed(1)
                                             : (4.6 + (i % 2) * 0.2).toFixed(1)}
                                       </span>
                                    </div>
                                    <img
                                       src={getRealInternetLink(product)}
                                       alt={product.name}
                                       className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                                    {/* Product Info & Cart button */}
                                    <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between z-20 pointer-events-none">
                                       <div className="flex-1 min-w-0 pr-4">
                                          <h4 className="text-white font-bold text-base mb-1 truncate">{product.name}</h4>
                                          <p className="text-white/80 text-sm font-medium">
                                             {Number(product.price).toLocaleString('fr-FR')} Fcfa <span className="text-white/50">/ {product.unit || 'Kg'}</span>
                                          </p>
                                       </div>
                                       <button
                                          onClick={(e) => {
                                             e.preventDefault();
                                             e.stopPropagation();
                                             handleActionClick(e, () => addToCart(product));
                                          }}
                                          className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center cursor-pointer transition-all shadow-sm shrink-0 pointer-events-auto"
                                       >
                                          <ShoppingCart size={16} />
                                       </button>
                                    </div>
                                    {/* Overlay Link to Shop */}
                                    <Link
                                       href={product.storeId || product.store?.id ? `/shops/${product.storeId || product.store?.id}` : '#'}
                                       className="absolute inset-0 z-10"
                                     />
                                 </div>
                              </div>
                           ))}
                        </div>
                        {/* Carousel controls */}
                        <div className="flex gap-3 mt-4 justify-end">
                           <button
                              onClick={() => scrollHeroCarousel('left')}
                              className="w-10 h-10 rounded-full border-2 border-manioco-brown/15 flex items-center justify-center text-manioco-brown/40 hover:border-manioco-terracotta hover:text-manioco-terracotta transition-all"
                           >
                              <ChevronLeft size={18} />
                           </button>
                           <button
                              onClick={() => scrollHeroCarousel('right')}
                              className="w-10 h-10 rounded-full border-2 border-manioco-brown/15 flex items-center justify-center text-manioco-brown/40 hover:border-manioco-terracotta hover:text-manioco-terracotta transition-all"
                           >
                              <ChevronRight size={18} />
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            </section>

            {/* ============================================ */}
            {/* SEARCH SECTION */}
            {/* ============================================ */}
            <section className="py-16 bg-white/50">
               <div className="max-w-[1400px] mx-auto px-8 lg:px-12">
                  <h2 className="text-3xl md:text-4xl font-extrabold text-manioco-brown text-left mb-8">
                     Trouvez le dérivé de manioc qu'il vous faut
                  </h2>
                  <div className="flex items-center bg-white border border-manioco-brown/15 rounded-full p-2 pl-6 pr-2 w-full mb-8 shadow-[0_4px_20px_rgba(92,45,35,0.04)] focus-within:ring-2 focus-within:ring-manioco-terracotta/20 focus-within:border-manioco-terracotta transition-all duration-300">
                     <input
                        type="text"
                        placeholder="Ex: Gari, Tapioca, Farine, Attiéké..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent border-0 outline-none py-3 text-base text-manioco-brown placeholder:text-manioco-brown/30 font-medium"
                     />
                     <button
                        onClick={() => document.getElementById('best-sellers')?.scrollIntoView({ behavior: 'smooth' })}
                        className="bg-manioco-terracotta text-white px-8 py-3.5 rounded-full font-semibold text-sm hover:bg-manioco-brown transition-all shadow-md whitespace-nowrap cursor-pointer"
                     >
                        Recherche
                     </button>
                  </div>

                  {/* Category badges */}
                  <div className="flex flex-wrap justify-start gap-3">
                     <button
                        type="button"
                        onClick={() => setActiveCategoryId(null)}
                        className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
                           activeCategoryId === null
                              ? 'bg-manioco-terracotta text-white shadow-md'
                              : 'bg-white text-manioco-brown/60 border border-manioco-brown/10 hover:border-manioco-terracotta/40 hover:text-manioco-terracotta'
                        }`}
                     >
                        Tout
                     </button>
                     {categories.map(cat => (
                        <button
                           type="button"
                           key={cat.id}
                           onClick={() => {
                              const categoryId = String(cat.id);
                              setActiveCategoryId(categoryId === activeCategoryId ? null : categoryId);
                           }}
                           className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
                              activeCategoryId === String(cat.id)
                                 ? 'bg-manioco-terracotta text-white shadow-md'
                                 : 'bg-white text-manioco-brown/60 border border-manioco-brown/10 hover:border-manioco-terracotta/40 hover:text-manioco-terracotta'
                           }`}
                        >
                           {cat.name}
                        </button>
                     ))}
                  </div>
               </div>
            </section>

            {/* ============================================ */}
            {/* BEST SELLERS SECTION */}
            {/* ============================================ */}
            <section id="best-sellers" className="py-20 scroll-mt-24">
               <div className="max-w-[1400px] mx-auto px-8 lg:px-12">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
                     <h2 className="text-3xl md:text-4xl font-bold text-manioco-brown">
                        {activeCity ? `Boutiques à ${activeCity}` : activeCategoryId ? `Produits : ${categories.find(c => c.id === activeCategoryId)?.name}` : 'Produits les plus vendus'}
                     </h2>
                     <div className="flex items-center gap-3">
                        {activeCategoryId && (
                           <button onClick={() => setActiveCategoryId(null)} className="text-xs font-semibold text-red-400 hover:text-red-600 flex items-center gap-1.5 border border-red-200 px-4 py-2 rounded-full hover:bg-red-50 transition-all">
                              <X size={12} /> Catégorie
                           </button>
                        )}
                        {activeCity && (
                           <button onClick={() => setActiveCity(null)} className="text-xs font-semibold text-manioco-terracotta hover:text-manioco-brown flex items-center gap-1.5 border border-manioco-terracotta/30 px-4 py-2 rounded-full hover:bg-manioco-terracotta/5 transition-all">
                              <X size={12} /> {activeCity}
                           </button>
                        )}
                        <Link href="/shops" className="inline-flex items-center gap-2 text-sm font-semibold text-manioco-terracotta hover:text-manioco-brown transition-colors">
                           Voir tous les produits <ArrowUpRight size={16} />
                        </Link>
                     </div>
                  </div>

                  {/* Location Filter */}
                  {uniqueCities.length > 0 && (
                     <div className="mb-10 relative" ref={cityFilterRef}>
                        <div className="flex items-center gap-3">
                           <button 
                              onClick={() => setIsCityFilterOpen(!isCityFilterOpen)}
                              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition-all border shadow-sm ${
                                 isCityFilterOpen || activeCity 
                                 ? 'bg-manioco-terracotta text-white border-manioco-terracotta' 
                                 : 'bg-white text-manioco-brown/60 border-manioco-brown/10 hover:border-manioco-terracotta/40'
                              }`}
                           >
                              <MapPin size={14} />
                              {activeCity ? `Ville : ${activeCity}` : 'Filtrer par ville'}
                              <ChevronDown size={12} className={`transition-transform duration-300 ${isCityFilterOpen ? 'rotate-180' : ''}`} />
                           </button>
                        </div>

                        {isCityFilterOpen && (
                           <div className="absolute top-full left-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-manioco-brown/5 p-3 z-[100] animate-fade-up">
                              <button
                                 onClick={() => { setActiveCity(null); setIsCityFilterOpen(false); }}
                                 className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-semibold transition-all ${!activeCity ? 'bg-manioco-terracotta text-white' : 'hover:bg-manioco-terracotta/5 text-manioco-brown/60'}`}
                              >
                                 <MapPin size={14} />
                                 Toutes les villes
                              </button>
                              {uniqueCities.map(city => (
                                 <button
                                    key={city}
                                    onClick={() => { setActiveCity(city); setIsCityFilterOpen(false); }}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-semibold transition-all ${activeCity === city ? 'bg-manioco-terracotta text-white' : 'hover:bg-manioco-terracotta/5 text-manioco-brown/60 hover:text-manioco-terracotta'}`}
                                 >
                                    <MapPin size={14} />
                                    {city}
                                 </button>
                              ))}
                           </div>
                        )}
                     </div>
                  )}

                  {isLoading ? (
                     <div className="py-32 flex justify-center w-full">
                        <Loader2 className="w-10 h-10 text-manioco-terracotta animate-spin" />
                     </div>
                  ) : (
                     <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                           {filteredProducts.slice(0, visibleCount).map((product) => (
                              <ManiocoProductCard
                                 key={product.id}
                                 product={product}
                                 addToCart={addToCart}
                                 handleActionClick={handleActionClick}
                                 storeId={product.storeId || product.store?.id}
                                 name={product.name}
                                 unit={product.unit || 'Kg'}
                                 producer={product.store?.name || 'Artisan Certifié'}
                                 price={Number(product.price)}
                                 img={getRealInternetLink(product)}
                                 badge={product.category?.name}
                              />
                           ))}
                        </div>

                        {visibleCount < filteredProducts.length && (
                           <div className="flex justify-center mt-16">
                              <button
                                 onClick={() => setVisibleCount(prev => prev + 8)}
                                 className="inline-flex items-center gap-3 border-2 border-manioco-terracotta text-manioco-terracotta px-8 py-3.5 rounded-full font-semibold text-sm hover:bg-manioco-terracotta hover:text-white transition-all group"
                              >
                                 Voir plus de produits
                                 <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                              </button>
                           </div>
                        )}
                     </>
                  )}
               </div>
            </section>

            {/* ============================================ */}
            {/* FEATURED SELLERS SECTION */}
            {/* ============================================ */}
            {stores.length > 0 && (
               <section id="sellers" className="py-20 bg-manioco-terracotta">
                  <div className="max-w-[1400px] mx-auto px-8 lg:px-12">
                     <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
                        <h2 className="text-3xl md:text-4xl font-bold text-white">
                           Nos vendeurs phares
                        </h2>
                        <div className="flex items-center gap-4">
                           {/* Carousel controls */}
                           <div className="flex gap-2">
                              <button
                                 type="button"
                                 onClick={() => scrollSellersCarousel('left')}
                                 className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center text-white/80 hover:border-white hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                              >
                                 <ChevronLeft size={18} />
                              </button>
                              <button
                                 type="button"
                                 onClick={() => scrollSellersCarousel('right')}
                                 className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center text-white/80 hover:border-white hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                              >
                                 <ChevronRight size={18} />
                              </button>
                           </div>
                           <Link href="/shops" className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white transition-colors border border-white/30 px-5 py-2.5 rounded-full hover:bg-white/10">
                              Voir tous les producteurs <ArrowUpRight size={16} />
                           </Link>
                        </div>
                     </div>

                     <div
                        ref={sellersCarouselRef}
                        className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x snap-mandatory"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                     >
                        {stores.map((store) => (
                           <div key={store.id} className="flex-shrink-0 w-[280px] snap-start">
                              <Link href={`/shops/${store.id}`} className="group block">
                                 <div className="bg-white rounded-3xl p-6 hover:-translate-y-2 transition-all duration-500 shadow-lg hover:shadow-2xl h-full">
                                    <div className="flex flex-col items-center text-center mb-5">
                                       <div className="relative mb-4">
                                          <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-manioco-cream shadow-md">
                                             <img
                                                src={store.profilePhoto ? (store.profilePhoto.startsWith('http') ? store.profilePhoto : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/uploads${store.profilePhoto.startsWith('/') ? '' : '/'}${store.profilePhoto}`) : "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200"}
                                                className="w-full h-full object-cover"
                                                alt={store.name}
                                             />
                                          </div>
                                          {/* Verified badge */}
                                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                                             <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                          </div>
                                       </div>
                                       <h4 className="text-base font-bold text-manioco-brown mb-1 truncate w-full">{store.name}</h4>
                                       <div className="flex items-center gap-1 text-manioco-brown/40 text-xs">
                                          <MapPin size={12} />
                                          <span>{store.city || 'Bénin'}</span>
                                       </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-manioco-brown/5">
                                       <div className="flex flex-col items-center flex-1">
                                          <div className="flex items-center gap-1">
                                             <Star size={14} className="fill-[#F4A261] text-[#F4A261] shrink-0" />
                                             <span className="text-sm font-bold text-manioco-brown">4.8</span>
                                          </div>
                                          <p className="text-[10px] text-manioco-brown/40 font-semibold mt-1">Note</p>
                                       </div>
                                       <div className="w-px h-8 bg-manioco-brown/5"></div>
                                       <div className="flex flex-col items-center flex-1">
                                          <div className="flex items-center gap-1">
                                             <TrendingUp size={14} className="text-[#9E4E3B] shrink-0" />
                                             <span className="text-sm font-bold text-manioco-brown">120+</span>
                                          </div>
                                          <p className="text-[10px] text-manioco-brown/40 font-semibold mt-1">Ventes</p>
                                       </div>
                                       <div className="w-px h-8 bg-manioco-brown/5"></div>
                                       <div className="flex flex-col items-center flex-1">
                                          <div className="flex items-center gap-1">
                                             <Package size={14} className="text-[#9E4E3B] shrink-0" />
                                             <span className="text-sm font-bold text-manioco-brown">15</span>
                                          </div>
                                          <p className="text-[10px] text-manioco-brown/40 font-semibold mt-1">Produits</p>
                                       </div>
                                    </div>
                                 </div>
                              </Link>
                           </div>
                        ))}
                     </div>
                  </div>
               </section>
            )}

            {/* ============================================ */}
            {/* HOW IT WORKS SECTION */}
            {/* ============================================ */}
            <section id="how-it-works" className="py-20">
               <div className="max-w-[1400px] mx-auto px-8 lg:px-12">
                  <h2 className="text-3xl md:text-4xl font-extrabold text-manioco-brown text-center mb-16">
                     Comment ça marche ?
                  </h2>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-manioco-brown/10 rounded-[32px] overflow-hidden border border-manioco-brown/10">
                     {[
                        { type: 'image', img: howItWorksSteps[0].img, title: howItWorksSteps[0].title },
                        { type: 'text', num: '01', title: howItWorksSteps[0].title, desc: howItWorksSteps[0].desc },
                        { type: 'image', img: howItWorksSteps[1].img, title: howItWorksSteps[1].title },
                        { type: 'text', num: '02', title: howItWorksSteps[1].title, desc: howItWorksSteps[1].desc },
                        { type: 'text', num: '03', title: howItWorksSteps[2].title, desc: howItWorksSteps[2].desc },
                        { type: 'image', img: howItWorksSteps[2].img, title: howItWorksSteps[2].title },
                        { type: 'text', num: '04', title: howItWorksSteps[3].title, desc: howItWorksSteps[3].desc },
                        { type: 'image', img: howItWorksSteps[3].img, title: howItWorksSteps[3].title },
                     ].map((cell, index) => {
                        if (cell.type === 'image') {
                           return (
                              <div key={`img-${index}`} className="relative aspect-square w-full overflow-hidden bg-white">
                                 <img
                                    src={cell.img}
                                    alt={cell.title}
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                                 />
                              </div>
                           );
                        } else {
                           return (
                              <div
                                 key={`text-${index}`}
                                 className="bg-white p-6 lg:p-8 relative flex flex-col justify-between aspect-square select-none group/step cursor-pointer"
                              >
                                 {/* Top side: number and animated line */}
                                 <div className="flex items-center justify-end w-full relative h-10">
                                    <span className="text-2xl lg:text-3xl font-extrabold text-manioco-terracotta font-serif transition-all duration-500 transform group-hover/step:-translate-x-[75px]">
                                       {cell.num}
                                    </span>
                                    <div className="absolute right-0 h-[2px] bg-manioco-terracotta w-0 group-hover/step:w-[65px] transition-all duration-500"></div>
                                 </div>

                                 {/* Bottom side: title & desc */}
                                 <div className="flex flex-col justify-end mt-4">
                                    <h4 className="text-sm lg:text-base font-bold text-manioco-brown leading-snug">
                                       {cell.title}
                                       <span className="text-manioco-terracotta ml-1.5 font-light group-hover/step:opacity-0 transition-opacity duration-300 inline-block">
                                          +
                                       </span>
                                    </h4>
                                    <div className="relative h-12 mt-1">
                                       <p className="text-xs lg:text-sm text-manioco-brown/50 leading-relaxed absolute top-0 left-0 w-full opacity-0 group-hover/step:opacity-100 transition-all duration-500 transform translate-y-2 group-hover/step:translate-y-0 select-none">
                                          {cell.desc}
                                       </p>
                                    </div>
                                 </div>
                              </div>
                           );
                        }
                     })}
                  </div>
               </div>
            </section>

            {/* ============================================ */}
            {/* TESTIMONIALS SECTION */}
            {/* ============================================ */}
            <section className="py-20 bg-white/40">
               <div className="max-w-[1400px] mx-auto px-8 lg:px-12">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
                     <h2 className="text-3xl md:text-4xl font-bold text-manioco-brown">
                        Ce que nos clients disent de nous
                     </h2>
                     <button
                        type="button"
                        onClick={() => {
                           if (!user) {
                              router.push('/auth/login');
                              return;
                           }
                           setIsReviewFormOpen(true);
                        }}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-manioco-terracotta border border-manioco-terracotta/30 px-5 py-2.5 rounded-full hover:bg-manioco-terracotta hover:text-white transition-all"
                     >
                        Laissez un avis <ArrowUpRight size={16} />
                     </button>
                  </div>

                  {isReviewFormOpen && (
                     <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4">
                        <div className="w-full max-w-2xl rounded-[32px] bg-white p-8 shadow-2xl">
                           <div className="flex items-start justify-between gap-4 mb-6">
                              <div>
                                 <h3 className="text-2xl font-extrabold text-manioco-brown">Laissez votre avis</h3>
                                 <p className="text-sm text-manioco-brown/60 mt-2">Donnez une note et un commentaire sur l’application. Votre avis sera visible dans cette section.</p>
                              </div>
                              <button
                                 type="button"
                                 onClick={() => setIsReviewFormOpen(false)}
                                 className="text-manioco-brown/70 hover:text-manioco-brown"
                                 aria-label="Fermer le formulaire d'avis"
                              >
                                 <X size={22} />
                              </button>
                           </div>
                           <div className="space-y-6">
                              <div>
                                 <p className="text-sm font-semibold text-manioco-brown mb-2">Votre note</p>
                                 <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((value) => (
                                       <button
                                          key={value}
                                          type="button"
                                          onClick={() => setReviewRating(value)}
                                          className="rounded-full p-2 transition-colors"
                                          aria-label={`Donner ${value} étoiles`}
                                       >
                                          <Star
                                             size={24}
                                             className={value <= reviewRating ? 'fill-[#F4A261] text-[#F4A261]' : 'text-manioco-brown/30'}
                                          />
                                       </button>
                                    ))}
                                 </div>
                              </div>
                              <div>
                                 <label htmlFor="reviewComment" className="text-sm font-semibold text-manioco-brown mb-2 block">
                                    Votre commentaire
                                 </label>
                                 <textarea
                                    id="reviewComment"
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    rows={5}
                                    className="w-full rounded-3xl border border-manioco-brown/10 bg-manioco-cream/50 px-4 py-4 text-sm text-manioco-brown outline-none focus:border-manioco-terracotta focus:ring-2 focus:ring-manioco-terracotta/20"
                                    placeholder="Ce que vous avez aimé ou ce qui peut être amélioré..."
                                 />
                              </div>
                              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                                 <button
                                    type="button"
                                    onClick={() => setIsReviewFormOpen(false)}
                                    className="rounded-full border border-manioco-brown/20 px-5 py-3 text-sm font-semibold text-manioco-brown hover:bg-manioco-brown/5 transition-all"
                                 >
                                    Annuler
                                 </button>
                                 <button
                                    type="button"
                                    onClick={async () => {
                                       if (!reviewComment.trim()) {
                                          alert('Veuillez écrire un commentaire avant de soumettre votre avis.');
                                          return;
                                       }
                                       setIsSubmittingReview(true);
                                       try {
                                          const newReview: Review = {
                                             id: `${Date.now()}`,
                                             userName: user?.name || 'Client Afrigari',
                                             rating: reviewRating,
                                             comment: reviewComment.trim(),
                                             createdAt: new Date().toISOString(),
                                          };
                                          setReviews((current) => [newReview, ...current]);
                                          setReviewComment('');
                                          setReviewRating(5);
                                          setIsReviewFormOpen(false);
                                       } catch (error) {
                                          console.error('Erreur soumission avis', error);
                                          alert('Impossible d’ajouter votre avis pour le moment.');
                                       } finally {
                                          setIsSubmittingReview(false);
                                       }
                                    }}
                                    disabled={isSubmittingReview}
                                    className="rounded-full bg-manioco-terracotta px-5 py-3 text-sm font-semibold text-white hover:bg-[#d87e5a] transition-all disabled:opacity-60"
                                 >
                                    {isSubmittingReview ? 'Envoi...' : 'Publier mon avis'}
                                 </button>
                              </div>
                           </div>
                        </div>
                     </div>
                  )}

                  {/* Testimonials Slider */}
                  {reviews.length > 0 ? (
                     <div className="relative">
                        <div className="overflow-hidden">
                           <div
                              className="flex transition-transform duration-500 ease-out gap-6"
                              style={{ transform: `translateX(-${testimonialIndex * (100 / Math.min(3, reviews.length))}%)` }}
                           >
                              {reviews.map((t, i) => (
                                 <div key={t.id || i} className="flex-shrink-0 w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]">
                                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-manioco-brown/5 h-full hover:shadow-lg transition-shadow duration-300">
                                       {/* Stars */}
                                       <div className="flex items-center gap-1 mb-4">
                                          {[...Array(Math.max(0, Math.round(t.rating || 0)))].map((_, si) => (
                                             <Star key={si} size={16} className="fill-[#F4A261] text-[#F4A261]" />
                                          ))}
                                          <span className="ml-2 text-sm font-bold text-manioco-brown/60">{t.rating?.toFixed(1)}</span>
                                       </div>
                                       {/* Review text */}
                                       <p className="text-sm text-manioco-brown/70 leading-relaxed mb-6 line-clamp-4">
                                          &ldquo;{t.comment}&rdquo;
                                       </p>
                                       {/* Author */}
                                       <div className="flex items-center gap-3">
                                          <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-manioco-cream bg-slate-100 text-sm font-bold text-manioco-brown">
                                             {t.userName?.charAt(0).toUpperCase() || 'C'}
                                          </div>
                                          <div>
                                             <p className="text-sm font-bold text-manioco-brown">{t.userName}</p>
                                             <p className="text-xs text-manioco-brown/40">{t.productName ? `Acheté: ${t.productName}` : 'Client Afrigari'}</p>
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>

                        {/* Slider Controls */}
                        <div className="flex items-center justify-center gap-4 mt-10">
                           <button
                              onClick={() => setTestimonialIndex(Math.max(0, testimonialIndex - 1))}
                              disabled={testimonialIndex === 0}
                              className="w-10 h-10 rounded-full border-2 border-manioco-brown/15 flex items-center justify-center text-manioco-brown/40 hover:border-manioco-terracotta hover:text-manioco-terracotta transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                           >
                              <ChevronLeft size={18} />
                           </button>
                           <div className="flex gap-2">
                              {reviews.map((_, i) => (
                                 <button
                                    key={i}
                                    onClick={() => setTestimonialIndex(i)}
                                    className={`w-2.5 h-2.5 rounded-full transition-all ${i === testimonialIndex ? 'bg-manioco-terracotta w-7' : 'bg-manioco-brown/15 hover:bg-manioco-brown/30'}`}
                                 />
                              ))}
                           </div>
                           <button
                              onClick={() => setTestimonialIndex(Math.min(reviews.length - 1, testimonialIndex + 1))}
                              disabled={testimonialIndex >= reviews.length - 1}
                              className="w-10 h-10 rounded-full border-2 border-manioco-brown/15 flex items-center justify-center text-manioco-brown/40 hover:border-manioco-terracotta hover:text-manioco-terracotta transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                           >
                              <ChevronRight size={18} />
                           </button>
                        </div>
                     </div>
                  ) : (
                     <div className="rounded-3xl bg-white p-12 border border-manioco-brown/10 text-center text-manioco-brown/70">
                        Aucun avis client n’est disponible pour le moment. Revenez bientôt pour lire les retours de nos utilisateurs.
                     </div>
                  )}
               </div>
            </section>
         </main>

         {/* ============================================ */}
         {/* FOOTER */}
         {/* ============================================ */}
         <footer className="py-16 border-t border-manioco-brown/5">
            <div className="max-w-[1400px] mx-auto px-8 lg:px-12 text-center">
               {/* Manioco Logo Large */}
               <div className="flex items-center justify-center gap-1.5 mb-8">
                  <span className="text-4xl font-extrabold tracking-tight text-manioco-brown font-sans">Mani</span>
                  <span className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#F4A261] border-[3px] border-manioco-brown text-manioco-brown text-lg font-black">o</span>
                  <span className="text-4xl font-extrabold tracking-tight text-manioco-brown font-sans">c</span>
                  <span className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#F4A261] border-[3px] border-manioco-brown text-manioco-brown text-lg font-black">o</span>
               </div>

               {/* Nav Links */}
               <div className="flex items-center justify-center gap-8 mb-8 text-sm text-manioco-brown/50 font-medium">
                  <Link href="/" className="hover:text-manioco-terracotta transition-colors">Accueil</Link>
                  <Link href="/shops" className="hover:text-manioco-terracotta transition-colors">Nos produits</Link>
                  <Link href="/shops" className="hover:text-manioco-terracotta transition-colors">Vendeurs</Link>
               </div>

               {/* Social Icons */}
               <div className="flex items-center justify-center gap-4 mb-10">
                  {['facebook', 'twitter', 'instagram'].map((social) => (
                     <a key={social} href="#" className="w-10 h-10 rounded-full border border-manioco-terracotta/30 flex items-center justify-center text-manioco-terracotta hover:bg-manioco-terracotta hover:text-white transition-all">
                        {social === 'facebook' && (
                           <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        )}
                        {social === 'twitter' && (
                           <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                        )}
                        {social === 'instagram' && (
                           <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z"/></svg>
                        )}
                     </a>
                  ))}
               </div>

               <p className="text-xs text-manioco-brown/30 font-medium">
                  © {new Date().getFullYear()} Manioco. Tous droits réservés.
               </p>
            </div>
         </footer>

         {/* Cart Drawer */}
         <CartDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            onSuccess={() => { setShowSuccessOrder(true); setIsCartOpen(false); }}
         />

         {/* Success Notification */}
         {showSuccessOrder && (
            <div className="fixed inset-0 z-[500] bg-manioco-brown/80 backdrop-blur-sm flex items-center justify-center p-8 animate-fade-up">
               <div className="bg-white rounded-3xl p-12 text-center max-w-md shadow-2xl">
                  <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                     <PackageCheck size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-manioco-brown mb-3">Commande Confirmée !</h3>
                  <p className="text-sm text-manioco-brown/50 mb-8 leading-relaxed">Votre commande a été transmise au producteur. Un SMS de confirmation vous sera envoyé.</p>
                  <button onClick={() => setShowSuccessOrder(false)} className="bg-manioco-terracotta text-white px-8 py-3 rounded-full font-semibold text-sm shadow-md hover:bg-manioco-brown transition-all">
                     Génial !
                  </button>
               </div>
            </div>
         )}
      </div>
   );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function ManiocoProductCard({ product, addToCart, handleActionClick, storeId, name, unit, producer, price, img, badge }: any) {
   const { toggleFavorite, isFavorited } = useFavorites();
   return (
      <div className="group animate-fade-up">
         <div className="bg-white rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 border border-manioco-brown/5">
            {/* Image */}
            <div className="relative aspect-square overflow-hidden">
               <img src={img} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
               
               {/* Rating badge */}
               <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1 shadow-md">
                  <Star size={12} className="fill-[#F4A261] text-[#F4A261]" />
                  <span className="text-xs font-bold text-manioco-brown">
                     {product?.rating && Number(product.rating) > 0 
                        ? Number(product.rating).toFixed(1) 
                        : "4.8"}
                  </span>
               </div>

               {/* Category badge */}
               {badge && (
                  <div className="absolute top-4 left-4 bg-manioco-terracotta/90 backdrop-blur-sm text-white rounded-full px-3 py-1.5 text-[10px] font-semibold shadow-md">
                     {badge}
                  </div>
               )}

               <Link href={storeId ? `/shops/${storeId}` : '#'} className="absolute inset-0 z-10"></Link>
            </div>

            {/* Content */}
            <div className="p-5">
               <Link href={storeId ? `/shops/${storeId}` : '#'}>
                  <h4 className="text-base font-bold text-manioco-terracotta mb-1 truncate hover:text-manioco-brown transition-colors cursor-pointer">{name}</h4>
               </Link>
               <p className="text-xs text-manioco-brown/40 mb-4 truncate">{producer} · {unit}</p>
               
               <div className="flex items-center justify-between">
                  <span className="text-lg font-extrabold text-manioco-brown">{price.toLocaleString('fr-FR')} <span className="text-xs font-medium text-manioco-brown/40">Fcfa</span></span>
                  <div className="flex gap-2">
                     <button
                        onClick={(e) => handleActionClick(e, () => toggleFavorite(String(product.id)))}
                        className={`relative z-20 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 ${
                           isFavorited(String(product.id))
                              ? 'bg-manioco-terracotta/10 text-manioco-terracotta scale-110'
                              : 'bg-manioco-cream text-manioco-brown/40 hover:bg-manioco-terracotta/10 hover:text-manioco-terracotta'
                        }`}
                        title={isFavorited(String(product.id)) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                     >
                        <Heart
                           size={14}
                           className={`transition-all duration-200 ${
                              isFavorited(String(product.id)) ? 'fill-manioco-terracotta text-manioco-terracotta' : ''
                           }`}
                        />
                     </button>
                     <button
                        onClick={(e) => handleActionClick(e, () => addToCart(product))}
                        className="w-9 h-9 rounded-full bg-manioco-terracotta text-white flex items-center justify-center cursor-pointer hover:bg-manioco-brown transition-all shadow-sm"
                     >
                        <ShoppingCart size={14} />
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
