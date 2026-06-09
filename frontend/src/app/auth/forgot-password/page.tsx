"use client";
import { Mail, ArrowLeft, Sparkles } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import api from '@/lib/axios';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message);
    } catch (err: any) {
      setError(err.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfbf7] flex items-center justify-center p-4 selection:bg-manioco-terracotta selection:text-white font-sans overflow-hidden relative">
      
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute -top-40 -left-40 w-[1000px] h-[1000px] bg-manioco-terracotta/5 rounded-full blur-[180px] opacity-70"></div>
         <div className="absolute -bottom-40 -right-40 w-[1000px] h-[1000px] bg-[#F4A261]/5 rounded-full blur-[180px] opacity-70"></div>
      </div>

      <div className="relative z-50 w-full max-w-md bg-white/40 backdrop-blur-3xl rounded-[48px] shadow-[0_40px_100px_-20px_rgba(139,69,19,0.15)] border border-white/60 overflow-hidden p-12">
        <div className="flex flex-col items-center text-center">
          {/* Logo Manioco */}
          <div className="flex gap-1 mb-8 items-center">
            <span className="text-2xl font-extrabold tracking-tight text-manioco-brown">Mani</span>
            <span className="relative inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#F4A261] border-[2.5px] border-manioco-brown text-manioco-brown text-sm font-black">o</span>
            <span className="text-2xl font-extrabold tracking-tight text-manioco-brown">c</span>
            <span className="relative inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#F4A261] border-[2.5px] border-manioco-brown text-manioco-brown text-sm font-black">o</span>
          </div>

          <h1 className="text-3xl font-black uppercase text-manioco-brown mb-4 tracking-tighter italic">Récupération</h1>
          <p className="text-manioco-brown/60 text-xs font-bold mb-10 leading-relaxed uppercase tracking-widest px-4">
            Entrez votre adresse email pour recevoir un lien de réinitialisation.
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-6">
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
              icon={Mail} 
              type="email"
              placeholder="votre@email.com" 
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
            />

            <button 
              type="submit"
              disabled={isLoading || message !== ''}
              className="w-full bg-manioco-terracotta text-white py-6 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] hover:bg-manioco-brown transition-all shadow-xl active:scale-95 disabled:opacity-50"
            >
              {isLoading ? "Envoi en cours..." : "Envoyer le lien"}
            </button>
          </form>

          <Link href="/auth/login" className="mt-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-manioco-brown/40 hover:text-manioco-brown transition-colors group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
