"use client";
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';
import api from '@/lib/axios';
import { 
    Bell, CheckCircle2, AlertCircle, 
    ShoppingCart, UserPlus, Flag, 
    Trash2, Clock, CheckCheck,
    Loader2
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

export default function AdminNotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await api.get('/notifications');
            setNotifications(response.data);
        } catch (err) {
            console.error("Erreur chargement notifications:");
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error("Erreur marquage lecture:");
        }
    };

    const markAllRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error("Erreur marquage global:");
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(notifications.filter(n => n.id !== id));
        } catch (err) {
            console.error("Erreur suppression:");
        }
    };

    const filteredNotifications = filter === 'unread' 
        ? notifications.filter(n => !n.isRead) 
        : notifications;

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="flex bg-[#f8fafc] min-h-screen text-slate-800 font-sans">
            <Sidebar mode="admin" />
            
            <main className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
                <TopNav title="Centre de Notifications" isAdmin={true} />

                <div className="p-8 max-w-5xl mx-auto w-full flex-1 flex flex-col overflow-hidden">
                    
                    {/* Header Section */}
                    <div className="flex justify-between items-end mb-10">
                        <div className="space-y-2">
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Alertes Système</h2>
                            <p className="text-sm font-bold text-slate-400">Vous avez <span className="text-emerald-500 font-black">{unreadCount}</span> notifications non lues.</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="bg-slate-100 p-1 rounded-2xl flex">
                                <FilterBtn active={filter === 'all'} label="Tout" onClick={() => setFilter('all')} />
                                <FilterBtn active={filter === 'unread'} label="Non lues" onClick={() => setFilter('unread')} />
                            </div>
                            <button 
                                onClick={markAllRead}
                                className="flex items-center gap-2 bg-white border border-slate-100 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all shadow-sm"
                            >
                                <CheckCheck size={16} className="text-emerald-500" />
                                Tout marquer comme lu
                            </button>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-4 pb-10">
                        {loading && (
                            <div className="flex flex-col items-center justify-center py-20 opacity-30">
                                <Loader2 size={40} className="animate-spin mb-4" />
                                <p className="text-xs font-black uppercase tracking-widest">Récupération des alertes...</p>
                            </div>
                        )}
                        {!loading && filteredNotifications.length > 0 && (
                            filteredNotifications.map((noti) => (
                                <NotificationItem 
                                    key={noti.id} 
                                    notification={noti} 
                                    onRead={() => markAsRead(noti.id)}
                                    onDelete={() => deleteNotification(noti.id)}
                                />
                            ))
                        )}
                        {!loading && filteredNotifications.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                                    <Bell size={40} />
                                </div>
                                <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest italic">Silence Radio</h3>
                                <p className="text-xs font-bold text-slate-400 mt-2">Aucune notification à afficher pour le moment.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}</style>
        </div>
    );
}

function FilterBtn({ active, label, onClick }: any) {
    return (
        <button 
            onClick={onClick}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
            {label}
        </button>
    );
}

function NotificationItem({ notification, onRead, onDelete }: any) {
    const isUnread = !notification.isRead;
    
    // Config based on type
    const configs: any = {
        ORDER: { icon: ShoppingCart, color: 'emerald', label: 'Commande' },
        USER: { icon: UserPlus, color: 'blue', label: 'Utilisateur' },
        REPORT: { icon: Flag, color: 'amber', label: 'Signalement' },
        SECURITY: { icon: AlertCircle, color: 'rose', label: 'Sécurité' },
        DEFAULT: { icon: Bell, color: 'slate', label: 'Système' }
    };

    const config = configs[notification.type] || configs.DEFAULT;
    const colors: any = {
        emerald: 'bg-emerald-50 text-emerald-500',
        blue: 'bg-blue-50 text-blue-500',
        amber: 'bg-amber-50 text-amber-500',
        rose: 'bg-rose-50 text-rose-500',
        slate: 'bg-slate-50 text-slate-500'
    };

    const date = new Date(notification.createdAt).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });

    return (
        <div className={`group flex items-start gap-6 p-7 rounded-[2.5rem] border transition-all ${isUnread ? 'bg-white border-emerald-100 shadow-xl shadow-emerald-500/5' : 'bg-white/50 border-slate-100 opacity-70 hover:opacity-100'}`}>
            <div className={`mt-1 p-4 rounded-2xl shrink-0 transition-transform group-hover:scale-110 shadow-sm ${colors[config.color]}`}>
                <config.icon size={22} />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isUnread ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {config.label}
                        </span>
                        {isUnread && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />}
                    </div>
                    <p className="text-[10px] font-bold text-slate-300 flex items-center gap-2">
                        <Clock size={12} />
                        {date}
                    </p>
                </div>
                <h4 className={`text-sm font-black tracking-tight ${isUnread ? 'text-slate-800' : 'text-slate-500'}`}>{notification.title}</h4>
                <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">{notification.message}</p>
                
                {isUnread && (
                    <button 
                        onClick={onRead}
                        className="mt-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                        <CheckCircle2 size={16} />
                        Marquer comme lu
                    </button>
                )}
            </div>

            <button 
                onClick={onDelete}
                className="opacity-0 group-hover:opacity-100 p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
            >
                <Trash2 size={18} />
            </button>
        </div>
    );
}
