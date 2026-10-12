"use client";
import { useState } from 'react';
import { 
    Zap, 
    ShieldCheck, 
    BarChart3, 
    ArrowRight,
    Star
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthContext';

export default function SellerOnboarding() {
    const { user } = useAuth();
    const [activeCard, setActiveCard] = useState(0);
    const router = useRouter();

    const cards = [
        {
            title: "La Puissance d'Afrigari",
            description: "Vous rejoignez bien plus qu'une marketplace. C'est un écosystème conçu pour propulser les talents locaux vers une audience nationale.",
            icon: <Zap size={28} className="text-manioco-terracotta" />,
            benefit: "Visibilité instantanée auprès de milliers d'acheteurs.",
            color: "bg-manioco-terracotta-50/50",
            image: "/onboarding/power.png"
        },
        {
            title: "Gestion 360° sans effort",
            description: "Votre nouveau dashboard vous permet de piloter vos stocks, vos promotions et vos livraisons avec une précision chirurgicale.",
            icon: <BarChart3 size={28} className="text-manioco-terracotta" />,
            benefit: "Gagnez 4h par semaine sur votre gestion administrative.",
            color: "bg-manioco-terracotta-50/40",
            image: "/onboarding/manage.png"
        },
        {
            title: "Sécurité & Croissance",
            description: "Chaque transaction est sécurisée. Nous nous occupons de la confiance, vous vous occupez de la croissance de votre chiffre d'affaires.",
            icon: <ShieldCheck size={28} className="text-blue-600" />,
            benefit: "Paiements garantis et protection contre les litiges.",
            color: "bg-blue-50/40",
            image: "/onboarding/secure.png"
        }
    ];

    const finishOnboarding = () => {
        if (user?.id) {
            localStorage.setItem(`onboarded_${user.id}`, 'true');
        }
        router.push('/dashboard/seller');
    };

    const nextCard = () => {
        if (activeCard < cards.length - 1) setActiveCard(v => v + 1);
        else finishOnboarding();
    };

    return (
        <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden relative selection:bg-manioco-terracotta selection:text-white">
            
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-[60%] h-[60%] bg-manioco-terracotta-100/30 rounded-full blur-[140px] animate-float" />
                <div className="absolute -bottom-40 -left-40 w-[60%] h-[60%] bg-manioco-terracotta-50/40 rounded-full blur-[140px] animate-float-reverse" />
            </div>

            <div className="max-w-4xl w-full relative z-10 space-y-10">
                
                {/* Header */}
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur text-manioco-terracotta rounded-full text-[10px] font-black uppercase tracking-widest border border-manioco-terracotta-100 shadow-sm">
                        <Star size={12} fill="currentColor" /> Compte Validé
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-manioco-brown leading-none">
                        Prêt pour <br /> <span className="text-manioco-terracotta">l'aventure ?</span>
                    </h1>
                    <p className="text-manioco-brown/60 font-bold max-w-md mx-auto leading-relaxed text-sm">
                        Votre dossier a été approuvé. Voici comment nous allons transformer votre business ensemble.
                    </p>
                </div>

                {/* Card Slider Container */}
                <div className="relative h-[620px] md:h-[460px] flex items-center justify-center">
                    {cards.map((card, index) => (
                        <div 
                            key={index}
                            className={`absolute inset-0 grid grid-cols-1 md:grid-cols-12 items-center gap-8 p-8 md:p-12 rounded-[3.5rem] border-4 border-white shadow-2xl transition-all duration-700 ease-in-out ${
                                index === activeCard 
                                ? 'opacity-100 translate-x-0 scale-100 z-20' 
                                : index < activeCard 
                                ? 'opacity-0 -translate-x-full scale-90 z-10 pointer-events-none' 
                                : 'opacity-0 translate-x-full scale-90 z-10 pointer-events-none'
                            } ${card.color}`}
                        >
                            {/* Left Side: Human Sticker Illustration */}
                            <div className="md:col-span-5 flex justify-center items-center relative h-52 md:h-full overflow-hidden">
                                <div className="absolute w-44 h-44 bg-white/40 rounded-full blur-xl animate-pulse" />
                                <img 
                                    src={card.image} 
                                    className={`w-44 h-44 md:w-60 md:h-60 object-contain relative z-10 drop-shadow-[0_20px_35px_rgba(92,45,22,0.18)] transition-all duration-1000 ease-out ${
                                        index === activeCard 
                                        ? 'scale-100 opacity-100 rotate-0 translate-y-0 animate-float' 
                                        : 'scale-50 opacity-0 -rotate-12 translate-y-8'
                                    }`} 
                                    alt={card.title} 
                                />
                            </div>

                            {/* Right Side: Onboarding details */}
                            <div className={`md:col-span-7 space-y-4 md:space-y-6 text-left transition-all duration-1000 ease-out delay-150 ${
                                index === activeCard 
                                ? 'opacity-100 translate-x-0' 
                                : 'opacity-0 translate-x-8'
                            }`}>
                                <div className="w-14 h-14 bg-white rounded-2xl shadow-md flex items-center justify-center mb-2 transform rotate-3 hover:rotate-0 transition-transform">
                                    {card.icon}
                                </div>
                                <h2 className="text-2xl md:text-4xl font-black italic uppercase tracking-tight text-manioco-brown leading-tight">{card.title}</h2>
                                <p className="text-manioco-brown/80 font-bold text-sm md:text-base leading-relaxed">{card.description}</p>
                                
                                <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur px-5 py-3 rounded-2xl border border-white text-xs font-black text-manioco-brown uppercase tracking-wide shadow-sm">
                                    <span className="text-base">💡</span> {card.benefit}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Controls */}
                <div className="flex flex-col items-center gap-6">
                    {/* Dots indicator */}
                    <div className="flex gap-3">
                        {cards.map((_, i) => (
                            <button 
                                key={i}
                                onClick={() => setActiveCard(i)}
                                className={`h-2.5 rounded-full transition-all duration-500 ${i === activeCard ? 'w-12 bg-manioco-brown' : 'w-2.5 bg-manioco-brown/20'}`}
                            />
                        ))}
                    </div>

                    {/* Next / Start Button */}
                    <button 
                        onClick={nextCard}
                        className="group bg-manioco-brown text-white pl-12 pr-6 py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-xs flex items-center gap-12 hover:scale-[1.03] hover:bg-manioco-terracotta transition-all shadow-2xl active:scale-95"
                    >
                        {activeCard === cards.length - 1 ? "Démarrer l'expérience" : "Continuer"}
                        <div className="w-12 h-12 bg-[#FAF7F2] text-manioco-brown rounded-full flex items-center justify-center group-hover:rotate-45 transition-transform">
                            <ArrowRight size={20} />
                        </div>
                    </button>
                    
                    {/* Skip button */}
                    <button 
                        onClick={finishOnboarding}
                        className="text-[10px] font-black uppercase tracking-widest text-manioco-brown/40 hover:text-manioco-brown transition-colors"
                    >
                        Passer l'introduction
                    </button>
                </div>
            </div>
        </div>
    );
}
