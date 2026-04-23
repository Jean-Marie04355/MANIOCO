"use client";
import { useState, useEffect } from 'react';
import { Product } from '@/types/product';
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';
import ProductTable from '../components/ProductTable';
import AddProductModal from '../components/AddProductModal';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Filter,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import api from '@/lib/axios';

import Link from 'next/link';

export default function SellerProducts() {
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasStore, setHasStore] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [productToEdit, setProductToEdit] = useState<any | null>(null);

  useEffect(() => {
    const initializePage = async () => {
      const currentUserId = user?.id || (user as any)?.userId;
      if (!currentUserId) return;

      try {
        // 1. Check if user has a store
        const storesResponse = await api.get('/stores');
        const myStore = storesResponse.data.find((s: any) => s.ownerId === currentUserId);
        
        if (myStore) {
          setHasStore(true);
          setStoreId(myStore.id);
          localStorage.setItem('afrigari_has_store', 'true');
          
          // 2. Fetch real products for this store
          const productsResponse = await api.get(`/products?storeId=${myStore.id}`);
          setProducts(productsResponse.data);
        } else {
          setHasStore(false);
          localStorage.removeItem('afrigari_has_store');
        }
      } catch (error) {
        console.error("Erreur d'initialisation", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializePage();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (typeof window !== 'undefined' && window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      try {
        await api.delete(`/products/${id}`);
        setProducts(products.filter(p => p.id !== id));
      } catch (error) {
        alert("Erreur lors de la suppression du produit");
      }
    }
  };

  const handleAddProductSuccess = (updatedProduct: any) => {
    if (productToEdit) {
      setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    } else {
      setProducts([updatedProduct, ...products]);
    }
    setIsAddModalOpen(false);
    setProductToEdit(null);
  };

  const handleEdit = (product: any) => {
    setProductToEdit(product);
    setIsAddModalOpen(true);
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
      
      <main className="flex-1 ml-64">
        <TopNav title="Mes Produits" isAdmin={true} />
        
        <div className="p-8">
          {!hasStore ? (
            <div className="h-[calc(100vh-140px)] flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm p-12 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-orange-50 rounded-[2rem] flex items-center justify-center mb-8 relative group">
                <div className="absolute inset-0 bg-orange-500 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-all duration-300 -rotate-6"></div>
                <div className="absolute inset-0 bg-orange-100 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-all duration-300 rotate-3"></div>
                <ShoppingBag size={48} className="text-orange-500 relative z-10 group-hover:scale-110 group-hover:text-white transition-all duration-300" />
              </div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Création de boutique requise</h2>
              <p className="text-sm font-medium text-slate-500 max-w-md mx-auto leading-relaxed mb-10">
                Sur Afrigari, tous vos produits doivent appartenir à une boutique. Vous devez d'abord configurer le nom, le logo et les informations de votre magasin avant de pouvoir ajouter des articles à vendre.
              </p>
              <Link 
                href="/dashboard/seller/settings/store"
                className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-orange-500 hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300 flex items-center gap-2"
              >
                Créer ma boutique maintenant
              </Link>
            </div>
          ) : (
            <>
              {/* Header Actions */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher un produit..." 
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
                <Filter size={18} />
                Filtres
              </button>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-2xl text-sm font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/30"
              >
                <Plus size={18} />
                Ajouter un produit
              </button>
            </div>
          </div>

          <ProductTable 
            products={products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))} 
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
          
          {products.length === 0 && (
            <div className="p-20 flex flex-col items-center text-center bg-white rounded-[3rem] mt-8 border border-slate-200/60 shadow-sm animate-in fade-in slide-in-from-bottom-4">
              <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6">
                <ShoppingBag size={48} className="text-slate-200" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Aucun produit trouvé</h3>
              <p className="text-sm text-slate-400 max-w-xs mt-3 font-medium">Commencez par ajouter votre premier produit pour le mettre en ligne sur Afrigari.</p>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="mt-8 px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold hover:bg-orange-500 hover:text-white transition-all"
              >
                Ajouter mon premier produit
              </button>
            </div>
          )}
          </>
          )}
        </div>
      </main>

      {storeId && (
        <AddProductModal 
          isOpen={isAddModalOpen} 
          onClose={() => {
            setIsAddModalOpen(false);
            setProductToEdit(null);
          }} 
          onSuccess={handleAddProductSuccess}
          storeId={storeId}
          productToEdit={productToEdit}
        />
      )}
    </div>
  );
}
