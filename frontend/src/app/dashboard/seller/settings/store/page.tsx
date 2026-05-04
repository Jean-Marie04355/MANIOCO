"use client";
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Sidebar from '../../../components/Sidebar';
import TopNav from '../../../components/TopNav';
import { 
  Store, 
  MapPin, 
  Phone, 
  AlignLeft, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Globe,
  Settings,
  ShoppingBag,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import api from '@/lib/axios';
import Link from 'next/link';

export default function StoreSettings() {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Real state matching CreateStoreDto
  const [storeData, setStoreData] = useState({
    name: '',
    description: '',
    phone: '',
    address: '',
    city: '',
    latitude: 0,
    longitude: 0,
    profilePhoto: '',
    payoutAccountId: '',
    ownerId: ''
  });

  const [stats, setStats] = useState({
    productCount: 0,
    salesCount: 0
  });

  // Fetch store data on mount
  useEffect(() => {
    const fetchStore = async () => {
      const currentUserId = user?.id || (user as any)?.userId;
      if (!currentUserId) return;
      
      setStoreData(prev => ({ ...prev, ownerId: currentUserId }));

      try {
        const response = await api.get('/stores');
        // ownerId is now returned by backend mapToPublic
        const myStore = response.data.find((s: any) => s.ownerId === currentUserId);
        
        if (myStore) {
          setStoreId(myStore.id);
          setStoreData({
            name: myStore.name || '',
            description: myStore.description || '',
            phone: myStore.phone || '',
            address: myStore.address || '',
            city: myStore.city || '',
            latitude: myStore.latitude || 0,
            longitude: myStore.longitude || 0,
            profilePhoto: myStore.profilePhoto || '',
            payoutAccountId: myStore.payoutAccountId || '',
            ownerId: currentUserId
          });
          if (myStore.profilePhoto) {
            setLogoPreview(myStore.profilePhoto);
          }

          // Récupérer les stats réelles
          const [productsRes, ordersRes] = await Promise.all([
            api.get(`/products?storeId=${myStore.id}`),
            api.get(`/orders/store/${myStore.id}`)
          ]);

          const successfulOrders = ordersRes.data.filter((o: any) => 
            ['PAID', 'SHIPPED', 'DELIVERED'].includes(o.status)
          );

          setStats({
            productCount: productsRes.data.length,
            salesCount: successfulOrders.length
          });
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de la boutique", error);
      }
    };
    fetchStore();
  }, [user]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUserId = user?.id || (user as any)?.userId;
    if (!currentUserId) return;
    
    setIsSaving(true);
    try {
      const payload = {
        ...storeData,
        ownerId: currentUserId,
        latitude: Number(storeData.latitude) || 0,
        longitude: Number(storeData.longitude) || 0,
        profilePhoto: logoPreview || 'https://via.placeholder.com/150'
      };

      if (storeId) {
        await api.patch(`/stores/${storeId}`, payload);
      } else {
        const response = await api.post('/stores', payload);
        setStoreId(response.data.id);
      }
      
      setIsSaved(true);
      setIsEditing(false);
      if (typeof window !== 'undefined') {
        localStorage.setItem('afrigari_has_store', 'true');
      }
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error: any) {
      console.error("Erreur de sauvegarde", error);
      const msg = error.response?.data?.message;
      alert(Array.isArray(msg) ? msg.join(", ") : (msg || "Erreur lors de la sauvegarde"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar mode="seller" />
      
      <main className="flex-1 ml-64">
        <TopNav title="Gestion Boutique" isAdmin={true} />
        
        <div className="p-8 max-w-5xl mx-auto">
          
          {/* Header Section */}
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Ma Boutique</h1>
              <p className="text-slate-500 mt-2 font-medium">Gérez l'identité visuelle et les paramètres de votre point de vente.</p>
            </div>
            {storeId && !isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                <Settings size={16} className="text-slate-400" />
                Modifier la boutique
              </button>
            )}
          </div>

          {isSaved && (
            <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-4 fade-in">
              <CheckCircle2 className="text-green-500" />
              <p className="text-sm font-bold text-green-700">Modifications enregistrées ! Votre boutique est à jour.</p>
            </div>
          )}

          {/* Conditional View: Card vs Form */}
          {storeId && !isEditing ? (
            /* PREMIUM STORE PREVIEW CARD */
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
              
              {/* Main Card */}
              <div className="bg-white rounded-[3rem] border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden">
                {/* Banner */}
                <div className="h-48 bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 relative">
                   <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px'}}></div>
                   <div className="absolute -bottom-16 left-12 p-2 bg-white rounded-[2.5rem] shadow-lg">
                      <div className="w-32 h-32 rounded-[2rem] bg-slate-100 overflow-hidden relative border border-slate-100">
                         {logoPreview ? (
                           <Image src={logoPreview} alt="Logo" fill className="object-cover" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center bg-orange-50 text-orange-500">
                              <Store size={40} />
                           </div>
                         )}
                      </div>
                   </div>
                </div>

                {/* Content */}
                <div className="pt-20 pb-10 px-12">
                   <div className="flex justify-between items-start">
                      <div className="max-w-2xl">
                         <div className="flex items-center gap-3 mb-2">
                           <h2 className="text-3xl font-black text-slate-900">{storeData.name}</h2>
                           <span className="px-3 py-1 bg-green-100 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full">Active</span>
                         </div>
                         <p className="text-slate-500 font-medium leading-relaxed">{storeData.description || "Aucune description fournie pour cette boutique."}</p>
                      </div>
                      <div className="flex gap-4">
                         <div className="text-center px-6 py-4 bg-slate-50 rounded-[2rem] border border-slate-100">
                            <span className="block text-2xl font-black text-slate-900">{stats.productCount}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase">Produits</span>
                         </div>
                         <div className="text-center px-6 py-4 bg-slate-50 rounded-[2rem] border border-slate-100">
                            <span className="block text-2xl font-black text-slate-900">{stats.salesCount}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase">Ventes</span>
                         </div>
                      </div>
                   </div>

                   <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-slate-100">
                      <div className="flex items-start gap-4">
                         <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                            <MapPin size={18} />
                         </div>
                         <div>
                            <span className="block text-[10px] font-black text-slate-400 uppercase">Localisation</span>
                            <span className="text-sm font-bold text-slate-700">{storeData.address}, {storeData.city}</span>
                         </div>
                      </div>
                      <div className="flex items-start gap-4">
                         <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                            <Phone size={18} />
                         </div>
                         <div>
                            <span className="block text-[10px] font-black text-slate-400 uppercase">Contact</span>
                            <span className="text-sm font-bold text-slate-700">{storeData.phone}</span>
                         </div>
                      </div>
                      <div className="flex items-start gap-4">
                         <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                            <CreditCard size={18} />
                         </div>
                         <div>
                            <span className="block text-[10px] font-black text-slate-400 uppercase">Reversements</span>
                            <span className="text-sm font-bold text-slate-700">{storeData.payoutAccountId}</span>
                         </div>
                      </div>
                   </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href="/dashboard/seller/products" className="bg-white p-6 rounded-[2.5rem] border border-slate-200/60 shadow-sm flex items-center justify-between group cursor-pointer hover:border-orange-500 transition-all">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
                         <ShoppingBag size={20} />
                      </div>
                      <div>
                         <h4 className="font-black text-slate-900">Voir mon catalogue</h4>
                         <p className="text-xs text-slate-500 font-medium">Gérez vos produits en vente</p>
                      </div>
                   </div>
                   <ChevronRight className="text-slate-300 group-hover:text-orange-500 transition-colors" />
                </Link>
                <Link href={`/shops/${storeId}`} target="_blank" className="bg-white p-6 rounded-[2.5rem] border border-slate-200/60 shadow-sm flex items-center justify-between group cursor-pointer hover:border-blue-500 transition-all">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                         <ExternalLink size={20} />
                      </div>
                      <div>
                         <h4 className="font-black text-slate-900">Aperçu public</h4>
                         <p className="text-xs text-slate-500 font-medium">Voir comme un client</p>
                      </div>
                   </div>
                   <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                </Link>
              </div>

            </div>
          ) : (
            /* EDIT / CREATE FORM */
            <div className="bg-white rounded-[3rem] border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-3xl bg-white border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-all overflow-hidden shadow-sm" onClick={() => fileInputRef.current?.click()}>
                      {logoPreview ? (
                        <Image src={logoPreview} alt="Logo de la boutique" fill className="object-cover" />
                      ) : (
                        <>
                          <ImageIcon className="text-slate-300 group-hover:text-orange-500 mb-1" size={24} />
                          <span className="text-[10px] font-black text-slate-400 uppercase">Logo</span>
                        </>
                      )}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleLogoChange} accept="image/*" className="hidden" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Identité Visuelle</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">Téléchargez un logo qui représente votre marque.</p>
                  </div>
                </div>
                {storeId && (
                  <button 
                    type="button" 
                    onClick={() => setIsEditing(false)}
                    className="text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest underline underline-offset-4"
                  >
                    Retour au profil
                  </button>
                )}
              </div>

              <form onSubmit={handleSave} className="p-10 space-y-10">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Store size={14} /> Nom de la boutique
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Afrigari Electronics" 
                      className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:bg-white transition-all shadow-inner"
                      value={storeData.name}
                      onChange={(e) => setStoreData({...storeData, name: e.target.value})}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Phone size={14} /> Téléphone de contact
                    </label>
                    <input 
                      type="tel" 
                      required
                      placeholder="0102030405 (Chiffres uniquement)" 
                      className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:bg-white transition-all shadow-inner"
                      value={storeData.phone}
                      onChange={(e) => setStoreData({...storeData, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <AlignLeft size={14} /> Description
                  </label>
                  <textarea 
                    rows={4}
                    required
                    placeholder="Décrivez votre activité..." 
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:bg-white transition-all shadow-inner resize-none"
                    value={storeData.description}
                    onChange={(e) => setStoreData({...storeData, description: e.target.value})}
                  />
                </div>

                <div className="pt-8 border-t border-slate-100">
                  <h4 className="text-sm font-black text-slate-900 mb-8 flex items-center gap-2"><MapPin size={16} className="text-orange-500"/> Localisation physique</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Ville</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ex: Abidjan" 
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:bg-white transition-all shadow-inner"
                        value={storeData.city}
                        onChange={(e) => setStoreData({...storeData, city: e.target.value})}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Adresse détaillée</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ex: Cocody Angré" 
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:bg-white transition-all shadow-inner"
                        value={storeData.address}
                        onChange={(e) => setStoreData({...storeData, address: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-8">
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Globe size={12} /> Latitude (GPS)
                      </label>
                      <input 
                        type="number" 
                        step="any"
                        placeholder="Ex: 5.348" 
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:bg-white transition-all shadow-inner"
                        value={storeData.latitude}
                        onChange={(e) => setStoreData({...storeData, latitude: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Globe size={12} /> Longitude (GPS)
                      </label>
                      <input 
                        type="number" 
                        step="any"
                        placeholder="Ex: -4.033" 
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:bg-white transition-all shadow-inner"
                        value={storeData.longitude}
                        onChange={(e) => setStoreData({...storeData, longitude: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100">
                  <h4 className="text-sm font-black text-slate-900 mb-8 flex items-center gap-2"><CreditCard size={16} className="text-orange-500"/> Retraits (FedaPay)</h4>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Compte FedaPay</label>
                    <input 
                      type="text" 
                      required
                      placeholder="acc_p8p8p8..." 
                      className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:bg-white transition-all shadow-inner"
                      value={storeData.payoutAccountId}
                      onChange={(e) => setStoreData({...storeData, payoutAccountId: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-10 flex items-center justify-end gap-6">
                  <button 
                    type="button" 
                    onClick={() => storeId ? setIsEditing(false) : null}
                    className="px-8 py-4 text-sm font-black text-slate-400 hover:text-slate-600 transition-all uppercase tracking-widest"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="px-10 py-4 bg-orange-500 text-white rounded-3xl text-sm font-black hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/30 active:scale-95 disabled:opacity-70 flex items-center gap-3"
                  >
                    {isSaving ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Traitement...
                      </>
                    ) : (
                      storeId ? "Mettre à jour" : "Créer ma boutique"
                    )}
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* Help Alert */}
          {!storeId && (
            <div className="mt-8 p-6 bg-blue-50/50 border border-blue-100 rounded-[2rem] flex gap-4">
              <div className="mt-1"><AlertCircle className="text-blue-500" size={24} /></div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Pourquoi créer une boutique ?</h4>
                <p className="text-xs font-medium text-slate-600 leading-relaxed mt-2 max-w-2xl">
                  Sur Afrigari, votre boutique est votre vitrine. Une fois créée, vous pourrez y ajouter vos produits et commencer à vendre.
                </p>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
