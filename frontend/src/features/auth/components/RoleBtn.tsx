import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

interface RoleBtnProps {
  active: boolean;
  onClick: () => void;
  label: string;
  color: 'forest' | 'gold';
}

export function RoleBtn({ active, onClick, label, color }: RoleBtnProps) {
  return (
    <button 
      type="button" 
      onClick={onClick} 
      className={`flex-1 flex items-center justify-center gap-3 py-4 border-2 rounded-[20px] transition-all ${
        active 
          ? (color === 'forest' 
              ? 'border-forest-green bg-forest-green text-white shadow-xl scale-105' 
              : 'border-afrigari-gold bg-afrigari-gold text-white shadow-xl scale-105') 
          : 'border-slate-50 bg-white text-slate-400'
      }`}
    >
      {active ? <CheckCircle2 size={16} /> : <Circle size={16} />}
      <span className="text-xs font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}
