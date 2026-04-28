"use client";
import { Gem, ArrowRight, Mail, Lock, User, Leaf, Globe, Sparkles, ShieldCheck, CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { RoleBtn } from '@/features/auth/components/RoleBtn';
import { useAuth } from '@/features/auth/AuthContext';
import api from '@/lib/axios';

export default function AuthPage() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [role, setRole] = useState('client');
  const [agreed, setAgreed] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Login States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Register States
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, user } = response.data;
      if (accessToken) {
        login(accessToken, user);
        // Redirection intelligente basée sur le rôle
        if (user.role === 'vendeur' || user.role === 'VENDEUR') {
            router.push('/dashboard/seller');
        } else if (user.role === 'admin' || user.role === 'super-admin') {
            router.push('/dashboard/admin');
        } else {
            router.push('/dashboard/client');
        }
      }
    } catch (err: any) {
      if (err.response?.data?.message === 'ACCOUNT_SUSPENDED') {
          const { suspensionUntil, reason } = err.response.data;
          router.push(`/auth/suspended?until=${suspensionUntil}&reason=${encodeURIComponent(reason)}`);
          return;
      }
      if (err.response?.data?.message === 'PENDING_VALIDATION') {
          router.push('/auth/pending-validation');
          return;
      }
      if (!err.response) {
        setError("Le serveur (backend) est injoignable.");
      } else {
        const msg = err.response?.data?.message;
        setError(Array.isArray(msg) ? msg.join(', ') : (msg || 'Identifiants incorrects'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    setRegisterError('');
    setRegisterSuccess(false);
    try {
      await api.post('/users', { 
        name: registerName, 
        email: registerEmail, 
        password: registerPassword, 
        role: role === 'seller' ? 'vendeur' : 'client'
      });
      setRegisterSuccess(true);
      // Auto-switch to login tab and prefill
      setTimeout(() => {
        setIsSignIn(true);
        setEmail(registerEmail);
        setPassword(registerPassword);
        setRegisterSuccess(false);
      }, 1500);
    } catch (err: any) {
      if (!err.response) {
        setRegisterError("Le serveur (backend) est injoignable. Est-il bien démarré ?");
      } else {
        const msg = err.response?.data?.message;
        setRegisterError(Array.isArray(msg) ? msg.join(', ') : (msg || "Erreur lors de l'inscription"));
      }
    } finally {
      setIsRegistering(false);
    }
  };

  // Système de Particules "Overload Premium"
  const particles = useMemo(() => {
    if (!mounted) return [];
    return Array.from({ length: 70 }).map((_, i) => ({
      id: i,
      size: Math.random() * 25 + 5,
      x: Math.random() * 100, 
      y: Math.random() * 100, 
      duration: Math.random() * 15 + 10, 
      delay: Math.random() * -30, 
      type: Math.random() > 0.6 ? 'leaf' : 'gold',
      opacity: Math.random() * 0.2 + 0.1,
      blur: Math.random() > 0.8 ? 'blur-[2px]' : 'blur-none'
    }));
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-luxury-cream flex items-center justify-center p-6 selection:bg-afrigari-gold selection:text-forest-night font-sans text-forest-night overflow-hidden relative">
      
      {/* Background Particles */}
      {particles.map((p) => (
        <div 
          key={p.id}
          className={`absolute rounded-full pointer-events-none transition-all duration-[10s] ${p.blur} ${p.type === 'leaf' ? 'bg-forest-night' : 'bg-afrigari-gold'}`}
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            opacity: p.opacity,
            animation: `float ${p.duration}s infinite ease-in-out ${p.delay}s`
          }}
        />
      ))}

      <div className="w-full max-w-6xl h-[800px] bg-white rounded-[80px] shadow-[0_80px_160px_-40px_rgba(10,33,24,0.2)] border border-forest-night/5 overflow-hidden animate-reveal flex relative">
         
         {/* Redirection / Toggle side */}
         <div className={`absolute top-0 w-1/2 h-full transition-all duration-[800ms] cubic-bezier(0.68, -0.6, 0.32, 1.6) z-[100] ${isSignIn ? 'left-1/2' : 'left-0'}`}>
            <div className={`h-full bg-forest-night relative overflow-hidden transition-all duration-700 ${isSignIn ? 'rounded-l-[150px]' : 'rounded-r-[150px]'}`}>
               {/* Visual Overlays */}
               <div className="absolute inset-0 opacity-20">
                  <div className="absolute -top-20 -left-20 w-80 h-80 bg-afrigari-gold rounded-full blur-[120px]"></div>
                  <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-afrigari-gold rounded-full blur-[120px]"></div>
               </div>
               
               <div className="h-full flex flex-col items-center justify-center text-center p-16 text-white relative z-10">
                  <div className="w-16 h-16 bg-afrigari-gold rounded-2xl flex items-center justify-center text-forest-night mb-10 shadow-2xl">
                     <Leaf size={32} fill="currentColor" />
                  </div>
                  
                  {isSignIn ? (
                     <div className="animate-reveal">
                        <h2 className="text-6xl font-black mb-8 tracking-tighter italic uppercase">Nouveau ?</h2>
                        <p className="text-white/70 text-lg mb-14 max-w-[320px] mx-auto leading-relaxed italic">Rejoignez l'élite des producteurs et clients de l'agro-industrie africaine.</p>
                        <button onClick={() => setIsSignIn(false)} className="group border-2 border-white/20 px-20 py-6 rounded-full font-black text-[10px] uppercase tracking-[0.4em] hover:bg-white hover:text-forest-night transition-all flex items-center gap-4">
                           S'inscrire <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                        </button>
                     </div>
                  ) : (
                     <div className="animate-reveal">
                        <h2 className="text-6xl font-black mb-8 tracking-tighter italic uppercase">Déjà Membre ?</h2>
                        <p className="text-white/70 text-lg mb-14 max-w-[320px] mx-auto leading-relaxed italic">Connectez-vous pour piloter vos commandes et vos revenus.</p>
                        <button onClick={() => setIsSignIn(true)} className="group border-2 border-white/20 px-20 py-6 rounded-full font-black text-[10px] uppercase tracking-[0.4em] hover:bg-white hover:text-forest-night transition-all flex items-center gap-4">
                           Se Connecter <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                        </button>
                     </div>
                  )}
               </div>
            </div>
         </div>

         {/* Forms Side */}
         <div className="flex-1 flex relative">
            {/* Login Form */}
            <div className={`w-1/2 h-full flex flex-col items-center justify-center p-20 transition-all duration-700 ${isSignIn ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none -translate-x-20'}`}>
               <div className="w-full max-w-[400px]">
                  <div className="mb-16">
                     <p className="text-[10px] font-black uppercase tracking-[0.5em] text-afrigari-gold mb-2">Bienvenue sur Afrigari</p>
                     <h1 className="text-6xl font-black uppercase text-forest-night tracking-tighter italic">Connexion.</h1>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-6">
                     {error && (
                        <div className="p-4 bg-red-50 text-red-600 text-xs font-black rounded-2xl border border-red-100 flex items-center gap-3 animate-reveal">
                           <AlertCircle size={18} /> {error}
                        </div>
                     )}
                     
                     <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-forest-night/40 ml-2">Email</label>
                        <Input 
                           icon={Mail} 
                           type="email"
                           placeholder="votre@prestige.com" 
                           value={email}
                           onChange={(e) => setEmail(e.target.value)}
                           required
                           className="bg-luxury-cream/30 h-16 border-transparent focus:bg-white"
                        />
                     </div>

                     <div className="space-y-2">
                        <div className="flex justify-between items-center px-2">
                           <label className="text-[9px] font-black uppercase tracking-widest text-forest-night/40">Code Secret</label>
                           <button type="button" className="text-[8px] font-black text-afrigari-gold uppercase tracking-widest opacity-40 hover:opacity-100 italic transition-all">Oublié ?</button>
                        </div>
                        <Input 
                           icon={Lock} 
                           type="password" 
                           placeholder="••••••••" 
                           value={password}
                           onChange={(e) => setPassword(e.target.value)}
                           required
                           className="bg-luxury-cream/30 h-16 border-transparent focus:bg-white"
                        />
                     </div>

                     <button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-forest-night text-white py-6 rounded-[28px] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-afrigari-gold hover:text-forest-night transition-all shadow-2xl mt-8 flex justify-center items-center gap-4 active:scale-95 disabled:opacity-70 group"
                     >
                        {isLoading ? <Loader2 className="animate-spin" /> : (
                           <>Accéder au Dashboard <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" /></>
                        )}
                     </button>
                  </form>
               </div>
            </div>

            {/* Register Form */}
            <div className={`w-1/2 h-full flex flex-col items-center justify-center p-20 transition-all duration-700 ml-auto ${!isSignIn ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none translate-x-20'}`}>
               <div className="w-full max-w-[420px]">
                  <div className="mb-10 text-right">
                     <p className="text-[10px] font-black uppercase tracking-[0.5em] text-afrigari-gold mb-2">Rejoignez-nous</p>
                     <h1 className="text-6xl font-black uppercase text-forest-night tracking-tighter italic">Inscription.</h1>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-5">
                     {registerError && (
                        <div className="p-4 bg-red-50 text-red-600 text-xs font-black rounded-2xl border border-red-100 flex items-center gap-3">
                           <AlertCircle size={18} /> {registerError}
                        </div>
                     )}
                     {registerSuccess && (
                        <div className="p-4 bg-green-50 text-green-600 text-xs font-black rounded-2xl border border-green-100 flex items-center gap-3 italic">
                           <CheckCircle2 size={18} /> Compte créé avec succès !
                        </div>
                     )}
                     
                     <div className="grid grid-cols-2 gap-4 mb-4">
                        <RoleBtn active={role === 'client'} onClick={() => setRole('client')} label="Client" color="forest" />
                        <RoleBtn active={role === 'seller'} onClick={() => setRole('seller')} label="Vendeur" color="gold" />
                     </div>

                     <Input 
                        icon={User} 
                        placeholder="Nom & Prénoms" 
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        required
                        className="bg-luxury-cream/30 h-14 border-transparent focus:bg-white"
                     />
                     <Input 
                        icon={Mail} 
                        type="email"
                        placeholder="Email Professionnel" 
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        required
                        className="bg-luxury-cream/30 h-14 border-transparent focus:bg-white"
                     />
                     <Input 
                        icon={Lock} 
                        type="password" 
                        placeholder="Mot de passe" 
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        required
                        minLength={6}
                        className="bg-luxury-cream/30 h-14 border-transparent focus:bg-white"
                     />

                     <div className="flex items-start gap-4 px-2 py-2">
                        <div className="relative h-6 w-6 flex items-center justify-center">
                           <input type="checkbox" checked={agreed} onChange={() => setAgreed(!agreed)} className="appearance-none h-5 w-5 rounded-lg border-2 border-forest-night/20 checked:bg-forest-night checked:border-forest-night transition-all cursor-pointer" />
                           {agreed && <CheckCircle2 size={12} className="text-white absolute pointer-events-none" />}
                        </div>
                        <p className="text-[10px] font-bold text-forest-night/40 leading-relaxed">J'accepte les <span className="text-forest-night font-black underline cursor-pointer">règles de confidentialité</span> d'Afrigari.</p>
                     </div>

                     <button 
                        type="submit"
                        disabled={!agreed || isRegistering} 
                        className={`w-full py-6 rounded-[28px] font-black text-[10px] uppercase tracking-widest transition-all shadow-xl flex justify-center items-center gap-4 ${(agreed && !isRegistering) ? 'bg-forest-night text-white hover:bg-afrigari-gold active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                     >
                        {isRegistering ? <Loader2 className="animate-spin" /> : "Créer Mon Compte"}
                     </button>
                  </form>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
