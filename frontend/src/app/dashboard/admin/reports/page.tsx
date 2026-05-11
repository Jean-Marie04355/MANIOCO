"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';
import {
  Flag, AlertOctagon, Eye, MessageSquare, ShieldOff, Ban,
  XCircle, CheckCircle2, Loader2, ChevronDown, ChevronUp,
  User, Store, ShoppingCart, FileText, Clock, AlertTriangle
} from 'lucide-react';
import api from '@/lib/axios';

// ─── Types ──────────────────────────────────────────────────────────────────
interface Report {
  id: string;
  reason: string;
  description: string;
  status: 'NEW' | 'INVESTIGATING' | 'RESOLVED' | 'REJECTED';
  internalNote?: string;
  createdAt: string;
  orderId?: string;
  order?: { id: string; totalAmount: number; status: string };
  reporter?: { id: string; name: string; email: string };
  seller?: { id: string; name: string; email: string };
  sellerReportCount?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const REASON_LABELS: Record<string, string> = {
  ARNAQUE: 'Arnaque / Fraude',
  'CONTREFAÇON': 'Produit non conforme',
  OFFENSANT: 'Comportement inapproprié',
  RETARD: 'Retard abusif / Non livré',
  AUTRE: 'Autre problème',
};

const STATUS_CONFIG = {
  NEW:          { label: 'Nouveau',           color: 'bg-red-100 text-red-600',     dot: 'bg-red-500' },
  INVESTIGATING:{ label: 'En cours d\'enquête', color: 'bg-amber-100 text-amber-600', dot: 'bg-amber-500' },
  RESOLVED:     { label: 'Résolu',             color: 'bg-green-100 text-green-600', dot: 'bg-green-500' },
  REJECTED:     { label: 'Rejeté',             color: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
};

// ─── Mock data (remplacer par api.get('/reports') quand la route existe) ─────
const MOCK_REPORTS: Report[] = [
  {
    id: 'rpt-001', reason: 'ARNAQUE', description: 'Le vendeur a encaissé le paiement mais n\'a jamais expédié la commande malgré plusieurs relances.',
    status: 'NEW', createdAt: new Date(Date.now() - 3600000).toISOString(),
    orderId: 'ord-A1B2C3',
    order: { id: 'ord-A1B2C3', totalAmount: 45000, status: 'PAID' },
    reporter: { id: 'u1', name: 'Marie Kone', email: 'marie@example.com' },
    seller:   { id: 's1', name: 'Boutique Gari Pro', email: 'garipro@example.com' },
    sellerReportCount: 4,
  },
  {
    id: 'rpt-002', reason: 'CONTREFAÇON', description: 'Le produit reçu ne correspond pas du tout à la description. Il s\'agit clairement d\'un faux.',
    status: 'INVESTIGATING', createdAt: new Date(Date.now() - 86400000).toISOString(),
    internalNote: 'Vendeur contacté par email le 03/05. En attente de sa réponse.',
    orderId: 'ord-D4E5F6',
    order: { id: 'ord-D4E5F6', totalAmount: 12000, status: 'DELIVERED' },
    reporter: { id: 'u2', name: 'Jean Mensah', email: 'jean@example.com' },
    seller:   { id: 's2', name: 'AgroTerre SARL', email: 'agroterre@example.com' },
    sellerReportCount: 1,
  },
  {
    id: 'rpt-003', reason: 'OFFENSANT', description: 'Le vendeur a été très agressif dans la messagerie suite à ma réclamation.',
    status: 'RESOLVED', createdAt: new Date(Date.now() - 172800000).toISOString(),
    internalNote: 'Avertissement envoyé au vendeur. Cas classé.',
    orderId: 'ord-G7H8I9',
    order: { id: 'ord-G7H8I9', totalAmount: 8500, status: 'DELIVERED' },
    reporter: { id: 'u3', name: 'Fatima Diallo', email: 'fatima@example.com' },
    seller:   { id: 's3', name: 'Ferme Bio Lokossa', email: 'lokossa@example.com' },
    sellerReportCount: 2,
  },
];

// ─── Page principale ──────────────────────────────────────────────────────────
export default function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/reports');
        setReports(res.data);
      } catch (error) {
        // Route pas encore créée → on utilise les données de démo
        setReports(MOCK_REPORTS);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const filtered = filterStatus === 'ALL'
    ? reports
    : reports.filter(r => r.status === filterStatus);

  const updateStatus = async (id: string, status: Report['status'], note?: string) => {
    setActionLoading(id + status);
    try {
      await api.patch(`/reports/${id}`, { status, internalNote: note });
      setReports(prev => prev.map(r => r.id === id ? { ...r, status, internalNote: note ?? r.internalNote } : r));
      setExpandedId(null);
    } finally {
      setActionLoading(null);
    }
  };

  const suspendSeller = async (sellerId: string, reportId: string) => {
    setActionLoading('suspend-' + reportId);
    try {
      await api.patch(`/users/${sellerId}/suspend`);
      alert('Boutique suspendue temporairement.');
    } finally {
      setActionLoading(null);
    }
  };

  const banSeller = async (sellerId: string, reportId: string) => {
    if (!confirm('Bannir définitivement ce vendeur ? Cette action est irréversible.')) return;
    setActionLoading('ban-' + reportId);
    try {
      await api.patch(`/users/${sellerId}/ban`);
      alert('Vendeur banni.');
    } finally {
      setActionLoading(null);
    }
  };

  const counts = {
    ALL: reports.length,
    NEW: reports.filter(r => r.status === 'NEW').length,
    INVESTIGATING: reports.filter(r => r.status === 'INVESTIGATING').length,
    RESOLVED: reports.filter(r => r.status === 'RESOLVED').length,
    REJECTED: reports.filter(r => r.status === 'REJECTED').length,
  };

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar mode="admin" />
      <main className="flex-1 ml-64">
        <TopNav title="Signalements" isAdmin={true} />
        <div className="p-8 space-y-6">

          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-orange-500 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl shadow-red-500/20">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <Flag size={28} />
                <h2 className="text-3xl font-black">Centre de Signalements</h2>
              </div>
              <p className="text-red-100 font-medium">
                Gérez les litiges signalés par les clients contre les vendeurs.
              </p>
            </div>
            <div className="absolute right-[-20px] top-[-20px] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          </div>

          {/* KPI rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: 'NEW', label: 'Nouveaux', icon: AlertOctagon, color: 'text-red-500 bg-red-50' },
              { key: 'INVESTIGATING', label: 'En enquête', icon: Eye, color: 'text-amber-500 bg-amber-50' },
              { key: 'RESOLVED', label: 'Résolus', icon: CheckCircle2, color: 'text-green-500 bg-green-50' },
              { key: 'REJECTED', label: 'Rejetés', icon: XCircle, color: 'text-slate-400 bg-slate-100' },
            ].map(({ key, label, icon: Icon, color }) => (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                className={`bg-white p-5 rounded-2xl shadow-sm border transition-all hover:shadow-md text-left ${filterStatus === key ? 'border-slate-900 ring-2 ring-slate-900/5' : 'border-slate-100'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                  <Icon size={20} />
                </div>
                <p className="text-2xl font-black text-slate-900">{counts[key as keyof typeof counts]}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{label}</p>
              </button>
            ))}
          </div>

          {/* Filtres */}
          <div className="flex items-center gap-3 flex-wrap">
            {['ALL', 'NEW', 'INVESTIGATING', 'RESOLVED', 'REJECTED'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${filterStatus === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}
              >
                {s === 'ALL' ? `Tous (${counts.ALL})` : STATUS_CONFIG[s as Report['status']].label}
              </button>
            ))}
          </div>

          {/* Tableau */}
          {isLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 size={40} className="animate-spin text-orange-500" />
            </div>
          ) : null}

          {!isLoading && filtered.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-16 text-center border border-slate-100">
              <Flag size={48} className="mx-auto mb-4 text-slate-200" />
              <p className="font-black text-slate-400 uppercase text-sm tracking-widest">Aucun signalement</p>
            </div>
          ) : null}

          {!isLoading && filtered.length > 0 ? (
            <div className="space-y-4">
              {filtered.map(report => {
                const cfg = STATUS_CONFIG[report.status];
                const isUrgent = report.reason === 'ARNAQUE' && report.status === 'NEW';
                const isExpanded = expandedId === report.id;

                return (
                  <div
                    key={report.id}
                    className={`bg-white rounded-[2rem] border shadow-sm transition-all ${isUrgent ? 'border-red-200 ring-2 ring-red-500/10' : 'border-slate-100'}`}
                  >
                    {/* ── Ligne principale ── */}
                    <div className="p-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">

                      {/* Niveau urgence */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isUrgent ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-slate-100 text-slate-500'}`}>
                          <AlertOctagon size={22} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            {isUrgent && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-red-200">
                                🔴 Urgent
                              </span>
                            )}
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-widest rounded-full">
                              {REASON_LABELS[report.reason] ?? report.reason}
                            </span>
                            {report.sellerReportCount && report.sellerReportCount > 2 && (
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[9px] font-black uppercase tracking-widest rounded-full flex items-center gap-1">
                                <AlertTriangle size={10} /> {report.sellerReportCount} signalements ce vendeur
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-bold text-slate-700 truncate">{report.description}</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-widest">
                            <Clock size={10} className="inline mr-1" />
                            {new Date(report.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      {/* Parties */}
                      <div className="flex gap-6 shrink-0 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                            <User size={14} />
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Client</p>
                            <p className="font-bold text-slate-700">{report.reporter?.name ?? '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                            <Store size={14} />
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Vendeur</p>
                            <p className="font-bold text-slate-700">{report.seller?.name ?? '—'}</p>
                          </div>
                        </div>
                        {report.order && (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                              <ShoppingCart size={14} />
                            </div>
                            <div>
                              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Commande</p>
                              <p className="font-bold text-slate-700">#{report.order.id.substring(4, 10).toUpperCase()}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Statut + toggle */}
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : report.id)}
                          className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-all"
                        >
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* ── Panneau d'actions (expandé) ── */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 p-6 space-y-6">

                        {/* Description complète */}
                        <div className="bg-slate-50 rounded-2xl p-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                            <FileText size={12} /> Description complète
                          </p>
                          <p className="text-sm text-slate-700 font-medium">{report.description}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                          {/* A. Enquête */}
                          <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-3 flex items-center gap-2">
                              <Eye size={12} /> Enquête
                            </p>
                            <div className="space-y-2">
                              {report.order && (
                                <a
                                  href={`/dashboard/admin/orders`}
                                  className="flex items-center gap-2 w-full px-3 py-2 bg-white rounded-xl text-blue-700 text-xs font-bold hover:bg-blue-100 transition-all border border-blue-100"
                                >
                                  <ShoppingCart size={14} /> Voir la commande · {Number(report.order.totalAmount).toLocaleString()} FCFA
                                </a>
                              )}
                              <Link
                                href={`/dashboard/admin/reports/chat/${report.reporter?.id}/${report.seller?.id}`}
                                className="flex items-center gap-2 w-full px-3 py-2 bg-white rounded-xl text-blue-700 text-xs font-bold hover:bg-blue-100 transition-all border border-blue-100"
                              >
                                <MessageSquare size={14} /> Voir la messagerie
                              </Link>
                            </div>
                          </div>

                          {/* B. Sanctions vendeur */}
                          <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-3 flex items-center gap-2">
                              <Store size={12} /> Sanctions vendeur
                            </p>
                            <div className="space-y-2">
                              <button
                                onClick={() => suspendSeller(report.seller?.id ?? '', report.id)}
                                disabled={actionLoading === 'suspend-' + report.id}
                                className="flex items-center gap-2 w-full px-3 py-2 bg-white rounded-xl text-orange-600 text-xs font-bold hover:bg-orange-100 transition-all border border-orange-200 disabled:opacity-50"
                              >
                                {actionLoading === 'suspend-' + report.id
                                  ? <Loader2 size={14} className="animate-spin" />
                                  : <ShieldOff size={14} />}
                                Suspendre la boutique
                              </button>
                              <button
                                onClick={() => banSeller(report.seller?.id ?? '', report.id)}
                                disabled={actionLoading === 'ban-' + report.id}
                                className="flex items-center gap-2 w-full px-3 py-2 bg-white rounded-xl text-red-600 text-xs font-bold hover:bg-red-50 transition-all border border-red-200 disabled:opacity-50"
                              >
                                {actionLoading === 'ban-' + report.id
                                  ? <Loader2 size={14} className="animate-spin" />
                                  : <Ban size={14} />}
                                Bannir le vendeur
                              </button>
                            </div>
                          </div>

                          {/* C. Décision finale */}
                          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                              <CheckCircle2 size={12} /> Décision
                            </p>
                            <div className="space-y-2">
                              <button
                                onClick={() => updateStatus(report.id, 'INVESTIGATING')}
                                disabled={!!actionLoading}
                                className="flex items-center gap-2 w-full px-3 py-2 bg-white rounded-xl text-amber-600 text-xs font-bold hover:bg-amber-50 transition-all border border-amber-200 disabled:opacity-50"
                              >
                                <Eye size={14} /> Marquer "En enquête"
                              </button>
                              <button
                                onClick={() => updateStatus(report.id, 'REJECTED')}
                                disabled={!!actionLoading}
                                className="flex items-center gap-2 w-full px-3 py-2 bg-white rounded-xl text-slate-500 text-xs font-bold hover:bg-slate-100 transition-all border border-slate-200 disabled:opacity-50"
                              >
                                <XCircle size={14} /> Rejeter le signalement
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* D. Note interne + Clôturer */}
                        <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-3 flex items-center gap-2">
                            <FileText size={12} /> Note interne (visible admins uniquement)
                          </p>
                          {report.internalNote && (
                            <div className="bg-white rounded-xl p-3 mb-3 border border-emerald-100 text-xs text-slate-600 font-medium italic">
                              📝 {report.internalNote}
                            </div>
                          )}
                          <div className="flex gap-3">
                            <textarea
                              value={noteInput[report.id] ?? ''}
                              onChange={e => setNoteInput(prev => ({ ...prev, [report.id]: e.target.value }))}
                              placeholder="Ex : Vendeur contacté par email, en attente de réponse..."
                              className="flex-1 bg-white rounded-xl p-3 text-sm text-slate-700 border border-emerald-200 outline-none focus:ring-2 focus:ring-emerald-300 resize-none min-h-[70px] font-medium"
                            />
                            <button
                              onClick={() => updateStatus(report.id, 'RESOLVED', noteInput[report.id])}
                              disabled={!noteInput[report.id]?.trim() || !!actionLoading}
                              className="px-5 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 self-end shadow-lg shadow-emerald-500/20"
                            >
                              {actionLoading?.includes(report.id)
                                ? <Loader2 size={16} className="animate-spin" />
                                : <CheckCircle2 size={16} />}
                              Clôturer
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
