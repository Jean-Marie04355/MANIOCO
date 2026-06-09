"use client";
import { ShieldCheck, Timer, RefreshCw, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthContext';
import api from '@/lib/axios';
import CitadelLayout from '@/features/auth/components/CitadelLayout';

export default function AdminVerifyPage() {
    const router = useRouter();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timeLeft, setTimeLeft] = useState(295);
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRefs = useRef<any>([]);
    const { login } = useAuth();

    useEffect(() => {
        const storedEmail = sessionStorage.getItem('adminLoginEmail');
        if (storedEmail) setEmail(storedEmail);
        else router.push('/auth/admin/login');
    }, [router]);

    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [timeLeft]);

    const handleChange = (element: any, index: number) => {
        if (Number.isNaN(Number(element.value))) return false;
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
        try {
            const res = await api.post('/auth/admin/verify-otp', { email, otpCode: otp.join('') });
            login(res.data.accessToken, res.data.user);
            router.push(res.data.user.role === 'super_admin' ? '/dashboard/super-admin' : '/dashboard/admin');
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Le code saisi est invalide ou expiré.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <CitadelLayout
            title="Vérification"
            subtitle="Synchronisation de sécurité nécessaire. Veuillez entrer le code envoyé à votre terminal."
            backUrl="/auth/admin/login"
            backLabel="Retour à l'accueil admin"
            icon={<ShieldCheck size={56} className="text-manioco-terracotta" />}
        >
            <div className="w-full space-y-12">
                <div className="flex justify-between gap-2.5">
                    {otp.map((data, index) => (
                        <input
                            key={`otp-digit-${index}`}
                            type="text"
                            maxLength={1}
                            ref={el => { inputRefs.current[index] = el; }}
                            value={data}
                            onChange={e => handleChange(e.target, index)}
                            onKeyDown={e => handleKeyDown(e, index)}
                            className="w-12 h-16 sm:w-14 sm:h-20 bg-white/50 border-2 border-manioco-terracotta/5 rounded-[24px] text-center text-3xl font-black text-manioco-brown outline-none focus:border-manioco-terracotta focus:bg-white focus:ring-8 focus:ring-manioco-terracotta/5 focus:scale-105 transition-all shadow-sm"
                        />
                    ))}
                </div>

                <div className="flex flex-col items-center gap-8">
                    <div className="px-8 py-4 bg-manioco-terracotta/5 rounded-full border border-manioco-terracotta/5 flex items-center gap-3">
                        <Timer size={20} className="text-[#F4A261]" />
                        <span className="text-lg font-black text-manioco-brown tabular-nums">
                            {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
                        </span>
                    </div>

                    <button
                        onClick={handleVerify}
                        disabled={!isComplete || isLoading}
                        className={`w-full py-6 rounded-[28px] font-black text-sm uppercase tracking-widest transition-all shadow-2xl flex items-center justify-center gap-4 group ${isComplete && !isLoading ? 'bg-manioco-terracotta text-white hover:bg-manioco-brown active:scale-95' : 'bg-slate-100 text-slate-400 pointer-events-none'}`}
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Valider l'Accès <ShieldCheck size={20} /></>}
                    </button>

                    <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-manioco-brown/30 hover:text-manioco-brown transition-all group p-2">
                        <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-700" /> Renvoyer un code
                    </button>
                </div>
            </div>
            {error && <div className="text-red-500 text-sm font-bold w-full text-center bg-red-50 p-4 rounded-[20px] mb-8">{error}</div>}
        </CitadelLayout>
    );
}
