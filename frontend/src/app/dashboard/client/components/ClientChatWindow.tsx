"use client";
import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Image as ImageIcon, 
  MoreVertical, 
  CheckCheck,
  X,
  Loader2,
  Search,
  ArrowLeft,
  MessageSquare
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import api from '@/lib/axios';
import { useAuth } from '@/features/auth/AuthContext';

interface Message {
  id: string;
  text: string;
  senderId: string;
  sender?: { name: string };
  createdAt: string;
  image?: string;
}

interface Conversation {
  id: string;
  customerId: string;
  storeId: string;
  customer?: { name: string; profilePhoto?: string };
  store?: { name: string; logo?: string };
  lastMessageText: string;
  lastMessageAt: string;
}

export default function ClientChatWindow() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const socketRef = useRef<Socket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentUserId = user?.id || (user as any)?.userId;

  useEffect(() => {
     const fetchConversations = async () => {
      try {
        const res = await api.get('/chat/conversations');
        setConversations(res.data);
        if (res.data.length > 0) {
          setActiveConv(res.data[0]);
        }
      } catch (error) {
        console.error("Erreur chargement données chat", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConversations();
  }, [user]);

  useEffect(() => {
    if (!currentUserId) return;
    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
    socketRef.current = io(`${socketUrl}/realtime`, {
      auth: { token: localStorage.getItem('token') || localStorage.getItem('afrigari_jwt') }
    });

    socketRef.current.on('new_message', (msg: Message) => {
      if (activeConv && (msg as any).conversationId === activeConv.id && msg.senderId !== currentUserId) {
         setMessages(prev => [...prev, msg]);
         setTimeout(scrollToBottom, 50);
      }
      
      setConversations(prev => prev.map(c => 
        (c.id === (msg as any).conversationId) 
          ? { ...c, lastMessageText: msg.text, lastMessageAt: msg.createdAt }
          : c
      ));
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [currentUserId, activeConv?.id]);

  useEffect(() => {
    if (activeConv) {
      if (socketRef.current) {
        socketRef.current.emit('join_conversation', { conversationId: activeConv.id });
      }
      
      const fetchMessages = async () => {
        try {
          const res = await api.get(`/chat/conversations/${activeConv.id}/messages`);
          setMessages(res.data || []);
          api.patch(`/chat/conversations/${activeConv.id}/read`).catch(() => {});
          setTimeout(scrollToBottom, 100);
        } catch (error) {
          console.error("Erreur chargement messages", error);
        }
      };
      fetchMessages();
    }
  }, [activeConv?.id]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleSend = async () => {
    if ((!inputText.trim() && !imagePreview) || !activeConv || isSending) return;

    setIsSending(true);
    try {
      const res = await api.post('/chat/messages', {
        conversationId: activeConv.id,
        text: inputText,
        image: imagePreview
      });

      setMessages(prev => [...prev, res.data]);
      setInputText('');
      setImagePreview(null);
      setTimeout(scrollToBottom, 50);
      
      setConversations(prev => prev.map(c => 
        c.id === activeConv.id 
          ? { ...c, lastMessageText: inputText || 'Image', lastMessageAt: new Date().toISOString() }
          : c
      ));
    } catch (error) {
      console.error("Erreur envoi message", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center h-full"><Loader2 className="animate-spin text-forest-night" size={40} /></div>;
  }

  return (
    <div className="flex h-full bg-white rounded-[3.5rem] border border-forest-night/5 shadow-2xl overflow-hidden">
      {/* Sidebar Contacts */}
      <div className="w-80 border-r border-forest-night/5 flex flex-col bg-white">
        <div className="p-8 border-b border-forest-night/5 bg-slate-50/30">
          <h3 className="text-2xl font-black text-forest-night italic uppercase tracking-tighter">Messages</h3>
          <div className="mt-6 relative">
             <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-forest-night/20" />
             <input 
               type="text" 
               placeholder="Chercher une boutique..." 
               className="w-full pl-12 pr-4 py-3 bg-white border border-forest-night/5 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-afrigari-gold/20 transition-all" 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {conversations.length === 0 ? (
            <div className="p-12 text-center text-forest-night/20 text-[10px] font-black uppercase tracking-[0.3em]">Aucune discussion</div>
          ) : (
            conversations.map((c) => (
              <div 
                key={c.id} 
                onClick={() => setActiveConv(c)}
                className={`p-6 flex gap-4 cursor-pointer transition-all border-l-4 ${activeConv?.id === c.id ? 'bg-luxury-cream/20 border-afrigari-gold' : 'hover:bg-slate-50 border-transparent'}`}
              >
                <div className="relative shrink-0">
                   <div className="w-14 h-14 rounded-2xl bg-forest-night/5 flex items-center justify-center text-forest-night/30 font-black text-xl italic uppercase">
                     {c.store ? c.store.name[0] : (c.customer?.name?.[0] || 'U')}
                   </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-sm font-black text-forest-night truncate uppercase tracking-tighter">
                      {c.store ? c.store.name : (c.customer?.name || 'Utilisateur')}
                    </h4>
                  </div>
                  <p className="text-[10px] text-forest-night/40 font-bold truncate tracking-tight">{c.lastMessageText || 'Nouvelle conversation'}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50/20">
        {activeConv ? (
          <>
            {/* Chat Header */}
            <div className="p-8 bg-white border-b border-forest-night/5 flex justify-between items-center">
              <div className="flex items-center gap-5">
                 <div className="w-12 h-12 rounded-2xl bg-forest-night/5 flex items-center justify-center text-forest-night/40 font-black text-lg italic uppercase">
                   {activeConv.store ? activeConv.store.name[0] : (activeConv.customer?.name?.[0] || 'U')}
                 </div>
                 <div>
                    <h4 className="text-base font-black text-forest-night uppercase tracking-tighter">
                      {activeConv.store ? activeConv.store.name : (activeConv.customer?.name || 'Utilisateur')}
                    </h4>
                    <p className="text-[9px] text-green-500 font-black uppercase tracking-widest flex items-center gap-1">
                       <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> En ligne
                    </p>
                 </div>
              </div>
              <button className="w-10 h-10 flex items-center justify-center text-forest-night/20 hover:text-forest-night transition-colors"><MoreVertical size={24} /></button>
            </div>

            {/* Messages List */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-luxury-cream/5">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-[2.5rem] p-5 ${m.senderId === currentUserId ? 'bg-forest-night text-white rounded-tr-none shadow-xl shadow-forest-night/10' : 'bg-white text-forest-night rounded-tl-none shadow-sm border border-forest-night/5'} ${m.image ? 'w-full max-w-[400px]' : 'max-w-[75%]'}`}>
                    {m.image && (
                      <div className="relative w-full aspect-[4/3] mb-4 rounded-3xl overflow-hidden border border-white/10 shadow-inner group cursor-pointer">
                        <img src={m.image} alt="Envoyé" className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700" />
                      </div>
                    )}
                    {m.text && <p className="text-sm font-bold leading-relaxed px-2">{m.text}</p>}
                    <div className={`flex items-center gap-2 mt-3 text-[9px] font-black px-2 uppercase tracking-widest ${m.senderId === currentUserId ? 'text-white/40' : 'text-forest-night/30'}`}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {m.senderId === currentUserId && <CheckCheck size={14} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-8 bg-white border-t border-forest-night/5">
              {imagePreview && (
                <div className="mb-6 relative w-28 h-28 rounded-3xl overflow-hidden border-4 border-afrigari-gold shadow-2xl animate-in zoom-in-95">
                  <img src={imagePreview} alt="Preview" className="object-cover w-full h-full" />
                  <button onClick={() => setImagePreview(null)} className="absolute top-2 right-2 p-1.5 bg-white rounded-full text-red-500 shadow-xl">
                    <X size={14} />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-6">
                <button onClick={() => fileInputRef.current?.click()} className="w-14 h-14 bg-forest-night/5 text-forest-night/20 hover:text-afrigari-gold rounded-2xl transition-all flex items-center justify-center">
                  <ImageIcon size={24} />
                </button>
                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Écrivez votre message..." 
                    className="w-full pl-8 pr-16 py-5 bg-luxury-cream/30 border border-forest-night/5 rounded-3xl text-sm font-bold outline-none focus:ring-4 focus:ring-afrigari-gold/5 focus:border-afrigari-gold/20 transition-all placeholder:text-forest-night/20"
                  />
                  <button 
                    onClick={handleSend}
                    disabled={isSending}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-forest-night text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-forest-night/20 disabled:opacity-50 flex items-center justify-center group"
                  >
                    {isSending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-forest-night/10">
            <div className="w-24 h-24 bg-forest-night/5 rounded-full flex items-center justify-center mb-6">
               <MessageSquare size={40} />
            </div>
            <p className="font-black italic uppercase tracking-[0.5em] text-xs">Sélectionnez une discussion</p>
          </div>
        )}
      </div>
    </div>
  );
}
