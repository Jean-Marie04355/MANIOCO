"use client";
import { 
    Clock, 
    ShieldAlert, 
    MessageSquare, 
    CheckCircle2, 
    ChevronRight, 
    AlertCircle, 
    Search,
    Filter,
    UserCheck,
    BellRing
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';

export default function AdminTasksPage() {
    const tasks = [
        {
            id: 1,
            type: "KYC",
            title: "Vérification d'identité - Jean Dupont",
            description: "Le vendeur Jean Dupont a soumis son dossier complet (CNI + Selfie).",
            status: "Urgent",
            time: "Il y a 15 min",
            color: "amber"
        },
        {
            id: 2,
            type: "SECURITY",
            title: "Tentative d'accès suspecte",
            description: "Connexion détectée depuis une IP inhabituelle sur le compte Admin #04.",
            status: "Critique",
            time: "Il y a 1h",
            color: "rose"
        },
        {
            id: 3,
            type: "SUPPORT",
            title: "Demande d'assistance - Boutique 'Samba Style'",
            description: "Le vendeur ne parvient pas à configurer ses frais de livraison.",
            status: "Normal",
            time: "Il y a 3h",
            color: "blue"
        },
        {
            id: 4,
            type: "KYC",
            title: "Correction reçue - Marie Kouadio",
            description: "Documents corrigés suite au rejet du selfie (flou). À ré-examiner.",
            status: "Urgent",
            time: "Il y a 5h",
            color: "amber"
        },
        {
            id: 5,
            type: "SUPPORT",
            title: "Question facturation - Client Alpha",
            description: "Demande d'information sur le remboursement de la commande #AF-902.",
            status: "Normal",
            time: "Hier",
            color: "blue"
        }
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Sidebar mode="admin" />
            <div className="lg:pl-72 flex flex-col min-h-screen">
                <TopNav title="Centre de Tâches" isAdmin={true} />
                
                <main className="p-8 space-y-10">
                    
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                                Tâches en <span className="text-orange-500">attente</span>
                            </h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                                Gérer les flux de travail et les urgences administratives
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="bg-white p-2 rounded-2xl border border-slate-200 flex items-center gap-2 shadow-sm">
                                <Search size={16} className="text-slate-400 ml-2" />
                                <input type="text" placeholder="Rechercher une tâche..." className="bg-transparent border-none focus:outline-none text-sm font-medium pr-4 py-2 w-48" />
                            </div>
                            <button className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl shadow-slate-200 hover:scale-105 transition-all">
                                <Filter size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <TaskStatCard icon={<UserCheck className="text-amber-500" />} label="Dossiers KYC" count={12} color="amber" />
                        <TaskStatCard icon={<ShieldAlert className="text-rose-500" />} label="Alertes Sécurité" count={3} color="rose" />
                        <TaskStatCard icon={<MessageSquare className="text-blue-500" />} label="Tickets Support" count={8} color="blue" />
                    </div>

                    {/* Task List */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-6 pb-2 border-b border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description de la tâche</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status / Temps</span>
                        </div>
                        
                        {tasks.map((task) => (
                            <div key={task.id} className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-start gap-6">
                                    <div className={`w-14 h-14 rounded-3xl flex items-center justify-center border-2 transition-all group-hover:scale-110 ${
                                        task.color === 'amber' ? 'bg-amber-50 border-amber-100 text-amber-500' :
                                        task.color === 'rose' ? 'bg-rose-50 border-rose-100 text-rose-500' :
                                        'bg-blue-50 border-blue-100 text-blue-500'
                                    }`}>
                                        {task.type === 'KYC' && <Clock size={24} />}
                                        {task.type === 'SECURITY' && <ShieldAlert size={24} />}
                                        {task.type === 'SUPPORT' && <MessageSquare size={24} />}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-800 text-lg tracking-tight group-hover:text-orange-500 transition-colors uppercase italic">{task.title}</h3>
                                        <p className="text-sm text-slate-400 font-medium leading-relaxed mt-1 max-w-xl">{task.description}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-10">
                                    <div className="text-right">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                            task.status === 'Critique' ? 'bg-rose-500 text-white' :
                                            task.status === 'Urgent' ? 'bg-amber-500 text-white' :
                                            'bg-blue-500 text-white'
                                        }`}>
                                            {task.status}
                                        </span>
                                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mt-2">{task.time}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-inner">
                                        <ChevronRight size={20} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer / Load More */}
                    <div className="pt-6 flex justify-center">
                        <button className="flex items-center gap-3 px-8 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all active:scale-95">
                            <Clock size={14} /> Charger plus de tâches
                        </button>
                    </div>

                </main>
            </div>
        </div>
    );
}

function TaskStatCard({ icon, label, count, color }: any) {
    const colorClasses = {
        amber: "bg-amber-50/50 shadow-amber-100",
        rose: "bg-rose-50/50 shadow-rose-100",
        blue: "bg-blue-50/50 shadow-blue-100"
    };

    return (
        <div className={`p-8 rounded-[3rem] border border-white shadow-xl flex flex-col items-center gap-4 group hover:scale-[1.02] transition-all cursor-default ${colorClasses[color as keyof typeof colorClasses]}`}>
            <div className="w-16 h-16 bg-white rounded-3xl shadow-lg flex items-center justify-center transition-transform group-hover:rotate-12">
                {icon}
            </div>
            <div className="text-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</span>
                <p className="text-4xl font-black italic text-slate-900 tracking-tighter mt-1">{count}</p>
            </div>
        </div>
    );
}
