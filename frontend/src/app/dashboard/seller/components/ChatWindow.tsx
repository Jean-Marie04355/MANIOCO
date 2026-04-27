"use client";
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  MoreVertical, 
  CheckCheck,
  X,
  Loader2,
  Search
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import api from '@/lib/axios';
import { useAuth } from '@/features/auth/AuthContext';

interface Message {
  id: string;
  text: string;
  senderId: string;
  sender?: { firstName: string; lastName: string };
  createdAt: string;
  image?: string;
}

interface Conversation {
  id: string;
  customerId: string;
  customer: { firstName: string; lastName: string; avatar?: string };
  lastMessageText: string;
  lastMessageAt: string;
}

export default function ChatWindow() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentUserId = user?.id || (user as any)?.userId;

  // 1. Initialisation : Charger les conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await api.get('/chat/conversations');
        setConversations(res.data);
        if (res.data.length > 0) {
          setActiveConv(res.data[0]);
        }
      } catch (error) {
        console.error("Erreur chargement conversations", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConversations();
  }, []);

  // 2. WebSocket : Connexion et écoute des nouveaux messages
  useEffect(() => {
    if (!currentUserId) return;

    // Connexion au namespace /realtime
    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
    socketRef.current = io(`${socketUrl}/realtime`, {
      auth: { token: localStorage.getItem('token') }
    });

    socketRef.current.on('new_message', (msg: Message) => {
      if (activeConv && msg.senderId !== currentUserId) {
         setMessages(prev => [...prev, msg]);
         scrollToBottom();
      }
      
      // Mettre à jour le dernier message dans la liste des conversations
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

  // 3. Rejoindre le salon de la conversation active
  useEffect(() => {
    if (activeConv && socketRef.current) {
      socketRef.current.emit('join_conversation', { conversationId: activeConv.id });
      
      // Charger les messages de cette conversation
      const fetchMessages = async () => {
        try {
          const res = await api.get(`/chat/conversations/${activeConv.id}/messages`);
          setMessages(res.data);
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
      
      // Update sidebar
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
    return <div className="flex-1 flex items-center justify-center h-full"><Loader2 className="animate-spin text-orange-500" size={40} /></div>;
  }

  return (
    <div className="flex h-full bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden">
      {/* Sidebar Contacts */}
      <div className="w-80 border-r border-slate-100 flex flex-col bg-white">
        <div className="p-6 border-b border-slate-50">
          <h3 className="text-xl font-black text-slate-900">Messages</h3>
          <div className="mt-4 relative">
             <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input type="text" placeholder="Rechercher..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-medium outline-none" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Aucune discussion</div>
          ) : (
            conversations.map((c) => (
              <div 
                key={c.id} 
                onClick={() => setActiveConv(c)}
                className={`p-4 flex gap-3 cursor-pointer transition-colors ${activeConv?.id === c.id ? 'bg-orange-50/50 border-r-4 border-orange-500' : 'hover:bg-slate-50'}`}
              >
                <div className="relative">
                   <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-black">
                     {c.customer?.firstName?.[0]}{c.customer?.lastName?.[0]}
                   </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-sm font-bold text-slate-800 truncate">{c.customer?.firstName} {c.customer?.lastName}</h4>
                    <span className="text-[10px] font-bold text-slate-400">
                      {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{c.lastMessageText || 'Nouvelle conversation'}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50/30">
        {activeConv ? (
          <>
            {/* Chat Header */}
            <div className="p-6 bg-white border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-black text-sm">
                   {activeConv.customer?.firstName?.[0]}{activeConv.customer?.lastName?.[0]}
                 </div>
                 <div>
                    <h4 className="text-sm font-black text-slate-900">{activeConv.customer?.firstName} {activeConv.customer?.lastName}</h4>
                    <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">En ligne</p>
                 </div>
              </div>
              <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><MoreVertical size={20} /></button>
            </div>

            {/* Messages List */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-[2rem] p-3 ${m.senderId === currentUserId ? 'bg-orange-500 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none shadow-sm'} ${m.image ? 'w-full max-w-[320px]' : 'max-w-[70%]'}`}>
                    {m.image && (
                      <div className="relative w-full aspect-[4/3] mb-3 rounded-2xl overflow-hidden border border-white/20 shadow-inner group cursor-pointer">
                        <img src={m.image} alt="Envoyé" className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    )}
                    {m.text && <p className="text-sm font-medium leading-relaxed px-2">{m.text}</p>}
                    <div className={`flex items-center gap-1 mt-2 text-[10px] font-bold px-2 ${m.senderId === currentUserId ? 'text-white/70' : 'text-slate-400'}`}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {m.senderId === currentUserId && <CheckCheck size={12} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white border-t border-slate-100">
              {imagePreview && (
                <div className="mb-4 relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-orange-500 shadow-lg animate-in zoom-in-90">
                  <img src={imagePreview} alt="Preview" className="object-cover w-full h-full" />
                  <button onClick={() => setImagePreview(null)} className="absolute top-1 right-1 p-1 bg-white rounded-full text-red-500 shadow-md">
                    <X size={12} />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-4">
                <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-slate-50 text-slate-400 hover:text-orange-500 rounded-2xl transition-all">
                  <ImageIcon size={20} />
                </button>
                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Écrivez votre message..." 
                    className="w-full pl-6 pr-12 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                  <button 
                    onClick={handleSend}
                    disabled={isSending}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
                  >
                    {isSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
               <Send size={32} />
            </div>
            <p className="font-bold uppercase tracking-widest text-[10px]">Sélectionnez une conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}
