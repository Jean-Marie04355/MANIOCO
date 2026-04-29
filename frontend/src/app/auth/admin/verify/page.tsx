"use client";
import { ChevronLeft, ArrowRight, ShieldCheck, Timer, RefreshCw, Leaf, Sparkles, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthContext';

export default function AdminVerifyPage() {
   const router = useRouter();
   const [otp, setOtp] = useState(['', '', '', '', '', '']);
   const [timeLeft, setTimeLeft] = useState(295);
   const [mounted, setMounted] = useState(false);
   const [email, setEmail] = useState('');
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const inputRefs = useRef<any>([]);
   const { login } = useAuth();

   useEffect(() => {
      setMounted(true);
      const storedEmail = sessionStorage.getItem('adminLoginEmail');
      if (storedEmail) setEmail(storedEmail);
      if (!storedEmail) {
         router.push('/auth/admin/login');
      }
   }, [router]);

   useEffect(() => {
      if (timeLeft > 0) {
         const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
         return () => clearTimeout(timer);
      }
   }, [timeLeft]);

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

   const handleChange = (element: any, index: number) => {
      if (isNaN(element.value)) return false;
      const newOtp = [...otp];
      newOtp[index] = element.value;
      setOtp(newOtp);
      if (element.value !== '' && index < 5) {
         inputRefs.current[index + 1].focus();
      }
   };

   const handleKeyDown = (e: any, index: number) => {
      if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
         inputRefs.current[index - 1].focus();
      }
   };

   const isComplete = otp.every(d => d !== '');

   const handleVerify = async () => {
      if (!isComplete || !email) return;

      setIsLoading(true);
      setError(null);
      const otpCode = otp.join('');

      try {
         const res = await fetch('http://localhost:3000/auth/admin/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otpCode }),
         });

         const data = await res.json();
         if (!res.ok) {
            throw new Error(data.message || 'Le code saisi est invalide ou expiré.');
         }

         login(data.accessToken, data.user);

         if (data.user.role === 'super_admin') {
            router.push('/dashboard/super-admin');
         } else {
            router.push('/dashboard/admin');
         }
      } catch (err: any) {
         setError(err.message);
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <div className="min-h-screen bg-organic-cream flex items-center justify-center p-4 font-sans selection:bg-forest-green selection:text-white overflow-hidden relative">

         {/* --- ORGANIC BACKGROUND ENGINE --- */}
         <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-5%] w-[700px] h-[700px] bg-forest-green/10 rounded-full blur-[140px] animate-float"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-afrigari-gold/5 rounded-full blur-[140px] animate-float-reverse"></div>

            {mounted && particles.map((p) => (
               <div key={p.id} className="absolute animate-drift-slow" style={{ left: `${p.x}%`, top: `${p.y}%`, animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s`, opacity: p.opacity }}>
                  {Math.random() > 0.5 ? (
                     <Leaf size={p.size} className="text-forest-green" fill="currentColor" />
                  ) : (
                     <div className="bg-afrigari-gold rounded-full" style={{ width: p.size / 5, height: p.size / 5 }}></div>
                  )}
               </div>
            ))}
         </div>

         {/* --- VERIFICATION CARD (CLIENT STYLE) --- */}
         <div className="relative z-20 w-full max-w-[500px] bg-white/40 backdrop-blur-3xl rounded-[60px] shadow-[0_60px_150px_-30px_rgba(45,70,53,0.25)] border border-white/60 p-12 lg:p-16 flex flex-col items-center animate-reveal">

            <div className="flex gap-1 mb-10 relative group">
               <Leaf size={40} className="text-green-600 rotate-[-15deg] group-hover:rotate-0 transition-transform duration-500" fill="currentColor" />
               <Leaf size={56} className="text-green-500 group-hover:scale-110 transition-transform duration-500" fill="currentColor" />
            </div>

            <h1 className="text-4xl font-black text-forest-green mb-3 tracking-tighter italic uppercase">Vérification</h1>
            <p className="text-sm font-bold text-forest-green/50 mb-8 text-center px-4 leading-relaxed italic">Synchronisation de sécurité nécessaire. Veuillez entrer le code envoyé à votre terminal.</p>

            {error && <div className="text-red-500 text-sm font-bold w-full text-center bg-red-50 p-4 rounded-[20px] mb-8">{error}</div>}

            <div className="w-full space-y-12">
               {/* OTP Inputs with Forest & Gold accents */}
               <div className="flex justify-between gap-2.5">
                  {otp.map((data, index) => (
                     <input
                        key={index}
                        type="text"
                        maxLength={1}
                        ref={el => { inputRefs.current[index] = el; }}
                        value={data}
                        onChange={e => handleChange(e.target, index)}
                        onKeyDown={e => handleKeyDown(e, index)}
                        className="w-12 h-16 sm:w-14 sm:h-20 bg-white/50 border-2 border-forest-green/5 rounded-[24px] text-center text-3xl font-black text-forest-green outline-none focus:border-forest-green focus:bg-white focus:ring-8 focus:ring-forest-green/5 focus:scale-105 transition-all shadow-sm"
                     />
                  ))}
               </div>

               <div className="flex flex-col items-center gap-8">
                  <div className="px-8 py-4 bg-forest-green/5 rounded-full border border-forest-green/5 flex items-center gap-3">
                     <Timer size={20} className="text-afrigari-gold" />
                     <span className="text-lg font-black text-forest-green tabular-nums">
                        {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
                     </span>
                  </div>

                  <button
                     onClick={handleVerify}
                     disabled={!isComplete || isLoading}
                     className={`w-full py-6 rounded-[28px] font-black text-sm uppercase tracking-widest transition-all shadow-2xl flex items-center justify-center gap-4 group ${isComplete && !isLoading ? 'bg-forest-green text-white hover:bg-afrigari-gold active:scale-95' : 'bg-slate-100 text-slate-400 pointer-events-none'}`}
                  >
                     {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Valider l'Accès <ShieldCheck size={20} /></>}
                  </button>

                  <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-forest-green/30 hover:text-forest-green transition-all group p-2">
                     <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-700" /> Renvoyer un code
                  </button>
               </div>
            </div>

            <Link href="/auth/admin/login" className="mt-12 text-[10px] font-black uppercase tracking-widest text-forest-green/20 hover:text-forest-green transition-colors flex items-center gap-2 italic">
               <ChevronLeft size={14} /> Retour à l'accueil admin
            </Link>
         </div>

         <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 animate-reveal opacity-10">
            <Sparkles size={16} className="text-afrigari-gold" />
            <span className="text-[10px] font-black uppercase tracking-[1em] text-forest-green">SÉCURITÉ</span>
            <Sparkles size={16} className="text-afrigari-gold" />
         </div>
      </div>
   );
}
