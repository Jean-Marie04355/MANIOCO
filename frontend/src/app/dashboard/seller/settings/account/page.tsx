"use client";
import { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import TopNav from '../../../components/TopNav';
import { 
  User as UserIcon, 
  Mail, 
  Lock, 
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import api from '@/lib/axios';
import { useAuth } from '@/features/auth/AuthContext';
import { useRouter } from 'next/navigation';

export default function AccountSettings() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSavedProfile, setIsSavedProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavedPassword, setIsSavedPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Champs exacts du backend : name, email (depuis user.entity.ts)
  const [profileData, setProfileData] = useState({ name: '', email: '', profilePhoto: '' });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  // Chargement du profil via GET /users/:id
  useEffect(() => {
    const fetchProfile = async () => {
      const userId = user?.id || (user as any)?.userId;
      if (!userId) return;
      try {
        const res = await api.get(`/users/${userId}`);
        setProfileData({
          name: res.data.name || '',
          email: res.data.email || '',
          profilePhoto: res.data.profilePhoto || ''
        });
      } catch (err) {
        console.error("Erreur chargement profil");
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

  // Mise à jour du profil via PATCH /users/:id avec { name, email, profilePhoto }
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setIsSavingProfile(true);
    const userId = user?.id || (user as any)?.userId;
    try {
      await api.patch(`/users/${userId}`, {
        name: profileData.name,
        email: profileData.email,
        profilePhoto: profileData.profilePhoto
      });
      // Mettre à jour le context utilisateur avec le nouveau nom et la nouvelle photo
      if (user) {
        const updatedUser = { ...user, name: profileData.name, profilePhoto: profileData.profilePhoto };
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('afrigari_jwt');
          if (token) {
            // Note: Idealement on a besoin de mettre a jour le token ou forcer un re-fetch
            // Ici on va juste re-fetch depuis le serveur
            await api.get('/auth/me'); 
          }
        }
      }
      setIsSavedProfile(true);
      setTimeout(() => setIsSavedProfile(false), 3000);
      window.location.reload(); // Recharger pour mettre à jour le TopNav
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setProfileError(Array.isArray(msg) ? msg.join(', ') : (msg || 'Erreur lors de la mise à jour'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Changement de mot de passe via PATCH /users/:id avec { password }
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    let isValid = true;
    const mismatch = passwordData.newPassword !== passwordData.confirmPassword;
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
        setIsSavedPassword(true);
        setPasswordData({ newPassword: '', confirmPassword: '' });
        setTimeout(() => setIsSavedPassword(false), 3000);
      } catch (err: any) {
        const msg = err.response?.data?.message;
        setPasswordError(Array.isArray(msg) ? msg.join(', ') : (msg || 'Erreur lors du changement'));
      } finally {
        setIsSavingPassword(false);
      }
    }
  };

  // Suppression de compte via DELETE /users/:id
  const handleDeleteAccount = async () => {
    const userId = user?.id || (user as any)?.userId;
    if (!userId) return;

    if (typeof window !== 'undefined' && window.confirm(
      "ATTENTION : Cette action va désactiver votre compte et vos produits ne seront plus visibles. Voulez-vous continuer ?"
    )) {
      try {
        await api.delete(`/users/${userId}`);
        logout?.();
        router.push('/auth/login');
      } catch (err: any) {
        alert("Erreur lors de la suppression du compte. Réessayez plus tard.");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex bg-slate-50 min-h-screen">
        <Sidebar mode="seller" />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar mode="seller" />
      
      <main className="flex-1 ml-64">
        <TopNav title="Paramètres Compte" isAdmin={false} />
        
        <div className="p-8 max-w-4xl mx-auto">
          
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Votre Compte</h1>
              <p className="text-sm text-slate-500 mt-2 font-medium">Gérez vos informations de connexion et la sécurité de votre compte vendeur.</p>
            </div>
            {(isSavedProfile || isSavedPassword) && (
              <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 animate-in slide-in-from-right-4 fade-in">
                <CheckCircle2 className="text-green-500" size={18} />
                <p className="text-xs font-bold text-green-700">Modifications enregistrées !</p>
              </div>
            )}
          </div>

          <div className="space-y-8">
            
            {/* Informations Personnelles — champs: name, email */}
            <form onSubmit={handleSaveProfile} className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <UserIcon size={20} className="text-orange-500" /> Informations Personnelles
                </h3>
              </div>
              <div className="p-8 space-y-8">
                {/* Section Photo de profil */}
                <div className="flex items-center gap-6 pb-8 border-b border-slate-100">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-100 flex items-center justify-center">
                      {profileData.profilePhoto ? (
                        <img src={profileData.profilePhoto} alt="Profil" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl font-black text-slate-300">
                          {profileData.name.charAt(0) || <UserIcon size={40} />}
                        </span>
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white border-2 border-white cursor-pointer hover:bg-orange-600 transition-colors shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                      <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/webp" 
                        className="hidden" 
                        onChange={handlePhotoUpload}
                      />
                    </label>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Photo de profil</h4>
                    <p className="text-xs text-slate-500 mt-1">Format JPG, PNG ou WEBP. Max 2Mo.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <UserIcon size={14} /> Nom complet
                    </label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Jean Dupont" 
                    className="w-full px-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all shadow-inner"
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Mail size={14} /> Adresse E-mail
                  </label>
                  <input 
                    type="email" 
                    required
                    placeholder="jean@example.com" 
                    className="w-full px-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all shadow-inner"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  />
                </div>
              </div>
              </div>
              {profileError && (
                <div className="px-8 pb-4">
                  <p className="text-xs font-bold text-red-500">{profileError}</p>
                </div>
              )}
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                  type="submit" 
                  disabled={isSavingProfile}
                  className="px-8 py-3.5 bg-orange-500 text-white rounded-2xl text-sm font-bold hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/30 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSavingProfile ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Mise à jour...</>
                  ) : "Enregistrer le profil"}
                </button>
              </div>
            </form>

            {/* Sécurité — champ: password */}
            <form onSubmit={handleSavePassword} className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Lock size={20} className="text-orange-500" /> Sécurité & Mot de passe
                </h3>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Nouveau mot de passe</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      minLength={6}
                      className="w-full px-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all shadow-inner"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Confirmer le nouveau mot de passe</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      className="w-full px-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all shadow-inner"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              {passwordError && (
                <div className="px-8 pb-4">
                  <p className="text-xs font-bold text-red-500">{passwordError}</p>
                </div>
              )}
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                  type="submit" 
                  disabled={isSavingPassword}
                  className="px-8 py-3.5 bg-orange-500 text-white rounded-2xl text-sm font-bold hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/30 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSavingPassword ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Mise à jour...</>
                  ) : "Modifier le mot de passe"}
                </button>
              </div>
            </form>
          </div>

          {/* Zone Dangereuse — DELETE /users/:id */}
          <div className="mt-12 bg-white rounded-[2.5rem] border border-red-200 shadow-sm overflow-hidden relative">
             <div className="absolute top-0 left-0 bottom-0 w-1 bg-red-500"></div>
             <div className="p-8">
                <h3 className="text-lg font-black text-red-600 flex items-center gap-2 mb-2">
                  <ShieldAlert size={20} /> Zone Dangereuse
                </h3>
                <p className="text-sm font-medium text-slate-600 max-w-2xl">
                   La suppression de votre compte est une action irréversible sur l'interface publique. Tous vos produits seront retirés de la vente. Conformément aux obligations légales, vos données de transaction seront conservées de manière sécurisée (Soft Delete).
                </p>
                <div className="mt-6">
                   <button 
                     type="button"
                     onClick={handleDeleteAccount}
                     className="px-6 py-3 border-2 border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
                   >
                     <AlertTriangle size={16} /> Supprimer mon compte
                   </button>
                </div>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}
