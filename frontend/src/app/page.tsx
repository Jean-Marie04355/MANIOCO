"use client";
import { ShoppingCart, Search, Plus, Star, ArrowRight, Heart, Grid, Package, Wallet, UserCircle, Settings, HelpCircle, ChevronDown, Clock, ShieldCheck, MapPin, Sparkles, Filter, Store, PackageCheck, LogOut, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useCart } from '@/context/CartContext';
import CartSidebar from './components/CartSidebar';

export default function Home() {
  const { addToCart, itemCount } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get('/products'),
          api.get('/product-categories')
        ]);
        setProducts(prodRes.data);
        setCategories(catRes.data);
      } catch (error) {
        console.error("Erreur chargement données", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'all' || p.categoryId === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-organic-cream min-h-screen text-forest-green selection:bg-afrigari-gold selection:text-white font-sans">
      
      {/* 1. Header & Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-[200] transition-all duration-700 px-8 ${scrolled ? 'py-4' : 'py-10'}`}>
         <div className={`max-w-7xl mx-auto flex justify-between items-center px-10 py-5 transition-all duration-500 ${scrolled ? 'glass-premium rounded-full px-12' : ''}`}>
            <div className="flex items-center gap-12">
               <Link href="/" className="flex items-center gap-2 group">
                  <div className="w-8 h-8 rounded-lg bg-forest-green flex items-center justify-center text-white scale-110 group-hover:rotate-12 transition-transform">
                     <PackageCheck size={16} />
                  </div>
                  <span className="font-black text-2xl tracking-tighter uppercase font-display italic">AFRIGARI</span>
               </Link>
               <div className="hidden lg:flex gap-10 text-[10px] font-black uppercase tracking-[0.4em]">
                  <button onMouseEnter={() => setIsExploreOpen(true)} className="hover:text-afrigari-gold transition-colors underline decoration-2 underline-offset-8 decoration-afrigari-gold flex items-center gap-2">
                    Explorateur <ChevronDown size={12} />
                  </button>
                  <Link href="/dashboard/client/shops" className="hover:text-afrigari-gold transition-colors">Nos Producteurs</Link>
               </div>
            </div>

            <div className="flex items-center gap-8">
                <div className="flex gap-6 items-center border-r border-forest-green/10 pr-8">
                  <div className="relative group">
                    <Search size={18} className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" />
                    <input 
                      type="text"
                      placeholder="Rechercher..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest pl-7 w-32 focus:w-48 transition-all"
                    />
                  </div>
                  <div className="relative cursor-pointer group" onClick={() => setIsCartOpen(true)}>
                    <ShoppingCart size={18} />
                    <span className="absolute -top-2 -right-2 w-4 h-4 bg-forest-green text-white text-[8px] flex items-center justify-center rounded-full font-black">{itemCount}</span>
                  </div>
                </div>
               <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="w-10 h-10 rounded-full border-2 border-white shadow-xl hover:scale-110 transition-transform overflow-hidden relative">
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100" />
               </button>
            </div>
         </div>
      </nav>

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <main className="max-w-7xl mx-auto pt-40 px-8">
        
        {/* Hero Section */}
        <section className="relative grid grid-cols-1 lg:grid-cols-2 gap-16 mb-40 items-center animate-reveal">
           <div className="z-20 order-2 lg:order-1">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-6 h-6 rounded-full bg-forest-green/10 flex items-center justify-center text-forest-green"><ShieldCheck size={12} /></div>
                 <span className="text-xs font-black uppercase tracking-[0.3em]">Qualité Supérieure & Transformation Locale</span>
              </div>
              <div className="relative z-10 space-y-8">
                 <h2 className="text-8xl font-black leading-[0.9] tracking-tighter text-forest-green">Le Terroir. <br/> <span className="text-slate-200 bg-forest-green/5 px-4 underline decoration-afrigari-gold">Redéfini.</span></h2>
                 <p className="text-sm font-bold text-forest-green/60 max-w-sm leading-relaxed">Découvrez des produits transformés avec soin, directement issus des meilleures coopératives du continent.</p>
                 <button className="bg-forest-green text-white px-12 py-5 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-2xl flex items-center gap-3">
                    Voir les Arrivages <ArrowRight size={18} />
                 </button>
              </div>
           </div>
           <div className="relative order-1 lg:order-2">
              <div className="relative w-full aspect-square rounded-[64px] overflow-hidden shadow-[0_50px_100px_-20px_rgba(45,70,53,0.3)]">
                 <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=1000" className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-gradient-to-t from-forest-green/20 to-transparent"></div>
              </div>
           </div>
        </section>

        {/* Products Grid */}
        <section className="mb-40">
            <div className="flex justify-between items-end mb-16 overflow-x-auto no-scrollbar">
              <div className="flex gap-16 pb-4 font-display min-w-max">
                 <CategoryTab 
                   label="Tous les produits" 
                   count={products.length} 
                   active={activeCategory === 'all'} 
                   onClick={() => setActiveCategory('all')}
                 />
                 {categories.map((cat) => (
                   <CategoryTab 
                     key={cat.id}
                     label={cat.name} 
                     count={products.filter(p => p.categoryId === cat.id).length} 
                     active={activeCategory === cat.id}
                     onClick={() => setActiveCategory(cat.id)}
                   />
                 ))}
              </div>
            </div>

            {isLoading ? (
               <div className="flex justify-center py-20">
                  <Loader2 className="w-12 h-12 text-forest-green animate-spin" />
               </div>
            ) : filteredProducts.length === 0 ? (
               <div className="text-center py-20 opacity-40 italic">Aucun produit trouvé</div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                  {filteredProducts.map((p) => (
                    <AfrigariAgroCard 
                      key={p.id}
                      name={p.name} 
                      unit={p.unit || "Sachet"} 
                      producer={p.store?.name || "Producteur Afrigari"} 
                      price={`${Number(p.price).toLocaleString()} FCFA`} 
                      img={p.image || "https://images.unsplash.com/photo-1549439602-43ebcb232811?auto=format&fit=crop&q=80&w=400"} 
                      badge={p.stock > 0 ? "Disponible" : "Épuisé"} 
                      onAdd={() => addToCart(p)}
                    />
                  ))}
               </div>
            )}
        </section>
      </main>

      <footer className="bg-forest-green py-20 text-white/40 text-center">
         <p className="text-[10px] font-black uppercase tracking-[0.5em]">© 2026 AFRIGARI AGRO-INDUSTRIAL MARKETPLACE</p>
      </footer>
    </div>
  );
}

// Components
function CategoryTab({ label, count, active = false, onClick }: any) {
   return (
      <div onClick={onClick} className={`flex gap-1 relative cursor-pointer group transition-all`}>
         <span className={`text-4xl font-black whitespace-nowrap tracking-tighter ${active ? 'text-forest-green' : 'text-slate-200 group-hover:text-forest-green/50'}`}>{label}</span>
         <span className={`text-[11px] font-black mt-2 ${active ? 'text-forest-green' : 'text-slate-200 group-hover:text-forest-green/50'}`}>{count}</span>
         {active && <div className="absolute bottom-[-10px] left-0 w-12 h-1 bg-forest-green rounded-full shadow-lg"></div>}
      </div>
   );
}

function AfrigariAgroCard({ name, unit, producer, price, img, badge, onAdd }: any) {
   return (
      <div className="group animate-reveal">
         <div className="relative aspect-[4/5] rounded-[56px] overflow-hidden mb-10 shadow-2xl group-hover:-translate-y-4 transition-all duration-700 ring-1 ring-forest-green/5">
            <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s]" />
            <div className="absolute inset-0 bg-gradient-to-t from-forest-green/60 to-transparent"></div>
            {badge && <span className="absolute top-8 left-8 bg-forest-green text-white px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-2xl border border-white/20">{badge}</span>}
            <button onClick={onAdd} className="absolute bottom-8 right-8 w-14 h-14 bg-white text-forest-green rounded-full flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 hover:rotate-90">
               <Plus size={24} />
            </button>
         </div>
         <div className="px-4">
            <p className="text-[9px] font-black text-afrigari-gold uppercase tracking-[0.4em] mb-2">{unit}</p>
            <h4 className="text-2xl font-black mb-3 tracking-tighter group-hover:text-amber-700 transition-colors uppercase">{name}</h4>
            <div className="flex items-center gap-3 text-[10px] font-bold text-forest-green/40 uppercase tracking-widest mb-6 border-b border-forest-green/5 pb-6">
                <Store size={14} className="text-afrigari-gold" />
                <span>{producer}</span>
            </div>
            <div className="flex justify-between items-center bg-white p-2 rounded-3xl border border-forest-green/5 group-hover:border-forest-green/20 transition-all">
               <span className="text-xl font-black text-forest-green ml-4">{price}</span>
               <div onClick={onAdd} className="w-12 h-12 rounded-2xl bg-forest-green flex items-center justify-center text-white cursor-pointer hover:bg-afrigari-gold transition-all shadow-lg">
                  <ShoppingCart size={18} />
               </div>
            </div>
         </div>
      </div>
   );
}
