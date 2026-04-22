"use client";
import { ShieldCheck, Lock, Mail, ArrowRight, User, Leaf, Fingerprint, Sparkles, CheckCircle2, ChevronLeft } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';


export default function AdminLoginPage() {
  const [isAdminMode, setIsAdminMode] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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
      
      {/* --- CLIENT-STYLE ANTIGRAVITY ENGINE --- */}
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

      {/* --- SLIDING AUTH CONTAINER (CLIENT-STYLE PORTED TO ADMIN) --- */}
      <div className="relative z-20 w-full max-w-5xl h-[720px] bg-white/40 backdrop-blur-3xl rounded-[60px] shadow-[0_60px_150px_-30px_rgba(45,70,53,0.3)] border border-white/60 overflow-hidden animate-reveal flex">
         
         {/* 1. ADMIN LOGIN (FIXED LEFT) */}
         <div className="absolute top-0 left-0 h-full w-1/2 transition-all duration-700">
            <div className={`h-full flex flex-col items-center justify-center p-12 lg:p-20 transition-all duration-700 ${isAdminMode ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none -translate-x-12'}`}>
               <div className="flex gap-1 mb-8 relative group">
                  <Leaf size={48} className="text-green-600 rotate-[-15deg] group-hover:rotate-0 transition-transform duration-500" fill="currentColor" />
                  <Leaf size={64} className="text-green-500 group-hover:scale-110 transition-transform duration-500" fill="currentColor" />
               </div>
               <h1 className="text-5xl font-black uppercase text-forest-green mb-10 tracking-tighter italic">Admin</h1>
               <form className="w-full space-y-6 max-w-[340px]">
                  <Input icon={Mail} placeholder="Admin Email" />
                  <Input icon={Lock} type="password" placeholder="Key Phrase" />
                  <Link href="/auth/admin/verify" className="w-full bg-forest-green text-white py-6 rounded-[28px] font-black text-sm uppercase tracking-widest hover:bg-afrigari-gold transition-all shadow-2xl flex items-center justify-center gap-3 mt-6">
                     Access Vault <Fingerprint size={18} />
                  </Link>
               </form>
               <Link href="/dashboard/client" className="mt-10 text-[10px] font-black uppercase tracking-widest text-forest-green/30 hover:text-forest-green transition-colors flex items-center gap-2">
                  <ChevronLeft size={14} /> Back to Platform
               </Link>
            </div>
         </div>

         {/* 2. SUPER ADMIN LOGIN (FIXED RIGHT) */}
         <div className="absolute top-0 left-1/2 h-full w-1/2 transition-all duration-700">
            <div className={`h-full flex flex-col items-center justify-center p-12 lg:p-20 transition-all duration-700 ${!isAdminMode ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none translate-x-12'}`}>
               <div className="flex gap-1 mb-8 relative group">
                  <ShieldCheck size={64} className="text-afrigari-gold group-hover:scale-110 transition-transform duration-500" />
               </div>
               <h1 className="text-4xl font-black uppercase text-forest-green mb-10 tracking-tighter italic text-center leading-none">Super<br/><span className="text-afrigari-gold">Privilege</span></h1>
               <form className="w-full space-y-6 max-w-[340px]">
                  <Input icon={User} placeholder="Super User ID" />
                  <Input icon={Lock} type="password" placeholder="System Master Key" />
                  <Link href="/auth/admin/verify" className="w-full bg-afrigari-gold text-white py-6 rounded-[28px] font-black text-sm uppercase tracking-widest hover:bg-forest-green transition-all shadow-2xl flex items-center justify-center gap-3 mt-6">
                     Root Access <ArrowRight size={18} />
                  </Link>
               </form>
            </div>
         </div>

         {/* --- SLIDING OVERLAY (THE "MAGIC" PART) --- */}
         <div className={`absolute top-0 w-1/2 h-full transition-all duration-[800ms] cubic-bezier(0.68, -0.6, 0.32, 1.6) z-[100] ${isAdminMode ? 'left-1/2' : 'left-0'}`}>
            <div className={`h-full bg-gradient-to-br from-forest-green to-forest-light relative overflow-hidden transition-all duration-700 ${isAdminMode ? 'rounded-l-[120px]' : 'rounded-r-[120px]'}`}>
               <div className="h-full flex flex-col items-center justify-center text-center p-16 text-white relative z-10">
                  {isAdminMode ? (
                     <div className="animate-reveal">
                        <Sparkles size={40} className="text-afrigari-gold mb-8 mx-auto opacity-50" />
                        <h2 className="text-5xl font-black mb-8 tracking-tighter italic italic">Root?</h2>
                        <p className="text-white/60 text-sm mb-12 max-w-[260px] mx-auto leading-relaxed italic">Vous possédez les clés maîtresses ? Basculez sur l'accès Super-Administrateur.</p>
                        <button onClick={() => setIsAdminMode(false)} className="group border-2 border-white/50 px-16 py-5 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-forest-green transition-all hover:scale-105 flex items-center gap-2 mx-auto">
                           Go to Root <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                     </div>
                  ) : (
                     <div className="animate-reveal">
                        <ShieldCheck size={40} className="text-white mb-8 mx-auto opacity-50" />
                        <h2 className="text-5xl font-black mb-8 tracking-tighter italic">Regular?</h2>
                        <p className="text-white/60 text-sm mb-12 max-w-[260px] mx-auto leading-relaxed italic">Retournez sur l'interface de gestion administrative standard.</p>
                        <button onClick={() => setIsAdminMode(true)} className="group border-2 border-white/50 px-16 py-5 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-forest-green transition-all hover:scale-105 flex items-center gap-2 mx-auto">
                           Go Admin <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                     </div>
                  )}
               </div>
               
               {/* Pattern overlay */}
               <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
            </div>
         </div>

      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 animate-reveal opacity-20">
         <div className="h-px w-24 bg-forest-green"></div>
         <span className="text-[11px] font-black uppercase tracking-[1em] text-forest-green">CITADEL</span>
         <div className="h-px w-24 bg-forest-green"></div>
      </div>
    </div>
  );
}

