"use client";
import { ArrowRight, Mail, Lock, User, Leaf, ShieldCheck, Loader2, AlertCircle, UserCircle, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import api from '@/lib/axios';

export default function AuthPage() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken } = response.data as any; // Backend returns accessToken (camelCase based on service)
      
      if (accessToken) {
        localStorage.setItem('token', accessToken);
        window.location.href = '/dashboard/client';
      }
    } catch (err: any) {
      console.error("Login detail:", err.response?.data);
      setError(err.response?.data?.message || "Email ou mot de passe incorrect.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/users', { name, email, password, role: 'client' });
      setSuccess("Compte créé avec succès ! Connectez-vous maintenant.");
      setIsSignIn(true);
      // Clean password for security
      setPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de l'inscription. L'email est peut-être déjà utilisé.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-luxury-cream flex items-center justify-center p-6 selection:bg-afrigari-gold selection:text-forest-night font-sans text-forest-night">
      
      <div className="w-full max-w-5xl h-[720px] bg-white rounded-[64px] shadow-[0_80px_160px_-40px_rgba(10,33,24,0.2)] border border-forest-night/5 overflow-hidden animate-reveal flex relative">
         
         {/* Left Side: Brand & Visual */}
         <div className="hidden lg:flex w-[45%] bg-forest-night relative p-20 flex-col justify-between overflow-hidden">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute -top-20 -left-20 w-80 h-80 bg-afrigari-gold rounded-full blur-[120px]"></div>
              <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-afrigari-gold rounded-full blur-[120px]"></div>
            </div>
            
            <div className="relative z-10">
               <div className="w-16 h-16 bg-afrigari-gold rounded-2xl flex items-center justify-center text-forest-night mb-8 shadow-2xl shadow-afrigari-gold/20">
                  <Leaf size={32} fill="currentColor" />
               </div>
               <h2 className="text-5xl font-black text-white leading-tight tracking-tighter uppercase italic">L'Excellence <br/> <span className="text-afrigari-gold">Du Terroir</span></h2>
            </div>

            <div className="relative z-10">
               <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.5em] mb-4">Certifié Authentique</p>
               <div className="flex gap-2">
                  <div className="h-1 w-12 bg-afrigari-gold"></div>
                  <div className="h-1 w-6 bg-white/20"></div>
               </div>
            </div>
            
            <Leaf size={300} className="absolute -right-20 top-1/2 -translate-y-1/2 text-white/5 rotate-12" fill="currentColor" />
         </div>

         {/* Right Side: Form */}
         <div className="flex-1 bg-white p-12 lg:p-20 relative overflow-y-auto">
            
            <div className="flex justify-between items-center mb-16">
               <h3 className="text-2xl font-black tracking-tighter uppercase italic">{isSignIn ? 'Connexion' : 'Inscription'}</h3>
               <button 
                  onClick={() => { setIsSignIn(!isSignIn); setError(''); setSuccess(''); }}
                  className="text-[10px] font-black uppercase tracking-widest text-afrigari-gold hover:text-forest-night transition-colors border-b-2 border-afrigari-gold"
               >
                  {isSignIn ? "Créer un compte" : "Déjà membre ?"}
               </button>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-6 rounded-3xl flex items-center gap-4 text-xs font-bold border border-red-100 mb-10 animate-reveal">
                <AlertCircle size={20} className="shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="bg-soft-mint text-forest-night p-6 rounded-3xl flex items-center gap-4 text-xs font-bold border border-forest-night/5 mb-10 animate-reveal">
                <CheckCircle size={20} className="text-afrigari-gold shrink-0" />
                {success}
              </div>
            )}

            {isSignIn ? (
               <form onSubmit={handleLogin} className="space-y-8">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase tracking-widest text-forest-night/40 ml-2">Email Privé</label>
                     <Input 
                        icon={Mail} 
                        type="email"
                        placeholder="votre@prestige.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-luxury-cream/50 border-forest-night/5 h-20 pl-20 rounded-[28px] focus:ring-afrigari-gold/10"
                        iconClassName="text-forest-night/20"
                     />
                  </div>
                  
                  <div className="space-y-3">
                     <div className="flex justify-between items-center px-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-forest-night/40">Code Sécurisé</label>
                        <button type="button" className="text-[9px] font-black text-afrigari-gold uppercase tracking-[0.2em] opacity-40 hover:opacity-100 italic transition-all">Oublié ?</button>
                     </div>
                     <Input 
                        icon={Lock} 
                        type="password" 
                        placeholder="••••••••" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-luxury-cream/50 border-forest-night/5 h-20 pl-20 rounded-[28px] focus:ring-afrigari-gold/10"
                        iconClassName="text-forest-night/20"
                     />
                  </div>

                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-forest-night text-white h-20 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] hover:bg-afrigari-gold hover:text-forest-night transition-all shadow-2xl flex items-center justify-center gap-4 group active:scale-95"
                  >
                    {isLoading ? <Loader2 className="animate-spin text-afrigari-gold" /> : (
                       <>Entrer Dans L&apos;univers <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" /></>
                    )}
                  </button>
               </form>
            ) : (
               <form onSubmit={handleRegister} className="space-y-6">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase tracking-widest text-forest-night/40 ml-2">Nom & Prénoms</label>
                     <Input 
                        icon={User} 
                        placeholder="Votre Nom Complet" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="bg-luxury-cream/50 border-forest-night/5 h-16 pl-16 rounded-[24px]"
                     />
                  </div>

                  <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase tracking-widest text-forest-night/40 ml-2">Email</label>
                     <Input 
                        icon={Mail} 
                        type="email"
                        placeholder="votre@prestige.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-luxury-cream/50 border-forest-night/5 h-16 pl-16 rounded-[24px]"
                     />
                  </div>
                  
                  <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase tracking-widest text-forest-night/40 ml-2">Mot de Passe (6+ car.)</label>
                     <Input 
                        icon={Lock} 
                        type="password" 
                        placeholder="••••••••" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="bg-luxury-cream/50 border-forest-night/5 h-16 pl-16 rounded-[24px]"
                     />
                  </div>

                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-afrigari-gold text-forest-night h-16 rounded-[24px] font-black text-xs uppercase tracking-[0.3em] hover:bg-forest-night hover:text-white transition-all shadow-xl shadow-afrigari-gold/20 flex items-center justify-center gap-4 active:scale-95 mt-6"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : (
                       <>Créer mon accès <ArrowRight size={18} /></>
                    )}
                  </button>
               </form>
            )}
            
            <div className="mt-20 text-center opacity-20 flex items-center justify-center gap-4">
               <span className="h-px bg-forest-night w-8"></span>
               <p className="text-[9px] font-black uppercase tracking-[0.5em]">Afrigari 2026</p>
               <span className="h-px bg-forest-night w-8"></span>
            </div>
         </div>

      </div>
    </div>
  );
}

