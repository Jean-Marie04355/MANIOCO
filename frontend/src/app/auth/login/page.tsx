"use client";
import { Gem, ArrowRight, Mail, Lock, User, Leaf, Globe, Sparkles, ShieldCheck, CheckCircle2, Circle } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
      const { accessToken } = response.data;
      if (accessToken) {
        login(accessToken);
        
        // Récupérer les infos de l'utilisateur pour connaître son rôle
        const userRes = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        const userRole = userRes.data.role;
        
        if (userRole === 'vendeur' || userRole === 'seller') {
          router.push('/dashboard/seller');
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

  return (
    <div className="min-h-screen bg-organic-cream flex items-center justify-center p-4 selection:bg-afrigari-gold selection:text-white font-sans overflow-hidden relative">
      
      {/* --- ANTIGRAVITY ENGINE (Back-Layer Overload) --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute -top-40 -left-40 w-[1000px] h-[1000px] bg-forest-green/10 rounded-full blur-[180px] animate-float opacity-70"></div>
         <div className="absolute -bottom-40 -right-40 w-[1000px] h-[1000px] bg-afrigari-gold/10 rounded-full blur-[180px] animate-float-reverse opacity-70"></div>

         {mounted && particles.map((p) => (
            <div 
               key={p.id}
               className={`absolute animate-drift-slow ${p.blur}`}
               style={{ 
                  left: `${p.x}%`, 
                  top: `${p.y}%`,
                  animationDuration: `${p.duration}s`,
                  animationDelay: `${p.delay}s`,
                  opacity: p.opacity
               }}
            >
               <div className="animate-slow-bounce">
                  {p.type === 'leaf' ? (
                     <Leaf size={p.size} className="text-forest-green rotate-45" fill="currentColor" />
                  ) : (
                     <div className="bg-afrigari-gold rounded-full shadow-[0_0_15px_rgba(197,160,89,0.5)]" style={{ width: p.size/2, height: p.size/2 }}></div>
                  )}
               </div>
            </div>
         ))}
      </div>

      {/* Main Container */}
      <div className="relative z-50 w-full max-w-5xl h-[720px] bg-white/30 backdrop-blur-3xl rounded-[64px] shadow-[0_60px_150px_-30px_rgba(45,70,53,0.35)] border border-white/40 overflow-hidden animate-reveal flex">
         
         <div className="absolute top-0 left-0 h-full w-1/2 transition-all duration-700">
            <div className={`h-full flex flex-col items-center justify-center p-12 lg:p-20 transition-all duration-700 ${isSignIn ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none -translate-x-20'}`}>
               <div className="flex gap-2 mb-8 items-center">
                  <Leaf size={56} className="text-green-500" fill="currentColor" />
                  <span className="text-3xl font-black italic text-forest-green tracking-tighter">AFRIGARI</span>
               </div>
               <h1 className="text-6xl font-black uppercase text-forest-green mb-10 tracking-tighter italic">Login</h1>
               <form onSubmit={handleLogin} className="w-full space-y-5 max-w-[340px]">
                  {error && <div className="p-3 bg-red-50 text-red-500 text-sm rounded-xl font-bold border border-red-100">{error}</div>}
                  <Input 
                    icon={Mail} 
                    type="email"
                    placeholder="Adresse Email" 
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    required
                  />
                  <Input 
                    icon={Lock} 
                    type="password" 
                    placeholder="Mot de passe" 
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-forest-green text-white py-6 rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-afrigari-gold transition-all shadow-2xl shadow-forest-green/20 mt-6 active:scale-95 disabled:opacity-70 flex justify-center items-center"
                  >
                    {isLoading ? "Connexion..." : "Se Connecter"}
                  </button>
                  <div className="flex justify-end mt-4">
                    <Link href="/auth/forgot-password" className="text-[11px] font-black text-forest-green/60 hover:text-afrigari-gold transition-colors uppercase tracking-widest">
                       Mot de passe oublié ?
                    </Link>
                  </div>
               </form>
            </div>
         </div>

         <div className="absolute top-0 left-1/2 h-full w-1/2 transition-all duration-700">
            <div className={`h-full flex flex-col items-center justify-center p-12 lg:p-20 transition-all duration-700 ${!isSignIn ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none translate-x-20'}`}>
               <div className="flex gap-2 mb-8 items-center">
                  <Leaf size={56} className="text-green-500" fill="currentColor" />
                  <span className="text-3xl font-black italic text-forest-green tracking-tighter">AFRIGARI</span>
               </div>
               <h1 className="text-5xl font-black uppercase text-forest-green mb-8 tracking-tighter italic">Register</h1>
               <form onSubmit={handleRegister} className="w-full space-y-4 max-w-[360px]">
                  {registerError && <div className="p-3 bg-red-50 text-red-500 text-sm rounded-xl font-bold border border-red-100">{registerError}</div>}
                  {registerSuccess && <div className="p-3 bg-green-50 text-green-600 text-sm rounded-xl font-bold border border-green-100">Compte créé avec succès !</div>}
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                     <RoleBtn active={role === 'client'} onClick={() => setRole('client')} label="Client" color="forest" />
                     <RoleBtn active={role === 'seller'} onClick={() => setRole('seller')} label="Vendeur" color="gold" />
                  </div>
                  <Input 
                    icon={User} 
                    placeholder="Nom Complet" 
                    value={registerName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegisterName(e.target.value)}
                    required
                  />
                  <Input 
                    icon={Mail} 
                    type="email"
                    placeholder="Email" 
                    value={registerEmail}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegisterEmail(e.target.value)}
                    required
                  />
                  <Input 
                    icon={Lock} 
                    type="password" 
                    placeholder="Mot de passe" 
                    value={registerPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegisterPassword(e.target.value)}
                    required
                  />
                  <div className="flex items-start gap-4 px-2 py-2">
                     <div className="relative h-6 w-6 flex items-center justify-center pt-1">
                        <input type="checkbox" checked={agreed} onChange={() => setAgreed(!agreed)} className="appearance-none h-5 w-5 rounded-lg border-2 border-slate-200 checked:bg-forest-green checked:border-forest-green transition-all cursor-pointer" />
                        {agreed && <CheckCircle2 size={12} className="text-white absolute pointer-events-none" />}
                     </div>
                     <p className="text-[11px] font-bold text-forest-green/50 leading-relaxed">J'accepte les <span className="text-forest-green font-black underline">règles de confidentialité</span>.</p>
                  </div>
                  <button 
                    type="submit"
                    disabled={!agreed || isRegistering} 
                    className={`w-full py-6 rounded-[24px] font-black text-sm uppercase tracking-widest transition-all shadow-xl flex justify-center items-center ${(agreed && !isRegistering) ? 'bg-forest-green text-white hover:bg-afrigari-gold active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                  >
                    {isRegistering ? "Création..." : "Créer Compte"}
                  </button>
               </form>
            </div>
         </div>

         <div className={`absolute top-0 w-1/2 h-full transition-all duration-[800ms] cubic-bezier(0.68, -0.6, 0.32, 1.6) z-[100] ${isSignIn ? 'left-1/2' : 'left-0'}`}>
            <div className={`h-full bg-gradient-to-br from-forest-green to-forest-light relative overflow-hidden transition-all duration-700 ${isSignIn ? 'rounded-l-[150px]' : 'rounded-r-[150px]'}`}>
               <div className="h-full flex flex-col items-center justify-center text-center p-16 text-white relative z-10">
                  {isSignIn ? (
                     <div className="animate-reveal">
                        <h2 className="text-6xl font-black mb-8 tracking-tighter italic">Nouveau ?</h2>
                        <p className="text-white/70 text-base mb-14 max-w-[280px] mx-auto leading-relaxed italic">Rejoignez l'élite des producteurs et clients Afrigari.</p>
                        <button onClick={() => setIsSignIn(false)} className="group border-2 border-white/40 px-20 py-5 rounded-full font-black text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-forest-green transition-all flex items-center gap-3">
                           S'inscrire <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                        </button>
                     </div>
                  ) : (
                     <div className="animate-reveal">
                        <h2 className="text-6xl font-black mb-8 tracking-tighter italic">Déjà Membre ?</h2>
                        <p className="text-white/70 text-base mb-14 max-w-[280px] mx-auto leading-relaxed italic">Connectez-vous pour retrouver vos saveurs préférées.</p>
                        <button onClick={() => setIsSignIn(true)} className="group border-2 border-white/40 px-20 py-5 rounded-full font-black text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-forest-green transition-all flex items-center gap-3">
                           Se Connecter <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                        </button>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

