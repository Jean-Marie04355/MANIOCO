"use client";
import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';
import { 
  ShoppingBag, CheckCircle, XCircle, Loader2, AlertCircle, Package, ArrowLeft, Store, Users, Tag, Layers
} from 'lucide-react';
import Image from 'next/image';
import api from '@/lib/axios';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  unit: string;
  description?: string;
  image?: string;
  category?: { name: string };
  store?: { id: string; name: string; owner?: { name: string } };
  parentId?: string;
  parent?: Product;
}

interface StoreGroup {
  id: string;
  name: string;
  ownerName: string;
  products: Product[];
}

export default function AdminProductsValidation() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selection state
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  // Rejection modal state
  const [rejectingProduct, setRejectingProduct] = useState<Product | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmittingRejection, setIsSubmittingRejection] = useState(false);

  const fetchPendingProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/products/admin/pending');
      setProducts(res.data);
    } catch (err: any) {
      console.error("Erreur récupération produits en attente", err);
      setError("Impossible de charger les produits en attente de modération.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingProducts();
  }, []);

  // Group products by store
  const getStoresWithPendingProducts = (): StoreGroup[] => {
    const storeMap = new Map<string, StoreGroup>();
    
    products.forEach(product => {
      const storeId = product.store?.id || 'unknown';
      const storeName = product.store?.name || 'Boutique Sans Nom';
      const ownerName = product.store?.owner?.name || 'Vendeur Inconnu';
      
      if (!storeMap.has(storeId)) {
        storeMap.set(storeId, {
          id: storeId,
          name: storeName,
          ownerName: ownerName,
          products: []
        });
      }
      
      storeMap.get(storeId)!.products.push(product);
    });
    
    return Array.from(storeMap.values());
  };

  const handleApprove = async (id: string, name: string) => {
    if (typeof window !== 'undefined' && !window.confirm(`Voulez-vous approuver le produit "${name}" ?`)) {
      return;
    }
    
    try {
      await api.patch(`/products/${id}/approve`);
      setProducts(prev => prev.filter(p => p.id !== id));
      alert(`Le produit "${name}" a été approuvé avec succès !`);
    } catch (err) {
      console.error("Erreur lors de l'approbation du produit", err);
      alert("Erreur lors de l'approbation du produit.");
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingProduct || !rejectionReason.trim()) return;

    setIsSubmittingRejection(true);
    try {
      await api.patch(`/products/${rejectingProduct.id}/reject`, {
        reason: rejectionReason
      });
      setProducts(prev => prev.filter(p => p.id !== rejectingProduct.id));
      setRejectingProduct(null);
      setRejectionReason("");
      alert(`Le produit "${rejectingProduct.name}" a été refusé.`);
    } catch (err) {
      console.error("Erreur lors du rejet du produit", err);
      alert("Erreur lors du rejet du produit.");
    } finally {
      setIsSubmittingRejection(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + " FCFA";
  };

  const stores = getStoresWithPendingProducts();
  const selectedStore = stores.find(s => s.id === selectedStoreId);

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar mode="admin" />
      
      <main className="flex-1 ml-64">
        <TopNav 
          title={selectedStore ? `Modération : ${selectedStore.name}` : "Validation Produits"} 
          isAdmin={true} 
        />
        
        <div className="p-8 space-y-8">
          {/* Main Info Banner with beautiful layout */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-900/10 border border-slate-700/30">
             <div className="relative z-10 max-w-3xl space-y-3">
                <div className="inline-flex items-center gap-2 bg-manioco-terracotta/20 text-manioco-terracotta px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-manioco-terracotta/30 animate-pulse">
                  Centre de Modération
                </div>
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight flex items-center gap-3">
                  <ShoppingBag className="text-manioco-terracotta w-8 h-8 md:w-10 h-10" />
                  Approbation du catalogue
                </h2>
                <p className="text-slate-400 font-medium text-xs md:text-sm leading-relaxed">
                  {selectedStore 
                    ? `Examen des produits de la boutique "${selectedStore.name}". Assurez-vous que l'intitulé, les visuels et les tarifs correspondent aux normes Afrigari.`
                    : "Sélectionnez une boutique ci-dessous pour gérer et vérifier ses produits en attente d'approbation."}
                </p>
             </div>
             <div className="absolute right-[-40px] top-[-40px] w-96 h-96 bg-manioco-terracotta/10 rounded-full blur-3xl"></div>
             <div className="absolute left-[-20px] bottom-[-20px] w-48 h-48 bg-blue-500/5 rounded-full blur-2xl"></div>
          </div>

          {/* Quick Statistics Strip for context */}
          {!selectedStoreId && products.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200/50 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shadow-inner">
                  <ShoppingBag size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Produits en attente</p>
                  <h4 className="text-xl font-black text-slate-900">{products.length}</h4>
                </div>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200/50 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-manioco-terracotta-50 text-manioco-terracotta flex items-center justify-center shadow-inner">
                  <Store size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Boutiques à modérer</p>
                  <h4 className="text-xl font-black text-slate-900">{stores.length}</h4>
                </div>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200/50 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-inner">
                  <Users size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Rôle de l'Admin</p>
                  <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest">Validateur</h4>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Back button */}
          {selectedStore && (
            <button 
              onClick={() => setSelectedStoreId(null)}
              className="group inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-manioco-terracotta transition-colors duration-300 bg-white px-5 py-3 rounded-xl border border-slate-200/60 shadow-sm hover:shadow"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              Retour aux boutiques
            </button>
          )}

          {isLoading ? (
            <div className="h-96 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-manioco-terracotta animate-spin" />
            </div>
          ) : error ? (
            <div className="p-12 text-center bg-white border border-red-100 rounded-[2.5rem] shadow-sm max-w-xl mx-auto">
              <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-black text-slate-900">Une erreur est survenue</h3>
              <p className="text-sm text-slate-500 mt-2 font-medium">{error}</p>
              <button 
                onClick={fetchPendingProducts}
                className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-manioco-terracotta transition-all"
              >
                Réessayer
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="p-20 flex flex-col items-center text-center bg-white rounded-[3rem] border border-slate-200/60 shadow-sm max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-green-50 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-inner text-green-500">
                <CheckCircle size={48} className="animate-bounce" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Aucun produit en attente</h3>
              <p className="text-sm text-slate-400 max-w-xs mt-3 font-medium leading-relaxed">
                Tous les produits soumis par les vendeurs ont été validés et sont actuellement en ligne. Bon travail !
              </p>
            </div>
          ) : !selectedStoreId ? (
            /* STORES SELECTION VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {stores.map((store) => (
                <div 
                  key={store.id} 
                  onClick={() => setSelectedStoreId(store.id)}
                  className="bg-white p-7 rounded-[2.5rem] border border-slate-200/60 shadow-sm hover:shadow-xl hover:border-manioco-terracotta/20 cursor-pointer transition-all duration-300 hover:-translate-y-1 group flex items-start gap-5 relative overflow-hidden"
                >
                  {/* Subtle hover background highlight */}
                  <div className="absolute top-0 left-0 w-2 h-full bg-manioco-terracotta scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300"></div>

                  <div className="w-16 h-16 bg-manioco-terracotta-50 rounded-[1.5rem] flex items-center justify-center text-manioco-terracotta group-hover:bg-manioco-terracotta group-hover:text-white transition-all duration-500 shadow-sm group-hover:scale-105">
                    <Store size={28} />
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-manioco-terracotta transition-colors">{store.name}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Par : {store.ownerName}</p>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                      <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-wider border border-amber-100">
                        {store.products.length} {store.products.length > 1 ? 'produits' : 'produit'}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-900 transition-colors flex items-center gap-1">
                        Examiner
                        <ArrowLeft size={12} className="rotate-180 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* PRODUCTS OF SELECTED STORE VIEW */
            <div className="space-y-6 animate-in fade-in duration-500">
              {(!selectedStore || selectedStore.products.length === 0) ? (
                <div className="p-16 text-center bg-white rounded-[2.5rem] border border-slate-200/60 max-w-md mx-auto shadow-sm">
                  <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                  <h4 className="text-xl font-black text-slate-900">Validation terminée</h4>
                  <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed">Tous les produits de cette boutique ont été modérés.</p>
                  <button
                    onClick={() => setSelectedStoreId(null)}
                    className="mt-8 px-6 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-manioco-terracotta hover:shadow-lg transition-all"
                  >
                    Retour aux boutiques
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {selectedStore.products.map((product) => {
                    const isRevision = !!product.parentId;
                    const nameChanged = isRevision && product.name !== product.parent?.name;
                    const priceChanged = isRevision && product.price !== product.parent?.price;
                    const descChanged = isRevision && product.description !== product.parent?.description;
                    const stockChanged = isRevision && (product.stock !== product.parent?.stock || product.unit !== product.parent?.unit);
                    const imageChanged = isRevision && product.image !== product.parent?.image;

                    return (
                      <div 
                        key={product.id} 
                        className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden flex flex-col hover:shadow-xl hover:border-slate-300/40 transition-all duration-300 group hover:-translate-y-1"
                      >
                        {/* Image section with glassmorphic tag */}
                        <div className="relative h-60 bg-slate-100 border-b border-slate-100 flex items-center justify-center overflow-hidden">
                          {product.image ? (
                            <Image 
                              src={product.image} 
                              alt={product.name} 
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-700"
                              sizes="(max-width: 1200px) 100vw, 33vw"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50/50 gap-2">
                              <Package size={54} className="stroke-[1.5]" />
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Aucun visuel fourni</span>
                            </div>
                          )}
                          
                          {/* Category tag - sleek */}
                          <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-white/10 shadow-md">
                            <Layers size={11} className="text-manioco-terracotta" />
                            <span className="text-[9px] font-black uppercase tracking-wider">
                              {product.category?.name || "Sans catégorie"}
                            </span>
                          </div>

                          {/* Revision Indicator */}
                          {isRevision && (
                            <div className="absolute top-4 right-4 bg-amber-500 text-white px-3 py-1.5 rounded-xl border border-white/10 shadow-md font-black text-[9px] uppercase tracking-wider">
                              Modification {imageChanged && "(Nouvelle Image)"}
                            </div>
                          )}

                          {/* Cost badge floating */}
                          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md text-slate-900 px-3 py-1.5 rounded-xl border border-slate-200/40 shadow-md font-black text-xs flex items-center gap-1.5">
                            {formatPrice(product.price)}
                            {priceChanged && product.parent && (
                              <span className="text-[10px] text-amber-600 line-through font-bold">
                                {formatPrice(product.parent.price)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Body Content */}
                        <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                          <div className="space-y-3">
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Tag size={13} />
                              <span className="text-[9px] font-black uppercase tracking-widest">
                                {isRevision ? 'Modification de produit' : 'Nouveau produit soumis'}
                              </span>
                            </div>

                            <h3 className="text-lg font-black text-slate-950 tracking-tight leading-snug line-clamp-1 group-hover:text-manioco-terracotta transition-colors">{product.name}</h3>
                            {nameChanged && product.parent && (
                              <p className="text-[10px] text-amber-600 font-bold -mt-2">Anciennement : {product.parent.name}</p>
                            )}

                            <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2 h-8">
                              {product.description || "Aucune description de produit renseignée par le vendeur."}
                            </p>
                            {descChanged && (
                              <p className="text-[9px] text-amber-600 font-bold -mt-2">ℹ️ Description mise à jour</p>
                            )}
                          </div>

                          {/* Info details */}
                          <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-slate-700">
                            <div>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Conditionnement</span>
                              <span className="text-xs font-black bg-slate-100 px-2.5 py-1 rounded-lg text-slate-600 block w-max">
                                {product.unit || 'Sac'}
                                {isRevision && product.unit !== product.parent?.unit && product.parent?.unit && (
                                  <span className="text-[9px] text-amber-600 ml-1 font-bold">({product.parent.unit})</span>
                                )}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Quantité stock</span>
                              <span className="text-sm font-black text-slate-950">
                                {product.stock} {product.unit === 'Kg' ? 'Kg' : (product.unit || 'Sac')}
                                {stockChanged && product.parent && (
                                  <span className="text-[10px] text-amber-600 ml-1.5 font-bold">
                                    (Ancien: {product.parent.stock} {product.parent.unit})
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>

                        {/* Actions block */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <button 
                            onClick={() => handleRejectProduct(product)}
                            className="py-3.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 border border-red-100"
                          >
                            <XCircle size={14} />
                            Rejeter
                          </button>
                          <button 
                            onClick={() => handleApprove(product.id, product.name)}
                            className="py-3.5 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white hover:shadow-lg hover:shadow-green-600/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 border border-green-100"
                          >
                            <CheckCircle size={14} />
                            Approuver
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Rejection Modal with premium design */}
      {rejectingProduct && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 border border-slate-100 flex flex-col space-y-6 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight flex items-center gap-2">
                <AlertCircle className="text-red-500 w-5 h-5" />
                Motif de refus
              </h3>
              <button 
                onClick={() => setRejectingProduct(null)} 
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors flex items-center justify-center text-sm font-black"
              >
                &times;
              </button>
            </div>
            
            <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100/50">
              <p className="text-xs text-red-800 leading-relaxed font-semibold">
                Vous refusez le produit <span className="font-black">"{rejectingProduct.name}"</span>. Veuillez renseigner le motif pour que le vendeur puisse corriger son produit.
              </p>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <textarea
                placeholder="Exemple : Ce produit n'est pas un dérivé du manioc. Afrigari est une plateforme spécialisée dans la vente de Gari et dérivés du manioc uniquement."
                required
                className="w-full min-h-[140px] p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-manioco-terracotta/20 focus:border-manioco-terracotta transition-all text-xs font-semibold leading-relaxed"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingProduct(null)}
                  className="px-6 py-3.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRejection || !rejectionReason.trim()}
                  className="px-6 py-3.5 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all flex items-center gap-2 shadow-lg shadow-red-500/25 disabled:opacity-50"
                >
                  {isSubmittingRejection && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Valider le refus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  function handleRejectProduct(product: Product) {
    setRejectingProduct(product);
  }
}
