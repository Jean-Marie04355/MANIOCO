"use client";
/* eslint-disable react/no-unescaped-entities */
import {
  Plus, Star, ArrowLeft, ShoppingCart, ShieldCheck, MapPin,
  Package, Phone, Loader2, MessageSquare, BadgeCheck, Heart,
  User as UserIcon, LogOut, Store
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter, usePathname } from 'next/navigation';
import api from '@/lib/axios';
import { useAuth } from '@/features/auth/AuthContext';
import { useCart } from '@/features/cart/CartContext';
import { useFavorites } from '@/features/favorites/FavoritesContext';
import CartDrawer from '@/components/CartDrawer';

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  profilePhoto?: string;
  unit?: string;
  description?: string;
  stock?: number;
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
  verified?: boolean;
}

interface ShopDetailsViewProps {
  isPublic?: boolean;
}

export default function ShopDetailsView({ isPublic = false }: Readonly<ShopDetailsViewProps>) {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const cartContext = useCart();
  const { totalFavorites } = useFavorites();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const isOwner = !!(user && store && (user.id === store.ownerId || user.userId === store.ownerId));

  const getRealInternetLink = (product: { name?: string; image?: string; profilePhoto?: string }) => {
    const dbPath = product.image || product.profilePhoto;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    if (!dbPath || String(dbPath).trim() === '' || dbPath === 'null') {
      return "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&q=80&w=800";
    }
    if (dbPath.startsWith('data:image') || dbPath.startsWith('http')) return dbPath;
    const cleanPath = dbPath.startsWith('/') ? dbPath : `/${dbPath}`;
    const finalPath = cleanPath.startsWith('/uploads') ? cleanPath : `/uploads${cleanPath}`;
    return `${apiUrl}${finalPath}`;
  };

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    if (!user) { e.preventDefault(); router.push('/auth/login'); return; }
    action();
  };

  const handleContact = async () => {
    if (!user) { router.push('/auth/login'); return; }
    setIsStartingChat(true);
    try {
      await api.post('/chat/conversations/init', { storeId: id });
      router.push('/dashboard/client/messages');
    } catch (err) {
      console.error("Erreur initiation chat", err);
    } finally {
      setIsStartingChat(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);

    const fetchStoreData = async () => {
      try {
        const [storeRes, productsRes] = await Promise.all([
          api.get(`/stores/${id}`),
          api.get(`/products?storeId=${id}`)
        ]);
        setStore(storeRes.data);
        setProducts(productsRes.data || []);
      } catch (err) {
        console.error("Erreur de chargement", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchStoreData();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [id]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-[#fcfbf7] min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-manioco-terracotta animate-spin" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="bg-[#fcfbf7] min-h-screen flex flex-col items-center justify-center gap-6">
        <Store size={48} className="text-manioco-brown/20" />
        <p className="text-manioco-brown/40 font-medium">Boutique introuvable</p>
        <button onClick={() => router.back()} className="bg-manioco-terracotta text-white px-8 py-3 rounded-full font-semibold text-sm hover:bg-manioco-brown transition-all">
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#fcfbf7] min-h-screen text-manioco-brown font-sans overflow-x-hidden">

      {/* NAVBAR */}
      {!pathname?.startsWith('/dashboard') && (
        <nav className={`fixed top-0 left-0 right-0 z-[200] transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-xl shadow-[0_4px_30px_rgba(92,45,35,0.08)]' : 'bg-white'}`}>
          <div className="max-w-[1400px] mx-auto flex justify-between items-center px-8 lg:px-12 py-5">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-1 group">
              <span className="text-2xl font-extrabold tracking-tight text-manioco-brown font-sans">Mani</span>
              <span className="relative inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#F4A261] border-[2.5px] border-manioco-brown text-manioco-brown text-sm font-black group-hover:scale-110 transition-transform">o</span>
              <span className="text-2xl font-extrabold tracking-tight text-manioco-brown font-sans">c</span>
              <span className="relative inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#F4A261] border-[2.5px] border-manioco-brown text-manioco-brown text-sm font-black group-hover:scale-110 transition-transform">o</span>
            </Link>

            {/* Nav Links */}
            <div className="hidden lg:flex items-center gap-10 text-sm font-semibold text-manioco-brown/60">
              <Link href="/" className="hover:text-manioco-brown transition-colors">Accueil</Link>
              <Link href="/produits" className="hover:text-manioco-brown transition-colors">Nos produits</Link>
              <Link href="/shops" className="text-manioco-terracotta font-bold bg-manioco-terracotta/5 px-4 py-2 rounded-full">Vendeurs</Link>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
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

              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative cursor-pointer group p-2.5 hover:bg-manioco-terracotta/10 rounded-xl transition-all"
              >
                <ShoppingCart size={20} className="text-manioco-brown/60 group-hover:text-manioco-terracotta transition-colors" />
                {cartContext && cartContext.totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-manioco-terracotta text-white text-[9px] flex items-center justify-center rounded-full font-bold shadow-sm border border-white">
                    {cartContext.totalItems}
                  </span>
                )}
              </button>

              {user ? (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="w-10 h-10 rounded-full border-2 border-manioco-terracotta/20 bg-manioco-cream flex items-center justify-center text-manioco-brown font-bold text-sm"
                  >
                    <span>{user?.name?.[0] || 'U'}</span>
                  </button>
                  {isProfileOpen && (
                    <div className="absolute top-14 right-0 w-64 bg-white shadow-2xl rounded-3xl p-5 z-[300] border border-manioco-brown/5">
                      <button onClick={() => logout()} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-red-500 transition-all">
                        <LogOut size={16} />
                        <span className="text-xs font-semibold">Déconnexion</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/auth/login" className="flex items-center gap-2 bg-manioco-terracotta text-white px-6 py-2.5 rounded-full hover:bg-manioco-brown transition-all text-sm font-semibold shadow-md">
                  <UserIcon size={16} />
                  <span>Se connecter</span>
                </Link>
              )}
            </div>
          </div>
        </nav>
      )}

      <main className={pathname?.startsWith('/dashboard') ? "" : "pt-[72px]"}>
        {/* Hero Cover */}
        <div className="relative h-[340px] w-full overflow-hidden">
          <img
            src={getRealInternetLink({ name: store.name, image: store.profilePhoto })}
            alt={store.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Back button */}
          <Link href="/shops" className="absolute top-6 left-8 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-manioco-brown font-semibold text-sm shadow-md hover:bg-white transition-all">
            <ArrowLeft size={15} />
            Vendeurs
          </Link>

          {/* Owner badge */}
          {isOwner && (
            <div className="absolute top-6 right-8 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-manioco-terracotta font-semibold text-xs shadow-md">
              <div className="w-2 h-2 rounded-full bg-manioco-terracotta animate-pulse" />
              Mode Aperçu
            </div>
          )}
        </div>

        {/* Shop Identity Strip */}
        <div className="bg-white border-b border-manioco-brown/5 shadow-sm">
          <div className="max-w-[1400px] mx-auto px-8 lg:px-12 py-6 flex flex-col md:flex-row md:items-center gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-[#fcfbf7] flex items-center justify-center text-manioco-brown font-black text-2xl uppercase -mt-14 relative z-10">
              {store.profilePhoto ? (
                <img src={getRealInternetLink({ name: store.name, image: store.profilePhoto })} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <span>{store.name?.[0]}</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-manioco-brown">{store.name}</h1>
                  {store.verified !== false && (
                    <BadgeCheck size={20} className="text-blue-500 fill-blue-500" />
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-manioco-brown/50">
                  {store.city && (
                    <span className="flex items-center gap-1">
                      <MapPin size={13} /> {store.city}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Package size={13} /> {products.length} produit{products.length > 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star size={13} className="fill-[#F4A261] text-[#F4A261]" /> 4.9
                  </span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex items-center gap-3">
                {!isOwner && (
                  <button
                    onClick={handleContact}
                    disabled={isStartingChat}
                    className="flex items-center gap-2 bg-manioco-terracotta text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-manioco-brown transition-all shadow-md disabled:opacity-60"
                  >
                    <MessageSquare size={15} />
                    {isStartingChat ? 'Connexion...' : 'Contacter'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="max-w-[1400px] mx-auto px-8 lg:px-12 py-12 flex flex-col lg:flex-row gap-10">

          {/* Sidebar */}
          <aside className="w-full lg:w-[280px] flex-shrink-0 space-y-6">

            {/* About */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-manioco-brown/5">
              <h3 className="text-base font-semibold text-manioco-brown mb-4">À propos</h3>
              <p className="text-[13px] text-manioco-brown/60 leading-relaxed">
                {store.description || `${store.name} propose une sélection authentique de produits issus du manioc, fabriqués avec soin par des producteurs béninois.`}
              </p>
            </div>

            {/* Contact Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-manioco-brown/5">
              <h3 className="text-base font-semibold text-manioco-brown mb-5">Informations</h3>
              <div className="space-y-4">
                {(store.address || store.city) && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-manioco-terracotta/10 flex items-center justify-center text-manioco-terracotta flex-shrink-0 mt-0.5">
                      <MapPin size={15} />
                    </div>
                    <div>
                      <p className="text-[11px] text-manioco-brown/40 font-semibold uppercase tracking-wide mb-0.5">Localisation</p>
                      <p className="text-[13px] font-medium text-manioco-brown">
                        {store.address ? `${store.address}${store.city ? ', ' + store.city : ''}` : store.city}
                      </p>
                    </div>
                  </div>
                )}
                {store.phone && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-manioco-terracotta/10 flex items-center justify-center text-manioco-terracotta flex-shrink-0 mt-0.5">
                      <Phone size={15} />
                    </div>
                    <div>
                      <p className="text-[11px] text-manioco-brown/40 font-semibold uppercase tracking-wide mb-0.5">Téléphone</p>
                      <p className="text-[13px] font-medium text-manioco-brown">{store.phone}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 flex-shrink-0 mt-0.5">
                    <ShieldCheck size={15} />
                  </div>
                  <div>
                    <p className="text-[11px] text-manioco-brown/40 font-semibold uppercase tracking-wide mb-0.5">Authenticité</p>
                    <p className="text-[13px] font-medium text-manioco-brown">Vérifié par Manioco</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat CTA */}
            {!isOwner && (
              <div className="bg-manioco-terracotta rounded-3xl p-6 text-white shadow-md">
                <h3 className="text-base font-semibold mb-2">Une question ?</h3>
                <p className="text-[13px] text-white/80 mb-5 leading-relaxed">
                  Contactez directement ce vendeur via notre messagerie sécurisée.
                </p>
                <button
                  onClick={handleContact}
                  disabled={isStartingChat}
                  className="w-full bg-white text-manioco-terracotta py-2.5 rounded-xl text-sm font-semibold hover:bg-white/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <MessageSquare size={15} />
                  {isStartingChat ? 'Connexion...' : 'Envoyer un message'}
                </button>
              </div>
            )}
          </aside>

          {/* Products */}
          <section className="flex-1">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-semibold text-manioco-brown">Catalogue</h2>
                <p className="text-sm text-manioco-brown/40 mt-0.5">{products.length} produit{products.length > 1 ? 's' : ''} disponible{products.length > 1 ? 's' : ''}</p>
              </div>
            </div>

            {products.length === 0 ? (
              <div className="py-32 flex flex-col items-center justify-center gap-4 bg-white rounded-3xl border border-dashed border-manioco-brown/10">
                <Package size={40} className="text-manioco-brown/20" />
                <p className="text-manioco-brown/40 font-medium text-sm">Aucun produit disponible pour le moment</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((product) => {
                  const rating = (4.5 + Math.random() * 0.8).toFixed(1);

                  const cartItem = cartContext?.items?.find(item => String(item.id) === String(product.id));
                  const isInsufficient = (() => {
                    if (!cartItem || product.stock === undefined || product.stock === null) return false;
                    const UNIT_FACTORS: Record<string, number> = {
                      'Sac': 50,
                      'Demi-sac': 25,
                      'Kg': 1,
                      'Demi-kg': 0.5,
                    };
                    const baseUnit = product.unit || 'Kg';
                    const currentUnit = cartItem.unit || 'Kg';
                    const baseFactor = UNIT_FACTORS[baseUnit] || 1;
                    const currentFactor = UNIT_FACTORS[currentUnit] || 1;
                    const availableWeight = Number(product.stock) * baseFactor;
                    const requestedWeight = Number(cartItem.quantity) * currentFactor;
                    return requestedWeight > availableWeight;
                  })();

                  return (
                    <div key={product.id} className="bg-white rounded-[20px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all border border-transparent hover:border-manioco-brown/5 flex flex-col group">
                      <div className="relative h-[200px] p-4 pb-0">
                        <img
                          src={getRealInternetLink(product)}
                          alt={product.name}
                          className="w-full h-full object-cover rounded-xl group-hover:scale-[1.02] transition-transform duration-500"
                        />
                        <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm flex items-center gap-1.5 z-10">
                          <Star size={12} className="fill-[#F4A261] text-[#F4A261]" />
                          <span className="text-[11px] font-bold text-manioco-brown">{rating}</span>
                        </div>
                      </div>

                      <div className="p-5 pt-4 flex flex-col flex-1">
                        <h3 className="text-[17px] font-semibold text-[#b25a49] mb-1.5 line-clamp-1">{product.name}</h3>
                        <p className="text-[13px] text-manioco-brown/50 leading-relaxed line-clamp-2 mb-4 min-h-[40px]">
                          {product.description || `${product.name} de qualité supérieure, idéal pour accompagner vos repas.`}
                        </p>
                        <div className="mt-auto pt-4 border-t border-manioco-brown/10 flex items-center justify-between">
                          <div>
                            <span className="text-[19px] font-bold text-[#b25a49]">{Number(product.price).toLocaleString('fr-FR')} Fcfa</span>
                            <p className="text-[11px] text-[#b25a49]/40 font-medium mt-0.5">/{product.unit || 'Kg'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="w-10 h-10 rounded-full bg-[#f4f4f4] flex items-center justify-center text-[#b25a49] hover:bg-[#b25a49]/10 transition-colors">
                              <Heart size={16} />
                            </button>
                            {cartContext && !isOwner && (
                              <button
                                onClick={(e) => handleActionClick(e, () => cartContext.addToCart(product))}
                                className="w-10 h-10 rounded-full bg-[#b25a49] flex items-center justify-center text-white hover:bg-manioco-brown transition-colors shadow-sm"
                              >
                                <Plus size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                        {isInsufficient && (
                          <div className="mt-3 pt-2 border-t border-red-100 flex items-center gap-1.5 justify-center text-[11px] font-bold text-red-500 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span>
                            Stock insuffisant (Max: {product.stock} {product.unit || 'Kg'})
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="py-16 border-t border-manioco-brown/5 bg-[#fcfbf7] mt-12">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-12 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-8 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <span className="text-[40px] font-extrabold tracking-tight text-manioco-terracotta font-sans">Mani</span>
            <span className="relative inline-flex items-center justify-center w-[30px] h-[30px] rounded-full bg-[#F4A261] border-[4px] border-manioco-terracotta text-manioco-terracotta text-lg font-black">o</span>
            <span className="text-[40px] font-extrabold tracking-tight text-manioco-terracotta font-sans">c</span>
            <span className="relative inline-flex items-center justify-center w-[30px] h-[30px] rounded-full bg-[#F4A261] border-[4px] border-manioco-terracotta text-manioco-terracotta text-lg font-black">o</span>
          </div>
          <div className="flex items-center justify-center gap-8 mb-10 text-sm text-manioco-brown/60 font-medium">
            <Link href="/" className="hover:text-manioco-terracotta transition-colors">Accueil</Link>
            <Link href="/produits" className="hover:text-manioco-terracotta transition-colors">Nos produits</Link>
            <Link href="/shops" className="hover:text-manioco-terracotta transition-colors">Vendeurs</Link>
          </div>
          <div className="w-[80%] mx-auto h-px bg-manioco-brown/5 mb-8"></div>
          <p className="text-[13px] text-manioco-brown/50 font-medium">© 2026 Manioco. Tout droits réservés</p>
        </div>
      </footer>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
