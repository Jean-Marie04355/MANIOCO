"use client";
import Sidebar from '../../components/Sidebar';
import {
    Users, Search, Filter, Activity,
    MoreHorizontal, Download, Bell, ShieldAlert, AlertTriangle,
    User, ShoppingBag, Shield, CheckCircle2, XCircle, RefreshCcw
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import api from '@/lib/axios';
export default function StylishUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            if (res.status === 200) {
                const data = res.data;
                // On garde tout sauf le super_admin pour la liste générale
                setUsers(data.filter((u: any) => u.role !== 'super_admin'));
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const filtered = users.filter(u => {
        const matchesSearch = u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'all' || u.role === activeTab;
        return matchesSearch && matchesTab;
    });

    // Stats
    const clientCount = users.filter(u => u.role === 'client').length;
    const sellerCount = users.filter(u => u.role === 'vendeur').length;
    const adminCount = users.filter(u => u.role === 'admin').length;

    const handleExport = () => {
        const dataToExport = filtered;
        if (dataToExport.length === 0) return alert('Aucune donnée à extraire.');

        const headers = ['ID', 'Nom', 'Email', 'Rôle', 'Date de création', 'Statut'];
        const csvRows = [headers.join(',')];

        dataToExport.forEach(u => {
            const date = new Date(u.createdAt).toLocaleDateString('fr-FR');
            const status = u.deletedAt ? 'Suspendu' : 'Actif';
            const values = [
                `"${u.id}"`,
                `"${(u.name || '').replace(/"/g, '""')}"`,
                `"${u.email || ''}"`,
                `"${u.role || ''}"`,
                date,
                status
            ];
            csvRows.push(values.join(','));
        });

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Afrigari_Utilisateurs_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex bg-slate-50 min-h-screen text-slate-800 font-sans">
            <Sidebar mode="super-admin" />
            <main className="flex-1 ml-64 p-12">
                <header className="mb-12 flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-3 text-indigo-600 mb-2">
                            <Users size={18} />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Annuaire_Global</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">
                            Base <span className="text-indigo-600">Utilisateurs</span>
                        </h1>
                        <p className="text-slate-500 text-sm mt-2 font-medium max-w-xl border-l-2 border-indigo-100 pl-4">
                            Surveillance centralisée des comptes Clients, Marchands et Staff.
                        </p>
                    </div>
                    <button 
                        onClick={handleExport}
                        className="bg-white border-2 border-slate-100 hover:border-indigo-600 hover:text-indigo-600 px-8 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-sm hover:shadow-xl"
                    >
                        <Download size={16} />
                        Exporter CSV
                    </button>
                </header>

                {/* Cartes de Compteurs Pop-Art */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    <UserCountCard label="Acheteurs" value={clientCount} icon={User} color="blue" />
                    <UserCountCard label="Marchands" value={sellerCount} icon={ShoppingBag} color="purple" />
                    <UserCountCard label="Staff Admin" value={adminCount} icon={Shield} color="indigo" />
                </div>

                {/* Filtres par Onglets et Recherche */}
                <div className="bg-white border-2 border-slate-100 rounded-[40px] p-6 shadow-sm mb-12 flex flex-col lg:flex-row items-center gap-8">
                    <div className="flex bg-slate-50 p-1.5 rounded-[24px] gap-1">
                        <TabButton active={activeTab === 'all'} label="Tous" count={users.length} onClick={() => setActiveTab('all')} />
                        <TabButton active={activeTab === 'client'} label="Clients" count={clientCount} onClick={() => setActiveTab('client')} />
                        <TabButton active={activeTab === 'vendeur'} label="Vendeurs" count={sellerCount} onClick={() => setActiveTab('vendeur')} />
                        <TabButton active={activeTab === 'admin'} label="Admins" count={adminCount} onClick={() => setActiveTab('admin')} />
                    </div>
                    <div className="flex-1 relative w-full">
                        <div className="absolute inset-y-0 left-6 flex items-center text-slate-400">
                            <Search size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Chercher une identité..."
                            className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 rounded-[28px] pl-16 pr-8 py-4 outline-none transition-all font-bold text-slate-700"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-white border-2 border-slate-100 rounded-[48px] overflow-hidden shadow-2xl shadow-indigo-100/30 animate-reveal">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="p-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Portrait</th>
                                <th className="p-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Identité</th>
                                <th className="p-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Rôle</th>
                                <th className="p-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Membre depuis</th>
                                <th className="p-10 text-right text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Options</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={5} className="p-32 text-center text-slate-400 font-bold italic animate-pulse tracking-widest uppercase text-xs">Extraction des identités...</td></tr>
                            ) : filtered.map(u => (
                                <tr key={u.id} className={`group hover:bg-slate-50/80 transition-colors ${u.deletedAt ? 'opacity-60 bg-slate-50/30' : ''}`}>
                                    <td className="p-10">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner border border-white ${u.role === 'admin' ? 'bg-indigo-600 text-white shadow-indigo-100' :
                                                u.role === 'client' ? 'bg-blue-100 text-blue-600 shadow-blue-50' :
                                                    'bg-purple-100 text-purple-600 shadow-purple-50'
                                            }`}>
                                            {u.name?.charAt(0)}
                                        </div>
                                    </td>
                                    <td className="p-10">
                                        <div className="flex items-center gap-3">
                                            <div className="font-black text-slate-900 uppercase tracking-tighter italic group-hover:text-indigo-600 transition-colors">{u.name}</div>
                                            {u.deletedAt && <span className="bg-rose-100 text-rose-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Suspendu</span>}
                                        </div>
                                        <div className="text-xs text-slate-400 font-bold mt-1 opacity-70">{u.email}</div>
                                    </td>
                                    <td className="p-10">
                                        <RoleBadge role={u.role} />
                                    </td>
                                    <td className="p-10 text-xs font-bold text-slate-400 italic">
                                        {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="p-10 text-right">
                                        <button className="p-3 text-slate-300 hover:text-indigo-600 transition-colors">
                                            <MoreHorizontal size={24} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}

function UserCountCard({ label, value, icon: Icon, color }: any) {
    const variants: any = {
        blue: "bg-blue-600 shadow-blue-100",
        purple: "bg-purple-600 shadow-purple-100",
        indigo: "bg-indigo-600 shadow-indigo-100"
    };
    return (
        <div className={`p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden group ${variants[color]}`}>
            <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-80 italic">{label}</p>
                <h3 className="text-5xl font-black italic tracking-tighter">{value}</h3>
            </div>
            <Icon className="absolute -right-4 -bottom-4 opacity-10 group-hover:rotate-12 transition-transform duration-700" size={140} />
        </div>
    );
}

function TabButton({ active, label, count, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`px-8 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${active ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'
                }`}
        >
            {label}
            <span className={`px-2 py-0.5 rounded-md text-[9px] ${active ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>{count}</span>
        </button>
    );
}

function RoleBadge({ role }: { role: string }) {
    const styles: any = {
        client: "bg-blue-50 text-blue-600 border-blue-100",
        vendeur: "bg-purple-50 text-purple-600 border-purple-100",
        admin: "bg-indigo-50 text-indigo-600 border-indigo-100",
    };
    return (
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest italic ${styles[role]}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${role === 'client' ? 'bg-blue-600' : role === 'vendeur' ? 'bg-purple-600' : 'bg-indigo-600'}`}></div>
            {role === 'admin' ? 'Staff' : role}
        </div>
    );
}
