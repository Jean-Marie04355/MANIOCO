"use client";
import { useState, useRef, useEffect } from 'react';
import { Bell, ChevronDown, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

interface TopNavProps {
  title: string;
  isAdmin: boolean;
}

export default function TopNav({ title, isAdmin }: TopNavProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Optionnel: rafraîchir toutes les minutes
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const unreadCount = notifications.filter(n => n.unread || n.isRead === false).length;

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Erreur lors du marquage des notifications', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error('Erreur lors du marquage de la notification', error);
    }
  };

  const timeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInMs = now.getTime() - past.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMins < 1) return 'À l\'instant';
    if (diffInMins < 60) return `Il y a ${diffInMins} min`;
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    return `Il y a ${diffInDays}j`;
  };

  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = user?.name || (user as any)?.name || 'Utilisateur';
  // Utiliser la photo de profil si elle existe, sinon générer un avatar
  const avatarUrl = user?.profilePhoto 
    ? user.profilePhoto 
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&bold=true`;

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <header className={`h-16 flex items-center justify-between px-8 sticky top-0 z-20 ${
      isAdmin ? 'bg-white border-b border-slate-100' : 'bg-[#151921] border-b border-slate-800'
    }`}>
      <div className="flex items-center gap-4">
        <h1 className={`text-lg font-bold ${isAdmin ? 'text-slate-900' : 'text-white'}`}>{title}</h1>
      </div>

      <div className="flex items-center gap-6">

        <div className="flex items-center gap-3">
          <div className="relative" ref={notificationsRef}>
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className={`p-2 rounded-xl transition-colors relative ${
                isNotificationsOpen 
                  ? (isAdmin ? 'bg-orange-50 text-orange-500' : 'bg-slate-800 text-white')
                  : (isAdmin ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-slate-800 text-slate-400')
              }`}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-100 py-4 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                <div className="px-6 pb-4 border-b border-slate-50 flex justify-between items-center">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-black text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">{unreadCount} NOUVELLES</span>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                  {loading && notifications.length === 0 ? (
                    <div className="px-6 py-8 text-center text-slate-400 text-xs font-medium">Chargement...</div>
                  ) : notifications.length === 0 ? (
                    <div className="px-6 py-8 text-center text-slate-400 text-xs font-medium">Aucune notification</div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        onClick={() => markAsRead(notif.id)}
                        className={`px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 last:border-0 ${!notif.isRead ? 'bg-orange-50/10' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className={`text-xs font-black ${!notif.isRead ? 'text-slate-900' : 'text-slate-400'}`}>{notif.title}</p>
                          <span className="text-[9px] font-bold text-slate-400">{timeAgo(notif.createdAt)}</span>
                        </div>
                        <p className={`text-[11px] font-medium leading-relaxed ${!notif.isRead ? 'text-slate-500' : 'text-slate-300'}`}>{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-6 pt-4 text-center">
                  <button 
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                    className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-orange-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Tout marquer comme lu
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>

          {/* Menu Déroulant Utilisateur */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 pr-2 rounded-xl hover:bg-slate-50 transition-colors py-1 pl-1"
            >
              <img 
                src={avatarUrl}
                className="w-8 h-8 rounded-lg object-cover" 
                alt={displayName}
              />
              <span className={`text-xs font-bold hidden sm:block ${isAdmin ? 'text-slate-900' : 'text-white'}`}>
                {displayName}
              </span>
              <ChevronDown 
                size={14} 
                className={`text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
              />
            </button>

            {/* Contenu du Dropdown */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2 border-b border-slate-100 mb-1">
                  <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
                
                <Link 
                  href="/dashboard/seller/settings/account" 
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <User size={16} /> Mon Profil
                </Link>
                
                <Link 
                  href="/dashboard/seller/settings/store" 
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <Settings size={16} /> Ma Boutique
                </Link>

                <div className="h-px bg-slate-100 my-1"></div>

                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <LogOut size={16} /> Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
