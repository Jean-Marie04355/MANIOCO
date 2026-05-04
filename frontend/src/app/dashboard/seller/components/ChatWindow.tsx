"use client";
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { 
  Send, 
  Image as ImageIcon, 
  MoreVertical, 
  CheckCheck,
  X,
  Loader2,
  Search,
  Trash2,
  Copy,
  CornerUpLeft,
  ArrowLeft
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  customer: { name: string; profilePhoto?: string };
  lastMessageText: string;
  lastMessageAt: string;
}

export default function ChatWindow() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [allClients, setAllClients] = useState<any[]>([]);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [contextMenu, setContextMenu] = useState<{ message: Message; x: number; y: number } | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentUserId = user?.id || (user as any)?.userId;

  const getImageUrl = (path: string) => {
    if (!path || String(path).trim() === '' || path === 'null') return "https://i.pravatar.cc/100?u=shop";
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return `${apiUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const searchParams = useSearchParams();
  const contactId = searchParams.get('contact');

  // 1. Initialisation : Charger les conversations
  useEffect(() => {
     const fetchConversations = async () => {
      try {
        const res = await api.get('/chat/conversations');
        const convs = res.data;
        setConversations(convs);

        // Charger aussi tous les clients uniques du vendeur (via les commandes)
        const storesRes = await api.get('/stores');
        const currentUserId = String(user?.id || (user as any)?.userId || '');
        const myStore = storesRes.data.find((s: any) => String(s.ownerId) == currentUserId);
        
        let customers: any[] = [];
        if (myStore) {
          const ordersRes = await api.get(`/orders/store/${myStore.id}`);
          customers = ordersRes.data
            .filter((o: any) => o.customer)
            .map((o: any) => ({
              ...o.customer,
              displayName: o.customer.name || `${o.customer.firstName || ''} ${o.customer.lastName || ''}`.trim() || 'Client'
            }))
            .filter((c: any, index: number, self: any[]) => 
              self.findIndex(t => t.id === c.id) === index
            );
          setAllClients(customers);
        }

        // LOGIQUE DE SÉLECTION AUTOMATIQUE (via URL ?contact=ID)
        if (contactId) {
          const existingConv = convs.find((c: any) => c.customerId === contactId);
          if (existingConv) {
            setActiveConv(existingConv);
          } else {
            // Chercher le client dans allClients pour créer une conversation temporaire
            const targetClient = customers.find(c => c.id === contactId);
            if (targetClient) {
              setActiveConv({
                id: `new-${targetClient.id}`,
                customerId: targetClient.id,
                customer: { 
                  name: targetClient.displayName || targetClient.name || 'Client',
                  profilePhoto: targetClient.profilePhoto || targetClient.avatar 
                },
                lastMessageText: '',
                lastMessageAt: ''
              });
            }
          }
        } else if (convs.length > 0) {
          setActiveConv(convs[0]);
        }
      } catch (error) {
        console.error("Erreur chargement données chat", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConversations();
  }, [user, contactId]);

  // 2. WebSocket : Connexion et écoute des nouveaux messages
  useEffect(() => {
    if (!currentUserId) return;

    // Connexion au namespace /realtime
    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://127.0.0.1:3000';
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
    if (activeConv) {
      if (socketRef.current) {
        socketRef.current.emit('join_conversation', { conversationId: activeConv.id });
      }
      
      // Charger les messages de cette conversation
      const fetchMessages = async () => {
        try {
          if (!activeConv.id.startsWith('new-')) {
            const res = await api.get(`/chat/conversations/${activeConv.id}/messages`);
            setMessages(res.data || []);
            
            // Marquer comme lu en arrière-plan
            api.patch(`/chat/conversations/${activeConv.id}/read`).catch(() => {});
          } else {
            setMessages([]);
          }
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

  // ─── Context menu helpers ───────────────────────────────────────────────────
  const openContextMenu = (e: React.MouseEvent | React.TouchEvent, msg: Message) => {
    e.preventDefault();
    const isTouch = e.type === 'touchstart' || e.type === 'contextmenu';
    let x = 0, y = 0;
    if ('touches' in e && e.touches.length > 0) {
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    } else if ('clientX' in e) {
      x = (e as React.MouseEvent).clientX;
      y = (e as React.MouseEvent).clientY;
    }
    setContextMenu({ message: msg, x, y });
  };

  const handleLongPressStart = (e: React.TouchEvent, msg: Message) => {
    longPressTimer.current = setTimeout(() => openContextMenu(e, msg), 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleDeleteMessage = async (msgId: string) => {
    setContextMenu(null);
    try {
      await api.delete(`/chat/messages/${msgId}`);
      // Retire le message de l'affichage
      const remaining = messages.filter(m => m.id !== msgId);
      setMessages(remaining);

      // Met à jour l'aperçu dans la sidebar
      if (activeConv) {
        const lastMsg = remaining[remaining.length - 1];
        setConversations(prev => prev.map(c =>
          c.id === activeConv.id
            ? { ...c, lastMessageText: lastMsg?.text || '', lastMessageAt: lastMsg?.createdAt || c.lastMessageAt }
            : c
        ));
      }
    } catch (e) { console.error('Erreur suppression', e); }
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text || '');
    setContextMenu(null);
  };

  const handleReplyMessage = (msg: Message) => {
    setReplyTo(msg);
    setContextMenu(null);
  };

  // ─── Send ────────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if ((!inputText.trim() && !imagePreview) || !activeConv || isSending) return;

    const textToSend = replyTo
      ? `↩ ${replyTo.text?.substring(0, 40)}${(replyTo.text?.length || 0) > 40 ? '…' : ''}\n${inputText}`
      : inputText;
    const imgToSend = selectedFile ? imagePreview : null; // This will be the path after upload logic is integrated below
    
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      text: textToSend,
      senderId: currentUserId,
      createdAt: new Date().toISOString(),
      image: imgToSend || undefined
    };
    
    setMessages(prev => [...prev, tempMsg]);
    setInputText('');
    setImagePreview(null);
    setReplyTo(null);
    setTimeout(scrollToBottom, 50);

    setIsSending(true);
    try {
      let uploadedPath = null;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadRes = await api.post('/files/upload', formData);
        uploadedPath = uploadRes.data.path;
      }

      const isNewConv = activeConv.id.startsWith('new-');
      const res = await api.post('/chat/messages', {
        conversationId: isNewConv ? null : activeConv.id,
        customerId: isNewConv ? activeConv.customerId : null,
        text: textToSend,
        image: uploadedPath || undefined
      });

      setSelectedFile(null);
      setImagePreview(null);
      
      if (isNewConv) {
         const convsRes = await api.get('/chat/conversations');
         setConversations(convsRes.data);
         const newConv = convsRes.data.find((c: any) => c.customerId === activeConv.customerId);
         if (newConv) {
            setActiveConv(newConv);
            const msgRes = await api.get(`/chat/conversations/${newConv.id}/messages`);
            setMessages(msgRes.data);
         }
      } else {
         setMessages(prev => prev.map(m => m.id === tempMsg.id ? res.data : m));
         setConversations(prev => prev.map(c => 
           c.id === activeConv.id 
             ? { ...c, lastMessageText: textToSend || 'Image', lastMessageAt: new Date().toISOString() }
             : c
         ));
      }
    } catch (error) {
      console.error("Erreur envoi message", error);
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      setInputText(inputText);
    } finally {
      setIsSending(false);
      setTimeout(scrollToBottom, 50);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
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
             <input 
               type="text" 
               placeholder="Rechercher un client..." 
               className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-orange-500/20" 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {searchTerm.trim() !== "" && (
             <div className="p-4 border-b border-slate-50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Résultats de recherche</p>
                <div className="space-y-2">
                   {allClients
                    .filter(c => 
                      `${c.displayName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      `${c.name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(client => {
                       const existingConv = conversations.find(conv => conv.customerId === client.id);
                       return (
                          <div 
                             key={client.id}
                             onClick={() => {
                                if (existingConv) {
                                   setActiveConv(existingConv);
                                } else {
                                   setActiveConv({
                                      id: `new-${client.id}`,
                                      customerId: client.id,
                                      customer: { 
                                         name: client.displayName || client.name || 'Client',
                                         profilePhoto: client.profilePhoto || client.avatar 
                                      },
                                      lastMessageText: '',
                                      lastMessageAt: ''
                                   });
                                }
                                setSearchTerm('');
                             }}
                             className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                          >
                             <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">
                                {client.displayName?.[0] || 'C'}
                             </div>
                             <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate">{client.displayName}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">{existingConv ? 'Discussion ouverte' : 'Nouveau message'}</p>
                             </div>
                          </div>
                       );
                    })
                   }
                   {allClients.filter(c => 
                      `${c.name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
                    ).length === 0 && (
                      <p className="text-[10px] text-slate-400 italic text-center py-2">Aucun client trouvé</p>
                    )}
                </div>
             </div>
          )}
          
          <div className="p-4 border-b border-slate-50">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Discussions récentes</p>
          </div>

          {conversations.length === 0 && searchTerm === "" ? (
            <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Aucune discussion</div>
          ) : (
            conversations.map((c) => (
              <div 
                key={c.id} 
                onClick={() => setActiveConv(c)}
                className={`p-4 flex gap-3 cursor-pointer transition-colors ${activeConv?.id === c.id ? 'bg-orange-50/50 border-r-4 border-orange-500' : 'hover:bg-slate-50'}`}
              >
                <div className="relative">
                   <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-black uppercase">
                     {c.customer?.name?.substring(0, 2) || 'C'}
                   </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-sm font-bold text-slate-800 truncate">{c.customer?.name || 'Client'}</h4>
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
                 <button 
                   onClick={() => setActiveConv(null)}
                   className="p-2 -ml-2 text-slate-400 hover:bg-slate-50 hover:text-orange-500 rounded-xl transition-all"
                   title="Fermer la discussion"
                 >
                   <ArrowLeft size={20} />
                 </button>
                 <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-black text-sm uppercase">
                   {activeConv.customer?.name?.substring(0, 2) || 'C'}
                 </div>
                 <div>
                    <h4 className="text-sm font-black text-slate-900">{activeConv.customer?.name || 'Client'}</h4>
                    <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">En ligne</p>
                 </div>
              </div>
              <div className="relative">
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 text-slate-400 hover:bg-slate-50 hover:text-orange-500 rounded-xl transition-all"
                >
                  <MoreVertical size={20} />
                </button>
                
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-10 animate-in fade-in slide-in-from-top-2">
                    <button 
                      onClick={() => {
                        setIsMenuOpen(false);
                        alert("Fonctionnalité à venir : Voir le profil complet du client.");
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors font-medium"
                    >
                      Voir le profil client
                    </button>
                    <button 
                      onClick={async () => {
                        setIsMenuOpen(false);
                        try {
                          await api.patch(`/chat/conversations/${activeConv.id}/unread`);
                          // Optional: fetch unread count again
                        } catch (e) {
                          console.error("Erreur", e);
                        }
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors font-medium"
                    >
                      Marquer comme non lu
                    </button>
                    <div className="h-px bg-slate-100 my-1"></div>
                    <button 
                      onClick={async () => {
                        setIsMenuOpen(false);
                        if (confirm("Voulez-vous vraiment supprimer cette discussion ?")) {
                          try {
                            await api.delete(`/chat/conversations/${activeConv.id}`);
                            setActiveConv(null);
                            setConversations(prev => prev.filter(c => c.id !== activeConv.id));
                          } catch (e) {
                            console.error("Erreur", e);
                          }
                        }
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors font-bold"
                    >
                      Supprimer la discussion
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Messages List */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar"
              onClick={() => setContextMenu(null)}
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`rounded-[2rem] p-3 cursor-pointer select-none
                      ${m.senderId === currentUserId
                        ? 'bg-orange-500 text-white rounded-tr-none'
                        : 'bg-white text-slate-700 rounded-tl-none shadow-sm'}
                      ${m.image ? 'w-full max-w-[240px]' : 'max-w-[70%]'}
                    `}
                    onContextMenu={(e) => openContextMenu(e, m)}
                    onTouchStart={(e) => handleLongPressStart(e, m)}
                    onTouchEnd={handleLongPressEnd}
                    onTouchMove={handleLongPressEnd}
                  >
                      {m.image && (
                        <div className="relative w-full aspect-square mb-3 rounded-2xl overflow-hidden border border-white/20 shadow-sm cursor-pointer">
                          <img src={getImageUrl(m.image)} alt="Envoyé" className="object-cover w-full h-full hover:scale-110 transition-transform duration-700" />
                        </div>
                      )}
                    {m.text && (
                      <p className="text-sm font-medium leading-relaxed px-2 whitespace-pre-line">{m.text}</p>
                    )}
                    <div className={`flex items-center gap-1 mt-2 text-[10px] font-bold px-2 ${m.senderId === currentUserId ? 'text-white/70' : 'text-slate-400'}`}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {m.senderId === currentUserId && <CheckCheck size={12} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
              {/* Reply preview */}
              {replyTo && (
                <div className="flex items-center gap-3 mb-3 px-4 py-2 bg-orange-50 border-l-4 border-orange-400 rounded-xl">
                  <CornerUpLeft size={14} className="text-orange-400 flex-shrink-0" />
                  <p className="text-xs text-slate-500 truncate flex-1">
                    <span className="font-bold text-orange-500">Répondre · </span>
                    {replyTo.text?.substring(0, 60)}
                  </p>
                  <button onClick={() => setReplyTo(null)} className="text-slate-400 hover:text-red-500 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              )}

              {imagePreview && (
                <div className="mb-4 relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-orange-500 shadow-lg">
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
                    placeholder={replyTo ? "Écrivez votre réponse..." : "Écrivez votre message..."} 
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

      {/* ─── Context Menu flottant ──────────────────────────────────────── */}
      {contextMenu && (
        <div
          className="fixed z-50"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 min-w-[180px] animate-in fade-in zoom-in-95 duration-150">
            {/* Répondre — disponible pour tous les messages */}
            <button
              onClick={() => handleReplyMessage(contextMenu.message)}
              className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors font-medium"
            >
              <CornerUpLeft size={15} className="text-slate-400" />
              Répondre
            </button>

            {/* Copier — seulement si le message a du texte */}
            {contextMenu.message.text && (
              <button
                onClick={() => handleCopyMessage(contextMenu.message.text)}
                className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors font-medium"
              >
                <Copy size={15} className="text-slate-400" />
                Copier le texte
              </button>
            )}

            {/* Supprimer — seulement pour ses propres messages */}
            {contextMenu.message.senderId === currentUserId && (
              <>
                <div className="h-px bg-slate-100 my-1 mx-3" />
                <button
                  onClick={() => handleDeleteMessage(contextMenu.message.id)}
                  className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors font-semibold"
                >
                  <Trash2 size={15} />
                  Supprimer
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
