"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Send, ArrowLeft, Store, MessageSquare, Loader2, CheckCheck, Phone, Video, MoreVertical, Search, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import api from '@/lib/axios';
import { useAuth } from '@/features/auth/AuthContext';
import { useSocket } from '@/features/realtime/SocketContext';

export default function ClientMessages() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const searchParams = useSearchParams();
  const targetSellerId = searchParams.get('sellerId');
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getImageUrl = (path: string) => {
    if (!path || String(path).trim() === '' || path === 'null') return "https://i.pravatar.cc/100?u=shop";
    
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    // Si le chemin contient déjà 'uploads/', on s'assure juste du slash initial
    let finalPath = path;
    if (!path.includes('uploads/')) {
       finalPath = `/uploads${path.startsWith('/') ? '' : '/'}${path}`;
    } else {
       finalPath = path.startsWith('/') ? path : `/${path}`;
    }
    
    const finalUrl = `${apiUrl}${finalPath}`;
    console.log("Rendering image URL:", finalUrl);
    return finalUrl;
  };

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        let initialConvId = null;
        
        // If we have a target seller, initialize that conversation first
        if (targetSellerId) {
           try {
              const initRes = await api.post('/chat/conversations/init', { storeId: targetSellerId });
              initialConvId = initRes.data.id;
           } catch (e) {
              console.error("Erreur initiation conversation", e);
           }
        }

        const res = await api.get('/chat/conversations');
        setConversations(res.data);
        
        if (initialConvId) {
           const found = res.data.find((c: any) => c.id === initialConvId);
           if (found) {
              setActiveConv(found);
           }
        }
      } catch (error) {
        console.error("Erreur chargement conversations", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConversations();
  }, [targetSellerId]);

  useEffect(() => {
    if (activeConv && socket) {
      const fetchMessages = async () => {
        try {
          const res = await api.get(`/chat/conversations/${activeConv.id}/messages`);
          setMessages(res.data || []);
          setTimeout(scrollToBottom, 100);
        } catch (error) {
          console.error("Erreur chargement messages", error);
        }
      };
      fetchMessages();

      socket.emit('join_conversation', { conversationId: activeConv.id });

      const handleNewMessage = (msg: any) => {
        // Ne pas ajouter si c'est un message d'une autre conversation (le socket global reçoit tout)
        if (String(msg.conversationId) !== String(activeConv.id)) return;
        
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setTimeout(scrollToBottom, 100);
      };

      socket.on('new_message', handleNewMessage);

      return () => {
        socket.off('new_message', handleNewMessage);
      };
    }
  }, [activeConv?.id, socket]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (activeConv) {
       // Marquer comme lu
       api.patch(`/chat/conversations/${activeConv.id}/read`).catch(console.error);
    }
  }, [activeConv?.id]);

  const handleSend = async () => {
    if (!inputText.trim() || !activeConv || isSending) return;
    
    const textToSend = inputText;
    const tempMsg = {
      id: `temp-${Date.now()}`,
      text: textToSend,
      senderId: user?.id,
      createdAt: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, tempMsg]);
    setInputText('');
    setTimeout(scrollToBottom, 50);

    setIsSending(true);
    try {
      await api.post('/chat/messages', {
        conversationId: activeConv.id,
        text: textToSend
      });
      // Rafraîchir les messages
      const res = await api.get(`/chat/conversations/${activeConv.id}/messages`);
      setMessages(res.data);
    } catch (error) {
      console.error("Erreur envoi", error);
    } finally {
      setIsSending(false);
      setTimeout(scrollToBottom, 50);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConv || isSending) return;

    setIsSending(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadRes = await api.post('/files/upload', formData);
      const imageUrl = uploadRes.data.path;

      await api.post('/chat/messages', {
        conversationId: activeConv.id,
        text: '',
        image: imageUrl
      });

      const res = await api.get(`/chat/conversations/${activeConv.id}/messages`);
      setMessages(res.data);
      setTimeout(scrollToBottom, 50);
    } catch (error) {
      console.error("Erreur envoi image", error);
      alert("Erreur lors de l'envoi de l'image");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-[#fcfbf7] h-screen flex flex-col text-[#1a2e22] font-sans overflow-hidden">
      
      {/* Header Premium */}
      <nav className="bg-white/80 backdrop-blur-md px-12 py-5 flex justify-between items-center border-b border-[#1a2e22]/5 z-20">
        <Link href="/dashboard/client" className="flex items-center gap-4 group">
          <div className="w-10 h-10 rounded-full border border-[#1a2e22]/10 flex items-center justify-center group-hover:bg-[#1a2e22] group-hover:text-white transition-all">
            <ArrowLeft size={18} />
          </div>
          <span className="font-black text-[11px] uppercase tracking-widest text-[#1a2e22]/40 group-hover:text-[#1a2e22]">Retour au Dashboard</span>
        </Link>
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-lg bg-[#1a2e22] flex items-center justify-center text-[#c5a059] rotate-3">
              <MessageSquare size={16} />
           </div>
           <h2 className="font-black text-2xl tracking-tighter uppercase italic">Afrigari <span className="text-[#c5a059]">Chat</span></h2>
        </div>
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 rounded-full bg-[#1a2e22]/5 flex items-center justify-center font-black text-xs overflow-hidden border border-[#1a2e22]/10 shadow-sm">
              {user?.profilePhoto ? (
                 <img src={getImageUrl(user.profilePhoto)} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                 <span>{user?.name?.[0] || 'U'}</span>
              )}
           </div>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar Discussions */}
        <aside className="w-[380px] bg-white border-r border-[#1a2e22]/5 flex flex-col overflow-hidden">
          <div className="p-8">
             <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1a2e22]/20" size={16} />
                <input 
                   type="text" 
                   placeholder="Rechercher un artisan..." 
                   className="w-full bg-[#1a2e22]/5 border-none rounded-2xl py-3 pl-12 pr-6 text-xs font-bold outline-none focus:ring-2 focus:ring-[#c5a059]/20"
                />
             </div>
             <p className="text-[10px] font-black text-[#c5a059] uppercase tracking-[0.4em] mb-4">Discussions Récentes</p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2">
                {isLoading ? (
                   <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-[#c5a059]" /></div>
                ) : conversations.length === 0 ? (
                   <div className="p-10 text-center">
                      <p className="text-[11px] font-bold text-slate-300 uppercase italic leading-relaxed">Aucune conversation <br /> n'a été initiée.</p>
                   </div>
                ) : (
                   conversations.map((c) => {
                      const storeName = c.store?.name || c.store?.owner?.name || 'Artisan Afrigari';
                      return (
                        <div 
                           key={c.id} 
                           onClick={() => setActiveConv(c)}
                           className={`p-5 rounded-[32px] flex items-center gap-4 cursor-pointer transition-all duration-500 ${activeConv?.id === c.id ? 'bg-[#1a2e22] text-white shadow-2xl scale-[1.02]' : 'hover:bg-[#1a2e22]/5'}`}
                        >
                           <div className="w-14 h-14 rounded-2xl bg-[#f4f1ea] overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                              <img src={getImageUrl(c.store?.profilePhoto)} className="w-full h-full object-cover" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-1">
                                 <h4 className={`text-sm font-black truncate uppercase ${activeConv?.id === c.id ? 'text-white' : 'text-[#1a2e22]'}`}>{storeName}</h4>
                                 <span className={`text-[8px] font-black uppercase opacity-40 ${activeConv?.id === c.id ? 'text-[#c5a059]' : ''}`}>
                                    {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                                 </span>
                              </div>
                              <p className={`text-[10px] truncate font-medium ${activeConv?.id === c.id ? 'text-white/60' : 'text-slate-400'}`}>{c.lastMessageText || 'Commencez la discussion...'}</p>
                           </div>
                        </div>
                      );
                   })
                )}
          </div>
        </aside>

        {/* Chat Area Section */}
        <main className="flex-1 flex flex-col bg-[#fcfbf7] relative">
          
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none overflow-hidden flex items-center justify-center">
             <span className="text-[30rem] font-black rotate-12">AFRIGARI</span>
          </div>

          {activeConv ? (
             <>
                {/* Chat Header Area */}
                <div className="p-6 bg-white/50 backdrop-blur-md border-b border-[#1a2e22]/5 flex items-center justify-between z-10">
                   <div className="flex items-center gap-5">
                      <button 
                         onClick={() => setActiveConv(null)} 
                         className="p-3 hover:bg-[#1a2e22]/5 rounded-2xl transition-all text-[#1a2e22]/40 hover:text-[#1a2e22]"
                         title="Retour à la liste"
                      >
                         <ArrowLeft size={22} />
                      </button>
                      <div className="flex items-center gap-4">
                         <div className="relative">
                            <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white shadow-lg">
                               <img src={getImageUrl(activeConv.store?.profilePhoto)} className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-4 border-white rounded-full"></div>
                         </div>
                         <div>
                            <h4 className="text-lg font-black uppercase tracking-tight">{activeConv.store?.name || activeConv.store?.owner?.name || 'Artisan Afrigari'}</h4>
                            <div className="flex items-center gap-2 text-[9px] font-black text-[#c5a059] uppercase tracking-widest mt-1">
                               <ShieldCheck size={12} />
                               <span>Vendeur Certifié Afrigari</span>
                            </div>
                         </div>
                      </div>
                   </div>
                   <div className="flex items-center gap-4 text-[#1a2e22]/20">
                      <button className="p-3 hover:bg-[#1a2e22]/5 rounded-2xl transition-all hover:text-[#1a2e22]"><Phone size={20} /></button>
                      <button className="p-3 hover:bg-[#1a2e22]/5 rounded-2xl transition-all hover:text-[#1a2e22]"><Video size={20} /></button>
                      <button className="p-3 hover:bg-[#1a2e22]/5 rounded-2xl transition-all hover:text-[#1a2e22]"><MoreVertical size={20} /></button>
                   </div>
                </div>

                {/* Messages List Area */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-8 scroll-smooth relative z-10">
                    {messages.map((m) => {
                      const myId = String(user?.id || (user as any)?.userId || "");
                      // Récupération de l'ID de l'expéditeur qu'il soit un objet ou une chaîne
                      const msgSenderId = m.senderId && typeof m.senderId === 'object' ? (m.senderId as any).id : (m.sender?.id || m.senderId);
                      const isMe = String(msgSenderId) === myId;
                      
                      return (
                        <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-reveal`}>
                           <div className="flex flex-col max-w-[65%]">
                              <div className={`p-5 rounded-[32px] shadow-sm ${isMe ? 'bg-[#1a2e22] text-white rounded-tr-none' : 'bg-white text-[#1a2e22] rounded-tl-none border border-[#1a2e22]/5'}`}>
                                 {m.image && (
                                   <div className="relative w-full max-w-[280px] aspect-square mb-3 rounded-2xl overflow-hidden border border-[#1a2e22]/10 shadow-sm cursor-pointer">
                                     <img 
                                       src={getImageUrl(m.image)} 
                                       alt="Envoyé" 
                                       className="object-cover w-full h-full hover:scale-110 transition-transform duration-700" 
                                     />
                                   </div>
                                 )}
                                 <p className="text-sm font-medium leading-relaxed">{m.text}</p>
                              </div>
                              <div className={`flex items-center gap-2 mt-2 px-2 text-[9px] font-black uppercase opacity-30 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                 {new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                 {isMe && <CheckCheck size={12} className="text-[#c5a059]" />}
                              </div>
                           </div>
                        </div>
                      );
                    })}
                </div>

                <div className="p-8 bg-white/50 backdrop-blur-md border-t border-[#1a2e22]/5 relative z-10">
                   <div className="max-w-4xl mx-auto flex gap-6 bg-white p-3 rounded-[40px] shadow-2xl border border-[#1a2e22]/5 items-center">
                      <input 
                         type="file" 
                         className="hidden" 
                         ref={fileInputRef} 
                         accept="image/*"
                         onChange={handleImageUpload}
                      />
                      <button 
                         onClick={() => fileInputRef.current?.click()}
                         className="w-12 h-12 rounded-full flex items-center justify-center text-[#1a2e22]/30 hover:bg-[#1a2e22]/5 hover:text-[#1a2e22] transition-all ml-2"
                      >
                         <ImageIcon size={22} />
                      </button>
                      <input 
                         type="text" 
                         value={inputText}
                         onChange={(e) => setInputText(e.target.value)}
                         onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                         placeholder="Écrivez votre message à l'artisan..." 
                         className="flex-1 bg-transparent border-none px-2 py-4 text-sm font-bold outline-none placeholder:text-[#1a2e22]/20"
                      />
                      <button 
                         onClick={handleSend}
                         disabled={isSending || !inputText.trim()}
                         className="w-14 h-14 bg-[#1a2e22] text-[#c5a059] rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 mr-1"
                      >
                         {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="rotate-12" />}
                      </button>
                   </div>
                </div>
             </>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-[#1a2e22]/20 relative z-10">
                <div className="w-32 h-32 rounded-[48px] bg-white shadow-2xl flex items-center justify-center mb-10 rotate-6 border border-[#1a2e22]/5">
                   <MessageSquare size={60} className="text-[#c5a059]/20" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 text-[#1a2e22]/40">Sélectionnez un Artisan</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.5em]">La qualité n'attend pas.</p>
             </div>
          )}
        </main>
      </div>
    </div>
  );
}
