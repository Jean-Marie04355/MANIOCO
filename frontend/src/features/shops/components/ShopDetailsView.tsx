"use client";
import { Plus, Star, ArrowLeft, ShoppingCart, ShieldCheck, MapPin, Package, Phone, Loader2, TrendingUp, MessageSquare, type LucideIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuth } from '@/features/auth/AuthContext';
import { useCart } from '@/features/cart/CartContext';
import CartDrawer from '@/components/CartDrawer';

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  profilePhoto?: string;
  unit?: string;
}

interface Store {
  id: string;
  name: string;
  description?: string;
  profilePhoto?: string;
  ownerId: string;
  category?: string;
  address?: string;
  city?: string;
  phone?: string;
}

interface ShopDetailsViewProps {
    isPublic?: boolean;
}

export default function ShopDetailsView({ isPublic = false }: Readonly<ShopDetailsViewProps>) {
  const { id } = useParams();
  const { user } = useAuth();
  const cartContext = useCart();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const isOwner = user && store && (user.id === store.ownerId || user.userId === store.ownerId);

  const getRealInternetLink = (product: { name?: string; image?: string; profilePhoto?: string }) => {
    const name = (product.name || "").toLowerCase();
    const dbPath = product.image || product.profilePhoto;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    if (!dbPath) {
      if (name.includes('gari')) return "https://images.unsplash.com/photo-1549439602-43ebcb232811?auto=format&fit=crop&q=80&w=800";
      if (name.includes('farine')) return "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800";
      if (name.includes('manioc')) return "https://images.unsplash.com/photo-1590736704728-f4730bb3c3af?auto=format&fit=crop&q=80&w=800";
      return "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&q=80&w=800";
    }

    if (dbPath.startsWith('data:image')) return dbPath;
    if (dbPath.startsWith('http')) return dbPath;

    const cleanPath = dbPath.startsWith('/') ? dbPath : `/${dbPath}`;
    const finalPath = cleanPath.startsWith('/uploads') ? cleanPath : `/uploads${cleanPath}`;
    return `${apiUrl}${finalPath}`;
  };

  const handleContact = async () => {
     if (isPublic && !user) {
        console.warn("Veuillez vous connecter pour contacter le vendeur.");
        router.push('/auth/login');
        return;
     }
     setIsStartingChat(true);
     try {
        await api.post('/chat/conversations/init', { storeId: id });
        router.push('/dashboard/client/messages');
     } catch (error) {
        console.error("Erreur initiation chat", error);
     } finally {
        setIsStartingChat(false);
     }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    const fetchStoreData = async () => {
      try {
        const [storeRes, productsRes] = await Promise.all([
          api.get(`/stores/${id}`),
          api.get(`/products?storeId=${id}`)
        ]);
        setStore(storeRes.data);
        setProducts(productsRes.data || []);
      } catch (error) {
        console.error("Erreur de chargement de la boutique", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchStoreData();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [id]);

  if (isLoading) {
    return (
      <div className="bg-[#fcfbf7] min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#c5a059] animate-spin" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="bg-[#fcfbf7] min-h-screen flex flex-col items-center justify-center gap-6">
        <p className="text-xl font-black text-[#1a2e22]/40 uppercase tracking-widest">Boutique introuvable</p>
        <button 
          type="button"
          onClick={() => router.back()} 
          className="bg-[#1a2e22] text-white px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
        >
          Retour
        </button>
      </div>
    );
  }

  const getBackUrl = () => {
    if (isOwner) return "/dashboard/seller/settings/store";
    if (user?.role === 'vendeur') return "/dashboard/seller";
    if (user?.role === 'super_admin' || user?.role === 'admin') return "/dashboard/super-admin";
    if (user?.role === 'client') return "/dashboard/client";
    return "/";
  };

  const getBackLabel = () => {
    if (isOwner) return "Retour aux Paramètres";
    if (!isPublic) return "Retour au Marché";
    return "Retour";
  };

  return (
    <div className="bg-[#fcfbf7] min-h-screen text-[#1a2e22] selection:bg-[#c5a059] selection:text-white font-sans overflow-x-hidden">
      
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-[200] transition-all duration-700 px-8 ${scrolled ? 'py-4' : 'py-12'}`}>
         <div className={`max-w-[1400px] mx-auto flex justify-between items-center px-12 py-6 transition-all duration-700 ${scrolled ? 'bg-white/80 backdrop-blur-2xl rounded-full shadow-2xl border border-white' : ''}`}>
            <Link href={getBackUrl()} className="flex items-center gap-4 group">
               <div className="w-10 h-10 rounded-full border border-[#1a2e22]/10 flex items-center justify-center group-hover:bg-[#1a2e22] group-hover:text-white transition-all shadow-sm">
                  <ArrowLeft size={20} />
               </div>
               <span className="font-black text-[11px] uppercase tracking-[0.3em] hidden md:block">
                  {getBackLabel()}
               </span>
            </Link>

            <div className="flex items-center gap-10">
               {!isPublic && cartContext && (
                 <button 
                    type="button"
                    onClick={() => setIsCartOpen(true)}
                    className="relative cursor-pointer group p-3 hover:bg-[#1a2e22]/5 rounded-2xl transition-all"
                    aria-label="Voir le panier"
                 >
                    <ShoppingCart size={22} className="group-hover:scale-110 transition-transform" />
                    {cartContext.totalItems > 0 && (
                       <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#c5a059] text-white text-[10px] flex items-center justify-center rounded-full font-black shadow-lg border-2 border-white animate-bounce">
                          {cartContext.totalItems}
                       </span>
                    )}
                 </button>
               )}
               <div className="w-12 h-12 rounded-full border-2 border-white shadow-2xl overflow-hidden relative bg-[#1a2e22]/5 flex items-center justify-center text-[#1a2e22] font-black text-sm uppercase ring-4 ring-[#1a2e22]/5">
                  {user?.profilePhoto ? (
                     <img src={getRealInternetLink({name: 'user', image: user.profilePhoto})} alt="Profil" className="w-full h-full object-cover" />
                  ) : (
                     <span>{user?.name?.[0] || 'U'}</span>
                  )}
               </div>
            </div>
         </div>
      </nav>

      {/* Hero Header */}
      <section className="relative h-[70vh] w-full overflow-hidden">
         <img 
            src={getRealInternetLink({name: store.name, image: store.profilePhoto})} 
            alt={store.name}
            className="w-full h-full object-cover"
         />
         <div className="absolute inset-0 bg-gradient-to-t from-[#1a2e22] via-[#1a2e22]/40 to-transparent"></div>
         
         <div className="absolute bottom-0 left-0 right-0 p-20 pb-32">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-end gap-12">
               <div className="w-48 h-48 bg-white p-4 rounded-[56px] shadow-3xl ring-[16px] ring-white/10 shrink-0">
                  <div className="w-full h-full rounded-[40px] bg-[#1a2e22]/5 flex items-center justify-center text-[#1a2e22] text-5xl font-black uppercase overflow-hidden">
                     {store.profilePhoto ? (
                        <img src={getRealInternetLink({name: store.name, image: store.profilePhoto})} alt={store.name} className="w-full h-full object-cover" />
                     ) : (
                        <span>{store.name?.[0]}</span>
                     )}
                  </div>
               </div>
               
               <div className="flex-1 pb-4 text-white">
                  <div className="flex items-center gap-6 mb-6">
                     <span className="bg-[#c5a059] text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl">
                        {store.category || "Vendeur Certifié"}
                     </span>
                     <div className="flex items-center gap-2 text-[#c5a059]">
                        <Star size={18} fill="currentColor" />
                        <span className="text-lg font-black italic font-serif">4.9 / 5.0</span>
                     </div>
                  </div>
                  <h1 className="text-7xl md:text-8xl font-black tracking-[-0.05em] uppercase mb-8 italic font-serif leading-none">{store.name}</h1>
                  <p className="text-xl text-white/80 max-w-3xl font-medium leading-relaxed italic">{store.description || "Découvrez une sélection unique de produits d'exception, authentiques et traçables par Afrigari."}</p>
                  
                  {isOwner && (
                     <div className="mt-8 inline-flex items-center gap-3 px-6 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full">
                        <div className="w-2 h-2 bg-[#c5a059] rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/90">Vous visualisez votre boutique (Mode Aperçu)</span>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </section>

      <main className="max-w-[1400px] mx-auto py-32 px-12 grid grid-cols-1 lg:grid-cols-4 gap-24">
         
         {/* Sidebar Info */}
         <aside className="space-y-16">
            <div className="bg-white rounded-[60px] p-12 shadow-3xl border border-[#1a2e22]/5">
               <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] mb-12">Artisan Certifié</h4>
               <div className="space-y-8">
                  <ContactItem 
                    icon={MapPin} 
                    label="Localisation" 
                    value={(() => {
                        if (store.address) {
                            return `${store.address}${store.city ? `, ${store.city}` : ''}`;
                        }
                        return store.city || "Abidjan, Côte d'Ivoire";
                    })()} 
                  />
                  <ContactItem 
                    icon={Phone} 
                    label="Contact Direct" 
                    value={store.phone || "+225 01 02 03 04 05"} 
                  />
               </div>
               
               <div className="mt-12 pt-12 border-t border-[#1a2e22]/5">
                  <div className="flex items-center gap-6">
                     <div className="w-12 h-12 rounded-2xl bg-[#1a2e22]/5 flex items-center justify-center text-[#1a2e22] shadow-inner">
                        <ShieldCheck size={24} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a2e22]">Authenticité</p>
                        <p className="text-[9px] font-bold opacity-40">Vérifié par Afrigari</p>
                     </div>
                  </div>
               </div>
            </div>

            {!isPublic && (
              <div className="bg-[#1a2e22] rounded-[60px] p-12 text-white shadow-3xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-[#c5a059]/10 rounded-full blur-3xl -z-0"></div>
                 <h4 className="text-3xl font-black mb-6 relative z-10 leading-tight">Envie de <br /> discuter ?</h4>
                 <p className="text-sm text-white/60 mb-10 relative z-10 leading-relaxed font-medium">Posez vos questions directement à l'artisan via notre messagerie sécurisée.</p>
                 <button 
                    onClick={handleContact}
                    disabled={isStartingChat || isOwner}
                    className="bg-white text-[#1a2e22] px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest relative z-10 hover:bg-[#c5a059] hover:text-white transition-all disabled:opacity-50 flex items-center gap-4 group"
                 >
                    <MessageSquare size={16} />
                    {(() => {
                        if (isOwner) return "Votre Boutique";
                        return isStartingChat ? "Connexion..." : "Ouvrir le Chat";
                    })()}
                 </button>
                 <TrendingUp size={120} className="absolute -right-10 -bottom-10 text-white/5 rotate-12 group-hover:scale-110 transition-transform duration-1000" />
              </div>
            )}
         </aside>

         {/* Products Grid */}
         <section className="lg:col-span-3">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 gap-8">
               <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#c5a059] mb-4">Stock de la Boutique</p>
                  <h2 className="text-6xl font-black tracking-[-0.03em] text-[#1a2e22]">Le <span className="text-[#c5a059] italic font-serif">Catalogue</span> Local.</h2>
               </div>
            </div>

            {products.length === 0 ? (
               <div className="py-40 text-center bg-white rounded-[80px] border-2 border-dashed border-[#1a2e22]/5 shadow-inner">
                  <Package size={64} className="mx-auto mb-8 text-[#1a2e22]/10" />
                  <p className="text-lg font-black uppercase tracking-[0.3em] text-[#1a2e22]/20">La boutique est vide pour le moment</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {products.map((product) => (
                     <ProductCard 
                        key={product.id} 
                        product={product} 
                        addToCart={cartContext?.addToCart} 
                        getImageUrl={() => getRealInternetLink(product)} 
                        isOwner={isOwner}
                        isPublic={isPublic}
                     />
                  ))}
               </div>
            )}
         </section>
      </main>

      {!isPublic && <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />}
    </div>
  );
}

function ContactItem({ icon: Icon, label, value }: Readonly<{ icon: LucideIcon; label: string; value: string }>) {
   return (
      <div className="flex gap-6 items-start">
         <div className="mt-1 text-[#c5a059] bg-[#c5a059]/5 p-2 rounded-xl shadow-inner"><Icon size={20} /></div>
         <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
            <p className="text-sm font-bold text-[#1a2e22]">{value}</p>
         </div>
      </div>
   );
}

function ProductCard({ product, addToCart, getImageUrl, isOwner, isPublic }: Readonly<{ product: Product; addToCart: ((p: Product) => void) | undefined; getImageUrl: () => string; isOwner: boolean | null; isPublic: boolean }>) {
   return (
      <div className="group bg-white rounded-[70px] overflow-hidden border border-[#1a2e22]/5 shadow-2xl hover:shadow-3xl hover:-translate-y-4 transition-all duration-1000 p-6 ring-1 ring-slate-50 border-[10px] border-white">
         <div className="relative aspect-[4/3] rounded-[56px] overflow-hidden mb-8 bg-slate-50">
               <img 
                  src={getImageUrl()} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s] block" 
               />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a2e22]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            {!isOwner && !isPublic && addToCart && (
               <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); addToCart(product); }}
                  className="absolute bottom-8 right-8 w-16 h-16 bg-white text-[#1a2e22] rounded-full flex items-center justify-center shadow-3xl opacity-0 translate-y-6 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-700 hover:bg-[#c5a059] hover:text-white z-20"
               >
                  <Plus size={28} className="group-hover:rotate-90 transition-transform" />
               </button>
            )}
         </div>
         
         <div className="px-6 pb-6">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-5 h-5 rounded-md bg-[#c5a059]/10 flex items-center justify-center text-[#c5a059]"><Package size={12} /></div>
               <p className="text-[10px] font-black text-[#c5a059] uppercase tracking-[0.4em]">{product.unit || 'Kg'}</p>
            </div>
            <h4 className="text-[28px] font-black mb-8 tracking-[-0.03em] text-[#1a2e22] uppercase leading-none truncate">{product.name}</h4>
            
            <div className="flex justify-between items-center bg-[#1a2e22]/5 p-3 rounded-[32px] group-hover:bg-[#1a2e22] group-hover:text-white transition-all duration-700 shadow-sm border border-[#1a2e22]/5">
               <span className="text-2xl font-black ml-4 tracking-tighter">{Number(product.price).toLocaleString('fr-FR')} FCFA</span>
               {!isOwner && !isPublic && addToCart && (
                  <button 
                     type="button"
                     onClick={(e) => { e.preventDefault(); addToCart(product); }}
                     tabIndex={0}
                     aria-label={`Ajouter ${product.name} au panier`}
                     className="w-14 h-14 rounded-2xl bg-white text-[#1a2e22] flex items-center justify-center group-hover:bg-[#c5a059] group-hover:text-white transition-all shadow-xl cursor-pointer"
                  >
                     <ShoppingCart size={20} />
                  </button>
               )}
            </div>
         </div>
      </div>
   );
}
