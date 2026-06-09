"use client";
import { useRouter } from 'next/navigation';
import { Clock, ArrowLeft, Mail, Hourglass, UserCheck } from 'lucide-react';
import { Suspense } from 'react';

function PendingValidationContent() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-organic-cream flex items-center justify-center p-6 font-sans overflow-hidden relative selection:bg-manioco-terracotta selection:text-white">
            
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-20 w-[800px] h-[800px] bg-manioco-terracotta/5 rounded-full blur-[150px] animate-float opacity-70"></div>
                <div className="absolute -bottom-40 -right-20 w-[800px] h-[800px] bg-[#F4A261]/5 rounded-full blur-[150px] animate-float-reverse opacity-70"></div>
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
                    
                    <div className="w-28 h-28 bg-[#F4A261]/10 rounded-full flex items-center justify-center mb-10 relative">
                        <Hourglass size={48} className="text-[#F4A261] animate-spin-slow" />
                        <div className="absolute inset-0 rounded-full border border-[#F4A261]/20 animate-pulse opacity-30"></div>
                    </div>

                    <h1 className="text-4xl font-black text-manioco-brown uppercase tracking-tighter italic mb-6 leading-tight">Vérification en Cours</h1>
                    
                    <div className="bg-slate-50/80 rounded-3xl p-8 w-full border border-slate-100/50 mb-10">
                        <p className="text-slate-800 font-bold text-base leading-relaxed italic">
                            "Bienvenue futur partenaire ! Notre équipe examine actuellement votre profil marchand pour garantir la sécurité de la communauté."
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-6 text-slate-500 mb-10">
                        <div className="flex items-center gap-3">
                            <Clock size={18} className="text-manioco-terracotta" />
                            <span className="text-sm font-bold italic">Délai estimé : 24h à 48h</span>
                        </div>
                        <p className="text-xs max-w-xs leading-relaxed">
                            Vous recevrez un email de confirmation dès que votre boutique sera activée.
                        </p>
                    </div>

                    <button 
                        onClick={() => router.push('/auth/login')}
                        className="bg-manioco-terracotta text-white px-12 py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-manioco-brown transition-all active:scale-95 shadow-xl shadow-manioco-terracotta/10 flex items-center gap-3"
                    >
                        <UserCheck size={18} />
                        Vérifier mon statut
                    </button>

                    <div className="mt-12 w-full pt-10 border-t border-slate-50 flex flex-col items-center gap-6">
                        <p className="text-xs text-slate-400 font-medium italic">Besoin d'envoyer des documents complémentaires ?</p>
                        <button className="text-manioco-terracotta font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:underline">
                            <Mail size={14} /> support@manioco.com
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

export default function PendingValidationPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-organic-cream flex items-center justify-center font-black text-manioco-terracotta animate-pulse">Ouverture de votre dossier...</div>}>
            <PendingValidationContent />
        </Suspense>
    );
}
