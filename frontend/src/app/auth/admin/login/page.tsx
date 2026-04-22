"use client";
import { ShieldCheck, Lock, Mail, ArrowRight, User, Leaf, Fingerprint, Sparkles, Loader2, ChevronLeft } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';

export default function AdminLoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:3000/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'La connexion a échoué.');
      }

      sessionStorage.setItem('adminLoginEmail', email);
      router.push('/auth/admin/verify');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const particles = useMemo(() => {
    if (!mounted) return [];
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      size: Math.random() * 20 + 5,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * -30,
      opacity: Math.random() * 0.15 + 0.05
    }));
  }, [mounted]);

  return (
    <div className="min-h-screen bg-organic-cream flex items-center justify-center p-4 font-sans selection:bg-forest-green selection:text-white overflow-hidden relative">
      
      {/* --- BACKGROUND ENGINE --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[-5%] w-[700px] h-[700px] bg-forest-green/10 rounded-full blur-[140px] animate-float"></div>
         <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-afrigari-gold/5 rounded-full blur-[140px] animate-float-reverse"></div>
         
         {mounted && particles.map((p) => (
            <div key={p.id} className="absolute animate-drift-slow" style={{ left: `${p.x}%`, top: `${p.y}%`, animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s`, opacity: p.opacity }}>
               {Math.random() > 0.5 ? (
                  <Leaf size={p.size} className="text-forest-green opacity-40" fill="currentColor" />
               ) : (
                  <div className="w-1 h-1 bg-afrigari-gold rounded-full"></div>
               )}
            </div>
         ))}
      </div>

      {/* --- CENTRALIZED AUTH CARD --- */}
      <div className="relative z-20 w-full max-w-[500px] bg-white/40 backdrop-blur-3xl rounded-[60px] shadow-[0_60px_150px_-30px_rgba(45,70,53,0.3)] border border-white/60 p-12 lg:p-16 flex flex-col items-center animate-reveal">
         
         <div className="flex gap-1 mb-8 relative group">
            <ShieldCheck size={56} className="text-forest-green group-hover:scale-110 transition-transform duration-500" />
            <Sparkles size={24} className="text-afrigari-gold absolute -top-2 -right-4 animate-pulse opacity-80" />
         </div>
         
         <h1 className="text-4xl font-black uppercase text-forest-green mb-4 tracking-tighter italic text-center">Citadel</h1>
         <p className="text-sm font-bold text-forest-green/50 mb-10 text-center px-4 leading-relaxed italic">Veuillez vous authentifier pour accéder à la gestion administrative (Admin & Super Admin).</p>

         <form onSubmit={onSubmit} className="w-full space-y-6">
            {error && <div className="text-red-500 text-sm font-bold text-center bg-red-50 p-4 rounded-[20px]">{error}</div>}
            
            <Input icon={User} type="email" placeholder="Identifiant (Email)" value={email} onChange={e => setEmail(e.target.value)} required />
            <Input icon={Lock} type="password" placeholder="Mot de passe système" value={password} onChange={e => setPassword(e.target.value)} required />
            
            <button type="submit" disabled={isLoading} className="w-full bg-forest-green text-white py-6 rounded-[28px] font-black text-sm uppercase tracking-widest hover:bg-afrigari-gold transition-all shadow-2xl flex items-center justify-center gap-3 mt-8 disabled:opacity-70 active:scale-95">
               {isLoading ? <Loader2 className="animate-spin" size={18} /> : <>Entrer dans la Citadelle <ArrowRight size={18} /></>}
            </button>
         </form>

         <Link href="/dashboard/client" className="mt-12 text-[10px] font-black uppercase tracking-widest text-forest-green/30 hover:text-forest-green transition-colors flex items-center gap-2">
            <ChevronLeft size={14} /> Retour à l'accueil
         </Link>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 animate-reveal opacity-20">
         <div className="h-px w-24 bg-forest-green"></div>
         <span className="text-[11px] font-black uppercase tracking-[1em] text-forest-green">SÉCURITÉ</span>
         <div className="h-px w-24 bg-forest-green"></div>
      </div>
    </div>
  );
}

