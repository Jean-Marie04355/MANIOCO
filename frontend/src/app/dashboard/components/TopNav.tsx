import { Search, Bell, Mail, ChevronDown } from 'lucide-react';

interface TopNavProps {
  title: string;
  isAdmin: boolean;
}

export default function TopNav({ title, isAdmin }: TopNavProps) {
  return (
    <header className={`h-16 flex items-center justify-between px-8 sticky top-0 z-20 ${
      isAdmin ? 'bg-white border-b border-slate-100' : 'bg-[#151921] border-b border-slate-800'
    }`}>
      <div className="flex items-center gap-4">
        <h1 className={`text-lg font-bold ${isAdmin ? 'text-slate-900' : 'text-white'}`}>{title}</h1>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Rechercher..." 
            className={`pl-10 pr-4 py-2 rounded-xl text-sm border focus:outline-none transition-all ${
              isAdmin 
                ? 'bg-slate-50 border-slate-100 focus:bg-white focus:ring-2 focus:ring-green-500/20' 
                : 'bg-slate-800/50 border-slate-700 text-white focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20'
            }`}
          />
        </div>

        <div className="flex items-center gap-3">
          <button className={`p-2 rounded-xl transition-colors ${isAdmin ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-slate-800 text-slate-400'}`}>
            <Bell size={20} />
          </button>
          <button className={`p-2 rounded-xl transition-colors ${isAdmin ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-slate-800 text-slate-400'}`}>
            <Mail size={20} />
          </button>
          
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>

          <button className="flex items-center gap-2 pr-2">
            <img 
              src={`https://ui-avatars.com/api/?name=${isAdmin ? 'Admin' : 'Super+Admin'}&background=random`} 
              className="w-8 h-8 rounded-lg" 
              alt="Profile" 
            />
            <span className={`text-xs font-bold hidden sm:block ${isAdmin ? 'text-slate-900' : 'text-white'}`}>
              {isAdmin ? 'Admin' : 'Super Admin'}
            </span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>
        </div>
      </div>
    </header>
  );
}
