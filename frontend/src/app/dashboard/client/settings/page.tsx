"use client";
import { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Mail, 
  Lock, 
  ShieldAlert,
  CheckCircle2,
  Loader2,
  Camera,
  ChevronLeft,
  Settings,
  Bell,
  Phone
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useAuth } from '@/features/auth/AuthContext';
import { useRouter } from 'next/navigation';

function constantTimeCompare(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= (a.codePointAt(i) || 0) ^ (b.codePointAt(i) || 0);
  }
  return result === 0;
}

function ProfilePhoto({ data }: { readonly data: any }) {
  if (data.profilePhoto) {
    return <img src={data.profilePhoto} alt="Profil" className="w-full h-full object-cover" />;
  }
  return <span className="text-manioco-brown/20">{data.name.charAt(0) || 'U'}</span>;
}

export default function ClientSettings() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [profileData, setProfileData] = useState({ 
    name: '', 
    email: '', 
    profilePhoto: '',
    phoneNumber: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  // Load profile
  useEffect(() => {
    const fetchProfile = async () => {
      const userId = user?.id || (user as any)?.userId;
      if (!userId) return;
      try {
        const res = await api.get(`/users/${userId}`);
        setProfileData({
          name: res.data.name || '',
          email: res.data.email || '',
          profilePhoto: res.data.profilePhoto || '',
          phoneNumber: res.data.phoneNumber || ''
        });
      } catch (error) {
        console.error("Erreur chargement profil", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setProfileError("L'image est trop grande (max 2Mo)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData, profilePhoto: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setSuccessMessage('');
    setIsSavingProfile(true);
    const userId = user?.id || (user as any)?.userId;
    try {
      await api.patch(`/users/${userId}`, {
        name: profileData.name,
        email: profileData.email,
        profilePhoto: profileData.profilePhoto,
        phoneNumber: profileData.phoneNumber
      });
      setSuccessMessage('Profil mis à jour avec succès !');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      console.error("Erreur mise à jour profil", error);
      const msg = error.response?.data?.message;
      setProfileError(Array.isArray(msg) ? msg.join(', ') : (msg || 'Erreur lors de la mise à jour'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setSuccessMessage('');

    let isValid = true;
    const mismatch = !constantTimeCompare(passwordData.newPassword, passwordData.confirmPassword);
    const tooShort = passwordData.newPassword.length < 6;

    if (mismatch) {
      setPasswordError('Les mots de passe ne correspondent pas.');
      isValid = false;
    }
    
    if (isValid && tooShort) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères.');
      isValid = false;
    }

    if (isValid) {
      setIsSavingPassword(true);
      const userId = user?.id || (user as any)?.userId;
      try {
        await api.patch(`/users/${userId}`, { password: passwordData.newPassword });
        setSuccessMessage('Mot de passe modifié avec succès !');
        setPasswordData({ newPassword: '', confirmPassword: '' });
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error: any) {
        console.error("Erreur changement mot de passe", error);
        const msg = error.response?.data?.message;
        setPasswordError(Array.isArray(msg) ? msg.join(', ') : (msg || 'Erreur lors du changement'));
      } finally {
        setIsSavingPassword(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-manioco-terracotta animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-manioco-brown font-sans pb-20">
      
      {/* Header / Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-manioco-brown/10 shadow-[0_4px_30px_rgba(92,45,35,0.08)] px-8 py-6">
        <div className="max-w-[1200px] mx-auto flex justify-between items-center">
          <Link href="/dashboard/client" className="flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-full border border-manioco-brown/10 flex items-center justify-center text-manioco-brown group-hover:bg-manioco-terracotta group-hover:text-white transition-all">
              <ChevronLeft size={20} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-manioco-brown/60 group-hover:text-manioco-brown transition-colors">Retour</span>
          </Link>
          <div className="flex items-center gap-3">
             <Settings className="text-manioco-terracotta" size={20} />
             <h1 className="text-xs font-black uppercase tracking-[0.3em]">Paramètres</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-[800px] mx-auto pt-32 px-6 animate-reveal">
        
        {/* Success Feedback */}
        {successMessage && (
          <div className="mb-8 p-4 bg-green-50 border border-green-100 rounded-3xl flex items-center gap-3 animate-reveal">
            <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <p className="text-sm font-bold text-green-700">{successMessage}</p>
          </div>
        )}

        <div className="space-y-12">
          
          {/* Profile Section */}
          <section className="bg-white rounded-[40px] border border-manioco-brown/10 shadow-xl overflow-hidden animate-reveal">
            <div className="p-10 border-b border-manioco-brown/10 bg-gradient-to-r from-manioco-terracotta/5 to-transparent">
              <h2 className="text-xl font-black flex items-center gap-4 uppercase tracking-tight text-manioco-brown">
                <UserIcon className="text-manioco-terracotta" size={24} /> Informations Personnelles
              </h2>
            </div>
            
            <form onSubmit={handleSaveProfile} className="p-10 space-y-10">
              
              {/* Photo Upload */}
              <div className="flex flex-col md:flex-row items-center gap-10 pb-10 border-b border-manioco-brown/10">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-manioco-brown/5 flex items-center justify-center text-4xl font-black">
                    <ProfilePhoto data={profileData} />
                  </div>
                  <label aria-label="Changer la photo" className="absolute bottom-1 right-1 w-10 h-10 bg-manioco-terracotta text-white rounded-full flex items-center justify-center border-4 border-white cursor-pointer hover:scale-110 transition-all shadow-xl hover:bg-manioco-brown">
                    <Camera size={18} />
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                </div>
                <div className="text-center md:text-left">
                  <h3 className="font-black text-lg text-manioco-brown">Votre Avatar</h3>
                  <p className="text-xs text-manioco-brown/40 mt-1 font-medium">Recommandé : JPG ou WEBP de moins de 2Mo.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-manioco-brown/40 ml-4">Nom Complet</label>
                  <div className="relative">
                    <UserIcon size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-manioco-terracotta" />
                    <input 
                      id="name"
                      type="text" 
                      value={profileData.name}
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      className="w-full pl-14 pr-8 py-5 bg-[#FAF7F2] border border-transparent rounded-3xl text-sm font-bold outline-none focus:ring-2 focus:ring-manioco-terracotta/20 focus:border-manioco-terracotta/30 focus:bg-white text-manioco-brown placeholder:text-manioco-brown/20 transition-all shadow-inner"
                      placeholder="Votre nom"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-manioco-brown/40 ml-4">Adresse E-mail</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-manioco-terracotta" />
                    <input 
                      id="email"
                      type="email" 
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      className="w-full pl-14 pr-8 py-5 bg-[#FAF7F2] border border-transparent rounded-3xl text-sm font-bold outline-none focus:ring-2 focus:ring-manioco-terracotta/20 focus:border-manioco-terracotta/30 focus:bg-white text-manioco-brown placeholder:text-manioco-brown/20 transition-all shadow-inner"
                      placeholder="email@exemple.com"
                    />
                  </div>
                </div>

                <div className="space-y-3 md:col-span-2">
                  <label htmlFor="phoneNumber" className="text-[10px] font-black uppercase tracking-widest text-manioco-brown/40 ml-4">Téléphone</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-manioco-terracotta" />
                    <input 
                      id="phoneNumber"
                      type="text" 
                      value={profileData.phoneNumber}
                      onChange={(e) => setProfileData({...profileData, phoneNumber: e.target.value})}
                      className="w-full pl-14 pr-8 py-5 bg-[#FAF7F2] border border-transparent rounded-3xl text-sm font-bold outline-none focus:ring-2 focus:ring-manioco-terracotta/20 focus:border-manioco-terracotta/30 focus:bg-white text-manioco-brown placeholder:text-manioco-brown/20 transition-all shadow-inner"
                      placeholder="+229 XX XX XX XX"
                    />
                  </div>
                </div>
              </div>

              {profileError && <p className="text-xs font-bold text-red-500 ml-4">{profileError}</p>}

              <div className="pt-6">
                <button 
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-full py-5 bg-manioco-terracotta text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-manioco-brown transition-all shadow-2xl disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isSavingProfile ? <Loader2 className="animate-spin" size={18} /> : 'Mettre à jour le profil'}
                </button>
              </div>
            </form>
          </section>

          {/* Password Section */}
          <section className="bg-white rounded-[40px] border border-manioco-brown/10 shadow-xl overflow-hidden animate-reveal delay-100">
            <div className="p-10 border-b border-manioco-brown/10 bg-gradient-to-r from-manioco-terracotta/5 to-transparent">
              <h2 className="text-xl font-black flex items-center gap-4 uppercase tracking-tight text-manioco-brown">
                <Lock className="text-manioco-terracotta" size={24} /> Sécurité
              </h2>
            </div>
            
            <form onSubmit={handleSavePassword} className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label htmlFor="newPassword" className="text-[10px] font-black uppercase tracking-widest text-manioco-brown/40 ml-4">Nouveau Mot de Passe</label>
                  <input 
                    id="newPassword"
                    type="password" 
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="w-full px-8 py-5 bg-[#FAF7F2] border border-transparent rounded-3xl text-sm font-bold outline-none focus:ring-2 focus:ring-manioco-terracotta/20 focus:border-manioco-terracotta/30 focus:bg-white text-manioco-brown placeholder:text-manioco-brown/20 transition-all shadow-inner"
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-3">
                  <label htmlFor="confirmPassword" className="text-[10px] font-black uppercase tracking-widest text-manioco-brown/40 ml-4">Confirmer</label>
                  <input 
                    id="confirmPassword"
                    type="password" 
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="w-full px-8 py-5 bg-[#FAF7F2] border border-transparent rounded-3xl text-sm font-bold outline-none focus:ring-2 focus:ring-manioco-terracotta/20 focus:border-manioco-terracotta/30 focus:bg-white text-manioco-brown placeholder:text-manioco-brown/20 transition-all shadow-inner"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {passwordError && <p className="text-xs font-bold text-red-500 ml-4">{passwordError}</p>}

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={isSavingPassword}
                  className="w-full py-5 border-2 border-manioco-terracotta text-manioco-terracotta rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-manioco-terracotta hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isSavingPassword ? <Loader2 className="animate-spin" size={18} /> : 'Changer le mot de passe'}
                </button>
              </div>
            </form>
          </section>

          {/* Danger Zone */}
          <section className="bg-red-50/70 border border-red-200/50 rounded-[40px] p-10 flex flex-col md:flex-row items-center justify-between gap-8 animate-reveal delay-200">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                <ShieldAlert size={28} />
              </div>
              <div>
                <h3 className="font-black text-red-900 tracking-tight">Zone de Danger</h3>
                <p className="text-xs font-medium text-red-700/60 mt-1">Actions irréversibles sur votre compte.</p>
              </div>
            </div>
            <button className="px-8 py-4 bg-white text-red-600 border border-red-200 hover:bg-red-600 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm">
              Désactiver le compte
            </button>
          </section>

        </div>
      </main>
    </div>
  );
}
