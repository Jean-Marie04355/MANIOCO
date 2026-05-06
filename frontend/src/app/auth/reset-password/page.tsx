"use client";
import { Lock, ArrowLeft, Leaf, Sparkles, ShieldCheck } from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import api from '@/lib/axios';

function ResetPasswordContent() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await api.post('/auth/reset-password', { token, newPassword });
      setMessage(res.data.message);
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#fcfbf7] flex items-center justify-center p-4">
        <div className="text-center p-12 bg-white rounded-[48px] shadow-xl border border-red-100 max-w-md">
          <h2 className="text-2xl font-black text-red-500 mb-4 uppercase italic">Lien Invalide</h2>
          <p className="text-[#2d4635]/60 text-xs font-bold mb-8 tracking-widest leading-relaxed">
            Le jeton de réinitialisation est manquant ou invalide.
          </p>
          <Link href="/auth/forgot-password" className="bg-[#2d4635] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#c5a059] transition-all">
            Demander un nouveau lien
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfbf7] flex items-center justify-center p-4 selection:bg-[#c5a059] selection:text-white font-sans overflow-hidden relative">
      
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute -top-40 -left-40 w-[1000px] h-[1000px] bg-[#2d4635]/5 rounded-full blur-[180px] opacity-70"></div>
         <div className="absolute -bottom-40 -right-40 w-[1000px] h-[1000px] bg-[#c5a059]/5 rounded-full blur-[180px] opacity-70"></div>
      </div>

      <div className="relative z-50 w-full max-w-md bg-white/40 backdrop-blur-3xl rounded-[48px] shadow-[0_40px_100px_-20px_rgba(45,70,53,0.2)] border border-white/60 overflow-hidden p-12">
        <div className="flex flex-col items-center text-center">
          <div className="flex gap-2 mb-8 items-center">
            <Leaf size={40} className="text-green-600" fill="currentColor" />
            <span className="text-2xl font-black italic text-[#2d4635] tracking-tighter">AFRIGARI</span>
          </div>

          <h1 className="text-3xl font-black uppercase text-[#2d4635] mb-4 tracking-tighter italic">Nouveau Sésame</h1>
          <p className="text-[#2d4635]/60 text-[9px] font-black mb-10 leading-relaxed uppercase tracking-[0.3em] px-4">
            Choisissez un nouveau mot de passe hautement sécurisé pour votre compte.
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-5">
            {message && (
              <div className="p-4 bg-green-50 text-green-600 text-xs rounded-2xl font-black border border-green-100 flex items-center gap-3">
                <Sparkles size={16} />
                {message}
              </div>
            )}
            {error && (
              <div className="p-4 bg-red-50 text-red-500 text-xs rounded-2xl font-black border border-red-100">
                {error}
              </div>
            )}

            <Input 
              icon={ShieldCheck} 
              type="password"
              placeholder="Nouveau mot de passe" 
              value={newPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
              required
            />

            <Input 
              icon={Lock} 
              type="password"
              placeholder="Confirmer le mot de passe" 
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
              required
            />

            <button 
              type="submit"
              disabled={isLoading || message !== ''}
              className="w-full bg-[#2d4635] text-white py-6 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] hover:bg-[#c5a059] transition-all shadow-xl active:scale-95 disabled:opacity-50"
            >
              {isLoading ? "Mise à jour..." : "Réinitialiser"}
            </button>
          </form>

          <Link href="/auth/login" className="mt-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#2d4635]/40 hover:text-[#2d4635] transition-colors group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Annuler
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fcfbf7] flex items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center">
          <Leaf size={40} className="text-green-600/20 mb-4" />
          <p className="text-[10px] font-black uppercase tracking-widest text-[#2d4635]/20 italic">Initialisation...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
