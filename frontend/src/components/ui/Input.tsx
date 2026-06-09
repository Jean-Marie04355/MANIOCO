import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ElementType;
  className?: string;
  iconClassName?: string;
}

export function Input({ icon: Icon, className, iconClassName, ...props }: InputProps) {
  return (
    <div className="relative group">
      <Icon 
        size={20} 
        className={`absolute left-6 top-1/2 -translate-y-1/2 text-manioco-brown/20 group-focus-within:text-manioco-terracotta transition-all ${iconClassName || ''}`} 
      />
      <input 
        {...props} 
        className={`w-full bg-slate-50/80 backdrop-blur border-2 border-transparent rounded-[24px] py-5 pl-16 pr-8 text-sm font-bold outline-none focus:bg-white focus:ring-8 focus:ring-manioco-terracotta/5 transition-all shadow-sm ${className || ''}`} 
      />
    </div>
  );
}
