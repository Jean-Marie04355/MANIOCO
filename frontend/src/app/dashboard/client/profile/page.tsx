"use client";
import { useState, useEffect } from 'react';
import { User, Mail, Shield, Save, ChevronLeft, Loader2, CheckCircle, PackageCheck, LogOut, Camera, ShieldCheck, Key, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [scrolled, setScrolled] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: ''
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    const fetchUser = async () => {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
        setFormData({
          ...formData,
          name: res.data.name,
          email: res.data.email
        });
      } catch (err) {
        console.error("Erreur chargement profil", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatus('idle');

    try {
      await api.patch(`/users/${user.id}`, {
        name: formData.name,
        email: formData.email,
        password: formData.newPassword || undefined
      });
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error("Erreur sauvegarde", err);
      setStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-luxury-cream flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-12 h-12 text-forest-night animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-forest-night/20">Accès sécurisé...</p>
      </div>
    );
  }

  return (
    <div className="bg-luxury-cream min-h-screen text-forest-night font-sans selection:bg-afrigari-gold selection:text-forest-night h-f">
      
      {/* Header */}
      <nav className={`fixed top-0 left-0 right-0 z-[200] transition-all duration-700 px-8 ${scrolled ? 'py-4' : 'py-10'}`}>
         <div className={`max-w-7xl mx-auto flex justify-between items-center px-10 py-6 transition-all duration-500 ${scrolled ? 'bg-white/90 backdrop-blur-xl rounded-[32px] px-12 border border-forest-night/5 shadow-[0_20px_50px_rgba(10,33,24,0.1)]' : ''}`}>
                <Link href="/dashboard/client" className="flex items-center gap-3 group">
                   <div className="w-10 h-10 rounded-xl bg-forest-night flex items-center justify-center text-afrigari-gold shadow-lg group-hover:rotate-[-12deg] transition-transform">
                      <ArrowLeft size={20} />
                   </div>
                   <span className="font-black text-2xl tracking-tighter uppercase italic">Mon Profil</span>
                </Link>

               <div className="flex items-center gap-6">
                  <Link href="/dashboard/client/orders" className="text-[10px] font-black uppercase tracking-widest hover:text-afrigari-gold transition-colors">Mes Commandes</Link>
                  <button 
                  onClick={() => { localStorage.removeItem('token'); window.location.href = '/auth/login'; }}
                  className="w-12 h-12 rounded-2xl bg-forest-night text-white shadow-xl flex items-center justify-center border-2 border-afrigari-gold/20 hover:bg-red-500 transition-all group">
                     <LogOut size={24} className="text-afrigari-gold group-hover:text-white" />
                  </button>
               </div>
         </div>
      </nav>

      <main className="max-w-4xl mx-auto pt-48 pb-32 px-8">
        
        {/* Profile Identity Card */}
        <div className="bg-white rounded-[64px] border border-forest-night/5 shadow-[0_80px_160px_-40px_rgba(10,33,24,0.1)] p-16 md:p-24 relative overflow-hidden mb-12 animate-reveal">
           <div className="relative z-10 flex flex-col md:flex-row items-center gap-16">
              {/* Avatar Section */}
              <div className="relative group">
                 <div className="w-48 h-48 rounded-[64px] border-8 border-luxury-cream p-1 overflow-hidden bg-forest-night/5 flex items-center justify-center shadow-2xl transition-transform duration-700 group-hover:rotate-6">
                    <User size={80} className="text-forest-night/10" />
                 </div>
                 <button className="absolute -bottom-4 -right-4 w-12 h-12 bg-afrigari-gold text-forest-night rounded-2xl flex items-center justify-center shadow-xl hover:rotate-12 transition-all">
                    <Camera size={20} />
                 </button>
              </div>

              {/* Basic Info */}
              <div className="text-center md:text-left flex-1">
                 <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                    <h1 className="text-5xl font-black tracking-tighter uppercase italic">{user?.name}</h1>
                    <div className="bg-soft-mint text-forest-night px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-forest-night/5 hidden md:block">
                       Compte Vérifié
                    </div>
                 </div>
                 <p className="text-lg font-bold text-forest-night/30 italic mb-8 flex items-center justify-center md:justify-start gap-3">
                    <Mail size={18} className="text-afrigari-gold" /> {user?.email}
                 </p>
                 <div className="flex items-center justify-center md:justify-start gap-10">
                    <div className="text-center md:text-left">
                       <p className="text-[10px] font-black uppercase text-forest-night/20 tracking-widest mb-1">Rôle</p>
                       <p className="text-xs font-black uppercase tracking-[0.2em]">{user?.role}</p>
                    </div>
                    <div className="w-px h-10 bg-forest-night/10"></div>
                    <div className="text-center md:text-left">
                       <p className="text-[10px] font-black uppercase text-forest-night/20 tracking-widest mb-1">Membre Depuis</p>
                       <p className="text-xs font-black uppercase tracking-[0.2em]">{new Date(user?.createdAt).getFullYear()}</p>
                    </div>
                 </div>
              </div>
           </div>
           
           <ShieldCheck size={300} className="absolute -bottom-20 -right-20 text-forest-night opacity-[0.02] pointer-events-none select-none" />
        </div>

        {/* Settings Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 animate-reveal" style={{ animationDelay: '0.2s' }}>
           <div className="md:col-span-1">
              <h3 className="text-3xl font-black tracking-tighter uppercase italic mb-4">Paramètres <br/> <span className="text-afrigari-gold">Du Compte</span></h3>
              <p className="text-xs font-bold text-forest-night/40 leading-relaxed italic">Mettez à jour vos informations personnelles pour une expérience personnalisée.</p>
           </div>

           <div className="md:col-span-2 space-y-10">
              <form onSubmit={handleSubmit} className="bg-white rounded-[48px] p-12 border border-forest-night/5 shadow-xl space-y-8">
                 <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-forest-night/40 ml-4">Nom Complet</label>
                          <input 
                            type="text" 
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full bg-luxury-cream/50 border-2 border-transparent focus:border-afrigari-gold/20 focus:bg-white p-6 rounded-3xl outline-none transition-all font-black text-sm text-forest-night"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-forest-night/40 ml-4">Adresse Email</label>
                          <input 
                            type="email" 
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="w-full bg-luxury-cream/50 border-2 border-transparent focus:border-afrigari-gold/20 focus:bg-white p-6 rounded-3xl outline-none transition-all font-black text-sm text-forest-night"
                          />
                       </div>
                    </div>

                    <div className="pt-8 border-t border-forest-night/5">
                       <div className="flex items-center gap-3 mb-6 text-forest-night/60">
                          <Key size={16} />
                          <h4 className="text-[10px] font-black uppercase tracking-[0.4em]">Sécurité & Mot de Passe</h4>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-forest-night/40 ml-4">Nouveau Mot de Passe (Optionnel)</label>
                          <input 
                            type="password" 
                            placeholder="Laisser vide pour ne pas changer"
                            value={formData.newPassword}
                            onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                            className="w-full bg-luxury-cream/50 border-2 border-transparent focus:border-afrigari-gold/20 focus:bg-white p-6 rounded-3xl outline-none transition-all font-black text-sm text-forest-night"
                          />
                       </div>
                    </div>
                 </div>

                 <button 
                   type="submit" 
                   disabled={isSaving}
                   className="w-full bg-forest-night text-white p-7 rounded-3xl font-black text-xs uppercase tracking-[0.3em] hover:bg-afrigari-gold hover:text-forest-night transition-all shadow-2xl flex items-center justify-center gap-4 group"
                 >
                    {isSaving ? <Loader2 className="animate-spin text-afrigari-gold" /> : (
                       status === 'success' ? (
                          <><CheckCircle className="text-afrigari-gold" /> Profil Mis à Jour</>
                       ) : (
                          <>Enregistrer les modifications <Save size={18} className="group-hover:scale-110" /></>
                       )
                    )}
                 </button>
                 {status === 'error' && <p className="text-center text-[10px] font-black text-red-500 uppercase tracking-widest mt-4">Erreur lors de la sauvegarde</p>}
              </form>

              {/* Extra Services Card */}
              <div className="bg-forest-night p-12 rounded-[48px] text-white relative overflow-hidden shadow-2xl">
                 <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <h4 className="text-2xl font-black italic tracking-tighter mb-2 italic">Aide & Support</h4>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest italic">Contactez notre conciergerie 24/7</p>
                    </div>
                    <Link href="mailto:support@afrigari.com" className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-afrigari-gold hover:bg-afrigari-gold hover:text-forest-night transition-all">
                       <Mail size={20} />
                    </Link>
                 </div>
              </div>
           </div>
        </div>
      </main>

    </div>
  );
}
