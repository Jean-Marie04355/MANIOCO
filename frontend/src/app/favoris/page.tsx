"use client";
/* eslint-disable react/no-unescaped-entities */
import {
  Heart,
  ShoppingCart,
  Trash2,
  ArrowLeft,
  Loader2,
  Package,
  Star,
  Plus,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import { useAuth } from '@/features/auth/AuthContext';
import { useCart } from '@/features/cart/CartContext';
import { useFavorites } from '@/features/favorites/FavoritesContext';

interface Product {
  id: string | number;
  name: string;
  image?: string;
  price: number | string;
  unit?: string;
  categoryId?: string | number | null;
  description?: string;
  store?: {
    name?: string;
    city?: string;
  };
}

const getRealInternetLink = (product: Pick<Product, 'name' | 'image'>) => {
  const dbPath = product.image;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  if (!dbPath || String(dbPath).trim() === '' || dbPath === 'null') {
    return 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&q=80&w=800';
  }
  if (dbPath.startsWith('http') || dbPath.startsWith('data:')) return dbPath;
  if (dbPath.includes('uploads/')) {
    const cleanPath = dbPath.startsWith('/') ? dbPath : `/${dbPath}`;
    return `${apiUrl}${cleanPath}`;
  }
  const cleanPath = dbPath.startsWith('/') ? dbPath : `/${dbPath}`;
  return `${apiUrl}/uploads${cleanPath}`;
};

export default function FavoritesPage() {
  const { user, logout } = useAuth();
  const { addToCart, totalItems } = useCart();
  const { toggleFavorite, isFavorited } = useFavorites();
  const router = useRouter();

  const [favorites, setFavorites] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);

    const fetchFavorites = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/favorites');
        setFavorites((res.data || []) as Product[]);
      } catch (err) {
        console.error('Erreur chargement favoris', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [user, router]);

  const handleRemoveFavorite = async (productId: string) => {
    setRemovingId(productId);
    await toggleFavorite(productId);
    setFavorites((prev) => prev.filter((p) => String(p.id) !== productId));
    setRemovingId(null);
  };

  const handleAddToCart = (product: Product) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    addToCart(product);
  };

  return (
    <div className="bg-[#fcfbf7] min-h-screen text-manioco-brown font-sans overflow-x-hidden">

      {/* NAVBAR */}
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
            <Link href="/shops" className="hover:text-manioco-brown transition-colors">Vendeurs</Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Favoris */}
            <Link
              href="/favoris"
              className="relative cursor-pointer group p-2.5 hover:bg-manioco-terracotta/10 rounded-xl transition-all"
              title="Mes Favoris"
            >
              <Heart size={20} className="fill-manioco-terracotta text-manioco-terracotta" />
              {favorites.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-manioco-terracotta text-white text-[9px] flex items-center justify-center rounded-full font-bold shadow-sm border border-white">
                  {favorites.length}
                </span>
              )}
            </Link>

            <button type="button" className="relative cursor-pointer group p-2.5 hover:bg-manioco-terracotta/10 rounded-xl transition-all">
              <ShoppingCart size={20} className="text-manioco-brown/60 group-hover:text-manioco-terracotta transition-colors" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-manioco-terracotta text-white text-[9px] flex items-center justify-center rounded-full font-bold shadow-sm border border-white">
                  {totalItems}
                </span>
              )}
            </button>

            {user ? (
              <div className="relative">
                <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="w-10 h-10 rounded-full border-2 border-manioco-terracotta/20 bg-manioco-cream flex items-center justify-center text-manioco-brown font-bold text-sm">
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

      <main className="pt-24">
        {/* ── Header Banner ───────────────────────── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#b25a49] via-[#c26a58] to-[#d4837a] text-white py-16 px-8 lg:px-12">
          {/* Decorative hearts */}
          <div className="absolute top-0 right-0 w-64 h-64 opacity-10 pointer-events-none">
            <svg viewBox="0 0 200 200" fill="currentColor">
              <path d="M100 180L17 100C-15 68-15 16 17 -16C49 -48 100 -16 100 -16C100 -16 151 -48 183 -16C215 16 215 68 183 100L100 180Z" transform="translate(0 40)" />
            </svg>
          </div>
          <div className="absolute bottom-0 left-0 w-48 h-48 opacity-[0.06] pointer-events-none" style={{ transform: 'rotate(20deg)' }}>
            <svg viewBox="0 0 200 200" fill="currentColor">
              <path d="M100 180L17 100C-15 68-15 16 17 -16C49 -48 100 -16 100 -16C100 -16 151 -48 183 -16C215 16 215 68 183 100L100 180Z" transform="translate(0 40)" />
            </svg>
          </div>

          <div className="max-w-[1400px] mx-auto relative">
            <Link href="/produits" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium mb-6 transition-colors">
              <ArrowLeft size={16} />
              Retour au catalogue
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Heart size={28} className="fill-white text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-[44px] font-medium tracking-tight">Mes Coups de Cœur</h1>
                <p className="text-sm font-medium text-white/80 mt-1">
                  {isLoading ? 'Chargement...' : `${favorites.length} produit${favorites.length !== 1 ? 's' : ''} sauvegardé${favorites.length !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Content ──────────────────────────────── */}
        <div className="max-w-[1400px] mx-auto px-8 lg:px-12 py-12">

          {isLoading ? (
            <div className="py-24 flex justify-center">
              <Loader2 className="w-10 h-10 text-manioco-terracotta animate-spin" />
            </div>
          ) : favorites.length === 0 ? (
            /* ── Empty State ── */
            <div className="flex flex-col items-center justify-center py-28 text-center">
              <div className="relative mb-8">
                <div className="w-28 h-28 rounded-full bg-manioco-terracotta/10 flex items-center justify-center">
                  <Heart size={52} className="text-manioco-terracotta/40" />
                </div>
                <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-[#F4A261]/20 flex items-center justify-center">
                  <Package size={20} className="text-[#F4A261]" />
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-manioco-brown mb-3">Aucun favori pour l'instant</h2>
              <p className="text-manioco-brown/50 text-sm max-w-xs leading-relaxed mb-8">
                Explorez notre catalogue et cliquez sur le cœur ❤️ pour sauvegarder vos produits préférés ici.
              </p>
              <Link
                href="/produits"
                className="inline-flex items-center gap-2 bg-manioco-terracotta text-white px-8 py-3.5 rounded-full hover:bg-manioco-brown transition-all font-semibold shadow-lg shadow-manioco-terracotta/20 hover:shadow-xl hover:-translate-y-0.5"
              >
                Découvrir les produits
                <ArrowLeft size={16} className="rotate-180" />
              </Link>
            </div>
          ) : (
            /* ── Products Grid ── */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favorites.map((product) => {
                const rating = (4.5 + Math.random() * 0.5).toFixed(1);
                const isRemoving = removingId === String(product.id);

                return (
                  <div
                    key={product.id}
                    className={`bg-white rounded-[20px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all border border-transparent hover:border-manioco-brown/5 flex flex-col h-full group ${isRemoving ? 'opacity-50 scale-95' : ''}`}
                    style={{ transition: 'opacity 0.3s, transform 0.3s' }}
                  >
                    {/* Image */}
                    <div className="relative h-[220px] p-4 pb-0">
                      <img
                        src={getRealInternetLink(product)}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-xl group-hover:scale-[1.02] transition-transform duration-500"
                      />
                      {/* Rating */}
                      <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm flex items-center gap-1.5 z-10">
                        <Star size={12} className="fill-[#F4A261] text-[#F4A261]" />
                        <span className="text-[11px] font-bold text-manioco-brown">{rating}</span>
                      </div>
                      {/* Favorited Badge */}
                      <div className="absolute top-6 left-6 bg-manioco-terracotta/90 backdrop-blur-sm p-1.5 rounded-full z-10">
                        <Heart size={12} className="fill-white text-white" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-6 pt-5 flex flex-col flex-1">
                      <h3 className="text-[19px] font-medium text-[#b25a49] mb-2 line-clamp-1">{product.name}</h3>
                      <p className="text-[13px] text-manioco-brown/50 mb-4 line-clamp-3 leading-relaxed min-h-[60px]">
                        {product.description || `${product.name} de qualité supérieure, idéal pour accompagner vos repas.`}
                      </p>

                      {product.store?.name && (
                        <p className="text-[11px] text-manioco-brown/40 font-medium mb-3">
                          🏪 {product.store.name}
                          {product.store.city && ` · ${product.store.city}`}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="mt-auto pt-4 border-t border-manioco-brown/10 flex items-center justify-between">
                        <div>
                          <span className="text-[20px] font-bold text-[#b25a49]">
                            {Number(product.price).toLocaleString('fr-FR')} Fcfa
                          </span>
                          <p className="text-[11px] text-[#b25a49]/40 font-medium mt-0.5">/{product.unit || 'Sachet de 900g'}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Remove from favorites */}
                          <button
                            id={`remove-fav-${product.id}`}
                            onClick={() => handleRemoveFavorite(String(product.id))}
                            disabled={isRemoving}
                            className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 hover:text-red-600 transition-all group/btn"
                            title="Retirer des favoris"
                          >
                            <Trash2 size={15} className="group-hover/btn:scale-110 transition-transform" />
                          </button>
                          {/* Add to cart */}
                          <button
                            id={`cart-fav-${product.id}`}
                            onClick={() => handleAddToCart(product)}
                            className="w-10 h-10 rounded-full bg-[#b25a49] flex items-center justify-center text-white hover:bg-manioco-brown transition-colors shadow-sm"
                          >
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
        </div>
      </main>

      {/* FOOTER */}
      <footer className="py-16 border-t border-manioco-brown/5 bg-[#fcfbf7]">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-12 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-8 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <span className="text-[40px] font-extrabold tracking-tight text-manioco-terracotta font-sans">Mani</span>
            <span className="relative inline-flex items-center justify-center w-[30px] h-[30px] rounded-full bg-[#F4A261] border-[4px] border-manioco-terracotta text-manioco-terracotta text-lg font-black group-hover:scale-110 transition-transform">o</span>
            <span className="text-[40px] font-extrabold tracking-tight text-manioco-terracotta font-sans">c</span>
            <span className="relative inline-flex items-center justify-center w-[30px] h-[30px] rounded-full bg-[#F4A261] border-[4px] border-manioco-terracotta text-manioco-terracotta text-lg font-black group-hover:scale-110 transition-transform">o</span>
          </div>
          <p className="text-[13px] text-manioco-brown/50 font-medium">© 2026 Manioco. Tout droits réservés</p>
        </div>
      </footer>
    </div>
  );
}
