"use client";
import { Search, ArrowRight, Star, MapPin, ShoppingBag, Heart, MoreHorizontal, ChevronLeft, Store as StoreIcon, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useAuth } from '@/features/auth/AuthContext';
import { secureRandom } from '@/lib/utils';

export default function ShopsExplorer() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const getRealInternetLink = (dbPath: string, name: string = "") => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    if (!dbPath) {
      if (name.toLowerCase().includes('gari')) return "https://images.unsplash.com/photo-1549439602-43ebcb232811?auto=format&fit=crop&q=80&w=800";
      return "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&q=80&w=800";
    }

    if (dbPath.startsWith('data:image') || dbPath.startsWith('http')) {
       return dbPath;
    }

    const cleanPath = dbPath.startsWith('/') ? dbPath : `/${dbPath}`;
    const finalPath = cleanPath.startsWith('/uploads') ? cleanPath : `/uploads${cleanPath}`;
    return `${apiUrl}${finalPath}`;
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    const fetchStoresData = async () => {
      try {
        const [storesRes, productsRes] = await Promise.all([
          api.get('/stores'),
          api.get('/products')
        ]);

        const storesData = storesRes.data || [];
        const productsData = productsRes.data || [];

        // Enrichir les boutiques avec le nombre de produits réels
        const enrichedStores = storesData.map((store: any) => ({
          ...store,
          productsCount: productsData.filter((p: any) => p.storeId === store.id).length,
          sales: Math.floor(secureRandom() * 50) + 1 // Mock sales as they might not be in the store entity
        }));

        setStores(enrichedStores);
      } catch (error) {
        console.error("Erreur de chargement des boutiques", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoresData();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredStores = stores.filter(shop => 
    shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (shop.description && shop.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="bg-organic-cream min-h-screen text-forest-green selection:bg-afrigari-gold selection:text-white pb-32">
      
      {/* Premium Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-[200] transition-all duration-500 px-8 ${scrolled ? 'py-4' : 'py-8'}`}>
         <div className={`max-w-7xl mx-auto flex justify-between items-center px-10 py-5 transition-all duration-500 ${scrolled ? 'glass-premium rounded-full px-12' : ''}`}>
            <div className="flex items-center gap-6">
                <Link href="/dashboard/client" className="w-10 h-10 rounded-full border border-forest-green/10 flex items-center justify-center hover:bg-forest-green hover:text-white transition-all">
                    <ChevronLeft size={20} />
                </Link>
                <div className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-forest-green flex items-center justify-center text-white scale-110 group-hover:rotate-12 transition-transform">
                       <ShoppingBag size={16} />
                    </div>
                    <span className="font-black text-xl tracking-tighter uppercase font-display italic">AFRIGARI</span>
                    <span className="text-[10px] font-black text-afrigari-gold bg-afrigari-gold/5 px-2 py-1 rounded-md uppercase tracking-widest ml-2">Annuaire</span>
                </div>
            </div>
            
            <div className="flex bg-forest-green/5 rounded-full px-5 py-2.5 items-center gap-3 border border-forest-green/5 w-96">
                <Search size={16} className="text-forest-green/40" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un artisan, une boutique..." 
                  className="bg-transparent border-none text-[10px] font-black outline-none w-full placeholder:text-forest-green/30 tracking-widest uppercase" 
                />
            </div>

            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-forest-green text-white flex items-center justify-center font-black text-xs shadow-xl uppercase overflow-hidden relative border-2 border-white">
                   <UserAvatar user={user} getImageUrl={getRealInternetLink} />
                </div>
            </div>
         </div>
      </nav>

      <main className="max-w-7xl mx-auto pt-40 px-8">
        
        {/* Header Section */}
        <header className="mb-20 animate-reveal">
           <p className="text-afrigari-gold font-black uppercase tracking-[0.5em] text-[10px] mb-4">Nos Partenaires</p>
           <h1 className="text-6xl font-black tracking-tighter leading-none mb-6">L'excellence des <br/> <span className="text-afrigari-gold">Boutiques</span> Afrigari.</h1>
           <p className="text-sm text-forest-green/50 max-w-xl font-bold leading-relaxed">Découvrez les créateurs, artisans et marchands qui font battre le cœur de l'Afrique. Chaque boutique a une histoire, un savoir-faire et une promesse d'exception.</p>
        </header>

        {/* Featured Shops Grid */}
        {isLoading ? (
           <div className="py-20 flex flex-col items-center justify-center gap-4 w-full bg-white/50 rounded-[64px] border-2 border-dashed border-forest-green/10">
              <Loader2 size={40} className="animate-spin text-forest-green" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-forest-green/40">Ouverture des comptoirs...</p>
           </div>
        ) : filteredStores.length === 0 ? (
           <div className="py-20 text-center w-full bg-white/50 rounded-[64px] border-2 border-dashed border-forest-green/10">
              <p className="text-xs font-black uppercase tracking-widest text-forest-green/40">Aucune boutique trouvée</p>
           </div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredStores.map((shop, i) => (
                 <ShopCard key={shop.id} shop={shop} delay={`${i * 0.1}s`} getImageUrl={(path: string, name: string) => getRealInternetLink(path, name)} />
              ))}
           </div>
        )}

        {/* Categories of Shops Toggle */}
        <section className="mt-32 p-16 bg-forest-green rounded-[64px] text-white relative overflow-hidden shadow-2xl">
           <div className="relative z-10">
              <h4 className="text-3xl font-black mb-10 tracking-tight">Devenir un Partenaire d'Exception ?</h4>
              <p className="text-white/60 mb-10 max-w-md font-bold text-sm">Vous êtes artisan ou créateur ? Ouvrez votre propre boutique sur Afrigari et rejoignez la communauté d'élite de l'art Africain.</p>
              <Link href="/dashboard/seller" className="bg-afrigari-gold text-white px-10 py-5 rounded-full font-black text-[11px] uppercase tracking-widest hover:bg-white hover:text-forest-green transition-all shadow-2xl inline-block">
                 Ouvrir ma boutique
              </Link>
           </div>
           <ShoppingBag size={200} className="absolute right-[-20px] bottom-[-40px] text-white/5 rotate-12" />
        </section>
      </main>

    </div>
  );
}

function ShopCard({ shop, delay, getImageUrl }: any) {
    return (
        <div className="group bg-white rounded-[48px] overflow-hidden border border-forest-green/5 shadow-[0_20px_50px_rgba(45,70,53,0.05)] hover:shadow-[0_40px_80px_-15px_rgba(45,70,53,0.15)] hover:-translate-y-2 transition-all duration-700 animate-reveal" style={{ animationDelay: delay }}>
           {/* Cover Photo */}
           <div className="h-44 relative overflow-hidden bg-slate-100">
              <img src={getImageUrl(shop.profilePhoto, shop.name)} alt={shop.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" />
              <div className="absolute inset-0 bg-forest-green/20 group-hover:bg-transparent transition-colors"></div>
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[9px] font-black uppercase text-forest-green flex items-center gap-1 shadow-sm">
                 <Star size={10} fill="#C5A059" className="text-afrigari-gold" /> {shop.rating || '4.9'}
              </div>
           </div>

           {/* Profile Content */}
           <div className="px-8 pb-10 relative">
              {/* Profile Logo */}
              <div className="w-20 h-20 bg-white p-2 rounded-3xl shadow-xl absolute -top-10 left-8 ring-4 ring-white overflow-hidden flex items-center justify-center text-forest-green font-black text-2xl uppercase">
                 <ShopLogo shop={shop} getImageUrl={getImageUrl} />
              </div>
              <div className="pt-14">
                 <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-black tracking-tight uppercase truncate">{shop.name}</h3>
                    {shop.verified !== false && <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center"><CheckIcon size={10} color="white" /></div>}
                 </div>
                 <p className="text-[10px] font-black text-afrigari-gold uppercase tracking-[0.3em] mb-4">{shop.category || "Vendeur Certifié"}</p>
                 <p className="text-xs text-forest-green/50 font-bold line-clamp-2 leading-relaxed mb-8 h-8">{shop.description || "Découvrez une sélection unique de produits d'exception, authentiques et traçables."}</p>
                 
                 <div className="flex items-center justify-between pt-6 border-t border-forest-green/5">
                    <div className="flex gap-4">
                       <div className="text-left">
                          <p className="text-sm font-black">{shop.productsCount}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Produits</p>
                       </div>
                       <div className="text-left">
                          <p className="text-sm font-black">{shop.sales}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ventes</p>
                       </div>
                    </div>
                    <Link href={`/dashboard/client/shops/${shop.id}`} className="w-12 h-12 rounded-full bg-forest-green text-white flex items-center justify-center hover:bg-afrigari-gold transition-colors shadow-lg shadow-forest-green/20 group-hover:rotate-45 transition-transform duration-500">
                       <ArrowRight size={20} />
                    </Link>
                 </div>
              </div>
           </div>
        </div>
    );
}

function UserAvatar({ user, getImageUrl }: { readonly user: any, readonly getImageUrl: any }) {
    if (user?.profilePhoto) {
        return <img src={getImageUrl(user.profilePhoto)} alt="Profil" className="w-full h-full object-cover" />;
    }
    return <span>{user?.name?.[0] || user?.email?.[0] || 'U'}</span>;
}

function ShopLogo({ shop, getImageUrl }: { readonly shop: any, readonly getImageUrl: any }) {
    if (shop.profilePhoto) {
        return <img src={getImageUrl(shop.profilePhoto, shop.name)} alt={`Logo ${shop.name}`} className="w-full h-full object-contain rounded-2xl" />;
    }
    return <span>{shop.name[0]}</span>;
}

const CheckIcon = ({ size, color }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>;
