"use client";
import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';
import { 
  Heart, ShoppingCart, Search, Trash2, 
  ArrowRight, Sparkles, ShoppingBag, 
  Loader2, Star, Store, Plus
} from 'lucide-react';
import api from '@/lib/axios';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';

export default function ClientFavorites() {
  const { addToCart } = useCart();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const prodRes = await api.get('/products');
        setProducts(prodRes.data);
        
        const favIds = JSON.parse(localStorage.getItem('afrigari_favorites') || '[]');
        const favProducts = prodRes.data.filter((p: any) => favIds.includes(p.id));
        setFavorites(favProducts);
      } catch (error) {
        console.error("Erreur chargement favoris", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const removeFavorite = (id: string) => {
    const favIds = JSON.parse(localStorage.getItem('afrigari_favorites') || '[]');
    const newFavIds = favIds.filter((favId: string) => favId !== id);
    localStorage.setItem('afrigari_favorites', JSON.stringify(newFavIds));
    setFavorites(prev => prev.filter(p => p.id !== id));
  };

  const filteredFavorites = favorites.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex bg-luxury-cream/30 min-h-screen">
        <Sidebar mode="client" />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-afrigari-gold animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex bg-luxury-cream/30 min-h-screen font-sans text-forest-night selection:bg-afrigari-gold selection:text-white">
      <Sidebar mode="client" />
      
      <main className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
        <TopNav title="Mes Favoris" isAdmin={false} />
        
        <div className="flex-1 p-8 lg:p-12 overflow-y-auto custom-scrollbar animate-reveal">
          <div className="max-w-7xl mx-auto space-y-12">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                    <Heart size={18} fill="currentColor" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-forest-night/40">Votre sélection exclusive</span>
                </div>
                <h1 className="text-5xl font-black tracking-tighter italic uppercase text-forest-night">Mes Coups de Cœur.</h1>
              </div>

              <div className="relative w-full md:w-80 group">
                <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-forest-night/20 group-focus-within:text-afrigari-gold transition-colors" />
                <input 
                  type="text" 
                  placeholder="Chercher dans vos favoris..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-white border border-forest-night/5 rounded-3xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-afrigari-gold/5 focus:border-afrigari-gold/20 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Content */}
            {favorites.length === 0 ? (
               <div className="bg-white rounded-[4rem] p-32 border border-forest-night/5 shadow-2xl text-center flex flex-col items-center overflow-hidden relative">
                  <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-red-100 mb-8 animate-pulse">
                     <Heart size={40} fill="currentColor" />
                  </div>
                  <h3 className="text-2xl font-black text-forest-night italic uppercase tracking-tighter">Votre liste est vide</h3>
                  <p className="text-[10px] font-black text-forest-night/30 uppercase tracking-[0.3em] mt-4 mb-10 max-w-sm">Explorez notre catalogue et ajoutez vos produits préférés ici.</p>
                  <Link href="/dashboard/client/shops" className="bg-forest-night text-white px-10 py-5 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-2xl flex items-center gap-3">
                     Découvrir le Marché <ArrowRight size={18} />
                  </Link>
                  <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-red-500/5 rounded-full blur-3xl"></div>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-20">
                  {filteredFavorites.map((p) => (
                    <FavoriteCard 
                      key={p.id}
                      product={p}
                      onRemove={() => removeFavorite(p.id)}
                      onAdd={() => addToCart(p)}
                    />
                  ))}
               </div>
            )}

            {/* Discovery Section if low on favorites */}
            {favorites.length > 0 && favorites.length < 4 && (
               <div className="bg-forest-night rounded-[4rem] p-12 text-white overflow-hidden relative group">
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                     <div>
                        <h3 className="text-3xl font-black tracking-tighter italic uppercase mb-2">Envie de plus ?</h3>
                        <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Nos algorithmes ont déniché des pépites pour vous.</p>
                     </div>
                     <Link href="/dashboard/client/shops" className="bg-afrigari-gold text-white px-12 py-5 rounded-full font-black text-xs uppercase tracking-widest hover:scale-110 transition-all shadow-2xl flex items-center gap-3">
                        Voir les suggestions <Sparkles size={18} />
                     </Link>
                  </div>
                  <div className="absolute top-0 right-0 w-96 h-96 bg-afrigari-gold/20 rounded-full blur-[100px] -mr-48 -mt-48 transition-all group-hover:bg-afrigari-gold/30"></div>
               </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}

function FavoriteCard({ product, onRemove, onAdd }: any) {
   return (
      <div className="group animate-reveal bg-white rounded-[3.5rem] border border-forest-night/5 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700">
         <div className="relative aspect-[4/5] overflow-hidden">
            <img 
               src={product.image || "https://images.unsplash.com/photo-1549439602-43ebcb232811?auto=format&fit=crop&q=80&w=400"} 
               className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s]" 
               alt={product.name}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-forest-night/40 to-transparent"></div>
            
            <button 
               onClick={onRemove}
               className="absolute top-6 right-6 w-12 h-12 bg-white/90 backdrop-blur-md text-red-500 rounded-2xl flex items-center justify-center shadow-lg hover:bg-red-500 hover:text-white transition-all transform hover:rotate-12"
            >
               <Trash2 size={20} />
            </button>

            <div className="absolute bottom-6 left-6 right-6">
               <button 
                  onClick={onAdd}
                  className="w-full bg-forest-night text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl transform translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 hover:bg-afrigari-gold"
               >
                  <ShoppingCart size={16} /> Ajouter au panier
               </button>
            </div>
         </div>

         <div className="p-8">
            <div className="flex justify-between items-start mb-3">
               <div>
                  <p className="text-[9px] font-black text-afrigari-gold uppercase tracking-[0.4em] mb-1">{product.unit || "Unité"}</p>
                  <h4 className="text-xl font-black tracking-tighter uppercase italic text-forest-night truncate w-40">{product.name}</h4>
               </div>
               <span className="text-lg font-black text-forest-night">{Number(product.price).toLocaleString()} F</span>
            </div>

            <div className="flex items-center gap-3 pt-6 border-t border-forest-night/5">
               <div className="w-8 h-8 rounded-lg bg-forest-night/5 flex items-center justify-center text-afrigari-gold">
                  <Store size={14} />
               </div>
               <p className="text-[9px] font-black text-forest-night/30 uppercase tracking-[0.2em]">{product.store?.name || "Producteur Afrigari"}</p>
            </div>
         </div>
      </div>
   );
}
