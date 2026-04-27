"use client";
import { Gem, ArrowRight, Mail, Lock, User } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
   return (
      <div className="min-h-screen bg-organic-cream flex items-center justify-center p-8 selection:bg-afrigari-gold selection:text-white">
         <div className="w-full max-w-md animate-reveal">
            <div className="text-center mb-12">
               <div className="w-16 h-16 bg-forest-green rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-2xl">
                  <Gem size={32} />
               </div>
               <h1 className="text-4xl font-black tracking-tighter uppercase font-display">Rejoindre</h1>
               <p className="text-sm text-forest-green/50 font-bold mt-2">Devenir membre de l'élite Afrigari</p>
            </div>

            <div className="glass-premium p-10 rounded-[48px] border border-white space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest ml-4 text-forest-green/40">Nom Complet</label>
                  <div className="relative">
                     <User className="absolute left-5 top-1/2 -translate-y-1/2 text-forest-green/30" size={18} />
                     <input type="text" placeholder="Jean DOSSOU" className="w-full bg-forest-green/5 border-none rounded-full py-4 pl-14 pr-6 text-sm font-bold outline-none focus:ring-2 focus:ring-afrigari-gold/20 transition-all" />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest ml-4 text-forest-green/40">Adresse Email</label>
                  <div className="relative">
                     <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-forest-green/30" size={18} />
                     <input type="email" placeholder="votre@email.com" className="w-full bg-forest-green/5 border-none rounded-full py-4 pl-14 pr-6 text-sm font-bold outline-none focus:ring-2 focus:ring-afrigari-gold/20 transition-all" />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest ml-4 text-forest-green/40">Mot de passe</label>
                  <div className="relative">
                     <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-forest-green/30" size={18} />
                     <input type="password" placeholder="••••••••" className="w-full bg-forest-green/5 border-none rounded-full py-4 pl-14 pr-6 text-sm font-bold outline-none focus:ring-2 focus:ring-afrigari-gold/20 transition-all" />
                  </div>
               </div>

               <button className="w-full bg-forest-green text-white py-5 rounded-full font-black text-xs uppercase tracking-widest hover:bg-afrigari-gold transition-all shadow-xl flex items-center justify-center gap-3 mt-4">
                  Créer Mon Compte <ArrowRight size={18} />
               </button>
            </div>

            <div className="text-center mt-10">
               <p className="text-xs font-bold text-forest-green/40">
                  Déjà membre ? <Link href="/auth/login" className="text-forest-green font-black underline decoration-afrigari-gold decoration-2 underline-offset-4 ml-1">Se connecter</Link>
               </p>
            </div>
         </div>
      </div>
   );
}
