"use client";
import { Search, ArrowRight, Star, MapPin, ShoppingBag, Heart, MoreHorizontal, ChevronLeft, Loader2, CheckCircle, PackageCheck, User, Store, ArrowLeft } from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import api from '@/lib/axios';
import { useAuth } from '@/features/auth/AuthContext';
import { useSearchParams } from 'next/navigation';

function ShopsExplorerContent() {
  const searchParams = useSearchParams();
  const filterNearby = searchParams.get('filter') === 'nearby';
  const { user } = useAuth();
  const [stores, setStores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const { itemCount } = useCart();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    const fetchStores = async (lat?: number, lng?: number) => {
      try {
        let url = '/stores';
        if (lat && lng) {
          url = `/stores/nearby?lat=${lat}&lng=${lng}&radius=5000`;
        }
        const res = await api.get(url);
        setStores(res.data);
      } catch (error) {
        console.error("Erreur chargement boutiques", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          fetchStores(loc.lat, loc.lng);
        },
        () => fetchStores()
      );
    } else {
      fetchStores();
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredStores = stores.filter(s => 
    (s.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-luxury-cream min-h-screen text-forest-night selection:bg-afrigari-gold selection:text-forest-night pb-32 font-sans">
      
      <nav className={`fixed top-0 left-0 right-0 z-[200] transition-all duration-700 px-8 ${scrolled ? 'py-4' : 'py-10'}`}>
         <div className={`max-w-7xl mx-auto flex justify-between items-center px-10 py-6 transition-all duration-500 ${scrolled ? 'bg-white/90 backdrop-blur-xl rounded-[32px] px-12 border border-forest-night/5 shadow-[0_20px_50px_rgba(10,33,24,0.1)]' : ''}`}>
            <div className="flex items-center gap-12">
               <button onClick={() => window.history.back()} className="p-3 rounded-2xl bg-forest-night/5 text-forest-night hover:bg-forest-night hover:text-white transition-all">
                  <ArrowLeft size={20} />
               </button>
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
        
        <header className="mb-24 animate-reveal">
           <div className="inline-flex items-center gap-4 py-2 px-4 bg-forest-night/5 rounded-full mb-8">
              <div className="w-2 h-2 rounded-full bg-afrigari-gold animate-pulse"></div>
              <p className="text-forest-night font-black uppercase tracking-[0.5em] text-[9px]">
                {filterNearby ? 'Artisans à proximité de vous' : "L'Annuaire des Producteurs Certifiés"}
              </p>
           </div>
           <h1 className="text-8xl font-black tracking-tighter leading-[0.9] mb-10 italic uppercase">
             {filterNearby ? (
               <>Vos <span className="text-afrigari-gold">Voisins</span> <br/> Artisans.</>
             ) : (
               <>Découvrez <br/> <span className="text-afrigari-gold">Les Terroirs</span> Afrigari.</>
             )}
           </h1>
           <p className="text-lg text-forest-night/40 max-w-xl font-bold leading-relaxed italic border-l-4 border-afrigari-gold pl-8">
             {filterNearby 
               ? "Nous avons sélectionné les meilleurs producteurs situés dans votre périmètre géographique pour une fraîcheur garantie."
               : "Parcourez le continent à travers le savoir-faire de nos artisans partenaires. Chaque boutique est un voyage culinaire unique."
             }
           </p>
        </header>

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
                  <ShopCard 
                    key={shop.id} 
                    shop={shop} 
                    delay={`${i * 0.1}s`} 
                    onLocalize={() => setSelectedStore(shop)}
                  />
               ))}
            </div>
          )}

          {selectedStore && (
             <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
                <div className="absolute inset-0 bg-forest-night/60 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => setSelectedStore(null)}></div>
                <div className="relative w-full max-w-4xl bg-white rounded-[4rem] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 fade-in duration-500 flex flex-col md:flex-row">
                   <div className="flex-1 h-[400px] md:h-auto bg-slate-100 relative">
                      {selectedStore.latitude && selectedStore.longitude ? (
                        <iframe 
                          width="100%" 
                          height="100%" 
                          frameBorder="0" 
                          style={{ border: 0 }}
                          src={`https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY_HERE&q=${selectedStore.latitude},${selectedStore.longitude}`} 
                          allowFullScreen
                          className="grayscale contrast-125 brightness-105"
                        ></iframe>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-forest-night/20 gap-4">
                           <MapPin size={60} />
                           <p className="text-[10px] font-black uppercase tracking-widest">Coordonnées non disponibles</p>
                        </div>
                      )}
                      <div className="absolute inset-0 pointer-events-none border-[20px] border-white/10"></div>
                   </div>

                   <div className="w-full md:w-80 p-12 flex flex-col justify-between bg-white border-l border-forest-night/5">
                      <div>
                         <button onClick={() => setSelectedStore(null)} className="w-10 h-10 rounded-full bg-forest-night/5 flex items-center justify-center text-forest-night/20 mb-8 hover:bg-forest-night hover:text-white transition-all">
                            <ChevronLeft size={20} />
                         </button>
                         <h3 className="text-3xl font-black tracking-tighter uppercase italic text-forest-night mb-2">{selectedStore.name}</h3>
                         <p className="text-[10px] font-black text-afrigari-gold uppercase tracking-[0.3em] mb-8">{selectedStore.address || selectedStore.city || 'Bénin'}</p>
                         
                         <div className="space-y-4">
                            <div className="flex items-center gap-4 text-xs font-bold text-forest-night/60 italic">
                               <MapPin size={16} className="text-afrigari-gold" />
                               <span>{selectedStore.distance ? `${selectedStore.distance} km de vous` : 'Localisation exacte'}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-bold text-forest-night/60 italic">
                               <ShoppingBag size={16} className="text-afrigari-gold" />
                               <span>{selectedStore.productsCount || 0} Produits disponibles</span>
                            </div>
                         </div>
                      </div>

                      <Link 
                        href={`/dashboard/client/shops/${selectedStore.id}`}
                        className="w-full py-5 bg-forest-night text-white rounded-2xl font-black text-[10px] uppercase tracking-widest text-center hover:bg-afrigari-gold hover:text-forest-night transition-all shadow-xl"
                      >
                         Visiter la boutique
                      </Link>
                   </div>
                </div>
             </div>
          )}

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

function ShopCard({ shop, delay, onLocalize }: any) {
    return (
        <div className="group bg-white rounded-[56px] overflow-hidden border border-forest-night/5 shadow-xl hover:shadow-[0_50px_100px_rgba(10,33,24,0.1)] hover:-translate-y-4 transition-all duration-700 animate-reveal block relative" style={{ animationDelay: delay }}>
           <div className="h-48 relative overflow-hidden bg-forest-night/5">
              <img src={shop.coverImage || "https://images.unsplash.com/photo-1549439602-43ebcb232811?auto=format&fit=crop&q=80&w=600"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s]" alt={shop.name} />
              <div className="absolute inset-0 bg-forest-night/40 group-hover:bg-forest-night/10 transition-colors"></div>
              
              {shop.distance && (
                <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-2 shadow-xl border border-white/20 scale-90 group-hover:scale-100 transition-transform">
                   <MapPin size={14} className="text-afrigari-gold" />
                   <span className="text-[10px] font-black text-forest-night uppercase tracking-widest">{shop.distance} km</span>
                </div>
              )}
           </div>

           <div className="px-10 pb-12 relative">
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
                    <div className="flex items-center gap-4">
                       <Link href={`/dashboard/client/shops/${shop.id}`} className="w-14 h-14 rounded-2xl bg-forest-night text-white flex items-center justify-center hover:bg-afrigari-gold hover:text-forest-night transition-all shadow-xl group-hover:rotate-12 duration-500">
                          <ArrowRight size={24} />
                       </Link>
                       <button 
                         onClick={(e) => { e.preventDefault(); onLocalize(); }}
                         className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-forest-night/40 hover:text-afrigari-gold transition-colors ml-2"
                       >
                          <MapPin size={14} /> Localiser
                       </button>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1">
                             <Star size={14} className="text-afrigari-gold" fill="currentColor" />
                             <span className="text-xs font-black text-forest-night">4.9</span>
                          </div>
                          <span className="text-[8px] font-black text-forest-night/20 uppercase tracking-widest">Avis Clients</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
    );
}

export default function ShopsExplorer() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-luxury-cream"><Loader2 className="w-12 h-12 text-forest-night animate-spin" /></div>}>
      <ShopsExplorerContent />
    </Suspense>
  );
}
