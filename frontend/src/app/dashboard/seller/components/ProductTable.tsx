"use client";
import Image from 'next/image';
import { Edit2, Trash2, Package } from 'lucide-react';

interface ProductTableProps {
  products: any[];
  onDelete: (id: string) => void;
  onEdit: (product: any) => void;
}

export default function ProductTable({ products, onDelete, onEdit }: ProductTableProps) {
  const formatPrice = (price: number | string) => {
    const num = typeof price === 'string' ? Number.parseFloat(price) : price;
    return new Intl.NumberFormat('fr-FR').format(num) + " FCFA";
  };

  const getStatus = (stock: number) => {
    if (stock <= 0) return { label: 'Epuisé', class: 'bg-red-50 text-red-600' };
    if (stock <= 5) return { label: 'Stock faible', class: 'bg-manioco-terracotta-50 text-manioco-terracotta' };
    return { label: 'En ligne', class: 'bg-green-50 text-green-600' };
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden animate-in fade-in duration-500">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produit</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Catégorie</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Prix</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Stock</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Statut</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {products.map((product) => {
              const status = getStatus(product.stock);
              return (
                <tr key={product.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-5">
                      <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
                        {product.image || product.profilePhoto ? (
                          <Image 
                            src={product.image || product.profilePhoto || "https://via.placeholder.com/150"} 
                            alt={product.name} 
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                            sizes="56px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                             <Package size={24} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 mb-1">{product.name}</p>
                        <p className="text-[9px] font-black text-slate-400 tracking-tighter uppercase">ID: {product.id.split('-')[0]}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-[10px] font-black text-slate-600 px-3 py-1.5 bg-slate-100 rounded-xl uppercase tracking-tight">
                      {product.category?.name || "Sans catégorie"}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm font-black text-slate-900">{formatPrice(product.price)}</span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-sm font-black ${product.stock === 0 ? "text-red-500" : "text-slate-700"}`}>
                        {product.stock} <span className="text-[10px] font-bold text-slate-400">{product.unit || 'Sac'}</span>
                      </span>
                      <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                         <div 
                           className={`h-full rounded-full ${product.stock === 0 ? "bg-red-500" : "bg-manioco-terracotta"}`} 
                           style={{ width: `${Math.min(product.stock * 4, 100)}%` }}
                         ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${status.class}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => onEdit(product)}
                        className="p-2.5 text-slate-400 hover:text-manioco-terracotta hover:bg-manioco-terracotta-50 rounded-xl transition-all shadow-sm bg-white border border-slate-100"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => onDelete(product.id)}
                        className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm bg-white border border-slate-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
