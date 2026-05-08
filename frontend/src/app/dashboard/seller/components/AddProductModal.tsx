"use client";
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { X, Package, Image as ImageIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (product: any) => void;
  storeId: string;
  productToEdit?: any; // Si présent, on est en mode édition
}

interface Category {
  id: string;
  name: string;
}

const UNIT_FACTORS: Record<string, number> = {
  'Sac': 50,
  'Demi-sac': 25,
  'Kg': 1,
  'Demi-kg': 0.5
};

export default function ProductModal({ isOpen, onClose, onSuccess, storeId, productToEdit }: ProductModalProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    price: '',
    stock: 1,
    unit: 'Sac',
    description: ''
  });

  const [prevUnit, setPrevUnit] = useState('Sac');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens or productToEdit changes
  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        setFormData({
          name: productToEdit.name,
          categoryId: productToEdit.categoryId || (productToEdit.category?.id || ''),
          price: productToEdit.price.toString(),
          stock: productToEdit.stock,
          unit: productToEdit.unit || 'Sac',
          description: productToEdit.description || ''
        });
        setPrevUnit(productToEdit.unit || 'Sac');
        setImagePreview(productToEdit.image || productToEdit.profilePhoto || null);
      } else {
        const initialUnit = 'Sac';
        setFormData({ name: '', categoryId: categories[0]?.id || '', price: '', stock: 1, unit: initialUnit, description: '' });
        setPrevUnit(initialUnit);
        setImagePreview(null);
      }
    }
  }, [isOpen, productToEdit, categories]);

  // Fetch categories when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchCategories = async () => {
        try {
          const response = await api.get(`/product-categories?storeId=${storeId}`);
          setCategories(response.data);
          if (!productToEdit && response.data.length > 0) {
            setFormData(prev => ({ ...prev, categoryId: response.data[0].id }));
          }
        } catch (error) {
          console.error("Erreur catégories");
        } finally {
          setIsLoadingCategories(false);
        }
      };
      fetchCategories();
    }
  }, [isOpen, storeId, productToEdit]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUnitChange = (newUnit: string) => {
    const oldUnit = formData.unit;
    if (oldUnit === newUnit) return;

    const oldFactor = UNIT_FACTORS[oldUnit] || 1;
    const newFactor = UNIT_FACTORS[newUnit] || 1;

    const priceNum = Number.parseFloat(formData.price);
    if (!Number.isNaN(priceNum) && priceNum > 0) {
      // Calculate new price based on the ratio of the new factor to the old factor
      const newPrice = priceNum * (newFactor / oldFactor);
      // Calculate new stock based on the ratio of the old factor to the new factor
      const newStock = formData.stock * (oldFactor / newFactor);
      
      setFormData(prev => ({
        ...prev,
        unit: newUnit,
        price: newPrice.toString(),
        stock: newStock
      }));
    } else {
      setFormData(prev => ({ ...prev, unit: newUnit }));
    }
    setPrevUnit(newUnit);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.categoryId || !imagePreview) {
      alert("Veuillez remplir tous les champs obligatoires, y compris l'image du produit.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        price: Number(formData.price),
        stock: Number(formData.stock),
        unit: formData.unit,
        description: formData.description,
        categoryId: formData.categoryId,
        storeId: storeId,
        image: imagePreview,
      };

      let response;
      if (productToEdit) {
        response = await api.patch(`/products/${productToEdit.id}`, payload);
      } else {
        response = await api.post('/products', payload);
      }
      
      onSuccess(response.data);
      onClose();
    } catch (error: any) {
      console.error("Erreur produit");
      alert(error.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
        <div className="flex justify-between items-center p-8 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-900">{productToEdit ? 'Modifier le produit' : 'Ajouter un produit'}</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
              {productToEdit ? `ID: ${productToEdit.id}` : 'Nouveau produit dans votre catalogue'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white hover:shadow-sm rounded-full text-slate-400 transition-all"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-10 overflow-y-auto max-h-[70vh] custom-scrollbar">
          <form id="product-form" onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label htmlFor="productName" className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  Nom du produit <span className="text-red-500">*</span>
                </label>
                <input 
                  id="productName"
                  type="text" 
                  required
                  placeholder="Ex: iPhone 15 Pro Max" 
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-orange-500/10 focus:bg-white transition-all text-sm font-bold shadow-inner"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label htmlFor="productCategory" className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  Catégorie <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  {categories.length > 0 ? (
                    <>
                      <select 
                        id="productCategory"
                        required
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-orange-500/10 focus:bg-white transition-all text-sm font-bold shadow-inner appearance-none disabled:opacity-50"
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        disabled={isLoadingCategories}
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                         <X size={14} className="text-slate-300 rotate-45" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2">
                       <div className="px-5 py-4 bg-orange-50 text-orange-600 rounded-2xl text-xs font-bold border border-orange-100">
                         Aucune catégorie trouvée.
                       </div>
                       <Link 
                         href="/dashboard/seller/categories"
                         className="text-[10px] font-black text-orange-500 uppercase tracking-widest hover:underline px-2"
                       >
                         + Créer ma première catégorie
                       </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label htmlFor="productPrice" className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  Prix (FCFA) <span className="text-red-500">*</span>
                </label>
                <input 
                  id="productPrice"
                  type="number" 
                  required
                  placeholder="0" 
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-orange-500/10 focus:bg-white transition-all text-sm font-bold shadow-inner"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label htmlFor="productStock" className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  Stock disponible <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-4 py-3.5 shadow-inner">
                  <input 
                    id="productStock"
                    type="number" 
                    min="0"
                    step="0.01"
                    required
                    className="w-full bg-transparent border-none outline-none text-sm font-bold"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                  />
                  <div className="h-6 w-px bg-slate-200 shrink-0"></div>
                  <select
                    value={formData.unit}
                    onChange={(e) => handleUnitChange(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs font-black text-orange-500 uppercase tracking-widest cursor-pointer shrink-0"
                  >
                    <option value="Sac">Sac (50 kg)</option>
                    <option value="Demi-sac">Demi-sac (25 kg)</option>
                    <option value="Kg">Kg</option>
                    <option value="Demi-kg">Demi-kg (0.5 kg)</option>
                  </select>
                </div>
                <div className="px-2 space-y-1">
                  {formData.price && !Number.isNaN(Number.parseFloat(formData.price)) && (
                    <p className="text-[10px] text-slate-400 font-bold">
                      ℹ️ Prix équivalent : {(Number.parseFloat(formData.price) / (UNIT_FACTORS[formData.unit] || 1)).toFixed(0)} FCFA le Kg
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="productDescription" className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Description détaillée</label>
              <textarea 
                id="productDescription"
                rows={4} 
                placeholder="Décrivez votre produit..."
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-orange-500/10 focus:bg-white transition-all text-sm font-bold shadow-inner resize-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              ></textarea>
            </div>

            <div className="space-y-3">
              <label htmlFor="productImage" className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                Image du produit <span className="text-red-500">*</span>
              </label>
              <div className="w-40">
                <input 
                  id="productImage"
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
                
                {imagePreview ? (
                  <div 
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerFileInput(); } }}
                    className="relative aspect-square rounded-[2rem] overflow-hidden border-2 border-orange-100 group cursor-pointer" 
                    onClick={triggerFileInput}
                  >
                    <Image src={imagePreview} alt="Aperçu du produit" fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <p className="text-[10px] text-white font-black uppercase tracking-widest">Changer</p>
                    </div>
                  </div>
                ) : (
                  <div 
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerFileInput(); } }}
                    onClick={triggerFileInput}
                    className="aspect-square bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-orange-50 hover:border-orange-200 transition-all group shadow-inner"
                  >
                    <ImageIcon className="text-slate-300 group-hover:text-orange-400 mb-2" size={32} />
                    <span className="text-[10px] font-black text-slate-400 group-hover:text-orange-500 uppercase tracking-widest">Ajouter</span>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        <div className="p-8 border-t border-slate-100 flex gap-4 bg-slate-50/30">
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-4 text-xs font-black text-slate-400 hover:text-slate-600 transition-all uppercase tracking-widest disabled:opacity-50"
          >
            Annuler
          </button>
          <button 
            type="submit"
            form="product-form"
            disabled={isSubmitting || (categories.length === 0 && !productToEdit)}
            className="flex-[2] py-4 bg-orange-500 text-white rounded-2xl text-sm font-black hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Enregistrement...
              </>
            ) : (
              productToEdit ? "Mettre à jour" : "Enregistrer le produit"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
