"use client";
import { Search, ArrowRight, Star, ShoppingBag, ChevronLeft, Loader2, Leaf } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useAuth } from '@/features/auth/AuthContext';
import { secureRandom } from '@/lib/utils';

export default function PublicShopsPage() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const getRealInternetLink = (dbPath: string, name: string = "") => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    if (!dbPath || dbPath === 'null') {
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

        const enrichedStores = storesData.map((store: any) => ({
          ...store,
          productsCount: productsData.filter((p: any) => p.storeId === store.id).length,
          sales: Math.floor(secureRandom() * 50) + 1
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
    <div className="bg-[#fcfbf7] min-h-screen text-[#1a2e22] selection:bg-[#c5a059] selection:text-white pb-32">
      
      {/* Premium Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-[200] transition-all duration-1000 px-8 ${scrolled ? 'py-4' : 'py-12'}`}>
         <div className={`max-w-[1400px] mx-auto flex justify-between items-center px-12 py-6 transition-all duration-700 ${scrolled ? 'bg-white/80 backdrop-blur-2xl rounded-full shadow-[0_20px_50px_rgba(26,46,34,0.1)] border border-white' : ''}`}>
            <div className="flex items-center gap-12">
                <Link href="/" className="w-12 h-12 rounded-2xl bg-[#1a2e22]/5 flex items-center justify-center hover:bg-[#1a2e22] hover:text-[#c5a059] transition-all group">
                    <ChevronLeft size={20} />
                </Link>
                <Link href="/" className="flex items-center gap-3 group">
                   <div className="w-10 h-10 rounded-xl bg-[#1a2e22] flex items-center justify-center text-[#c5a059] rotate-3 group-hover:rotate-12 transition-transform shadow-lg">
                      <Leaf size={20} />
                   </div>
                   <span className="font-black text-3xl tracking-[-0.05em] uppercase font-serif italic text-[#1a2e22]">AFRIGARI</span>
                </Link>
            </div>
            
            <div className="hidden md:flex bg-[#1a2e22]/5 rounded-full px-8 py-3.5 items-center gap-4 border border-[#1a2e22]/5 w-[500px]">
                <Search size={18} className="text-[#1a2e22]/20" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un artisan, une boutique..." 
                  className="bg-transparent border-none text-[11px] font-black outline-none w-full placeholder:text-[#1a2e22]/30 tracking-widest uppercase" 
                />
            </div>

            <div className="flex items-center gap-4">
                {user ? (
                   <div className="w-12 h-12 rounded-full bg-[#1a2e22] text-[#c5a059] flex items-center justify-center font-black text-sm shadow-xl uppercase overflow-hidden border-2 border-white">
                      {user?.profilePhoto ? (
                         <img src={getRealInternetLink(user.profilePhoto)} className="w-full h-full object-cover" />
                      ) : (
                         <span>{user?.name?.[0] || 'U'}</span>
                      )}
                   </div>
                ) : (
                   <Link href="/auth/login" className="bg-[#1a2e22] text-[#c5a059] px-8 py-3.5 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-[#c5a059] hover:text-[#1a2e22] transition-all shadow-xl">
                      Connexion
                   </Link>
                )}
            </div>
         </div>
      </nav>

      <main className="max-w-[1400px] mx-auto pt-56 px-12">
        
        {/* Header Section */}
        <header className="mb-32 animate-reveal">
           <div className="flex items-center gap-4 mb-8">
              <span className="w-12 h-[2px] bg-[#c5a059]"></span>
              <p className="text-[#c5a059] font-black uppercase tracking-[0.5em] text-[11px]">Nos Maîtres Artisans</p>
           </div>
           <h1 className="text-8xl font-black tracking-tighter leading-[0.85] mb-10 text-[#1a2e22]">
              L&apos;élite des <br/> 
              <span className="text-[#c5a059] font-serif italic font-normal lowercase tracking-normal">producteurs</span> Afrigari.
           </h1>
           <p className="text-lg text-[#1a2e22]/50 max-w-2xl font-medium leading-relaxed">
              Découvrez les créateurs, artisans et marchands qui font battre le cœur du Bénin. Chaque boutique a une histoire, un savoir-faire et une promesse d&apos;exception.
           </p>
        </header>

        {/* Featured Shops Grid */}
        {isLoading ? (
           <div className="py-40 flex flex-col items-center justify-center gap-8 w-full bg-white/50 rounded-[80px] border-2 border-dashed border-[#1a2e22]/10">
              <Loader2 size={48} className="animate-spin text-[#c5a059]" />
              <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#1a2e22]/40">Chargement des comptoirs...</p>
           </div>
        ) : filteredStores.length === 0 ? (
           <div className="py-40 text-center w-full bg-white/50 rounded-[80px] border-2 border-dashed border-[#1a2e22]/10">
              <p className="text-xs font-black uppercase tracking-widest text-[#1a2e22]/40">Aucune boutique trouvée</p>
           </div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
              {filteredStores.map((shop, i) => (
                 <ShopCard key={shop.id} shop={shop} delay={`${i * 0.1}s`} getImageUrl={(path: string, name: string) => getRealInternetLink(path, name)} />
              ))}
           </div>
        )}

        {/* Call to Action */}
        {!user && (
           <section className="mt-60 p-24 bg-[#1a2e22] rounded-[80px] text-white relative overflow-hidden shadow-3xl">
              <div className="relative z-10 max-w-2xl">
                 <h4 className="text-5xl font-black mb-10 tracking-tight leading-none">Vous êtes un <br/> <span className="text-[#c5a059]">Producteur</span> d&apos;exception ?</h4>
                 <p className="text-white/60 mb-12 font-medium text-lg leading-relaxed">Rejoignez notre réseau d&apos;élite et commencez à vendre vos produits transformés à une clientèle exigeante.</p>
                 <Link href="/auth/register" className="bg-[#c5a059] text-[#1a2e22] px-12 py-6 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-2xl inline-block">
                    Ouvrir ma boutique
                 </Link>
              </div>
              <ShoppingBag size={400} className="absolute right-[-100px] bottom-[-150px] text-white/5 rotate-12" />
           </section>
        )}
      </main>

    </div>
  );
}

function ShopCard({ shop, delay, getImageUrl }: any) {
    return (
        <div className="group bg-white rounded-[60px] overflow-hidden border border-[#1a2e22]/5 shadow-[0_30px_100px_rgba(26,46,34,0.05)] hover:shadow-[0_50px_120px_-20px_rgba(26,46,34,0.15)] hover:-translate-y-4 transition-all duration-1000 animate-reveal" style={{ animationDelay: delay }}>
           {/* Cover Photo */}
           <div className="h-56 relative overflow-hidden bg-slate-100">
              <img src={getImageUrl(shop.profilePhoto, shop.name)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[4s]" />
              <div className="absolute inset-0 bg-[#1a2e22]/20 group-hover:bg-transparent transition-colors duration-1000"></div>
              <div className="absolute top-8 right-8 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-black uppercase text-[#1a2e22] flex items-center gap-2 shadow-xl">
                 <Star size={12} fill="#c5a059" className="text-[#c5a059]" /> {shop.rating || '4.9'}
              </div>
           </div>

           {/* Profile Content */}
           <div className="px-10 pb-12 relative">
              {/* Profile Logo */}
              <div className="w-24 h-24 bg-white p-3 rounded-[32px] shadow-2xl absolute -top-12 left-10 ring-8 ring-white overflow-hidden flex items-center justify-center text-[#1a2e22] font-black text-3xl uppercase">
                 {shop.profilePhoto ? (
                    <img src={getImageUrl(shop.profilePhoto, shop.name)} className="w-full h-full object-contain rounded-2xl" />
                 ) : (
                    <span>{shop.name[0]}</span>
                 )}
              </div>

              <div className="pt-16">
                 <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-2xl font-black tracking-tight uppercase truncate">{shop.name}</h3>
                    {shop.verified !== false && <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-lg"><CheckIcon size={12} color="white" /></div>}
                 </div>
                 <p className="text-[10px] font-black text-[#c5a059] uppercase tracking-[0.4em] mb-6">{shop.city || "Bénin"}</p>
                 <p className="text-sm text-[#1a2e22]/50 font-medium line-clamp-2 leading-relaxed mb-10 h-10">{shop.description || "Découvrez une sélection unique de produits d'exception, authentiques et traçables."}</p>
                 
                 <div className="flex items-center justify-between pt-8 border-t border-[#1a2e22]/5">
                    <div className="flex gap-8">
                       <div className="text-left">
                          <p className="text-lg font-black text-[#1a2e22]">{shop.productsCount}</p>
                          <p className="text-[9px] font-black text-[#1a2e22]/20 uppercase tracking-widest">Produits</p>
                       </div>
                       <div className="text-left">
                          <p className="text-lg font-black text-[#1a2e22]">{shop.sales}</p>
                          <p className="text-[9px] font-black text-[#1a2e22]/20 uppercase tracking-widest">Ventes</p>
                       </div>
                    </div>
                    <Link href={`/shops/${shop.id}`} className="w-14 h-14 rounded-2xl bg-[#1a2e22] text-[#c5a059] flex items-center justify-center hover:bg-[#c5a059] hover:text-white transition-all shadow-2xl group-hover:rotate-45 transition-transform duration-700">
                       <ArrowRight size={24} />
                    </Link>
                 </div>
              </div>
           </div>
        </div>
    );
}

const CheckIcon = ({ size, color }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>;
