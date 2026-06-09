"use client";
import { Sparkles, ChevronLeft } from 'lucide-react';
import { useState, useEffect, useMemo, ReactNode } from 'react';
import Link from 'next/link';
import { secureRandom } from '@/lib/utils';

interface CitadelLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
    backUrl: string;
    backLabel: string;
    icon: ReactNode;
}

export default function CitadelLayout({ children, title, subtitle, backUrl, backLabel, icon }: Readonly<CitadelLayoutProps>) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const particles = useMemo(() => {
        if (!mounted) return [];
        return Array.from({ length: 40 }).map((_, i) => ({
            id: i,
            size: secureRandom() * 20 + 5,
            x: secureRandom() * 100,
            y: secureRandom() * 100,
            duration: secureRandom() * 20 + 15,
            delay: secureRandom() * -30,
            opacity: secureRandom() * 0.15 + 0.05
        }));
    }, [mounted]);

    return (
        <div className="min-h-screen bg-organic-cream flex items-center justify-center p-4 font-sans selection:bg-manioco-terracotta selection:text-white overflow-hidden relative">

            {/* --- BACKGROUND ENGINE --- */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-5%] w-[700px] h-[700px] bg-manioco-terracotta/10 rounded-full blur-[140px] animate-float"></div>
                <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#F4A261]/5 rounded-full blur-[140px] animate-float-reverse"></div>

                {mounted && particles.map((p) => (
                    <div key={p.id} className="absolute animate-drift-slow" style={{ left: `${p.x}%`, top: `${p.y}%`, animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s`, opacity: p.opacity }}>
                        {secureRandom() > 0.5 ? (
                            <div className="rounded-full bg-manioco-terracotta opacity-40" style={{ width: p.size, height: p.size }}></div>
                        ) : (
                            <div className="w-1 h-1 bg-[#F4A261] rounded-full"></div>
                        )}
                    </div>
                ))}
            </div>

            {/* --- CENTRALIZED AUTH CARD --- */}
            <div className="relative z-20 w-full max-w-[500px] bg-white/40 backdrop-blur-3xl rounded-[60px] shadow-[0_60px_150px_-30px_rgba(139,69,19,0.2)] border border-white/60 p-12 lg:p-16 flex flex-col items-center animate-reveal">

                <div className="flex gap-1 mb-8 relative group">
                    {icon}
                    <Sparkles size={24} className="text-[#F4A261] absolute -top-2 -right-4 animate-pulse opacity-80" />
                </div>

                <h1 className="text-4xl font-black uppercase text-manioco-brown mb-4 tracking-tighter italic text-center">{title}</h1>
                <p className="text-sm font-bold text-manioco-brown/50 mb-10 text-center px-4 leading-relaxed italic">{subtitle}</p>

                {children}

                <Link href={backUrl} className="mt-12 text-[10px] font-black uppercase tracking-widest text-manioco-brown/30 hover:text-manioco-brown transition-colors flex items-center gap-2">
                    <ChevronLeft size={14} /> {backLabel}
                </Link>
            </div>

            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 animate-reveal opacity-20">
                <div className="h-px w-24 bg-manioco-brown"></div>
                <span className="text-[11px] font-black uppercase tracking-[1em] text-manioco-brown">SÉCURITÉ</span>
                <div className="h-px w-24 bg-manioco-brown"></div>
            </div>
        </div>
    );
}
