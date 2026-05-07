"use client";
import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';
import { 
  Layers, 
  Plus, 
  Search, 
  Loader2,
  Trash2,
  Tag,
  ShoppingBag,
  Edit2,
  Check
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import api from '@/lib/axios';
import Link from 'next/link';

export default function SellerCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStore, setHasStore] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [categoryToEdit, setCategoryToEdit] = useState<any | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const initialize = async () => {
      const currentUserId = user?.id || (user as any)?.userId;
      if (!currentUserId) return;

      try {
        const storesResponse = await api.get('/stores');
        const myStore = storesResponse.data.find((s: any) => s.ownerId === currentUserId);
        
        if (myStore) {
          setHasStore(true);
          setStoreId(myStore.id);
          const response = await api.get(`/product-categories?storeId=${myStore.id}`);
          setCategories(response.data);
        } else {
          setHasStore(false);
        }
      } catch (error) {
        console.error("Error fetching categories");
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, [user]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsSubmitting(true);
    try {
      if (categoryToEdit) {
        const response = await api.patch(`/product-categories/${categoryToEdit.id}`, { name: newCategoryName });
        setCategories(categories.map(c => c.id === categoryToEdit.id ? response.data : c));
        setToastMessage("Catégorie mise à jour !");
      } else {
        const response = await api.post('/product-categories', { name: newCategoryName });
        setCategories([response.data, ...categories]);
        setToastMessage("Catégorie créée avec succès !");
      }
      setNewCategoryName("");
      setCategoryToEdit(null);
      setIsAddModalOpen(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      alert("Erreur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (category: any) => {
    setCategoryToEdit(category);
    setNewCategoryName(category.name);
    setIsAddModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Voulez-vous vraiment supprimer cette catégorie ?")) {
      try {
        await api.delete(`/product-categories/${id}`);
        setCategories(categories.filter(c => c.id !== id));
        setToastMessage("Catégorie supprimée avec succès !");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } catch (error: any) {
        alert(error.response?.data?.message || "Erreur lors de la suppression");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex bg-slate-50 min-h-screen">
        <Sidebar mode="seller" />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar mode="seller" />
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-white/80 backdrop-blur-xl border border-emerald-500/20 shadow-2xl shadow-emerald-500/10 px-6 py-4 rounded-[2rem] flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
              <Check size={18} strokeWidth={3} />
            </div>
            <p className="text-sm font-black text-slate-900">{toastMessage}</p>
          </div>
        </div>
      )}
      
      <main className="flex-1 ml-64">
        <TopNav title="Mes Catégories" isAdmin={false} />
        
        <div className="p-8">
          {!hasStore ? (
            <div className="h-[calc(100vh-140px)] flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm p-12 text-center">
               <ShoppingBag size={48} className="text-orange-500 mb-6" />
               <h2 className="text-2xl font-black text-slate-900 mb-2">Boutique requise</h2>
               <p className="text-slate-500 mb-8 max-w-sm">Vous devez créer votre boutique avant de pouvoir gérer vos catégories personnalisées.</p>
               <Link href="/dashboard/seller/settings/store" className="px-6 py-3 bg-orange-500 text-white rounded-2xl font-bold">Créer ma boutique</Link>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-8">
                <div className="relative max-w-md w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Rechercher une catégorie..." 
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-2xl text-sm font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
                >
                  <Plus size={18} />
                  Nouvelle catégorie
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map((category) => (
                  <div key={category.id} className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${!category.storeId ? 'bg-slate-50 text-slate-400' : 'bg-orange-50 text-orange-500'}`}>
                        <Tag size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-black text-slate-900 truncate">{category.name}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          {category.storeId ? 'Ma catégorie' : 'Catégorie Afrigari'}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-1 mt-2 pt-3 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                      {category.storeId ? (
                        <>
                          <button 
                            onClick={() => handleEdit(category)}
                            className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                            title="Modifier"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(category.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      ) : (
                        <span className="text-[9px] font-black text-slate-300 bg-slate-50 px-2 py-1 rounded-lg uppercase">Système</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {categories.length === 0 && (
                <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-200/60 mt-8">
                  <Layers size={48} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-400 font-medium">Vous n'avez pas encore de catégories personnalisées.</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modal Ajout */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-900">{categoryToEdit ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{categoryToEdit ? `ID: ${categoryToEdit.id}` : 'Créez un segment pour vos produits'}</p>
            </div>
            <form onSubmit={handleAddCategory} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nom de la catégorie</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  placeholder="Ex: Épices du terroir, Chaussures..."
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-orange-500/10 focus:bg-white transition-all text-sm font-bold"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
              </div>
              <div className="flex gap-4">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setCategoryToEdit(null);
                    setNewCategoryName("");
                  }}
                  className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] py-4 bg-orange-500 text-white rounded-2xl text-sm font-black hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (categoryToEdit ? "Mettre à jour" : "Créer")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
