"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ChevronLeft, Store, Package, Star, MapPin, ShoppingCart, Loader2, ArrowRight, PackageCheck, User, Search, ShieldCheck, Plus } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useCart } from '@/context/CartContext';
import CartSidebar from '@/app/components/CartSidebar';

export default function ShopDetail() {
   const params = useParams();
   const { addToCart, itemCount } = useCart();
   const [isCartOpen, setIsCartOpen] = useState(false);
   const [store, setStore] = useState<any>(null);
   const [products, setProducts] = useState<any[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [scrolled, setScrolled] = useState(false);

   useEffect(() => {
      const handleScroll = () => setScrolled(window.scrollY > 50);
      window.addEventListener('scroll', handleScroll);

      const fetchShopData = async () => {
         try {
            const [storeRes, productsRes] = await Promise.all([
               api.get(`/stores/${params.id}`),
               api.get(`/products?storeId=${params.id}`)
            ]);
            setStore(storeRes.data);
            setProducts(productsRes.data || []);
         } catch (error) {
            console.error("Erreur chargement boutique", error);
         } finally {
            setIsLoading(false);
         }
      };
      if (params.id) fetchShopData();
      return () => window.removeEventListener('scroll', handleScroll);
   }, [params.id]);

   if (isLoading) {
      return (
         <div className="min-h-screen bg-luxury-cream flex flex-col items-center justify-center gap-6">
            <Loader2 className="w-12 h-12 text-forest-night animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-forest-night/20">Accès au Terroir...</p>
         </div>
      );
   }

   if (!store) return (
      <div className="min-h-screen bg-luxury-cream flex flex-col items-center justify-center text-center p-20">
         <h3 className="text-4xl font-black mb-6 uppercase italic tracking-tighter">Boutique éphémère</h3>
         <p className="opacity-40 font-bold mb-10">Ce producteur n&apos;est pas disponible pour le moment.</p>
         <Link href="/dashboard/client" className="text-afrigari-gold font-black uppercase tracking-widest underline italic">Retour au marché</Link>
      </div>
   );

   return (
      <div className="bg-luxury-cream min-h-screen text-forest-night selection:bg-afrigari-gold pb-32 font-sans">

         {/* 1. Header & Navigation (Luxury Header) */}
         <nav className={`fixed top-0 left-0 right-0 z-[200] transition-all duration-700 px-8 ${scrolled ? 'py-4' : 'py-10'}`}>
            <div className={`max-w-7xl mx-auto flex justify-between items-center px-10 py-6 transition-all duration-500 ${scrolled ? 'bg-white/90 backdrop-blur-xl rounded-[32px] px-12 border border-forest-night/5 shadow-[0_20px_50px_rgba(10,33,24,0.1)]' : ''}`}>
               <div className="flex items-center gap-12">
                  <Link href="/dashboard/client" className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-forest-night flex items-center justify-center text-afrigari-gold shadow-lg">
                        <ChevronLeft size={20} />
                     </div>
                     <span className="font-black text-2xl tracking-tighter uppercase italic">RETOUR</span>
                  </Link>
               </div>

               <div className="flex items-center gap-10">
                  <div className="relative cursor-pointer group" onClick={() => setIsCartOpen(true)}>
                     <ShoppingCart size={22} className="text-forest-night group-hover:text-afrigari-gold transition-colors" />
                     <span className="absolute -top-3 -right-3 w-5 h-5 bg-afrigari-gold text-forest-night text-[10px] flex items-center justify-center rounded-full font-black shadow-lg">{itemCount}</span>
                  </div>
                  <button className="w-12 h-12 rounded-2xl bg-forest-night text-white shadow-xl flex items-center justify-center border-2 border-afrigari-gold/20">
                     <User size={24} className="text-afrigari-gold" />
                  </button>
               </div>
            </div>
         </nav>

         {/* 2. Cover Section */}
         <div className="h-[45vh] relative overflow-hidden bg-forest-night">
            <img
               src={store.coverImage || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200"}
               className="w-full h-full object-cover opacity-30 scale-105"
               alt={store.name}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-luxury-cream to-transparent"></div>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <h2 className="text-[12rem] font-black text-white/5 uppercase tracking-tighter select-none">BOUTIQUE</h2>
            </div>
         </div>

         <main className="max-w-7xl mx-auto px-8">
            {/* 3. Shop Identity Card */}
            <div className="relative -mt-32 z-20 flex flex-col md:flex-row items-end gap-12 mb-24">
               <div className="w-56 h-56 bg-white p-6 rounded-[64px] shadow-2xl ring-[16px] ring-luxury-cream flex items-center justify-center overflow-hidden border border-forest-night/5">
                  {store.logo ? (
                     <img src={store.logo} className="w-full h-full object-contain rounded-[40px]" alt={`${store.name} logo`} />
                  ) : (
                     <Store size={80} className="text-forest-night/10" />
                  )}
               </div>
               <div className="flex-1 pb-6">
                  <div className="flex items-center gap-6 mb-4">
                     <h1 className="text-6xl font-black tracking-tighter uppercase italic text-forest-night">{store.name}</h1>
                     <div className="bg-forest-night text-white px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                        <ShieldCheck size={14} className="text-afrigari-gold" /> Certifié
                     </div>
                  </div>
                  <div className="flex items-center gap-10 text-[11px] font-black uppercase tracking-[0.3em] text-forest-night/40 italic">
                     <div className="flex items-center gap-3"><MapPin size={18} className="text-afrigari-gold" /> {store.city || 'COTONOU'}, BÉNIN</div>
                     <div className="flex items-center gap-3"><Package size={18} className="text-afrigari-gold" /> {products.length} RÉFÉRENCES</div>
                     <div className="flex items-center gap-3"><Star size={18} className="text-afrigari-gold" fill="currentColor" /> EXCELLENCE 4.9</div>
                  </div>
               </div>
               <button className="bg-forest-night text-white px-12 py-6 rounded-[28px] font-black text-xs uppercase tracking-[0.3em] hover:bg-afrigari-gold hover:text-forest-night transition-all shadow-2xl flex items-center gap-4 mb-6 group active:scale-95">
                  Contacter l&apos;Artisan <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
               </button>
            </div>

            {/* 4. Products Listing */}
            <section className="mb-40">
               <div className="flex items-center gap-10 mb-16">
                  <h3 className="text-4xl font-black tracking-tighter uppercase italic">Sa Sélection <span className="text-afrigari-gold">Privée</span></h3>
                  <div className="h-px bg-forest-night/5 flex-1"></div>
               </div>

               {products.length === 0 ? (
                  <div className="bg-white rounded-[48px] p-24 text-center border border-forest-night/5 shadow-xl">
                     <p className="text-lg font-bold text-forest-night/20 italic">Aucun trésor disponible dans cette boutique pour le moment.</p>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                     {products.map((p) => (
                        <div key={p.id} className="group animate-reveal">
                           <div className="relative aspect-[4/5] rounded-[56px] overflow-hidden mb-8 shadow-2xl ring-1 ring-forest-night/5 group-hover:-translate-y-4 transition-all duration-700">
                              <img src={p.image || "https://images.unsplash.com/photo-1549439602-43ebcb232811?auto=format&fit=crop&q=80&w=400"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s]" alt={p.name} />
                              <div className="absolute inset-0 bg-gradient-to-t from-forest-night/60 to-transparent"></div>
                              <button
                                 onClick={() => addToCart({ ...p, store })}
                                 className="absolute bottom-8 right-8 w-14 h-14 bg-white text-forest-night rounded-full flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 active:scale-95"
                              >
                                 <Plus size={24} />
                              </button>
                           </div>
                           <p className="text-[9px] font-black text-afrigari-gold uppercase tracking-[0.4em] mb-2 italic">{p.unit || 'Standard'}</p>
                           <h4 className="text-2xl font-black mb-4 tracking-tighter uppercase text-forest-night">{p.name}</h4>
                           <div className="flex justify-between items-center p-2 rounded-3xl border border-forest-night/5 group-hover:border-afrigari-gold/20 transition-all">
                              <span className="text-xl font-black text-forest-night ml-4">{(Number(p.price)).toLocaleString()} F</span>
                              <div className="w-12 h-12 rounded-2xl bg-forest-night flex items-center justify-center text-white shadow-lg group-hover:bg-afrigari-gold group-hover:text-forest-night transition-colors">
                                 <ShoppingCart size={18} />
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </section>

            <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
         </main>
      </div>
   );
}
