"use client";
import { useRouter } from 'next/navigation';
import { Leaf, Clock, ArrowLeft, Mail, Hourglass, UserCheck } from 'lucide-react';
import { Suspense } from 'react';

function PendingValidationContent() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-organic-cream flex items-center justify-center p-6 font-sans overflow-hidden relative selection:bg-afrigari-gold selection:text-white">
            
            {/* Soft Organic Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-20 w-[800px] h-[800px] bg-forest-green/5 rounded-full blur-[150px] animate-float opacity-70"></div>
                <div className="absolute -bottom-40 -right-20 w-[800px] h-[800px] bg-afrigari-gold/5 rounded-full blur-[150px] animate-float-reverse opacity-70"></div>
            </div>

            <div className="relative z-10 max-w-xl w-full text-center">
                
                {/* Brand Identity */}
                <div className="flex flex-col items-center mb-12 animate-reveal">
                    <div className="flex gap-2 items-center mb-4">
                        <Leaf size={48} className="text-forest-green" fill="currentColor" />
                        <span className="text-2xl font-black italic text-forest-green tracking-tighter uppercase">Afrigari</span>
                    </div>
                    <div className="h-px w-12 bg-afrigari-gold"></div>
                </div>

                {/* Main Card */}
                <div className="bg-white/80 backdrop-blur-2xl rounded-[4rem] shadow-[0_40px_100px_-20px_rgba(45,70,53,0.15)] border border-white p-12 lg:p-16 animate-reveal flex flex-col items-center">
                    
                    {/* Status Icon */}
                    <div className="w-28 h-28 bg-afrigari-gold/5 rounded-full flex items-center justify-center mb-10 relative">
                        <Hourglass size={48} className="text-afrigari-gold animate-spin-slow" />
                        <div className="absolute inset-0 rounded-full border border-afrigari-gold/20 animate-pulse opacity-30"></div>
                    </div>

                    <h1 className="text-4xl font-black text-forest-green uppercase tracking-tighter italic mb-6 leading-tight">Vérification en Cours</h1>
                    
                    <div className="bg-slate-50/80 rounded-3xl p-8 w-full border border-slate-100/50 mb-10">
                        <p className="text-slate-800 font-bold text-base leading-relaxed italic">
                            "Bienvenue futur partenaire ! Notre équipe examine actuellement votre profil marchand pour garantir la sécurité de la communauté."
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-6 text-slate-500 mb-10">
                        <div className="flex items-center gap-3">
                            <Clock size={18} className="text-forest-green" />
                            <span className="text-sm font-bold italic">Délai estimé : 24h à 48h</span>
                        </div>
                        <p className="text-xs max-w-xs leading-relaxed">
                            Vous recevrez un email de confirmation dès que votre boutique sera activée.
                        </p>
                    </div>

                    {/* Action Button */}
                    <button 
                        onClick={() => router.push('/auth/login')}
                        className="bg-forest-green text-white px-12 py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-afrigari-gold transition-all active:scale-95 shadow-xl shadow-forest-green/10 flex items-center gap-3"
                    >
                        <UserCheck size={18} />
                        Vérifier mon statut
                    </button>

                    {/* Support Linking */}
                    <div className="mt-12 w-full pt-10 border-t border-slate-50 flex flex-col items-center gap-6">
                        <p className="text-xs text-slate-400 font-medium italic">Besoin d'envoyer des documents complémentaires ?</p>
                        <button 
                            className="text-forest-green font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:underline"
                        >
                            <Mail size={14} /> support@afrigari.com
                        </button>
                    </div>
                </div>

                {/* Return button */}
                <button 
                    onClick={() => router.push('/auth/login')}
                    className="mt-12 flex items-center gap-3 mx-auto text-slate-400 hover:text-forest-green transition-all font-black uppercase text-[10px] tracking-widest"
                >
                    <ArrowLeft size={16} /> Retour à l'accueil
                </button>
            </div>
        </div>
    );
}

export default function PendingValidationPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-organic-cream flex items-center justify-center font-black text-forest-green animate-pulse">Ouverture de votre dossier...</div>}>
            <PendingValidationContent />
        </Suspense>
    );
}
