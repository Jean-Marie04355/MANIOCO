"use client";
import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';
import { 
  Bell, CheckCircle2, Clock, Trash2, 
  ShoppingBag, MessageSquare, AlertCircle, 
  MoreVertical, Check, Loader2, Sparkles, Filter
} from 'lucide-react';
import api from '@/lib/axios';

interface Notification {
  id: string;
  type: 'ORDER' | 'MESSAGE' | 'STOCK' | 'INFO';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata?: string;
}

export default function ClientNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      // Sort by date descending
      const sorted = res.data.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setNotifications(sorted);
    } catch (error) {
      console.error("Erreur chargement notifications", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error("Erreur marquage notification", error);
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Erreur marquage toutes notifications", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error("Erreur suppression notification", error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'ORDER': return <ShoppingBag className="text-amber-500" size={20} />;
      case 'MESSAGE': return <MessageSquare className="text-blue-500" size={20} />;
      case 'STOCK': return <AlertCircle className="text-red-500" size={20} />;
      default: return <Bell className="text-indigo-500" size={20} />;
    }
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => !n.isRead);

  if (isLoading) {
    return (
      <div className="flex bg-luxury-cream/30 min-h-screen font-sans">
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
        <TopNav title="Mes Notifications" isAdmin={false} />
        
        <div className="flex-1 p-8 lg:p-12 overflow-y-auto custom-scrollbar animate-reveal">
          <div className="max-w-5xl mx-auto space-y-10">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-forest-night/5 flex items-center justify-center text-forest-night">
                    <Bell size={18} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-forest-night/40">Restez informé en temps réel</span>
                </div>
                <h1 className="text-5xl font-black tracking-tighter italic uppercase text-forest-night">Centre d&apos;Alertes.</h1>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto">
                 <button 
                  onClick={markAllRead}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white border border-forest-night/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-forest-night hover:text-white transition-all shadow-sm"
                 >
                   <Check size={14} /> Tout marquer comme lu
                 </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-4 p-1.5 bg-white rounded-3xl border border-forest-night/5 shadow-sm w-fit">
              <button 
                onClick={() => setFilter('all')}
                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-forest-night text-white shadow-lg' : 'text-forest-night/40 hover:text-forest-night'}`}
              >
                Toutes ({notifications.length})
              </button>
              <button 
                onClick={() => setFilter('unread')}
                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'unread' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-forest-night/40 hover:text-forest-night'}`}
              >
                Non lues ({notifications.filter(n => !n.isRead).length})
              </button>
            </div>

            {/* Notifications List */}
            <div className="space-y-4">
              {filteredNotifications.length === 0 ? (
                <div className="bg-white rounded-[3rem] p-24 border border-forest-night/5 shadow-xl text-center flex flex-col items-center">
                  <div className="w-20 h-20 bg-luxury-cream rounded-full flex items-center justify-center text-forest-night/10 mb-8">
                    <Sparkles size={32} />
                  </div>
                  <h3 className="text-xl font-black text-forest-night italic uppercase tracking-tighter">Tout est à jour !</h3>
                  <p className="text-[10px] font-black text-forest-night/30 uppercase tracking-[0.2em] mt-2">Vous n&apos;avez aucune notification pour le moment.</p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`group relative bg-white rounded-[2.5rem] border transition-all duration-500 overflow-hidden ${notification.isRead ? 'border-forest-night/5 opacity-70 hover:opacity-100' : 'border-afrigari-gold/20 shadow-xl shadow-afrigari-gold/5 ring-1 ring-afrigari-gold/10'}`}
                  >
                    {!notification.isRead && (
                      <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-afrigari-gold shadow-[0_0_15px_rgba(212,175,55,0.5)]"></div>
                    )}
                    
                    <div className="p-8 flex items-start gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:scale-110 ${notification.isRead ? 'bg-slate-50' : 'bg-luxury-cream'}`}>
                        {getIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0 py-1">
                        <div className="flex justify-between items-start mb-2">
                           <h4 className={`text-lg font-black tracking-tight ${notification.isRead ? 'text-forest-night/60' : 'text-forest-night'}`}>
                            {notification.title}
                           </h4>
                           <span className="text-[9px] font-black text-forest-night/20 uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap">
                             <Clock size={10} />
                             {new Date(notification.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                           </span>
                        </div>
                        <p className={`text-xs font-medium leading-relaxed max-w-2xl ${notification.isRead ? 'text-forest-night/40' : 'text-forest-night/60'}`}>
                          {notification.message}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.isRead && (
                          <button 
                            onClick={() => markAsRead(notification.id)}
                            className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-500 hover:text-white transition-all shadow-sm"
                            title="Marquer comme lu"
                          >
                            <Check size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => deleteNotification(notification.id)}
                          className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
