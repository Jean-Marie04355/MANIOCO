"use client";
import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Send, ArrowLeft, MessageSquare, Loader2, CheckCheck,
  Search, ShieldCheck, Image as ImageIcon, Sparkles,
  ChevronLeft, Package, X
} from 'lucide-react';
import api from '@/lib/axios';
import { useAuth } from '@/features/auth/AuthContext';
import { useSocket } from '@/features/realtime/SocketContext';

function ClientMessagesContent() {
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
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getImageUrl = (path: string) => {
    if (!path || String(path).trim() === '' || path === 'null')
      return "https://i.pravatar.cc/100?u=shop";
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    let finalPath = path;
    if (!path.includes('uploads/')) {
      finalPath = `/uploads${path.startsWith('/') ? '' : '/'}${path}`;
    } else {
      finalPath = path.startsWith('/') ? path : `/${path}`;
    }
    return `${apiUrl}${finalPath}`;
  };

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        let initialConvId = null;
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
            setShowMobileSidebar(false);
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
        if (String(msg.conversationId) !== String(activeConv.id)) return;
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setTimeout(scrollToBottom, 100);
      };
      socket.on('new_message', handleNewMessage);
      return () => { socket.off('new_message', handleNewMessage); };
    }
  }, [activeConv?.id, socket]);

  useEffect(() => {
    if (activeConv) {
      api.patch(`/chat/conversations/${activeConv.id}/read`).catch(() => {});
    }
  }, [activeConv?.id]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

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
      await api.post('/chat/messages', { conversationId: activeConv.id, text: textToSend });
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
      await api.post('/chat/messages', {
        conversationId: activeConv.id,
        text: '',
        image: uploadRes.data.path
      });
      const res = await api.get(`/chat/conversations/${activeConv.id}/messages`);
      setMessages(res.data);
      setTimeout(scrollToBottom, 50);
    } catch (error) {
      console.error("Erreur envoi image", error);
    } finally {
      setIsSending(false);
    }
  };

  const openConv = (c: any) => {
    setActiveConv(c);
    setShowMobileSidebar(false);
  };

  const filteredConversations = conversations.filter(c => {
    const name = getStoreName(c).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const storeName = activeConv ? getStoreName(activeConv) : '';

  return (
    <div className="bg-[#FAF7F2] h-screen flex flex-col font-sans overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── TOP NAV ─────────────────────────────────────────── */}
      <nav className="relative z-30 flex items-center justify-between px-6 md:px-10 py-4 bg-white/95 backdrop-blur-xl border-b border-manioco-brown/10 shadow-[0_4px_30px_rgba(92,45,35,0.08)]">
        {/* Left — back */}
        <Link href="/dashboard/client" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-full border border-manioco-brown/10 flex items-center justify-center group-hover:bg-manioco-terracotta/10 transition-all">
            <ChevronLeft size={18} className="text-manioco-brown/60 group-hover:text-manioco-terracotta transition-colors" />
          </div>
          <span className="hidden md:block text-[10px] font-black uppercase tracking-[0.3em] text-manioco-brown/50 group-hover:text-manioco-terracotta transition-colors">
            Dashboard
          </span>
        </Link>

        {/* Center — branding */}
        <Link href="/" className="flex items-center gap-1.5 group animate-reveal">
          <span className="text-2xl font-extrabold tracking-tight text-manioco-brown font-sans">Mani</span>
          <span className="relative inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#F4A261] border-[2.5px] border-manioco-brown text-manioco-brown text-sm font-black group-hover:scale-110 transition-transform">o</span>
          <span className="text-2xl font-extrabold tracking-tight text-manioco-brown font-sans">c</span>
          <span className="relative inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#F4A261] border-[2.5px] border-manioco-brown text-manioco-brown text-sm font-black group-hover:scale-110 transition-transform">o</span>
          <span className="ml-2 px-2.5 py-0.5 rounded-full bg-manioco-terracotta/10 text-manioco-terracotta text-[9px] font-extrabold uppercase tracking-wider">Chat</span>
        </Link>

        {/* Right — avatar */}
        <div className="w-10 h-10 rounded-full border-2 border-manioco-terracotta/20 bg-manioco-cream flex items-center justify-center text-manioco-brown font-bold text-sm overflow-hidden shadow-md">
          {user?.profilePhoto ? (
            <img src={getImageUrl(user.profilePhoto)} alt="Profil" className="w-full h-full object-cover" />
          ) : (
            <span className="text-manioco-brown font-bold text-sm">{user?.name?.[0] || 'U'}</span>
          )}
        </div>
      </nav>

      {/* ── BODY ───────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── SIDEBAR ──────────────────────────────────────── */}
        <aside className={`
          ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          absolute md:relative z-20 md:z-auto
          w-[320px] md:w-[340px] h-full
          bg-white border-r border-manioco-brown/10
          flex flex-col transition-transform duration-300
          shadow-2xl md:shadow-none
        `}>

          {/* Sidebar Header */}
          <div className="px-7 pt-7 pb-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[9px] font-black text-manioco-terracotta uppercase tracking-[0.4em] mb-0.5">Messagerie</p>
                <h2 className="text-lg font-black text-manioco-brown uppercase tracking-tight">Conversations</h2>
              </div>
              <div className="w-9 h-9 rounded-2xl bg-manioco-brown/5 flex items-center justify-center">
                <Sparkles size={16} className="text-manioco-terracotta" />
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-manioco-brown/25" size={15} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Chercher un vendeur..."
                className="w-full bg-manioco-brown/5 rounded-2xl py-3 pl-11 pr-4 text-[12px] font-semibold text-manioco-brown placeholder:text-manioco-brown/25 outline-none focus:ring-2 focus:ring-manioco-terracotta/30 border border-transparent focus:border-manioco-terracotta/20 transition-all"
              />
            </div>

            <p className="text-[9px] font-black text-manioco-brown/30 uppercase tracking-[0.3em] mt-6 mb-3">
              {filteredConversations.length} discussion{filteredConversations.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2 custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="animate-spin text-manioco-terracotta" size={28} />
                <p className="text-[10px] font-black uppercase text-manioco-brown/30 tracking-widest">Chargement...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-6">
                <div className="w-16 h-16 rounded-[24px] bg-manioco-brown/5 flex items-center justify-center rotate-6">
                  <MessageSquare size={28} className="text-manioco-terracotta/40" />
                </div>
                <div>
                  <p className="text-sm font-black text-manioco-brown/30 uppercase tracking-tight">Aucune conversation</p>
                  <p className="text-[10px] text-manioco-brown/20 font-medium mt-1">Commandez un produit pour démarrer un chat avec un vendeur.</p>
                </div>
              </div>
            ) : (
              filteredConversations.map((c) => {
                const name = getStoreName(c);
                const isActive = activeConv?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => openConv(c)}
                    className={`
                      w-full p-4 rounded-[20px] flex items-center gap-4 text-left transition-all duration-300 border
                      ${isActive
                        ? 'bg-manioco-brown text-white shadow-xl shadow-manioco-brown/20 scale-[1.01]'
                        : 'bg-transparent border-transparent hover:bg-manioco-brown/5 hover:border-manioco-brown/10'
                      }
                    `}
                  >
                    {/* Avatar */}
                    <div className={`relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 shadow-md ${isActive ? 'ring-2 ring-manioco-terracotta/60 ring-offset-2 ring-offset-manioco-brown' : ''}`}>
                      <img
                        src={getImageUrl(c.store?.profilePhoto)}
                        alt={name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <h4 className={`text-[12px] font-black uppercase truncate tracking-tight ${isActive ? 'text-white' : 'text-manioco-brown'}`}>
                          {name}
                        </h4>
                        <span className={`text-[9px] font-bold shrink-0 ml-2 ${isActive ? 'text-manioco-terracotta' : 'text-manioco-brown/25'}`}>
                          {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className={`text-[11px] truncate font-medium leading-tight ${isActive ? 'text-white/50' : 'text-manioco-brown/40'}`}>
                        {c.lastMessageText || 'Commencer la discussion...'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ── CHAT AREA ─────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden relative bg-[#FAF7F2]">

          {/* Subtle watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
            <span className="text-[18rem] font-black text-manioco-brown/[0.015] rotate-[-12deg] tracking-tighter leading-none">
              MANIOCO
            </span>
          </div>

          {activeConv ? (
            <>
              {/* ── Chat Top Bar */}
              <div className="relative z-10 flex items-center justify-between px-6 md:px-8 py-4 bg-white/70 backdrop-blur-xl border-b border-manioco-brown/10 shadow-sm">
                <div className="flex items-center gap-4">
                  {/* Mobile back */}
                  <button
                    onClick={() => setShowMobileSidebar(true)}
                    className="md:hidden w-9 h-9 rounded-2xl bg-manioco-brown/5 flex items-center justify-center text-manioco-brown/50 hover:text-manioco-brown transition-colors"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  {/* Store avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-lg">
                      <img
                        src={getImageUrl(activeConv.store?.profilePhoto)}
                        alt={storeName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full" />
                  </div>

                  {/* Store name + badge */}
                  <div>
                    <h3 className="text-[15px] font-black text-manioco-brown uppercase tracking-tight">
                      {storeName}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">En ligne</span>
                      <span className="text-manioco-brown/20 mx-1">·</span>
                      <ShieldCheck size={10} className="text-manioco-terracotta" />
                      <span className="text-[9px] font-black text-manioco-terracotta uppercase tracking-widest">Vendeur Certifié</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link
                    href="/dashboard/client/orders"
                    className="hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl bg-manioco-brown/5 text-manioco-brown/50 hover:bg-manioco-brown/10 hover:text-manioco-brown transition-all text-[10px] font-black uppercase tracking-widest"
                  >
                    <Package size={14} />
                    Commandes
                  </Link>
                </div>
              </div>

              {/* ── Messages Area */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-6 md:px-10 py-8 space-y-5 relative z-10 scroll-smooth"
              >
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
                    <div className="w-20 h-20 rounded-[28px] bg-white shadow-xl flex items-center justify-center rotate-6 border border-manioco-brown/5">
                      <MessageSquare size={36} className="text-manioco-terracotta/30" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-manioco-brown/30 uppercase tracking-tight">Aucun message</p>
                      <p className="text-[11px] text-manioco-brown/20 mt-1">Soyez le premier à écrire !</p>
                    </div>
                  </div>
                )}

                {messages.map((m, idx) => {
                  const isMe = checkIsMe(m, user);
                  const showDate = idx === 0 || (
                    new Date(messages[idx - 1].createdAt).toDateString() !== new Date(m.createdAt).toDateString()
                  );

                  return (
                    <div key={m.id}>
                      {/* Date separator */}
                      {showDate && (
                        <div className="flex items-center gap-4 my-4">
                          <div className="flex-1 h-px bg-manioco-brown/10" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-manioco-brown/25 bg-[#FAF7F2] px-3">
                            {new Date(m.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })}
                          </span>
                          <div className="flex-1 h-px bg-manioco-brown/10" />
                        </div>
                      )}

                      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                        {/* Other user avatar */}
                        {!isMe && (
                          <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 mr-3 mt-auto mb-1 shadow-md">
                            <img
                              src={getImageUrl(activeConv.store?.profilePhoto)}
                              alt="Vendeur"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <div className="flex flex-col max-w-[65%]">
                          {/* Bubble */}
                          <div className={`
                            px-5 py-3.5 shadow-sm
                            ${isMe
                              ? 'bg-manioco-brown text-white rounded-[20px] rounded-tr-[4px]'
                              : 'bg-white text-manioco-brown rounded-[20px] rounded-tl-[4px] border border-manioco-brown/10'
                            }
                          `}>
                            {/* Image attachment */}
                            {m.image && (
                              <div className="relative w-full max-w-[260px] aspect-square mb-3 rounded-2xl overflow-hidden shadow-md">
                                <img
                                  src={getImageUrl(m.image)}
                                  alt="Image"
                                  className="object-cover w-full h-full hover:scale-105 transition-transform duration-700"
                                />
                              </div>
                            )}
                            {m.text && (
                              <p className={`text-[13px] font-medium leading-relaxed ${isMe ? 'text-white/90' : 'text-manioco-brown'}`}>
                                {m.text}
                              </p>
                            )}
                          </div>

                          {/* Timestamp + read status */}
                          <div className={`flex items-center gap-1.5 mt-1.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-[9px] font-bold text-manioco-brown/30 uppercase">
                              {new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && <CheckCheck size={12} className="text-manioco-terracotta" />}
                          </div>
                        </div>

                        {/* My avatar */}
                        {isMe && (
                          <div className="w-8 h-8 rounded-xl bg-manioco-brown/10 border border-manioco-brown/10 shrink-0 ml-3 mt-auto mb-1 flex items-center justify-center overflow-hidden shadow-md">
                            {user?.profilePhoto ? (
                              <img src={getImageUrl(user.profilePhoto)} alt="Moi" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] font-black text-manioco-brown">{user?.name?.[0] || 'M'}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Input Bar */}
              <div className="relative z-10 px-6 md:px-8 py-5 bg-white/60 backdrop-blur-xl border-t border-manioco-brown/10">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center gap-3 bg-white rounded-[24px] shadow-xl shadow-manioco-brown/5 border border-manioco-brown/10 px-2 py-2">
                    {/* Image btn */}
                    <input
                      type="file"
                      className="hidden"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-manioco-brown/25 hover:bg-manioco-brown/5 hover:text-manioco-brown/50 transition-all shrink-0"
                    >
                      <ImageIcon size={20} />
                    </button>

                    {/* Text input */}
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      placeholder={`Écrire à ${storeName}...`}
                      className="flex-1 bg-transparent border-none py-3 text-[13px] font-medium text-manioco-brown placeholder:text-manioco-brown/25 outline-none"
                    />

                    {/* Send btn */}
                    <button
                      onClick={handleSend}
                      disabled={isSending || !inputText.trim()}
                      className={`
                        w-12 h-12 rounded-[18px] flex items-center justify-center shrink-0 transition-all
                        ${inputText.trim()
                          ? 'bg-manioco-terracotta text-white shadow-lg shadow-manioco-terracotta/20 hover:scale-105 active:scale-95'
                          : 'bg-manioco-brown/5 text-manioco-brown/20 cursor-not-allowed'
                        }
                        disabled:opacity-50
                      `}
                    >
                      {isSending
                        ? <Loader2 size={18} className="animate-spin" />
                        : <Send size={18} className="translate-x-0.5 -translate-y-0.5" />
                      }
                    </button>
                  </div>

                  <p className="text-center mt-3 text-[9px] font-black uppercase tracking-widest text-manioco-brown/15">
                    Messages chiffrés · Manioco
                  </p>
                </div>
              </div>
            </>
          ) : (
            /* ── Empty State */
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-8">
              <div className="text-center max-w-sm">
                {/* Icon */}
                <div className="relative mx-auto w-32 h-32 mb-10">
                  <div className="absolute inset-0 bg-manioco-brown/5 rounded-[40px] rotate-12" />
                  <div className="absolute inset-2 bg-white rounded-[32px] shadow-2xl flex items-center justify-center border border-manioco-brown/5">
                    <MessageSquare size={48} className="text-manioco-terracotta/40" />
                  </div>
                </div>

                <h3 className="text-2xl font-black uppercase tracking-tight text-manioco-brown mb-3">
                  Sélectionnez<br />
                  <span className="text-manioco-terracotta">un vendeur</span>
                </h3>
                <p className="text-[11px] font-bold text-manioco-brown/35 uppercase tracking-widest leading-relaxed mb-8">
                  Choisissez une conversation dans la liste<br />pour commencer à échanger.
                </p>

                {/* Stats bar */}
                <div className="flex items-center justify-center gap-8 py-5 px-8 bg-white rounded-[24px] border border-manioco-brown/10 shadow-xl shadow-manioco-brown/5">
                  <div className="text-center">
                    <p className="text-2xl font-black text-manioco-brown">{conversations.length}</p>
                    <p className="text-[9px] font-black text-manioco-brown/30 uppercase tracking-widest">Discussions</p>
                  </div>
                  <div className="w-px h-8 bg-manioco-brown/10" />
                  <div className="text-center">
                    <p className="text-2xl font-black text-manioco-terracotta">24h</p>
                    <p className="text-[9px] font-black text-manioco-brown/30 uppercase tracking-widest">Réponse moy.</p>
                  </div>
                  <div className="w-px h-8 bg-manioco-brown/10" />
                  <div className="text-center">
                    <p className="text-2xl font-black text-manioco-brown">100%</p>
                    <p className="text-[9px] font-black text-manioco-brown/30 uppercase tracking-widest">Sécurisé</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mobile sidebar overlay backdrop */}
          {showMobileSidebar && (
            <button
              type="button"
              aria-label="Fermer"
              className="md:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-10 cursor-default border-none"
              onClick={() => setShowMobileSidebar(false)}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function getStoreName(c: any) {
  return c.store?.name || c.store?.owner?.name || 'Artisan Afrigari';
}

function checkIsMe(m: any, user: any) {
  const myId = String(user?.id || user?.userId || "");
  const msgSenderId = m.senderId && typeof m.senderId === 'object'
    ? m.senderId.id
    : (m.sender?.id || m.senderId);
  return String(msgSenderId) === myId;
}

export default function ClientMessages() {
  return (
    <Suspense fallback={
      <div className="bg-[#FAF7F2] h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-[24px] bg-manioco-terracotta flex items-center justify-center rotate-6 shadow-2xl shadow-manioco-terracotta/25">
            <MessageSquare size={28} className="text-white" />
          </div>
          <Loader2 className="animate-spin text-manioco-terracotta" size={28} />
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-manioco-brown/30">Chargement...</p>
        </div>
      </div>
    }>
      <ClientMessagesContent />
    </Suspense>
  );
}
