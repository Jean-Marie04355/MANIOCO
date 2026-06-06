"use client";
/* eslint-disable react/no-unescaped-entities */
import { ShoppingCart, Search, ArrowUpRight, ArrowRight, ArrowLeft, Package, Clock, Store, PackageCheck, LogOut, Loader2, MessageSquare, X, TrendingUp, Bell, Settings, MapPin, ChevronDown, User as UserIcon, Star, Heart, ChevronRight, ChevronLeft, Plus, Menu, LayoutGrid } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import { useAuth } from '@/features/auth/AuthContext';
import { useCart } from '@/features/cart/CartContext';
import { useSocket } from '@/features/realtime/SocketContext';
import { useFavorites } from '@/features/favorites/FavoritesContext';
import PublicNavbar from '@/components/PublicNavbar';

// Types adapted from HomeView
interface Category {
   id: string | number;
   name: string;
}

interface Product {
   id: string | number;
   name: string;
   image?: string;
   price: number | string;
   unit?: string;
   categoryId?: string | number | null;
   description?: string;
   rating?: number;
   ratingsCount?: number;
   store?: {
      name?: string;
      city?: string;
   }
}

export default function ProductsCatalogView() {
   const { user, logout } = useAuth();
   const { addToCart, totalItems } = useCart();
   const { socket } = useSocket();
   const { toggleFavorite, isFavorited, totalFavorites } = useFavorites();
   const router = useRouter();
   const [scrolled, setScrolled] = useState(false);
   const [isProfileOpen, setIsProfileOpen] = useState(false);
   const [isCartOpen, setIsCartOpen] = useState(false);

   const [products, setProducts] = useState<Product[]>([]);
   const [categories, setCategories] = useState<Category[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
   const [activeCity, setActiveCity] = useState<string | null>(null);
   const [isCategoryOpen, setIsCategoryOpen] = useState(true);
   const [isCityOpen, setIsCityOpen] = useState(true);

   const [notifications, setNotifications] = useState<any[]>([]);
   const [unreadCount, setUnreadCount] = useState(0);
   const [unreadMessages, setUnreadMessages] = useState(0);
   const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
   const notificationsRef = useRef<HTMLDivElement>(null);
   const profileRef = useRef<HTMLDivElement>(null);
   const [isNotificationLoading, setIsNotificationLoading] = useState(false);

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
      const handleScroll = () => setScrolled(window.scrollY > 10);
      window.addEventListener('scroll', handleScroll);

      const fetchDynamicData = async () => {
         try {
            const [prodRes, catRes] = await Promise.all([
               api.get('/products'),
               api.get('/product-categories')
            ]);
            setProducts((prodRes?.data || []) as Product[]);
            setCategories((catRes?.data || []) as Category[]);
         } catch (error) {
            console.error("Erreur de chargement", error);
         } finally {
            setIsLoading(false);
         }
      };

      fetchDynamicData();

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
                console.error("Erreur", error);
             } finally {
                setIsNotificationLoading(false);
             }
          };

          fetchInitialData();
      }

      return () => window.removeEventListener('scroll', handleScroll);
   }, [user]);

   const handleActionClick = (e: React.MouseEvent, action: () => void) => {
      e.preventDefault();
      e.stopPropagation();
      if (!user) {
         router.push('/auth/login');
         return;
      }
      action();
   };

   const uniqueCities = Array.from(new Set(products.map(p => p.store?.city).filter(Boolean))) as string[];

   const filteredProducts = products.filter(p => {
      const matchesCategory = activeCategoryId ? p.categoryId === activeCategoryId : true;
      const matchesCity = activeCity ? p.store?.city === activeCity : true;
      return matchesCategory && matchesCity;
   });

   return (
      <div className="bg-[#fcfbf7] min-h-screen text-manioco-brown font-sans overflow-x-hidden">
         <PublicNavbar activePage="produits" />

         <main className="pt-24">
            {/* Header Banner */}
            <div className="bg-manioco-terracotta text-white py-14 px-8 lg:px-12">
               <div className="max-w-[1400px] mx-auto">
                  <h1 className="text-4xl md:text-[44px] font-medium tracking-tight mb-4">Catalogue des produits issus du Manioc</h1>
                  <p className="text-sm font-medium text-white/90">Produits de producteurs béninois vérifiés — livraison dans tout le Bénin</p>
               </div>
            </div>

            {/* Content Container */}
            <div className="max-w-[1400px] mx-auto px-8 lg:px-12 py-12">
               
               {/* Main Grid area */}
               <div className="w-full">
                  
                  {/* Horizontal Filters & Controls */}
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-10 gap-4">
                     {/* Category Chips */}
                     <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide w-full lg:w-auto">
                        <button 
                           onClick={() => setActiveCategoryId(null)}
                           className={`flex-shrink-0 px-5 py-2.5 rounded-full text-[14px] font-medium transition-all ${!activeCategoryId ? 'bg-manioco-terracotta text-white shadow-md' : 'bg-white text-manioco-brown/70 hover:bg-manioco-terracotta/5 border border-manioco-brown/10 hover:border-manioco-terracotta/20'}`}
                        >
                           Tous les produits
                        </button>
                        {categories.map((cat) => (
                           <button 
                              key={cat.id}
                              onClick={() => setActiveCategoryId(String(cat.id))}
                              className={`flex-shrink-0 px-5 py-2.5 rounded-full text-[14px] font-medium transition-all ${activeCategoryId === String(cat.id) ? 'bg-manioco-terracotta text-white shadow-md' : 'bg-white text-manioco-brown/70 hover:bg-manioco-terracotta/5 border border-manioco-brown/10 hover:border-manioco-terracotta/20'}`}
                           >
                              {cat.name}
                           </button>
                        ))}
                     </div>

                     {/* Dropdowns */}
                     <div className="flex items-center gap-3 self-end lg:self-auto">
                        {uniqueCities.length > 0 && (
                           <div className="relative">
                              <select 
                                 value={activeCity || ''} 
                                 onChange={(e) => setActiveCity(e.target.value || null)}
                                 className="appearance-none bg-white border border-manioco-brown/10 rounded-full pl-5 pr-10 py-2.5 text-[14px] font-medium text-manioco-brown/70 outline-none shadow-sm cursor-pointer hover:border-manioco-terracotta/30 transition-colors focus:ring-2 focus:ring-manioco-terracotta/20"
                              >
                                 <option value="">Toutes les villes</option>
                                 {uniqueCities.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                 ))}
                              </select>
                              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-manioco-brown/40 pointer-events-none" />
                           </div>
                        )}

                        <div className="relative">
                           <select className="appearance-none bg-white border border-manioco-brown/10 rounded-full pl-5 pr-10 py-2.5 text-[14px] font-medium text-manioco-terracotta outline-none shadow-sm cursor-pointer hover:border-manioco-terracotta/30 transition-colors focus:ring-2 focus:ring-manioco-terracotta/20">
                              <option>Les plus populaires</option>
                              <option>Prix croissant</option>
                              <option>Prix décroissant</option>
                           </select>
                           <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-manioco-terracotta pointer-events-none" />
                        </div>
                     </div>
                  </div>

                  {/* Grid */}
                  {isLoading ? (
                     <div className="py-20 flex justify-center w-full">
                        <Loader2 className="w-10 h-10 text-manioco-terracotta animate-spin" />
                     </div>
                  ) : (
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                         {filteredProducts.map((product, i) => {
                             const hasRealRating = product.ratingsCount && product.ratingsCount > 0;
                             const rating = hasRealRating
                                ? Number(product.rating).toFixed(1)
                                : (4.5 + (i % 5) * 0.1).toFixed(1); // Note par défaut élégante
                             return (
                              <div key={product.id} className="bg-white rounded-[20px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all border border-transparent hover:border-manioco-brown/5 flex flex-col h-full group">
                                 <div className="relative h-[220px] p-4 pb-0">
                                    <img src={getRealInternetLink(product)} alt={product.name} className="w-full h-full object-cover rounded-xl group-hover:scale-[1.02] transition-transform duration-500" />
                                     <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm flex items-center gap-1.5 z-10">
                                        <Star size={12} className="fill-[#F4A261] text-[#F4A261]"/>
                                        <span className="text-[11px] font-bold text-manioco-brown">{rating}</span>
                                        {hasRealRating && <span className="text-[9px] text-manioco-brown/40">({product.ratingsCount})</span>}
                                     </div>
                                 </div>
                                 <div className="p-6 pt-5 flex flex-col flex-1">
                                    <h3 className="text-[19px] font-medium text-[#b25a49] mb-2 line-clamp-1">{product.name}</h3>
                                    <p className="text-[13px] text-manioco-brown/50 mb-4 line-clamp-3 leading-relaxed min-h-[60px]">
                                       {product.description || `${product.name} de qualité supérieure, idéal pour accompagner vos repas.`}
                                    </p>
                                    
                                    <div className="mt-auto pt-4 border-t border-manioco-brown/10 flex items-center justify-between">
                                       <div>
                                          <span className="text-[20px] font-bold text-[#b25a49]">{Number(product.price).toLocaleString('fr-FR')} Fcfa</span>
                                          <p className="text-[11px] text-[#b25a49]/40 font-medium mt-0.5">/{product.unit || 'Sachet de 900g'}</p>
                                       </div>
                                       <div className="flex items-center gap-2">
                                          <button
                                             type="button"
                                             id={`fav-btn-${product.id}`}
                                             onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleActionClick(e, () => toggleFavorite(String(product.id))); }}
                                             className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                                                isFavorited(String(product.id))
                                                   ? 'bg-manioco-terracotta/10 text-manioco-terracotta scale-110'
                                                   : 'bg-[#f4f4f4] text-[#b25a49] hover:bg-[#b25a49]/10'
                                             }`}
                                             title={isFavorited(String(product.id)) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                                          >
                                             <Heart
                                                size={16}
                                                className={`transition-all duration-200 ${
                                                   isFavorited(String(product.id))
                                                      ? 'fill-manioco-terracotta text-manioco-terracotta scale-125'
                                                      : ''
                                                }`}
                                             />
                                          </button>
                                          <button onClick={(e) => handleActionClick(e, () => addToCart(product))} className="w-10 h-10 rounded-full bg-[#b25a49] flex items-center justify-center text-white hover:bg-manioco-brown transition-colors shadow-sm">
                                             <Plus size={18} />
                                          </button>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  )}

                  {/* Pagination */}
                  {!isLoading && filteredProducts.length > 0 && (
                     <div className="flex justify-center items-center gap-3 mt-16 mb-4">
                        <button className="w-10 h-10 rounded-full border border-manioco-terracotta/40 flex items-center justify-center text-manioco-terracotta hover:bg-manioco-terracotta/5 transition-colors">
                           <ArrowLeft size={16} />
                        </button>
                        <button className="w-10 h-10 rounded-full bg-manioco-terracotta flex items-center justify-center text-white font-medium text-sm shadow-sm transition-colors">
                           1
                        </button>
                        <button className="w-10 h-10 rounded-full border border-manioco-terracotta/40 flex items-center justify-center text-manioco-terracotta font-medium text-sm hover:bg-manioco-terracotta/5 transition-colors">
                           2
                        </button>
                        <button className="w-10 h-10 rounded-full border border-manioco-terracotta/40 flex items-center justify-center text-manioco-terracotta font-medium text-sm hover:bg-manioco-terracotta/5 transition-colors">
                           3
                        </button>
                        <button className="w-10 h-10 rounded-full bg-manioco-terracotta flex items-center justify-center text-white hover:bg-manioco-brown shadow-sm transition-colors">
                           <ArrowRight size={16} />
                        </button>
                     </div>
                  )}

               </div>
            </div>
         </main>

         {/* FOOTER */}
         <footer className="py-16 border-t border-manioco-brown/5 bg-[#fcfbf7]">
            <div className="max-w-[1400px] mx-auto px-8 lg:px-12 text-center">
               {/* Manioco Logo Large */}
               <div className="flex items-center justify-center gap-1.5 mb-8 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  <span className="text-[40px] font-extrabold tracking-tight text-manioco-terracotta font-sans">Mani</span>
                  <span className="relative inline-flex items-center justify-center w-[30px] h-[30px] rounded-full bg-[#F4A261] border-[4px] border-manioco-terracotta text-manioco-terracotta text-lg font-black group-hover:scale-110 transition-transform">o</span>
                  <span className="text-[40px] font-extrabold tracking-tight text-manioco-terracotta font-sans">c</span>
                  <span className="relative inline-flex items-center justify-center w-[30px] h-[30px] rounded-full bg-[#F4A261] border-[4px] border-manioco-terracotta text-manioco-terracotta text-lg font-black group-hover:scale-110 transition-transform">o</span>
               </div>

               {/* Nav Links */}
               <div className="flex items-center justify-center gap-8 mb-10 text-sm text-manioco-brown/60 font-medium">
                  <Link href="/" className="hover:text-manioco-terracotta transition-colors">Accueil</Link>
                  <Link href="/produits" className="hover:text-manioco-terracotta transition-colors">Nos produits</Link>
                  <Link href="/shops" className="hover:text-manioco-terracotta transition-colors">Vendeurs</Link>
               </div>

               {/* Social Icons */}
               <div className="flex items-center justify-center gap-4 mb-12">
                  {['facebook', 'twitter', 'instagram'].map((social) => (
                     <a key={social} href="#" className="w-[42px] h-[42px] rounded-full border border-manioco-terracotta/60 flex items-center justify-center text-manioco-terracotta hover:bg-manioco-terracotta hover:text-white transition-all">
                        {social === 'facebook' && (
                           <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        )}
                        {social === 'twitter' && (
                           <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                        )}
                        {social === 'instagram' && (
                           <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z"/></svg>
                        )}
                     </a>
                  ))}
               </div>

               <div className="w-[80%] mx-auto h-px bg-manioco-brown/5 mb-8"></div>

               <p className="text-[13px] text-manioco-brown/50 font-medium">
                  © 2026Manioco. Tout droits réservés
               </p>
            </div>
         </footer>
      </div>
   );
}
