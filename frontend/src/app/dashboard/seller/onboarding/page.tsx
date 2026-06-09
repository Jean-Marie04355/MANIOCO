"use client";
import { useState } from 'react';
import { 
    Zap, 
    ShieldCheck, 
    TrendingUp, 
    ChevronRight, 
    ChevronLeft, 
    ShoppingBag, 
    BarChart3, 
    ArrowRight,
    Star
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SellerOnboarding() {
    const [activeCard, setActiveCard] = useState(0);
    const router = useRouter();

    const cards = [
        {
            title: "La Puissance d'Afrigari",
            description: "Vous rejoignez bien plus qu'une marketplace. C'est un écosystème conçu pour propulser les talents locaux vers une audience nationale.",
            icon: <Zap size={48} className="text-manioco-terracotta" />,
            benefit: "Visibilité instantanée auprès de milliers d'acheteurs.",
            color: "bg-manioco-terracotta-50"
        },
        {
            title: "Gestion 360° sans effort",
            description: "Votre nouveau dashboard vous permet de piloter vos stocks, vos promotions et vos livraisons avec une précision chirurgicale.",
            icon: <BarChart3 size={48} className="text-manioco-terracotta" />,
            benefit: "Gagnez 4h par semaine sur votre gestion administrative.",
            color: "bg-manioco-terracotta-50"
        },
        {
            title: "Sécurité & Croissance",
            description: "Chaque transaction est sécurisée. Nous nous occupons de la confiance, vous vous occupez de la croissance de votre chiffre d'affaires.",
            icon: <ShieldCheck size={48} className="text-blue-500" />,
            benefit: "Paiements garantis et protection contre les litiges.",
            color: "bg-blue-50"
        }
    ];

    const nextCard = () => {
        if (activeCard < cards.length - 1) setActiveCard(v => v + 1);
        else router.push('/dashboard/seller');
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 overflow-hidden">
            
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-manioco-terracotta-100 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-manioco-terracotta-50 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-4xl w-full relative z-10 space-y-12">
                
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-manioco-terracotta-50 text-manioco-terracotta rounded-full text-[10px] font-black uppercase tracking-widest border border-manioco-terracotta-100">
                        <Star size={12} /> Compte Validé
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                        Prêt pour <br /> <span className="text-manioco-terracotta">l'aventure ?</span>
                    </h1>
                    <p className="text-slate-400 font-bold max-w-lg mx-auto leading-relaxed">
                        Votre dossier a été approuvé. Voici comment nous allons transformer votre business ensemble.
                    </p>
                </div>

                {/* Card Slider */}
                <div className="relative h-[400px] flex items-center justify-center">
                    {cards.map((card, index) => (
                        <div 
                            key={index}
                            className={`absolute inset-0 flex flex-col items-center justify-center text-center p-8 md:p-16 rounded-[4rem] border-4 border-white shadow-2xl transition-all duration-700 ease-in-out ${
                                index === activeCard 
                                ? 'opacity-100 translate-x-0 scale-100 z-20' 
                                : index < activeCard 
                                ? 'opacity-0 -translate-x-full scale-90 z-10' 
                                : 'opacity-0 translate-x-full scale-90 z-10'
                            } ${card.color}`}
                        >
                            <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-8 transform rotate-3">
                                {card.icon}
                            </div>
                            <h2 className="text-3xl font-black italic uppercase tracking-tight text-slate-900 mb-4">{card.title}</h2>
                            <p className="text-slate-600 font-medium max-w-md mb-8">{card.description}</p>
                            <div className="bg-white/50 px-6 py-3 rounded-2xl border border-white text-xs font-black text-slate-800 uppercase tracking-wide">
                                💡 {card.benefit}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Controls */}
                <div className="flex flex-col items-center gap-8">
                    {/* Dots */}
                    <div className="flex gap-3">
                        {cards.map((_, i) => (
                            <div 
                                key={i}
                                className={`h-2 rounded-full transition-all duration-500 ${i === activeCard ? 'w-12 bg-slate-900' : 'w-2 bg-slate-200'}`}
                            />
                        ))}
                    </div>

                    {/* Button */}
                    <button 
                        onClick={nextCard}
                        className="group bg-slate-900 text-white pl-12 pr-6 py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-xs flex items-center gap-12 hover:scale-[1.05] transition-all shadow-2xl shadow-slate-200"
                    >
                        {activeCard === cards.length - 1 ? "Démarrer l'expérience" : "Continuer"}
                        <div className="w-12 h-12 bg-manioco-terracotta rounded-full flex items-center justify-center group-hover:rotate-45 transition-transform">
                            <ArrowRight size={24} />
                        </div>
                    </button>
                    
                    <button 
                        onClick={() => router.push('/dashboard/seller')}
                        className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                    >
                        Passer l'introduction
                    </button>
                </div>
            </div>
        </div>
    );
}
