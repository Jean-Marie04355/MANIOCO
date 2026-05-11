"use client";
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';
import api from '@/lib/axios';
import { 
    ShoppingCart, Search,
    User, Store, 
    Clock, CheckCircle2, AlertCircle, 
    Package, CreditCard, 
    ChevronRight, TrendingUp, ShieldCheck, Mail,
    Printer, Phone, Truck,
    History,
    Loader2
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';

export default function AdminOrdersManagement() {
    const [viewMode, setViewMode] = useState<'orders' | 'customers'>('orders');
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [orderFilter, setOrderFilter] = useState<'all' | 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'PAID' | 'CANCELLED'>('all');

    // Fetch orders from backend
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const response = await api.get('/orders');
                setOrders(response.data);
                if (response.data.length > 0) {
                    setSelectedOrder(response.data[0]);
                }
                setError(null);
            } catch (err: any) {
                console.error("Erreur lors du chargement des commandes", err);
                const status = err.response?.status;
                const statusMessages: Record<number, string> = {
                  401: "Session expirée (401). Connectez-vous.",
                  403: "Accès refusé (403). Permissions insuffisantes.",
                  404: "Route introuvable (404). Vérifiez le backend."
                };
                const message = statusMessages[status as number] || "Erreur serveur ou connexion impossible.";
                setError(`[${status || 'ERR'}] ${message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    // Logic for unique customers
    const uniqueCustomers = useMemo(() => {
        const customersMap = new Map();
        
        orders.forEach(order => {
            if (!order.customer) return;
            const email = order.customer.email;
            if (!customersMap.has(email)) {
                customersMap.set(email, {
                    ...order.customer,
                    avatar: order.customer.firstName 
                        ? (order.customer.firstName[0] + (order.customer.lastName?.[0] || '')).toUpperCase() 
                        : 'U',
                    name: `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim(),
                    totalOrders: 0,
                    totalSpent: 0,
                    orders: []
                });
            }
            const cust = customersMap.get(email);
            cust.totalOrders += 1;
            cust.totalSpent += Number(order.totalAmount);
            cust.orders.push({
                ...order,
                date: new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
            });
        });

        return Array.from(customersMap.values());
    }, [orders]);

    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            if (orderFilter === 'all') return true;
            return o.status === orderFilter;
        });
    }, [orders, orderFilter]);

    const counts = {
        all: orders.length,
        pending: orders.filter(o => o.status === 'PENDING').length,
        shipped: orders.filter(o => o.status === 'SHIPPED').length,
        delivered: orders.filter(o => o.status === 'DELIVERED').length
    };

    if (loading && orders.length === 0) {
        return (
            <div className="flex bg-[#f8fafc] min-h-screen items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 size={48} className="animate-spin text-emerald-500 mx-auto" />
                    <p className="text-slate-400 font-bold animate-pulse uppercase tracking-widest text-xs">Initialisation de la tour de contrôle...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex bg-[#f8fafc] min-h-screen text-slate-800 font-sans selection:bg-emerald-100">
            <Sidebar mode="admin" />
            
            <main className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
                <TopNav title="Gestion Commandes & Clients (Réel)" isAdmin={true} />

                {error && (
                    <div className="mx-10 mt-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-shake">
                        <AlertCircle size={18} />
                        {error}
                        <button onClick={() => globalThis.location.reload()} className="ml-auto underline">Réessayer</button>
                    </div>
                )}

                <div className="px-10 py-6 grid grid-cols-4 gap-6 bg-white border-b border-slate-100 shrink-0">
                    <StatCard icon={TrendingUp} label="Total Ventes" value={`${orders.reduce((sum, o) => sum + Number(o.totalAmount), 0).toLocaleString()} FCFA`} color="emerald" />
                    <StatCard icon={Clock} label="En Attente" value={counts.pending} color="amber" highlight={counts.pending > 0} />
                    <StatCard icon={Truck} label="En Transit" value={counts.shipped} color="blue" />
                    <StatCard icon={CheckCircle2} label="Livraisons" value={counts.delivered} color="emerald" />
                </div>

                <div className="flex-1 flex overflow-hidden p-8 gap-8">
                    
                    {/* Left List Area */}
                    <div className="w-[440px] flex flex-col gap-5">
                        <div className="flex bg-slate-100 p-1 rounded-2xl">
                            <ModeToggle active={viewMode === 'orders'} label="Flux Commandes" onClick={() => setViewMode('orders')} />
                            <ModeToggle active={viewMode === 'customers'} label="Fiches Clients" onClick={() => setViewMode('customers')} />
                        </div>

                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Rechercher..."
                                className="w-full bg-white border-none rounded-2xl pl-12 pr-4 py-3.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-100 transition-all shadow-sm"
                            />
                        </div>

                        {viewMode === 'orders' && (
                            <div className="flex gap-1">
                                <FilterTab active={orderFilter === 'all'} label="Tout" count={counts.all} onClick={() => setOrderFilter('all')} />
                                <FilterTab active={orderFilter === 'PENDING'} label="Attente" count={counts.pending} onClick={() => setOrderFilter('PENDING')} alert />
                                <FilterTab active={orderFilter === 'SHIPPED'} label="Transit" count={counts.shipped} onClick={() => setOrderFilter('SHIPPED')} />
                                <FilterTab active={orderFilter === 'DELIVERED'} label="Livré" count={counts.delivered} onClick={() => setOrderFilter('DELIVERED')} />
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                            {viewMode === 'orders' && filteredOrders.length > 0 && filteredOrders.map((order) => (
                                <OrderCardItem 
                                    key={order.id} 
                                    order={order} 
                                    active={selectedOrder?.id === order.id && !selectedCustomer}
                                    onClick={() => { setSelectedOrder(order); setSelectedCustomer(null); }}
                                />
                            ))}
                            
                            {viewMode === 'orders' && filteredOrders.length === 0 && (
                                <div className="py-20 text-center opacity-20"><ShoppingCart size={40} className="mx-auto mb-2"/><p className="text-[10px] font-black uppercase">Aucune commande</p></div>
                            )}

                            {viewMode === 'customers' && uniqueCustomers.length > 0 && uniqueCustomers.map((cust) => (
                                <CustomerCardItem 
                                    key={cust.email} 
                                    customer={cust} 
                                    active={selectedCustomer?.email === cust.email}
                                    onClick={() => { setSelectedCustomer(cust); setSelectedOrder(null); }}
                                />
                            ))}

                            {viewMode === 'customers' && uniqueCustomers.length === 0 && (
                                <div className="py-20 text-center opacity-20"><User size={40} className="mx-auto mb-2"/><p className="text-[10px] font-black uppercase">Aucun client</p></div>
                            )}
                        </div>
                    </div>

                    {/* Right Detail Area */}
                    <div className="flex-1 bg-white rounded-[2.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col overflow-hidden">
                        {selectedOrder && <OrderDisplay order={selectedOrder} />}
                        {!selectedOrder && selectedCustomer && <CustomerDisplay customer={selectedCustomer} />}
                        {!selectedOrder && !selectedCustomer && (
                            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center opacity-20">
                                <ShoppingCart size={100} className="mb-6" />
                                <h2 className="text-xl font-black uppercase tracking-widest text-slate-400">Sélectionnez un élément</h2>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <style jsx global>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake { animation: shake 0.5s ease-in-out; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar { scroll-behavior: smooth; }
            `}</style>
        </div>
    );
}

// Subcomponents
function StatCard({ icon: Icon, label, value, color, highlight }: { readonly icon: any, readonly label: string, readonly value: string | number, readonly color: string, readonly highlight?: boolean }) {
    const colors: any = { emerald: 'text-emerald-500 bg-emerald-50', amber: 'text-amber-500 bg-amber-50', blue: 'text-blue-500 bg-blue-50' };
    return (
        <div className="flex items-center gap-4 group">
            <div className={`p-4 rounded-2xl ${colors[color]} group-hover:scale-110 transition-transform shadow-sm`}>
                <Icon size={22} />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
                <p className={`text-xl font-black ${highlight ? 'text-amber-600' : 'text-slate-800'}`}>{value}</p>
            </div>
        </div>
    );
}

function ModeToggle({ active, label, onClick }: { readonly active: boolean, readonly label: string, readonly onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-white shadow-md text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
            {label}
        </button>
    );
}

function FilterTab({ active, label, count, onClick, alert }: { readonly active: boolean, readonly label: string, readonly count: number, readonly onClick: () => void, readonly alert?: boolean }) {
    return (
        <button 
            onClick={onClick}
            className={`flex-1 py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex flex-col items-center gap-1.5 transition-all ${active ? 'bg-emerald-50 text-emerald-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}
        >
            {label}
            {count > 0 && (
                <span className={`px-2 py-0.5 rounded-md text-[8px] ${getFilterBadgeStyles(active, alert)}`}>
                    {count}
                </span>
            )}
        </button>
    );
}

function OrderCardItem({ order, active, onClick }: { readonly order: any, readonly active: boolean, readonly onClick: () => void }) {
    const statusLabels: any = { PENDING: 'Attente', PAID: 'Payé', SHIPPED: 'Transit', DELIVERED: 'Livré', CANCELLED: 'Annulé' };
    const avatar = getOrderAvatar(order);
    const date = new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

    return (
        <button 
            onClick={onClick}
            className={`w-full p-6 rounded-3xl border transition-all text-left relative group ${active ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-[1.02]' : 'bg-white border-slate-100 hover:border-emerald-200'}`}
        >
            <div className="flex justify-between items-start mb-5">
                <div>
                    <p className={`text-[10px] font-black tracking-widest ${active ? 'text-emerald-400' : 'text-slate-400'}`}>#{order.id.split('-')[0]}</p>
                    <p className={`text-[10px] font-bold ${active ? 'text-slate-400' : 'text-slate-300'}`}>{date}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter border ${active ? 'bg-white/10 border-white/20' : 'bg-slate-50 text-slate-500'}`}>{statusLabels[order.status] || order.status}</span>
            </div>
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs ${active ? 'bg-white/10' : 'bg-slate-50 text-emerald-600'}`}>{avatar}</div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-black tracking-tight">{Number(order.totalAmount).toLocaleString()} FCFA</p>
                    <p className={`text-[10px] font-bold truncate ${active ? 'text-slate-100' : 'text-slate-400'}`}>{order.customer?.firstName} ➔ {order.store?.name || 'Boutique'}</p>
                </div>
            </div>
        </button>
    );
}

function getFilterBadgeStyles(active: boolean, alert?: boolean) {
    if (!active) return 'bg-slate-200 text-slate-500';
    if (alert) return 'bg-rose-500 text-white animate-pulse';
    return 'bg-emerald-500 text-white shadow-xl';
}

function getOrderAvatar(order: any) {
    if (!order.customer?.firstName) return 'U';
    const first = order.customer.firstName[0];
    const last = order.customer.lastName ? order.customer.lastName[0] : '';
    return (first + last).toUpperCase();
}

function CustomerCardItem({ customer, active, onClick }: { readonly customer: any, readonly active: boolean, readonly onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            className={`w-full p-6 rounded-3xl border transition-all text-left group ${active ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-[1.02]' : 'bg-white border-slate-100 hover:border-emerald-200'}`}
        >
            <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm ${active ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-emerald-50 text-emerald-600'}`}>{customer.avatar}</div>
                <div className="flex-1">
                    <h4 className="font-black text-xs uppercase tracking-tight">{customer.name}</h4>
                    <p className={`text-[10px] font-bold ${active ? 'text-slate-100' : 'text-slate-400'}`}>{customer.totalOrders} commandes passées</p>
                </div>
                <ChevronRight size={18} className={active ? 'text-emerald-500' : 'text-slate-200'} />
            </div>
        </button>
    );
}

function OrderDisplay({ order }: { readonly order: any }) {
    const statusLabels: any = { PENDING: 'Attente', PAID: 'Payé', SHIPPED: 'Expédié', DELIVERED: 'Livré', CANCELLED: 'Annulé' };
    const date = new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-12 pb-10 border-b border-slate-50 bg-slate-50/30">
                <div className="flex justify-between items-end">
                    <div className="space-y-4">
                        <span className="px-3 py-1 bg-white border border-slate-100 rounded-lg text-[9px] font-black uppercase text-emerald-600 tracking-widest shadow-sm">ID Dossier : {order.id}</span>
                        <h2 className="text-6xl font-black text-slate-800 tracking-tighter">
                            {Number(order.totalAmount).toLocaleString()} <span className="text-emerald-500 text-3xl">FCFA</span>
                        </h2>
                        <div className="flex gap-6 text-xs font-bold text-slate-400 italic">
                            <span className="flex items-center gap-2"><Clock size={16}/> Enregistrée le {date}</span>
                            <span className="flex items-center gap-2 text-emerald-600 font-black"><CheckCircle2 size={16}/> Statut : {statusLabels[order.status] || order.status}</span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <DetailAction icon={Printer} onClick={() => globalThis.print()} />
                        <DetailAction icon={CreditCard} label="Agir sur Transaction" color="emerald" onClick={() => {}} />
                    </div>
                </div>
            </div>

            <div className="p-12 overflow-y-auto space-y-12 no-scrollbar">
                <div className="grid grid-cols-2 gap-8">
                    <PartyBox title="Client (Destinataire)" name={`${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`} sub={order.customer?.email} icon={User} color="slate" />
                    <PartyBox title="Marchand (Expéditeur)" name={order.store?.name} sub={order.store?.phone || "Contact non renseigné"} icon={Store} color="emerald" />
                </div>

                <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-300 flex items-center gap-3">
                        <div className="w-10 h-[1px] bg-slate-100"></div>
                        Inventaire de la Commande
                    </h3>
                    <div className="bg-slate-50 rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-white border-b border-slate-100"><tr><th className="p-8 text-[10px] font-black uppercase text-slate-300">Désignation Produit</th><th className="p-8 text-center text-[10px] font-black uppercase text-slate-300">Qté</th><th className="p-8 text-right text-[10px] font-black uppercase text-slate-300">Unitaire</th><th className="p-8 text-right text-[10px] font-black uppercase text-slate-300">Total</th></tr></thead>
                            <tbody className="divide-y divide-slate-100">
                                {order.items?.map((it: any) => (
                                    <tr key={it.productId || it.id} className="hover:bg-white transition-colors">
                                        <td className="p-8 font-black text-xs text-slate-700 uppercase tracking-tight">{it.productName}</td>
                                        <td className="p-8 text-center font-bold text-xs">x{it.quantity}</td>
                                        <td className="p-8 text-right font-medium text-xs font-mono">{Number(it.price).toLocaleString()}</td>
                                        <td className="p-8 text-right font-black text-xs font-mono">{(Number(it.price) * it.quantity).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-10 bg-slate-900 text-white flex justify-between items-center px-12">
                            <div><p className="text-[10px] font-black uppercase tracking-widest opacity-70">Taxe Afrigari Collectée (10%)</p><p className="text-2xl font-black italic">{(Number(order.totalAmount) * 0.1).toLocaleString()} FCFA</p></div>
                            <ShieldCheck size={48} className="text-emerald-500" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CustomerDisplay({ customer }: { readonly customer: any }) {
    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-12 border-b border-slate-50 bg-emerald-50/20">
                <div className="flex items-center gap-10">
                    <div className="w-28 h-28 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white text-5xl font-black shadow-2xl">{customer.avatar}</div>
                    <div className="space-y-3">
                        <span className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200">Base de Donnée CRM</span>
                        <h2 className="text-5xl font-black text-slate-800 tracking-tighter uppercase">{customer.name}</h2>
                        <div className="flex gap-6 text-sm font-bold text-slate-400 italic">
                            <span className="flex items-center gap-2"><Mail size={16}/> {customer.email}</span>
                            <span className="flex items-center gap-2"><Phone size={16}/> {customer.phone || 'Non renseigné'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-12 space-y-12 overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-3 gap-6 text-center">
                    <KpiBox label="Activité" value={customer.totalOrders} sub="Commandes" color="slate" />
                    <KpiBox label="Loyauté (CA)" value={customer.totalSpent.toLocaleString() + " FCFA"} sub="Dépenses réelles" color="emerald" />
                    <KpiBox label="Sécurité" value="Vérifié" sub="Compte Actif" color="emerald" />
                </div>

                <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-300 flex items-center gap-3">
                        <History size={18}/> Historique Chronologique
                    </h3>
                    <div className="space-y-4">
                        {customer.orders.slice().reverse().map((o: any) => (
                            <div key={o.id} className="p-8 bg-white border border-slate-100 rounded-[2rem] flex items-center justify-between hover:shadow-xl hover:border-emerald-100 transition-all cursor-pointer">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all"><Package size={24}/></div>
                                    <div><p className="font-black text-xs uppercase text-slate-700">Commande #{o.id.split('-')[0]}</p><p className="text-[11px] font-bold text-slate-400">{o.date}</p></div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black text-emerald-600 font-mono italic">{Number(o.totalAmount).toLocaleString()} FCFA</p>
                                    <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-100`}>{o.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function PartyBox({ title, name, sub, icon: Icon, color }: { readonly title: string, readonly name: string, readonly sub: string, readonly icon: any, readonly color: string }) {
    const styles: any = { slate: 'bg-slate-50 border-slate-100 text-slate-800', emerald: 'bg-emerald-50 border-emerald-100 text-emerald-800 shadow-sm' };
    return (
        <div className={`p-8 rounded-[2.5rem] border ${styles[color]} relative group hover:shadow-md transition-all`}>
            <span className="absolute top-6 right-8 text-[9px] font-black uppercase tracking-widest opacity-30 italic">{title}</span>
            <div className="flex items-center gap-6 mt-4">
                <div className={`p-5 rounded-[1.5rem] ${color==='slate'?'bg-white shadow-sm text-slate-400':'bg-emerald-500 text-white shadow-lg'}`}><Icon size={28} /></div>
                <div className="min-w-0"><h4 className="text-xl font-black tracking-tighter uppercase truncate">{name || 'Inconnu'}</h4><p className="text-xs font-bold opacity-60 flex items-center gap-2 mt-1 truncate"><Mail size={14}/>{sub || 'Aucun contact'}</p></div>
            </div>
        </div>
    );
}

function KpiBox({ label, value, sub, color }: { readonly label: string, readonly value: string | number, readonly sub: string, readonly color: string }) {
    const colors: any = { emerald: 'bg-emerald-50 text-emerald-600', slate: 'bg-slate-900 text-white shadow-xl' };
    return (
        <div className={`p-10 rounded-[2.5rem] ${colors[color]} flex flex-col items-center justify-center transition-transform hover:scale-105`}>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">{label}</p>
            <p className="text-2xl font-black italic tracking-tighter uppercase leading-none">{value}</p>
            <p className="text-[9px] font-bold mt-2 opacity-50 uppercase tracking-widest">{sub}</p>
        </div>
    );
}

function DetailAction({ icon: Icon, label, color, onClick }: { readonly icon: any, readonly label?: string, readonly color?: string, readonly onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            className={`h-14 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 ${color === 'emerald' ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-200 hover:bg-emerald-600' : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-800 shadow-sm'}`}
        >
            <Icon size={18} />
            {label}
        </button>
    );
}
