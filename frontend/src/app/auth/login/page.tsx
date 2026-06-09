"use client";
import { ArrowRight, Mail, Lock, User, CheckCircle2 } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { RoleBtn } from '@/features/auth/components/RoleBtn';
import { useAuth } from '@/features/auth/AuthContext';
import api from '@/lib/axios';
import { secureRandom } from '@/lib/utils';

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
      if (err.response) {
        const msg = err.response?.data?.message;
        setError(Array.isArray(msg) ? msg.join(', ') : (msg || 'Identifiants incorrects'));
      } else {
        setError("Le serveur (backend) est injoignable.");
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
      setTimeout(() => {
        setIsSignIn(true);
        setEmail(registerEmail);
        setPassword(registerPassword);
        setRegisterSuccess(false);
      }, 1500);
    } catch (err: any) {
      if (err.response) {
        const msg = err.response?.data?.message;
        setRegisterError(Array.isArray(msg) ? msg.join(', ') : (msg || "Erreur lors de l'inscription"));
      } else {
        setRegisterError("Le serveur (backend) est injoignable. Est-il bien démarré ?");
      }
    } finally {
      setIsRegistering(false);
    }
  };

  // Particules
  const particles = useMemo(() => {
    if (!mounted) return [];
    return Array.from({ length: 70 }).map((_, i) => ({
      id: i,
      size: secureRandom() * 25 + 5,
      x: secureRandom() * 100, 
      y: secureRandom() * 100, 
      duration: secureRandom() * 15 + 10, 
      delay: secureRandom() * -30, 
      type: secureRandom() > 0.6 ? 'circle' : 'dot',
      opacity: secureRandom() * 0.2 + 0.1,
      blur: secureRandom() > 0.8 ? 'blur-[2px]' : 'blur-none'
    }));
  }, [mounted]);

  // Logo Manioco (identique à la page d'accueil)
  const ManiocoLogo = () => (
    <div className="flex gap-1 mb-8 items-center">
      <span className="text-3xl font-extrabold tracking-tight text-manioco-brown">Mani</span>
      <span className="relative inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#F4A261] border-[2.5px] border-manioco-brown text-manioco-brown text-base font-black">o</span>
      <span className="text-3xl font-extrabold tracking-tight text-manioco-brown">c</span>
      <span className="relative inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#F4A261] border-[2.5px] border-manioco-brown text-manioco-brown text-base font-black">o</span>
    </div>
  );

  const ManiocoLogoWhite = () => (
    <div className="flex gap-1 mb-8 items-center justify-center">
      <span className="text-3xl font-extrabold tracking-tight text-white">Mani</span>
      <span className="relative inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#F4A261] border-[2.5px] border-white text-white text-base font-black">o</span>
      <span className="text-3xl font-extrabold tracking-tight text-white">c</span>
      <span className="relative inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#F4A261] border-[2.5px] border-white text-white text-base font-black">o</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-organic-cream flex items-center justify-center p-4 selection:bg-manioco-terracotta selection:text-white font-sans overflow-hidden relative">
      
      {/* --- Fond animé --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute -top-40 -left-40 w-[1000px] h-[1000px] bg-manioco-terracotta/10 rounded-full blur-[180px] animate-float opacity-70"></div>
         <div className="absolute -bottom-40 -right-40 w-[1000px] h-[1000px] bg-[#F4A261]/10 rounded-full blur-[180px] animate-float-reverse opacity-70"></div>

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
                  {p.type === 'circle' ? (
                     <div className="rounded-full bg-manioco-terracotta shadow-[0_0_15px_rgba(197,100,89,0.4)]" style={{ width: p.size, height: p.size }}></div>
                  ) : (
                     <div className="bg-[#F4A261] rounded-full shadow-[0_0_15px_rgba(244,162,97,0.5)]" style={{ width: p.size/2, height: p.size/2 }}></div>
                  )}
               </div>
            </div>
         ))}
      </div>

      {/* Main Container */}
      <div className="relative z-50 w-full max-w-5xl h-[720px] bg-white/30 backdrop-blur-3xl rounded-[64px] shadow-[0_60px_150px_-30px_rgba(139,69,19,0.25)] border border-white/40 overflow-hidden animate-reveal flex">
         
         {/* Panneau Login */}
         <div className="absolute top-0 left-0 h-full w-1/2 transition-all duration-700">
            <div className={`h-full flex flex-col items-center justify-center p-12 lg:p-20 transition-all duration-700 ${isSignIn ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none -translate-x-20'}`}>
               <ManiocoLogo />
               <h1 className="text-6xl font-black uppercase text-manioco-brown mb-10 tracking-tighter italic">Login</h1>
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
                    className="w-full bg-manioco-terracotta text-white py-6 rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-manioco-brown transition-all shadow-2xl shadow-manioco-terracotta/20 mt-6 active:scale-95 disabled:opacity-70 flex justify-center items-center"
                  >
                    {isLoading ? "Connexion..." : "Se Connecter"}
                  </button>
                  <div className="flex justify-end mt-4">
                    <Link href="/auth/forgot-password" className="text-[11px] font-black text-manioco-brown/60 hover:text-manioco-terracotta transition-colors uppercase tracking-widest">
                       Mot de passe oublié ?
                    </Link>
                  </div>
               </form>
            </div>
         </div>

         {/* Panneau Register */}
         <div className="absolute top-0 left-1/2 h-full w-1/2 transition-all duration-700">
            <div className={`h-full flex flex-col items-center justify-center p-12 lg:p-20 transition-all duration-700 ${isSignIn ? 'opacity-0 scale-90 pointer-events-none translate-x-20' : 'opacity-100 scale-100'}`}>
               <ManiocoLogo />
               <h1 className="text-5xl font-black uppercase text-manioco-brown mb-8 tracking-tighter italic">Register</h1>
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
                        <input type="checkbox" checked={agreed} onChange={() => setAgreed(!agreed)} className="appearance-none h-5 w-5 rounded-lg border-2 border-slate-200 checked:bg-manioco-terracotta checked:border-manioco-terracotta transition-all cursor-pointer" />
                        {agreed && <CheckCircle2 size={12} className="text-white absolute pointer-events-none" />}
                     </div>
                     <p className="text-[11px] font-bold text-manioco-brown/50 leading-relaxed">J'accepte les <span className="text-manioco-brown font-black underline">règles de confidentialité</span>.</p>
                  </div>
                  <button 
                    type="submit"
                    disabled={!agreed || isRegistering} 
                    className={`w-full py-6 rounded-[24px] font-black text-sm uppercase tracking-widest transition-all shadow-xl flex justify-center items-center ${(agreed && !isRegistering) ? 'bg-manioco-terracotta text-white hover:bg-manioco-brown active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                  >
                    {isRegistering ? "Création..." : "Créer Compte"}
                  </button>
               </form>
            </div>
         </div>

         {/* Panneau glissant */}
         <div className={`absolute top-0 w-1/2 h-full transition-all duration-[800ms] cubic-bezier(0.68, -0.6, 0.32, 1.6) z-[100] ${isSignIn ? 'left-1/2' : 'left-0'}`}>
            <div className={`h-full bg-gradient-to-br from-manioco-terracotta to-[#c8602a] relative overflow-hidden transition-all duration-700 ${isSignIn ? 'rounded-l-[150px]' : 'rounded-r-[150px]'}`}>
               <div className="h-full flex flex-col items-center justify-center text-center p-16 text-white relative z-10">
                  {isSignIn ? (
                     <div className="animate-reveal">
                        <ManiocoLogoWhite />
                        <h2 className="text-6xl font-black mb-8 tracking-tighter italic">Nouveau ?</h2>
                        <p className="text-white/70 text-base mb-14 max-w-[280px] mx-auto leading-relaxed italic">Rejoignez l'élite des producteurs et clients Manioco.</p>
                        <button onClick={() => setIsSignIn(false)} className="group border-2 border-white/40 px-20 py-5 rounded-full font-black text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-manioco-terracotta transition-all flex items-center gap-3">
                           S'inscrire <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                        </button>
                     </div>
                  ) : (
                     <div className="animate-reveal">
                        <ManiocoLogoWhite />
                        <h2 className="text-6xl font-black mb-8 tracking-tighter italic">Déjà Membre ?</h2>
                        <p className="text-white/70 text-base mb-14 max-w-[280px] mx-auto leading-relaxed italic">Connectez-vous pour retrouver vos saveurs préférées.</p>
                        <button onClick={() => setIsSignIn(true)} className="group border-2 border-white/40 px-20 py-5 rounded-full font-black text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-manioco-terracotta transition-all flex items-center gap-3">
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
