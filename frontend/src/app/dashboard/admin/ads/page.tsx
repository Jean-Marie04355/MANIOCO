"use client";
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';
import { 
    Megaphone, Plus, Trash2, Edit3, 
    Power, Image as ImageIcon,
    Eye, MousePointer2
} from 'lucide-react';
import React, { useState } from 'react';

// Données fictives simples
const INITIAL_ADS = [
    {
        id: "AD-001",
        title: "Soldes d'Été 2026",
        type: "BANNER",
        status: "ACTIVE",
        clicks: 1240,
        views: 8900,
        image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=600",
        link: "/shop/promo"
    },
    {
        id: "AD-002",
        title: "Livraison gratuite ce Dimanche",
        type: "NOTICE",
        status: "INACTIVE",
        clicks: 0,
        views: 450,
        image: null,
        link: null
    }
];

export default function AdminAdsPage() {
    const [ads, setAds] = useState(INITIAL_ADS);

    const toggleStatus = (id: string) => {
        setAds(ads.map(ad => 
            ad.id === id ? { ...ad, status: ad.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : ad
        ));
    };

    return (
        <div className="flex bg-[#f8fafc] min-h-screen text-slate-800 font-sans">
            <Sidebar mode="admin" />
            
            <main className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
                <TopNav title="Gestion des Annonces" isAdmin={true} />

                <div className="p-8 space-y-8 flex-1 overflow-y-auto">
                    
                    {/* Header Action */}
                    <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Mes Campagnes</h2>
                            <p className="text-sm text-slate-400 font-medium">Gérez vos bannières et messages promotionnels en direct.</p>
                        </div>
                        <button className="flex items-center gap-3 bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-emerald-100 hover:scale-105 transition-all">
                            <Plus size={18} />
                            Nouvelle Annonce
                        </button>
                    </div>

                    {/* Ads Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {ads.map((ad) => (
                            <div key={ad.id} className={`bg-white rounded-[2.5rem] border transition-all overflow-hidden relative group ${ad.status === 'INACTIVE' ? 'opacity-60 border-slate-100' : 'border-emerald-100 shadow-xl shadow-emerald-500/5'}`}>
                                
                                {/* Status Toggle Overlay */}
                                <div className="absolute top-6 right-6 z-10 flex gap-2">
                                    <button 
                                        onClick={() => toggleStatus(ad.id)}
                                        className={`p-3 rounded-xl transition-all ${ad.status === 'ACTIVE' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
                                    >
                                        <Power size={18} />
                                    </button>
                                    <button className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-rose-500 rounded-xl transition-all shadow-sm">
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div className="flex flex-col md:flex-row h-full">
                                    {/* Preview Block */}
                                    <div className="w-full md:w-56 bg-slate-50 flex items-center justify-center relative bg-cover bg-center" style={ad.image ? {backgroundImage: `url(${ad.image})`} : {}}>
                                        {!ad.image && <Megaphone className="text-slate-200" size={48} />}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <ImageIcon className="text-white" size={24} />
                                        </div>
                                    </div>

                                    {/* Content Block */}
                                    <div className="flex-1 p-8 space-y-6">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${ad.type === 'BANNER' ? 'bg-blue-50 text-blue-500' : 'bg-amber-50 text-amber-500'}`}>
                                                    {ad.type === 'BANNER' ? 'Bannière Image' : 'Alerte Texte'}
                                                </span>
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${ad.status === 'ACTIVE' ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                    ● {ad.status === 'ACTIVE' ? 'Active' : 'Désactivée'}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{ad.title}</h3>
                                            <p className="text-xs text-slate-400 line-clamp-1 mt-1 font-medium">{ad.link || "Aucun lien cible"}</p>
                                        </div>

                                        {/* Simple Stats */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-slate-50 px-4 py-3 rounded-2xl">
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Vues</p>
                                                <div className="flex items-center gap-2">
                                                    <Eye size={12} className="text-slate-400" />
                                                    <span className="text-sm font-black italic">{ad.views}</span>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 px-4 py-3 rounded-2xl">
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Clics</p>
                                                <div className="flex items-center gap-2">
                                                    <MousePointer2 size={12} className="text-slate-400" />
                                                    <span className="text-sm font-black italic">{ad.clicks}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button className="w-full flex items-center justify-center gap-3 py-4 bg-slate-50 hover:bg-slate-900 hover:text-white transition-all rounded-2xl text-[10px] font-black uppercase tracking-widest">
                                            <Edit3 size={16} />
                                            Modifier l'annonce
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
