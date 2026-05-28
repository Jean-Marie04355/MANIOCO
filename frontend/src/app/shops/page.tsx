"use client";
/* eslint-disable react/no-unescaped-entities */
import {
  ShoppingCart, Search, ArrowRight, Star, Loader2, MapPin,
  ChevronDown, User as UserIcon, LogOut, Store, Package,
  BadgeCheck, Heart
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuth } from '@/features/auth/AuthContext';
import { useCart } from '@/features/cart/CartContext';

export default function VendeursPage() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const getRealInternetLink = (dbPath: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    if (!dbPath || dbPath === 'null' || String(dbPath).trim() === '') {
      return "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&q=80&w=800";
    }
    if (dbPath.startsWith('data:image') || dbPath.startsWith('http')) return dbPath;
    const cleanPath = dbPath.startsWith('/') ? dbPath : `/${dbPath}`;
    const finalPath = cleanPath.startsWith('/uploads') ? cleanPath : `/uploads${cleanPath}`;
    return `${apiUrl}${finalPath}`;
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);

    const fetchStoresData = async () => {
      try {
        const [storesRes, productsRes] = await Promise.all([
          api.get('/stores'),
          api.get('/products'),
        ]);
        const storesData = storesRes.data || [];
        const productsData = productsRes.data || [];
        const enriched = storesData.map((store: any) => ({
          ...store,
          productsCount: productsData.filter((p: any) => p.storeId === store.id).length,
        }));
        setStores(enriched);
      } catch (err) {
        console.error('Erreur chargement vendeurs', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoresData();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const uniqueCities = Array.from(new Set(stores.map(s => s.city).filter(Boolean))) as string[];

  const filteredStores = stores.filter(shop => {
    const matchesSearch =
      shop.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (shop.description && shop.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCity = activeCity ? shop.city === activeCity : true;
    return matchesSearch && matchesCity;
  });

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
            <Link href="/shops" className="text-manioco-terracotta font-bold bg-manioco-terracotta/5 px-4 py-2 rounded-full">Vendeurs</Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button type="button" className="relative cursor-pointer group p-2.5 hover:bg-manioco-terracotta/10 rounded-xl transition-all">
              <ShoppingCart size={20} className="text-manioco-brown/60 group-hover:text-manioco-terracotta transition-colors" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-manioco-terracotta text-white text-[9px] flex items-center justify-center rounded-full font-bold shadow-sm border border-white">
                  {totalItems}
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

      <main className="pt-24">
        {/* Header Banner */}
        <div className="bg-manioco-terracotta text-white py-14 px-8 lg:px-12">
          <div className="max-w-[1400px] mx-auto">
            <h1 className="text-4xl md:text-[44px] font-medium tracking-tight mb-4">Nos Vendeurs & Producteurs</h1>
            <p className="text-sm font-medium text-white/90">Découvrez les artisans et producteurs béninois vérifiés — des produits authentiques et traçables</p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-[1400px] mx-auto px-8 lg:px-12 py-12">

          {/* Filters & Search Bar */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-10 gap-4">

            {/* City Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto">
              <button
                onClick={() => setActiveCity(null)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-full text-[14px] font-medium transition-all ${!activeCity ? 'bg-manioco-terracotta text-white shadow-md' : 'bg-white text-manioco-brown/70 hover:bg-manioco-terracotta/5 border border-manioco-brown/10 hover:border-manioco-terracotta/20'}`}
              >
                Tous les vendeurs
              </button>
              {uniqueCities.map((city) => (
                <button
                  key={city}
                  onClick={() => setActiveCity(city)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[14px] font-medium transition-all ${activeCity === city ? 'bg-manioco-terracotta text-white shadow-md' : 'bg-white text-manioco-brown/70 hover:bg-manioco-terracotta/5 border border-manioco-brown/10 hover:border-manioco-terracotta/20'}`}
                >
                  <MapPin size={13} />
                  {city}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative self-end lg:self-auto">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-manioco-brown/30 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un vendeur..."
                className="bg-white border border-manioco-brown/10 rounded-full pl-10 pr-5 py-2.5 text-[14px] text-manioco-brown outline-none w-[260px] placeholder:text-manioco-brown/30 shadow-sm hover:border-manioco-terracotta/30 focus:ring-2 focus:ring-manioco-terracotta/20 transition-all"
              />
            </div>
          </div>

          {/* Results count */}
          {!isLoading && (
            <p className="text-sm text-manioco-brown/40 font-medium mb-8">
              {filteredStores.length} vendeur{filteredStores.length > 1 ? 's' : ''} trouvé{filteredStores.length > 1 ? 's' : ''}
              {activeCity && <span> à <span className="text-manioco-terracotta font-semibold">{activeCity}</span></span>}
            </p>
          )}

          {/* Grid */}
          {isLoading ? (
            <div className="py-20 flex justify-center w-full">
              <Loader2 className="w-10 h-10 text-manioco-terracotta animate-spin" />
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center gap-4">
              <Store size={48} className="text-manioco-brown/20" />
              <p className="text-manioco-brown/40 font-medium text-sm">Aucun vendeur trouvé</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredStores.map((shop) => (
                <div
                  key={shop.id}
                  className="bg-white rounded-[20px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all border border-transparent hover:border-manioco-brown/5 flex flex-col group"
                >
                  {/* Cover image */}
                  <div className="relative h-[180px] p-4 pb-0">
                    <img
                      src={getRealInternetLink(shop.profilePhoto)}
                      alt={shop.name}
                      className="w-full h-full object-cover rounded-xl group-hover:scale-[1.02] transition-transform duration-500"
                    />
                    {/* Rating badge */}
                    <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm flex items-center gap-1.5 z-10">
                      <Star size={12} className="fill-[#F4A261] text-[#F4A261]" />
                      <span className="text-[11px] font-bold text-manioco-brown">{shop.rating || '4.9'}</span>
                    </div>
                    {/* Verified badge */}
                    {shop.verified !== false && (
                      <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1.5 z-10">
                        <BadgeCheck size={13} className="text-blue-500 fill-blue-500" />
                        <span className="text-[11px] font-bold text-manioco-brown">Vérifié</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6 pt-5 flex flex-col flex-1">
                    <h3 className="text-[18px] font-semibold text-[#b25a49] mb-1 line-clamp-1">{shop.name}</h3>
                    {shop.city && (
                      <p className="flex items-center gap-1 text-[12px] text-manioco-brown/50 font-medium mb-3">
                        <MapPin size={11} />
                        {shop.city}
                      </p>
                    )}
                    <p className="text-[13px] text-manioco-brown/50 leading-relaxed line-clamp-2 min-h-[40px] mb-4">
                      {shop.description || `${shop.name} — Producteur béninois proposant des produits authentiques et de qualité.`}
                    </p>

                    {/* Stats + CTA */}
                    <div className="mt-auto pt-4 border-t border-manioco-brown/10 flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div>
                          <p className="text-[17px] font-bold text-[#b25a49]">{shop.productsCount}</p>
                          <p className="text-[10px] text-manioco-brown/30 font-medium uppercase tracking-wide">Produits</p>
                        </div>
                        <div className="w-px h-6 bg-manioco-brown/10"></div>
                        <div>
                          <p className="text-[17px] font-bold text-[#b25a49]">{shop.sales || Math.floor(Math.random() * 50) + 5}</p>
                          <p className="text-[10px] text-manioco-brown/30 font-medium uppercase tracking-wide">Ventes</p>
                        </div>
                      </div>
                      <Link
                        href={`/shops/${shop.id}`}
                        className="w-10 h-10 rounded-full bg-[#b25a49] flex items-center justify-center text-white hover:bg-manioco-brown transition-colors shadow-sm"
                      >
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && filteredStores.length > 0 && (
            <div className="flex justify-center items-center gap-3 mt-16 mb-4">
              <button className="w-10 h-10 rounded-full border border-manioco-terracotta/40 flex items-center justify-center text-manioco-terracotta hover:bg-manioco-terracotta/5 transition-colors">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <button className="w-10 h-10 rounded-full bg-manioco-terracotta flex items-center justify-center text-white font-medium text-sm shadow-sm">1</button>
              <button className="w-10 h-10 rounded-full border border-manioco-terracotta/40 flex items-center justify-center text-manioco-terracotta font-medium text-sm hover:bg-manioco-terracotta/5 transition-colors">2</button>
              <button className="w-10 h-10 rounded-full border border-manioco-terracotta/40 flex items-center justify-center text-manioco-terracotta font-medium text-sm hover:bg-manioco-terracotta/5 transition-colors">3</button>
              <button className="w-10 h-10 rounded-full bg-manioco-terracotta flex items-center justify-center text-white hover:bg-manioco-brown shadow-sm transition-colors">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
              </button>
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

          <div className="flex items-center justify-center gap-8 mb-10 text-sm text-manioco-brown/60 font-medium">
            <Link href="/" className="hover:text-manioco-terracotta transition-colors">Accueil</Link>
            <Link href="/produits" className="hover:text-manioco-terracotta transition-colors">Nos produits</Link>
            <Link href="/shops" className="hover:text-manioco-terracotta transition-colors">Vendeurs</Link>
          </div>

          <div className="flex items-center justify-center gap-4 mb-12">
            {['facebook', 'twitter', 'instagram'].map((social) => (
              <a key={social} href="#" className="w-[42px] h-[42px] rounded-full border border-manioco-terracotta/60 flex items-center justify-center text-manioco-terracotta hover:bg-manioco-terracotta hover:text-white transition-all">
                {social === 'facebook' && (
                  <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                )}
                {social === 'twitter' && (
                  <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                )}
                {social === 'instagram' && (
                  <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z"/></svg>
                )}
              </a>
            ))}
          </div>

          <div className="w-[80%] mx-auto h-px bg-manioco-brown/5 mb-8"></div>
          <p className="text-[13px] text-manioco-brown/50 font-medium">© 2026Manioco. Tout droits réservés</p>
        </div>
      </footer>
    </div>
  );
}
