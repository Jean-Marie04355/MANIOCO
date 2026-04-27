"use client";
import { Search, ArrowRight, Star, MapPin, ShoppingBag, Heart, MoreHorizontal, ChevronLeft, Loader2, CheckCircle, PackageCheck, User, Store } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import api from '@/lib/axios';

export default function ShopsExplorer() {
  const [stores, setStores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const { itemCount } = useCart();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    const fetchStores = async () => {
      try {
        const res = await api.get('/stores');
        setStores(res.data);
      } catch (error) {
        console.error("Erreur chargement boutiques", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStores();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredStores = stores.filter(s => 
    (s.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-luxury-cream min-h-screen text-forest-night selection:bg-afrigari-gold selection:text-forest-night pb-32 font-sans">
      
      {/* 1. Header & Navigation (Luxury Header) */}
      <nav className={`fixed top-0 left-0 right-0 z-[200] transition-all duration-700 px-8 ${scrolled ? 'py-4' : 'py-10'}`}>
         <div className={`max-w-7xl mx-auto flex justify-between items-center px-10 py-6 transition-all duration-500 ${scrolled ? 'bg-white/90 backdrop-blur-xl rounded-[32px] px-12 border border-forest-night/5 shadow-[0_20px_50px_rgba(10,33,24,0.1)]' : ''}`}>
            <div className="flex items-center gap-12">
               <Link href="/dashboard/client" className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-xl bg-forest-night flex items-center justify-center text-afrigari-gold scale-110 shadow-lg group-hover:rotate-12 transition-transform">
                     <PackageCheck size={20} />
                  </div>
                  <span className="font-black text-3xl tracking-tighter uppercase font-display italic text-forest-night">AFRIGARI</span>
               </Link>
            </div>

            <div className="flex items-center gap-10">
                <div className="flex bg-forest-night/5 rounded-full px-6 py-3 items-center gap-4 border border-forest-night/5 w-96 group focus-within:w-[500px] transition-all duration-700">
                    <Search size={18} className="text-forest-night/20 group-focus-within:text-afrigari-gold transition-colors" />
                    <input 
                      type="text" 
                      placeholder="RECHERCHER UN ARTISAN..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-none text-[10px] font-black outline-none w-full placeholder:text-forest-night/20 tracking-widest text-forest-night" 
                    />
                </div>
                <div className="flex items-center gap-6">
                  <Link href="/dashboard/client" className="text-[10px] font-black uppercase tracking-widest hover:text-afrigari-gold transition-colors">Boutique</Link>
                  <button className="w-12 h-12 rounded-2xl bg-forest-night text-white shadow-xl flex items-center justify-center border-2 border-afrigari-gold/20">
                     <User size={24} className="text-afrigari-gold" />
                  </button>
                </div>
            </div>
         </div>
      </nav>

      <main className="max-w-7xl mx-auto pt-48 px-8">
        
        {/* Header Section */}
        <header className="mb-24 animate-reveal">
           <div className="inline-flex items-center gap-4 py-2 px-4 bg-forest-night/5 rounded-full mb-8">
              <div className="w-2 h-2 rounded-full bg-afrigari-gold animate-pulse"></div>
              <p className="text-forest-night font-black uppercase tracking-[0.5em] text-[9px]">L&apos;Annuaire des Producteurs Certifiés</p>
           </div>
           <h1 className="text-8xl font-black tracking-tighter leading-[0.9] mb-10 italic uppercase">Découvrez <br/> <span className="text-afrigari-gold">Les Terroirs</span> Afrigari.</h1>
           <p className="text-lg text-forest-night/40 max-w-xl font-bold leading-relaxed italic border-l-4 border-afrigari-gold pl-8">Parcourez le continent à travers le savoir-faire de nos artisans partenaires. Chaque boutique est un voyage culinaire unique.</p>
        </header>

         {/* Shops Grid */}
         {isLoading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-6 opacity-20">
               <Loader2 className="w-12 h-12 text-forest-night animate-spin" />
               <p className="text-[10px] font-black uppercase tracking-[0.4em]">Exploration des territoires...</p>
            </div>
         ) : filteredStores.length === 0 ? (
            <div className="bg-white rounded-[64px] p-24 text-center border border-forest-night/5 shadow-xl animate-reveal">
               <p className="text-2xl font-black text-forest-night/20 italic">Aucun artisan ne correspond à votre recherche.</p>
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
               {filteredStores.map((shop, i) => (
                  <ShopCard key={shop.id} shop={shop} delay={`${i * 0.1}s`} />
               ))}
            </div>
         )}

        {/* Categories Section */}
        <section className="mt-40 bg-forest-night rounded-[64px] px-20 py-24 text-white overflow-hidden relative shadow-[0_60px_120px_-30px_rgba(45,70,53,0.3)]">
           <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-20 relative z-10">
              <div>
                 <h4 className="text-6xl font-black mb-10 tracking-tighter italic leading-none">Devenir un <br/> <span className="text-afrigari-gold">Partenaire</span> <br/> D&apos;Élite ?</h4>
                 <p className="text-white/40 mb-12 max-w-sm font-bold text-sm leading-relaxed">Rejoignez la première marketplace premium dédiée aux meilleurs produits agro-alimentaires du continent.</p>
                 <button className="bg-afrigari-gold text-forest-night px-12 py-6 rounded-[24px] font-black text-[11px] uppercase tracking-[0.3em] hover:bg-white transition-all shadow-2xl flex items-center gap-4 group">
                    Ouvrir ma boutique <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                 </button>
              </div>
              <div className="flex justify-center">
                 <div className="w-80 h-80 bg-white/5 rounded-full flex items-center justify-center animate-slow-bounce">
                    <Store size={150} className="text-white/10" />
                 </div>
              </div>
           </div>
           <span className="absolute bottom-[-100px] left-[-100px] text-[20rem] font-black opacity-[0.03] pointer-events-none select-none tracking-tighter">ELITE</span>
        </section>
      </main>

    </div>
  );
}

function ShopCard({ shop, delay }: any) {
    return (
        <Link href={`/dashboard/client/shops/${shop.id}`} className="group bg-white rounded-[56px] overflow-hidden border border-forest-night/5 shadow-xl hover:shadow-[0_50px_100px_rgba(10,33,24,0.1)] hover:-translate-y-4 transition-all duration-700 animate-reveal block" style={{ animationDelay: delay }}>
           {/* Cover Photo */}
           <div className="h-48 relative overflow-hidden bg-forest-night/5">
              <img src={shop.coverImage || "https://images.unsplash.com/photo-1549439602-43ebcb232811?auto=format&fit=crop&q=80&w=600"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s]" alt={shop.name} />
              <div className="absolute inset-0 bg-forest-night/40 group-hover:bg-forest-night/10 transition-colors"></div>
           </div>

           {/* Profile Content */}
           <div className="px-10 pb-12 relative">
              {/* Profile Logo */}
              <div className="w-24 h-24 bg-white p-4 rounded-[32px] shadow-2xl absolute -top-12 left-10 ring-[8px] ring-white flex items-center justify-center overflow-hidden border border-forest-night/5">
                 {shop.logo ? (
                    <img src={shop.logo} className="w-full h-full object-contain rounded-2xl" alt={`${shop.name} logo`} />
                 ) : (
                    <Store size={40} className="text-forest-night/10" />
                 )}
              </div>

              <div className="pt-16">
                 <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-black tracking-tighter uppercase italic text-forest-night">{shop.name}</h3>
                    {shop.isVerified && <CheckCircle size={18} className="text-blue-500" fill="currentColor" />}
                 </div>
                 <p className="text-[10px] font-black text-afrigari-gold uppercase tracking-[0.4em] mb-4 italic">{shop.city || 'Bénin'}, Afrique</p>
                 <p className="text-xs text-forest-night/40 font-bold line-clamp-2 leading-relaxed mb-8">{shop.description || "Un artisan sélectionné pour son engagement envers l'excellence du terroir."}</p>
                 
                 <div className="flex items-center justify-between pt-8 border-t border-forest-night/5">
                    <div className="flex items-center gap-6">
                       <div className="flex items-center gap-2 text-forest-night">
                          <PackageCheck size={18} className="text-afrigari-gold" />
                          <span className="text-sm font-black">{shop.productsCount || 0}</span>
                       </div>
                       <div className="flex items-center gap-2 text-forest-night">
                          <Star size={18} className="text-afrigari-gold" fill="currentColor" />
                          <span className="text-sm font-black">4.9</span>
                       </div>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-forest-night text-white flex items-center justify-center hover:bg-afrigari-gold hover:text-forest-night transition-all shadow-xl group-hover:rotate-12 duration-500">
                       <ArrowRight size={24} />
                    </div>
                 </div>
              </div>
           </div>
        </Link>
    );
}
