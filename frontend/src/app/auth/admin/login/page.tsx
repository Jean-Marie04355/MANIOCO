"use client";
import { ShieldCheck, Lock, ArrowRight, User, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import api from '@/lib/axios';
import CitadelLayout from '@/features/auth/components/CitadelLayout';

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;

        setError(null);
        setIsLoading(true);

        try {
            await api.post('/auth/admin/login', { email, password });
            sessionStorage.setItem('adminLoginEmail', email);
            router.push('/auth/admin/verify');
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'La connexion a échoué.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <CitadelLayout 
            title="Citadel" 
            subtitle="Veuillez vous authentifier pour accéder à la gestion administrative (Admin & Super Admin)."
            backUrl="/dashboard/client"
            backLabel="Retour à l'accueil"
            icon={<ShieldCheck size={56} className="text-manioco-terracotta" />}
        >
            <form onSubmit={onSubmit} className="w-full space-y-6">
                {error && <div className="text-red-500 text-sm font-bold text-center bg-red-50 p-4 rounded-[20px]">{error}</div>}

                <Input icon={User} type="email" placeholder="Identifiant (Email)" value={email} onChange={e => setEmail(e.target.value)} required />
                <Input icon={Lock} type="password" placeholder="Mot de passe système" value={password} onChange={e => setPassword(e.target.value)} required />

                <button type="submit" disabled={isLoading} className="w-full bg-manioco-terracotta text-white py-6 rounded-[28px] font-black text-sm uppercase tracking-widest hover:bg-manioco-brown transition-all shadow-2xl flex items-center justify-center gap-3 mt-8 disabled:opacity-70 active:scale-95">
                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : <>Entrer dans la Citadelle <ArrowRight size={18} /></>}
                </button>
            </form>
        </CitadelLayout>
    );
}
