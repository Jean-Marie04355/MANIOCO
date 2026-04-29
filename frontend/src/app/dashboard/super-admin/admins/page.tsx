"use client";
import Sidebar from '../../components/Sidebar';
import {
  Users, UserCheck, Shield, Plus, Search,
  MoreHorizontal, Edit2, Lock, PowerOff, X, Loader2,
  Mail, ShieldAlert, Zap, Trash2, CheckCircle2, RotateCcw,
  Activity, Award, Anchor
} from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';
export default function StylishAdminsPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // États de création
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  // États d'édition
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({ name: '', email: '' });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/users/admin/all');
      if (res.status === 200) {
        const data = res.data;
        setAdmins(data.filter((u: any) => {
          const role = (u.role || '').toLowerCase();
          return role.includes('admin');
        }));
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.post('/users/admin', { ...formData, role: 'admin' });

      setShowModal(false);
      setFormData({ name: '', email: '', password: '' });
      fetchAdmins();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await api.patch(`/users/${editingAdmin.id}`, editFormData);

      setShowEditModal(false);
      fetchAdmins();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (admin: any) => {
    const isSuspended = !!admin.deletedAt;
    const url = `/users/${admin.id}${isSuspended ? '/restore' : ''}`;
    const method = isSuspended ? 'PATCH' : 'DELETE';

    try {
      const res = await api({
        url,
        method
      });
      if (res.status === 200) fetchAdmins();
    } catch (err) { console.error(err); }
  };

  const permanentlyDelete = async (admin: any) => {
    if (!confirm(`ATTENTION : Voulez-vous vraiment supprimer DÉFINITIVEMENT l'accès de ${admin.name} ? Cette action est irréversible.`)) {
      return;
    }

    try {
      const res = await api.delete(`/users/${admin.id}/permanent`);
      if (res.status === 200) fetchAdmins();
    } catch (err) { console.error(err); }
  };

  const openEdit = (admin: any) => {
    setEditingAdmin(admin);
    setEditFormData({ name: admin.name, email: admin.email });
    setShowEditModal(true);
  };

  const filtered = admins.filter(a =>
    a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats calculées
  const activeCount = admins.filter(a => !a.deletedAt).length;
  const suspendedCount = admins.filter(a => a.deletedAt).length;
  const seniorCount = admins.filter(a => a.role === 'super_admin').length;

  return (
    <div className="flex bg-slate-50 min-h-screen text-slate-800 font-sans">
      <Sidebar mode="super-admin" />
      <main className="flex-1 ml-64 p-12">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-3 text-indigo-600 mb-2">
              <Shield size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Administration_Système</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">
              Équipe de <span className="text-indigo-600">Garde</span>
            </h1>
            <p className="text-slate-500 text-sm mt-2 font-medium max-w-xl border-l-2 border-indigo-100 pl-4">
              Configuration et déploiement de l'unité Citadel.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="group bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-[28px] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 hover:-translate-y-1 transition-all duration-300 flex items-center gap-3"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-500" />
            Accréditer un Agent
          </button>
        </header>

        {/* Section Stats "Intéressante" */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <AdminStatCard label="Unités Actives" value={activeCount} icon={Shield} color="emerald" sub="Opérationnel" />
          <AdminStatCard label="Hauts Gradés" value={seniorCount} icon={Award} color="indigo" sub="Niveau de Droit 2" />
          <AdminStatCard label="Accès Révoqués" value={suspendedCount} icon={ShieldAlert} color="rose" sub="En attente d'audit" />
        </div>

        {/* Recherche */}
        <div className="relative mb-12 group">
          <div className="absolute inset-y-0 left-8 flex items-center text-slate-400 group-focus-within:text-indigo-600 transition-colors">
            <Search size={22} strokeWidth={3} />
          </div>
          <input
            type="text"
            placeholder="Rechercher un agent par identité..."
            className="w-full bg-white border-2 border-slate-100 rounded-[32px] pl-20 pr-8 py-7 outline-none focus:border-indigo-600 shadow-sm transition-all font-bold text-lg italic"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="bg-white border-2 border-slate-100 rounded-[48px] overflow-hidden shadow-2xl shadow-indigo-100/20 animate-reveal">
          <table className="w-full text-left border-collapse font-sans">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-10 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Identité_Vérifiée</th>
                <th className="p-10 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Grade</th>
                <th className="p-10 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Enrôlement</th>
                <th className="p-10 text-right text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Commandes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={4} className="p-32 text-center text-slate-400 font-bold italic animate-pulse tracking-widest uppercase text-xs">Initialisation de l'unité...</td></tr>
              ) : filtered.map(admin => (
                <tr key={admin.id} className="group hover:bg-indigo-50/30 transition-all duration-300">
                  <td className="p-10">
                    <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center font-black text-xl shadow-inner border border-white group-hover:rotate-12 transition-transform ${admin.role === 'super_admin' ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-indigo-200' : 'bg-slate-100 text-slate-500'
                        }`}>
                        {admin.name?.charAt(0)}
                      </div>
                      <div>
                        <div className="font-black text-slate-900 text-lg tracking-tighter uppercase italic group-hover:text-indigo-600 transition-colors">{admin.name}</div>
                        <div className="text-xs text-slate-400 font-bold mt-1 opacity-70 italic">{admin.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                        <Anchor size={14} />
                      </div>
                      <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">
                        {admin.role === 'super_admin' ? 'Haut Gradé' : 'Gardien'}
                      </span>
                    </div>
                  </td>
                  <td className="p-10 text-xs font-bold text-slate-400 italic">
                    {new Date(admin.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="p-10 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
                      <ActionButton
                        onClick={() => openEdit(admin)}
                        icon={Edit2}
                        title="Édition Identité"
                        color="hover:bg-indigo-600"
                      />
                      <ActionButton
                        onClick={() => toggleStatus(admin)}
                        icon={PowerOff}
                        title={admin.deletedAt ? "Réactiver" : "Révoquer Accès"}
                        color={admin.deletedAt ? 'hover:bg-emerald-600 text-emerald-500' : 'hover:bg-amber-500 text-amber-500'}
                      />
                      <ActionButton
                        onClick={() => permanentlyDelete(admin)}
                        icon={Trash2}
                        title="Effacer Archives"
                        color="hover:bg-rose-600 text-rose-400"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Création */}
        {showModal && (
          <Modal close={() => setShowModal(false)} title="Nouvelle Accréditation">
            <form onSubmit={handleCreateAdmin} className="space-y-8 p-12">
              {error && <ErrorMessage message={error} />}
              <InputField label="Identité de l'Agent" value={formData.name} onChange={(v: string) => setFormData({ ...formData, name: v })} placeholder="Alexandre Vesper" />
              <InputField label="Canal de Liaison" value={formData.email} onChange={(v: string) => setFormData({ ...formData, email: v })} placeholder="agent@afrigari.com" type="email" />
              <InputField label="Clef de Sécurité" value={formData.password} onChange={(v: string) => setFormData({ ...formData, password: v })} placeholder="••••••••" type="password" />
              <SubmitButton loading={isSubmitting} label="Activer l'Unité" />
            </form>
          </Modal>
        )}

        {/* Modal Édition */}
        {showEditModal && (
          <Modal close={() => setShowEditModal(false)} title="Mise à jour Profil">
            <form onSubmit={handleEditAdmin} className="space-y-8 p-12">
              {error && <ErrorMessage message={error} />}
              <InputField label="Identité de l'Agent" value={editFormData.name} onChange={(v: string) => setEditFormData({ ...editFormData, name: v })} placeholder="Nom complet" />
              <InputField label="Canal de Liaison" value={editFormData.email} onChange={(v: string) => setEditFormData({ ...editFormData, email: v })} placeholder="Email" type="email" />
              <SubmitButton loading={isSubmitting} label="Sauvegarder Archive" />
            </form>
          </Modal>
        )}
      </main>
    </div>
  );
}

// Composants de style réutilisables
function AdminStatCard({ label, value, icon: Icon, color, sub }: any) {
  const colors: any = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-50',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100 shadow-indigo-50',
    rose: 'bg-rose-50 text-rose-600 border-rose-100 shadow-rose-50',
  };
  return (
    <div className={`bg-white border-2 ${colors[color].split(' ')[2]} rounded-[32px] p-8 shadow-xl ${colors[color].split(' ')[3]} flex items-center justify-between group hover:-translate-y-2 transition-all duration-300`}>
      <div>
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 italic">{label}</p>
        <h3 className="text-3xl font-black text-slate-900 leading-none mb-1">{value}</h3>
        <p className={`text-[8px] font-bold uppercase tracking-widest ${colors[color].split(' ')[1]}`}>{sub}</p>
      </div>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colors[color].split(' ')[0]} ${colors[color].split(' ')[1]} group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
    </div>
  );
}

function ActionButton({ onClick, icon: Icon, title, color }: any) {
  return (
    <button
      onClick={onClick}
      className={`p-3 bg-white rounded-2xl shadow-sm transition-all border border-slate-100 ${color} hover:text-white`}
      title={title}
    >
      <Icon size={18} />
    </button>
  );
}

function Modal({ children, close, title }: any) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
      <div className="bg-white rounded-[56px] shadow-2xl w-full max-w-lg overflow-hidden animate-reveal border-4 border-white">
        <div className="p-12 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">{title}</h3>
          <button onClick={close} className="w-12 h-12 bg-white border border-slate-100 flex items-center justify-center rounded-2xl text-slate-400 hover:text-rose-500 transition-all shadow-sm"><X size={24} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = "text" }: any) {
  return (
    <div>
      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-2 block italic">{label}</label>
      <input
        required
        type={type}
        className="w-full bg-slate-50 border-2 border-slate-100 rounded-[28px] px-8 py-5 outline-none focus:border-indigo-600 transition-all font-bold text-base italic"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

function SubmitButton({ loading, label }: any) {
  return (
    <button
      disabled={loading}
      type="submit"
      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 rounded-[32px] font-black uppercase text-xs tracking-[0.3em] shadow-2xl shadow-indigo-200 transition-all flex items-center justify-center gap-4"
    >
      {loading ? <Loader2 className="animate-spin" size={20} /> : <><Zap size={18} className="fill-white" /> {label}</>}
    </button>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="p-5 bg-rose-50 text-rose-600 rounded-[24px] text-[10px] font-black uppercase tracking-widest border-2 border-rose-100 flex items-center gap-3">
      <ShieldAlert size={18} /> {message}
    </div>
  );
}
