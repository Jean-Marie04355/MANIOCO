"use client";
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquare, Loader2, ShieldCheck, User, Store, Calendar, Info } from 'lucide-react';
import api from '@/lib/axios';
import Sidebar from '../../../../../components/Sidebar';
import TopNav from '../../../../../components/TopNav';

export default function AdminChatView() {
  const params = useParams();
  const router = useRouter();
  const { customerId, storeId } = params;
  
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const getImageUrl = (path: string) => {
    if (!path || String(path).trim() === '' || path === 'null') return "https://i.pravatar.cc/100?u=user";
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    if (path.includes('uploads/')) {
       const cleanPath = path.startsWith('/') ? path : `/${path}`;
       return `${apiUrl}${cleanPath}`;
    }
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${apiUrl}/uploads${cleanPath}`;
  };

  useEffect(() => {
    const fetchChatData = async () => {
      try {
        // 1. Trouver la conversation
        const convRes = await api.get(`/chat/admin/conversation?customerId=${customerId}&storeId=${storeId}`);
        const conv = convRes.data;
        setConversation(conv);

        // 2. Récupérer les messages
        const msgRes = await api.get(`/chat/conversations/${conv.id}/messages`);
        setMessages(msgRes.data || []);
        
        setTimeout(scrollToBottom, 100);
      } catch (error) {
        console.error("Erreur chargement chat admin", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (customerId && storeId) {
      fetchChatData();
    }
  }, [customerId, storeId]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  if (isLoading) {
    return (
      <div className="flex bg-slate-50 min-h-screen">
        <Sidebar mode="admin" />
        <main className="flex-1 ml-64 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-manioco-terracotta animate-spin" />
        </main>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex bg-slate-50 min-h-screen">
        <Sidebar mode="admin" />
        <main className="flex-1 ml-64 flex flex-col items-center justify-center p-10">
            <div className="bg-white p-12 rounded-[3rem] shadow-xl text-center max-w-md border border-slate-100">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 border border-slate-100">
                  <MessageSquare size={32} />
               </div>
               <h3 className="text-2xl font-black text-slate-800 mb-2">Aucune conversation</h3>
               <p className="text-sm text-slate-400 font-medium mb-8">Ces deux utilisateurs n'ont jamais échangé de messages sur la plateforme.</p>
               <button onClick={() => router.back()} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all">Retour aux signalements</button>
            </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans">
      <Sidebar mode="admin" />
      
      <main className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
        <TopNav title="Archive des Discussions" isAdmin={true} />
        
        <div className="flex-1 flex overflow-hidden p-6 gap-6">
           
           {/* Chat Panel */}
           <div className="flex-1 bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 flex flex-col overflow-hidden relative">
              
              {/* Header */}
              <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-md z-10">
                 <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all">
                       <ArrowLeft size={18} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-manioco-terracotta flex items-center justify-center text-white shadow-lg shadow-manioco-terracotta/20">
                           <MessageSquare size={24} />
                        </div>
                        <div>
                           <h4 className="font-black text-slate-900 uppercase tracking-tight">Audit de Discussion</h4>
                           <p className="text-[10px] font-black text-manioco-terracotta uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                             <ShieldCheck size={12} /> Mode Surveillance Administrateur
                          </p>
                       </div>
                    </div>
                 </div>
                 
                 <div className="bg-amber-50 border border-amber-100 px-4 py-2 rounded-xl flex items-center gap-2">
                    <Info size={14} className="text-amber-600" />
                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Contenu en lecture seule</span>
                 </div>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-50/30">
                 {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300">
                       <p className="text-xs font-black uppercase tracking-widest">Début de l'historique</p>
                    </div>
                 ) : (
                    messages.map((m, i) => {
                       const isCustomer = m.senderId === conversation.customerId;
                       return (
                          <div key={m.id} className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'} animate-reveal`}>
                             <div className="flex items-center gap-2 mb-1.5 px-2">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                   {isCustomer ? `CLIENT: ${conversation.customer?.name}` : `VENDEUR: ${conversation.store?.name}`}
                                </span>
                             </div>
                             <div className={`max-w-[70%] p-4 rounded-2xl shadow-sm text-sm font-medium leading-relaxed ${
                                isCustomer 
                                ? 'bg-white text-slate-800 border border-slate-100 rounded-tl-none' 
                                : 'bg-slate-900 text-white rounded-tr-none'
                             }`}>
                                {m.text}
                             </div>
                             <span className="text-[9px] font-bold text-slate-300 mt-1.5 px-2">
                                {new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {new Date(m.createdAt).toLocaleDateString('fr-FR')}
                             </span>
                          </div>
                       );
                    })
                 )}
              </div>
           </div>

           {/* Info Sidebar */}
           <div className="w-80 space-y-6 overflow-y-auto custom-scrollbar pr-1">
              {/* Client Info */}
              <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
                 <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <User size={12} /> Profil Client
                 </p>
                 <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-50">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 font-black">
                       {conversation.customer?.name?.[0]}
                    </div>
                    <div>
                       <p className="text-sm font-black text-slate-900 truncate">{conversation.customer?.name}</p>
                       <p className="text-[10px] font-bold text-slate-400 truncate">{conversation.customer?.email}</p>
                    </div>
                 </div>
                 <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                       <span className="text-slate-400">ID Unique</span>
                       <span className="text-slate-900">#{conversation.customerId.substring(0,8)}</span>
                    </div>
                 </div>
              </div>

              {/* Store Info */}
              <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
                 <p className="text-[10px] font-black text-manioco-terracotta uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Store size={12} /> Profil Boutique
                 </p>
                 <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-50">
                    <img src={getImageUrl(conversation.store?.profilePhoto)} alt={conversation.store?.name || "Logo Boutique"} className="w-12 h-12 rounded-2xl object-cover border border-slate-100" />
                    <div>
                       <p className="text-sm font-black text-slate-900 truncate">{conversation.store?.name}</p>
                       <p className="text-[10px] font-bold text-slate-400 truncate">Vendeur: {conversation.store?.owner?.name}</p>
                    </div>
                 </div>
                 <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                       <span className="text-slate-400">Statut</span>
                       <span className="text-emerald-500">Actif</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                       <span className="text-slate-400">ID Boutique</span>
                       <span className="text-slate-900">#{conversation.storeId.substring(0,8)}</span>
                    </div>
                 </div>
              </div>

              {/* Tips for Admin */}
              <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl shadow-slate-900/10">
                 <h5 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-manioco-terracotta">Conseils Audit</h5>
                 <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    Analysez le ton des échanges. Cherchez des preuves de promesses non tenues ou de comportement déplacé pour justifier votre décision sur le signalement.
                 </p>
              </div>
           </div>
        </div>
      </main>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9E4E3B;
        }
      `}</style>
    </div>
  );
}
