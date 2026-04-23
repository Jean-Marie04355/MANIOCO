"use client";
import { 
  Eye, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  Truck, 
  XCircle 
} from 'lucide-react';

export interface Order {
  id: string;
  client: string;
  date: string;
  amount: string;
  status: 'En attente' | 'Confirmée' | 'Expédiée' | 'Annulée';
  items: number;
}

interface OrderTableProps {
  orders: Order[];
  onStatusChange: (id: string, newStatus: Order['status']) => void;
}

export default function OrderTable({ orders, onStatusChange }: OrderTableProps) {
  const getStatusStyle = (status: Order['status']) => {
    switch (status) {
      case 'Confirmée':
        return 'bg-green-50 text-green-600 border-green-100';
      case 'En attente':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Expédiée':
        return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'Annulée':
        return 'bg-red-50 text-red-600 border-red-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'Confirmée': return <CheckCircle2 size={14} />;
      case 'En attente': return <Clock size={14} />;
      case 'Expédiée': return <Truck size={14} />;
      case 'Annulée': return <XCircle size={14} />;
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Commande</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Statut</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-8 py-5">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-900">#{order.id}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{order.items} articles</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-[10px] font-black text-orange-600">
                      {order.client.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-sm font-bold text-slate-700">{order.client}</span>
                  </div>
                </td>
                <td className="px-6 py-5 text-sm font-medium text-slate-500">
                  {order.date}
                </td>
                <td className="px-6 py-5 text-sm font-black text-slate-900">
                  {order.amount}
                </td>
                <td className="px-6 py-5">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${getStatusStyle(order.status)}`}>
                    {getStatusIcon(order.status)}
                    {order.status}
                  </div>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all">
                      <Eye size={18} />
                    </button>
                    <div className="relative group/menu">
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                        <MoreVertical size={18} />
                      </button>
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-10 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all scale-95 group-hover/menu:scale-100 origin-top-right">
                        <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Changer statut</p>
                        <button onClick={() => onStatusChange(order.id, 'Confirmée')} className="w-full px-4 py-2 text-left text-xs font-bold text-slate-600 hover:bg-green-50 hover:text-green-600 transition-colors flex items-center gap-2">
                           <CheckCircle2 size={14} /> Confirmer
                        </button>
                        <button onClick={() => onStatusChange(order.id, 'Expédiée')} className="w-full px-4 py-2 text-left text-xs font-bold text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition-colors flex items-center gap-2">
                           <Truck size={14} /> Expédier
                        </button>
                        <button onClick={() => onStatusChange(order.id, 'Annulée')} className="w-full px-4 py-2 text-left text-xs font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-2">
                           <XCircle size={14} /> Annuler
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
