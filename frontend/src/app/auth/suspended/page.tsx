"use client";
import { useSearchParams, useRouter } from 'next/navigation';
import { Clock, ArrowLeft, ShieldCheck, Mail, AlertCircle } from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';

function SuspendedContent() {
   const searchParams = useSearchParams();
   const router = useRouter();
   const until = searchParams.get('until');
   const reason = searchParams.get('reason') || 'Violation des conditions d\'utilisation de la plateforme';

   const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null);
   const [mounted, setMounted] = useState(false);

   useEffect(() => {
      setMounted(true);
      if (!until) return;

      const timer = setInterval(() => {
         const now = Date.now();
         const distance = new Date(until).getTime() - now;

         if (distance < 0) {
            clearInterval(timer);
            setTimeLeft(null);
            return;
         }

         setTimeLeft({
            d: Math.floor(distance / (1000 * 60 * 60 * 24)),
            h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
            s: Math.floor((distance % (1000 * 60)) / 1000)
         });
      }, 1000);

      return () => clearInterval(timer);
   }, [until]);

   if (!mounted) return null;

   return (
      <div className="min-h-screen bg-organic-cream flex items-center justify-center p-6 font-sans overflow-hidden relative selection:bg-manioco-terracotta selection:text-white">

         <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-manioco-terracotta/5 rounded-full blur-[150px] animate-float opacity-70"></div>
            <div className="absolute -bottom-40 -right-40 w-[800px] h-[800px] bg-[#F4A261]/5 rounded-full blur-[150px] animate-float-reverse opacity-70"></div>
         </div>

         <div className="relative z-10 max-w-xl w-full text-center">

            {/* Logo Manioco */}
            <div className="flex flex-col items-center mb-12 animate-reveal">
               <div className="flex gap-1 items-center mb-4">
                  <span className="text-2xl font-extrabold tracking-tight text-manioco-brown">Mani</span>
                  <span className="relative inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#F4A261] border-[2.5px] border-manioco-brown text-manioco-brown text-sm font-black">o</span>
                  <span className="text-2xl font-extrabold tracking-tight text-manioco-brown">c</span>
                  <span className="relative inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#F4A261] border-[2.5px] border-manioco-brown text-manioco-brown text-sm font-black">o</span>
               </div>
               <div className="h-px w-12 bg-manioco-terracotta"></div>
            </div>

            {/* Main Card */}
            <div className="bg-white/80 backdrop-blur-2xl rounded-[4rem] shadow-[0_40px_100px_-20px_rgba(139,69,19,0.12)] border border-white p-12 lg:p-16 animate-reveal flex flex-col items-center">

               <div className="w-24 h-24 bg-manioco-terracotta/5 rounded-full flex items-center justify-center mb-10 relative">
                  <AlertCircle size={40} className="text-manioco-terracotta" />
                  <div className="absolute inset-0 rounded-full border border-manioco-terracotta/20 animate-ping opacity-30"></div>
               </div>

               <h1 className="text-4xl font-black text-manioco-brown uppercase tracking-tighter italic mb-6">Compte Limité</h1>

               <div className="bg-slate-50/80 rounded-3xl p-8 w-full border border-slate-100/50 mb-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Motif de la restriction</p>
                  <p className="text-slate-800 font-bold text-base leading-relaxed italic">
                     "{reason}"
                  </p>
               </div>

               {timeLeft ? (
                  <div className="w-full space-y-8">
                     <div className="flex items-center gap-3 justify-center mb-2">
                        <Clock size={16} className="text-[#F4A261]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Temps restant avant réactivation</span>
                     </div>

                     <div className="grid grid-cols-4 gap-4">
                        <TimeBox value={timeLeft.d} label="Jours" />
                        <TimeBox value={timeLeft.h} label="Heures" />
                        <TimeBox value={timeLeft.m} label="Min" />
                        <TimeBox value={timeLeft.s} label="Sec" />
                     </div>
                  </div>
               ) : (
                  <div className="w-full p-8 bg-manioco-terracotta rounded-[2.5rem] text-white flex flex-col items-center gap-6 shadow-2xl shadow-manioco-terracotta/20">
                     <ShieldCheck size={48} />
                     <div className="text-center">
                        <p className="text-lg font-black italic uppercase tracking-tighter">Restriction terminée</p>
                        <p className="text-xs opacity-80 mt-1">Votre accès est maintenant rétabli.</p>
                     </div>
                     <button
                        onClick={() => router.push('/auth/login')}
                        className="bg-white text-manioco-terracotta px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-manioco-brown hover:text-white transition-all active:scale-95 shadow-xl"
                     >
                        Se Connecter
                     </button>
                  </div>
               )}

               <div className="mt-12 w-full pt-10 border-t border-slate-50 flex flex-col items-center gap-6">
                  <p className="text-xs text-slate-400 font-medium italic">Vous pensez qu'il s'agit d'une erreur ?</p>
                  <button className="bg-slate-100 text-slate-600 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-manioco-terracotta hover:text-white transition-all flex items-center gap-2">
                     <Mail size={14} /> Contacter l'assistance
                  </button>
               </div>
            </div>

            <button
               onClick={() => router.push('/auth/login')}
               className="mt-12 flex items-center gap-3 mx-auto text-slate-400 hover:text-manioco-brown transition-all font-black uppercase text-[10px] tracking-widest"
            >
               <ArrowLeft size={16} /> Retour à l'accueil
            </button>
         </div>
      </div>
   );
}

function TimeBox({ value, label }: Readonly<{ value: number, label: string }>) {
   return (
      <div className="bg-white p-5 rounded-[2rem] border border-slate-100 flex flex-col items-center shadow-sm">
         <p className="text-3xl font-black text-manioco-terracotta tracking-tighter leading-none mb-1">{value < 10 ? `0${value}` : value}</p>
         <p className="text-[8px] font-black uppercase text-slate-300 tracking-widest">{label}</p>
      </div>
   );
}

export default function SuspendedPage() {
   return (
      <Suspense fallback={<div className="min-h-screen bg-organic-cream flex items-center justify-center font-black text-manioco-terracotta animate-pulse">Chargement de votre profil sécurisé...</div>}>
         <SuspendedContent />
      </Suspense>
   );
}
