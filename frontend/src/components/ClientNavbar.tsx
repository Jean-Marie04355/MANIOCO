"use client";

import {
  ShoppingCart, MessageSquare, Bell, Heart, LogOut,
  Settings, Clock, User as UserIcon, X, ChevronDown
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import { useAuth } from '@/features/auth/AuthContext';
import { useCart } from '@/features/cart/CartContext';
import { useFavorites } from '@/features/favorites/FavoritesContext';
import CartDrawer from '@/components/CartDrawer';

export default function ClientNavbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { totalFavorites } = useFavorites();
  const router = useRouter();

  const [scrolled, setScrolled] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showSuccessOrder, setShowSuccessOrder] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isNotificationLoading, setIsNotificationLoading] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch notifications & unread messages
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        setIsNotificationLoading(true);
        const [notifRes, unreadNotifRes, unreadChatRes] = await Promise.all([
          api.get('/notifications'),
          api.get('/notifications/unread/count'),
          api.get('/chat/unread-count'),
        ]);
        setNotifications(notifRes.data);
        setUnreadCount(
          typeof unreadNotifRes.data === 'object'
            ? unreadNotifRes.data.count
            : unreadNotifRes.data
        );
        setUnreadMessages(
          typeof unreadChatRes.data === 'object'
            ? unreadChatRes.data.count
            : unreadChatRes.data
        );
      } catch {
        // Silently fail
      } finally {
        setIsNotificationLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {/**/}
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {/**/}
  };

  const timeAgo = (date: string) => {
    const diffInMins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (diffInMins < 1) return 'À l\'instant';
    if (diffInMins < 60) return `Il y a ${diffInMins} min`;
    const diffInHours = Math.floor(diffInMins / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    return `Il y a ${Math.floor(diffInHours / 24)}j`;
  };

  const getAvatarUrl = (u: any) => {
    if (!u?.profilePhoto) return null;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    if (u.profilePhoto.startsWith('http') || u.profilePhoto.startsWith('data:')) return u.profilePhoto;
    const clean = u.profilePhoto.startsWith('/') ? u.profilePhoto : `/${u.profilePhoto}`;
    return u.profilePhoto.includes('uploads/') ? `${apiUrl}${clean}` : `${apiUrl}/uploads${clean}`;
  };

  const pathname = usePathname();
  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const navLink = (href: string, label: string) => {
    const active = isActive(href);
    return (
      <Link
        href={href}
        className={`transition-colors text-sm font-semibold px-4 py-2 rounded-full ${
          active
            ? 'text-manioco-terracotta bg-manioco-terracotta/5 font-bold'
            : 'text-manioco-brown/60 hover:text-manioco-brown hover:bg-manioco-terracotta/5'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[200] transition-all duration-500 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-xl shadow-[0_4px_30px_rgba(92,45,35,0.08)]'
            : 'bg-white/80 backdrop-blur-xl'
        }`}
      >
        <div className="max-w-[1400px] mx-auto flex justify-between items-center px-8 lg:px-12 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 group">
            <span className="text-2xl font-extrabold tracking-tight text-manioco-brown font-sans">Mani</span>
            <span className="relative inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#F4A261] border-[2.5px] border-manioco-brown text-manioco-brown text-sm font-black group-hover:scale-110 transition-transform">o</span>
            <span className="text-2xl font-extrabold tracking-tight text-manioco-brown font-sans">c</span>
            <span className="relative inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#F4A261] border-[2.5px] border-manioco-brown text-manioco-brown text-sm font-black group-hover:scale-110 transition-transform">o</span>
          </Link>

          {/* Nav links */}
          <div className="hidden lg:flex items-center gap-4">
            {navLink('/', 'Accueil')}
            {navLink('/produits', 'Nos produits')}
            {navLink('/shops', 'Vendeurs')}
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-3">

            {/* Messages */}
            <Link
              href="/dashboard/client/messages"
              className="relative cursor-pointer group p-2.5 hover:bg-manioco-terracotta/10 rounded-xl transition-all"
              title="Messages"
            >
              <MessageSquare size={20} className="text-manioco-brown/60 group-hover:text-manioco-terracotta transition-colors" />
              {unreadMessages > 0 && (
                <>
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full animate-ping opacity-75" />
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full font-bold shadow-sm border border-white">
                    {unreadMessages}
                  </span>
                </>
              )}
            </Link>

            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative cursor-pointer group p-2.5 hover:bg-manioco-terracotta/10 rounded-xl transition-all"
                title="Notifications"
              >
                <Bell size={20} className="text-manioco-brown/60 group-hover:text-manioco-terracotta transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full font-bold shadow-sm border border-white animate-bounce">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-manioco-brown/5 py-5 z-[300] animate-fade-up overflow-hidden">
                  <div className="px-6 pb-4 border-b border-manioco-brown/5 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-manioco-brown">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-manioco-terracotta bg-manioco-terracotta/10">
                        {unreadCount} nouvelles
                      </span>
                    )}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {isNotificationLoading && notifications.length === 0 ? (
                      <div className="px-6 py-8 text-center text-manioco-brown/40 text-xs font-medium">Chargement...</div>
                    ) : notifications.length === 0 ? (
                      <div className="px-6 py-8 text-center text-manioco-brown/40 text-xs font-medium">Aucune notification</div>
                    ) : (
                      notifications.map(notif => (
                        <button
                          type="button"
                          key={notif.id}
                          onClick={() => markAsRead(notif.id)}
                          className={`w-full text-left px-6 py-4 hover:bg-manioco-terracotta/5 transition-colors cursor-pointer border-b border-manioco-brown/5 last:border-0 ${notif.isRead ? '' : 'bg-manioco-terracotta/5'}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <p className={`text-xs font-bold ${notif.isRead ? 'text-manioco-brown/40' : 'text-manioco-brown'}`}>{notif.title}</p>
                            <span className="text-[10px] font-medium text-manioco-terracotta ml-2 whitespace-nowrap">{timeAgo(notif.createdAt)}</span>
                          </div>
                          <p className={`text-xs leading-relaxed ${notif.isRead ? 'text-manioco-brown/30' : 'text-manioco-brown/60'}`}>{notif.message}</p>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="px-6 pt-3 text-center">
                    <button
                      onClick={markAllAsRead}
                      disabled={unreadCount === 0}
                      className="text-xs font-semibold text-manioco-terracotta hover:underline transition-colors disabled:opacity-30"
                    >
                      Tout marquer comme lu
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Favoris */}
            <Link
              href="/favoris"
              className="relative cursor-pointer group p-2.5 hover:bg-manioco-terracotta/10 rounded-xl transition-all"
              title="Mes Favoris"
            >
              <Heart
                size={20}
                className={`text-manioco-brown/60 group-hover:text-manioco-terracotta transition-colors ${totalFavorites > 0 ? 'fill-manioco-terracotta text-manioco-terracotta' : ''}`}
              />
              {totalFavorites > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-manioco-terracotta text-white text-[9px] flex items-center justify-center rounded-full font-bold shadow-sm border border-white">
                  {totalFavorites}
                </span>
              )}
            </Link>

            {/* Panier */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative cursor-pointer group p-2.5 hover:bg-manioco-terracotta/10 rounded-xl transition-all"
              title="Mon panier"
            >
              <ShoppingCart size={20} className="text-manioco-brown/60 group-hover:text-manioco-terracotta transition-colors" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-manioco-terracotta text-white text-[9px] flex items-center justify-center rounded-full font-bold shadow-sm border border-white">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Profil */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-10 h-10 rounded-full border-2 border-manioco-terracotta/20 shadow-md hover:scale-105 transition-all overflow-hidden bg-manioco-cream flex items-center justify-center text-manioco-brown font-bold text-sm"
              >
                {getAvatarUrl(user) ? (
                  <img src={getAvatarUrl(user)!} alt={user?.name || 'Profil'} className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                )}
              </button>

              {isProfileOpen && (
                <div className="absolute top-14 right-0 w-64 bg-white shadow-2xl rounded-3xl p-5 z-[300] border border-manioco-brown/5 animate-fade-up">
                  <div className="flex flex-col items-center mb-5">
                    <div className="w-14 h-14 rounded-full border-2 border-manioco-terracotta/20 mb-2 overflow-hidden bg-manioco-cream flex items-center justify-center text-manioco-brown text-lg font-bold">
                      {getAvatarUrl(user) ? (
                        <img src={getAvatarUrl(user)!} alt={user?.name || 'Profil'} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <span>{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                      )}
                    </div>
                    <h4 className="font-bold text-base text-manioco-brown text-center">{user?.name || 'Utilisateur'}</h4>
                    <p className="text-[10px] font-semibold text-manioco-terracotta uppercase tracking-wider mt-0.5">{user?.role || 'Client'}</p>
                  </div>
                  <div className="space-y-1">
                    <Link href="/dashboard/client/messages" onClick={() => setIsProfileOpen(false)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-manioco-terracotta/5 transition-all group">
                      <MessageSquare size={16} className="text-manioco-brown/30 group-hover:text-manioco-terracotta" />
                      <span className="text-xs font-semibold text-manioco-brown/60 group-hover:text-manioco-brown">Conversations</span>
                    </Link>
                    <Link href="/dashboard/client/orders" onClick={() => setIsProfileOpen(false)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-manioco-terracotta/5 transition-all group">
                      <Clock size={16} className="text-manioco-brown/30 group-hover:text-manioco-terracotta" />
                      <span className="text-xs font-semibold text-manioco-brown/60 group-hover:text-manioco-brown">Commandes</span>
                    </Link>
                    <Link href="/dashboard/client/settings" onClick={() => setIsProfileOpen(false)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-manioco-terracotta/5 transition-all group">
                      <Settings size={16} className="text-manioco-brown/30 group-hover:text-manioco-terracotta" />
                      <span className="text-xs font-semibold text-manioco-brown/60 group-hover:text-manioco-brown">Paramètres</span>
                    </Link>
                    <div className="h-px bg-manioco-brown/5 my-3 mx-2" />
                    <button onClick={() => logout()} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-red-500 transition-all">
                      <LogOut size={16} />
                      <span className="text-xs font-semibold">Déconnexion</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onSuccess={() => { setShowSuccessOrder(true); setIsCartOpen(false); }}
      />

      {/* Success Modal */}
      {showSuccessOrder && (
        <div className="fixed inset-0 z-[500] bg-manioco-brown/80 backdrop-blur-sm flex items-center justify-center p-8 animate-fade-up">
          <div className="bg-white rounded-3xl p-12 text-center max-w-md shadow-2xl">
            <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg text-3xl">✓</div>
            <h3 className="text-2xl font-bold text-manioco-brown mb-3">Commande Confirmée !</h3>
            <p className="text-sm text-manioco-brown/50 mb-8 leading-relaxed">Votre commande a été transmise au producteur. Un SMS de confirmation vous sera envoyé.</p>
            <button onClick={() => setShowSuccessOrder(false)} className="bg-manioco-terracotta text-white px-8 py-3 rounded-full font-semibold text-sm shadow-md hover:bg-manioco-brown transition-all">
              Génial !
            </button>
          </div>
        </div>
      )}
    </>
  );
}
