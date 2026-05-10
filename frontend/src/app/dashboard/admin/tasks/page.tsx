"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
    Clock, 
    ShieldAlert, 
    MessageSquare, 
    ChevronRight, 
    Search,
    Filter,
    UserCheck,
    Loader2,
    CheckCircle2
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';
import api from '@/lib/axios';

export default function AdminTasksPage() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const [usersRes, ticketsRes] = await Promise.all([
                    api.get('/users'),
                    api.get('/support/tickets/all')
                ]);

                const newTasks: any[] = [];

                // KYC Tasks
                const pendingKyc = usersRes.data.filter((u: any) => u.kycStatus === 'PENDING');
                pendingKyc.forEach((user: any) => {
                    newTasks.push({
                        id: `kyc-${user.id}`,
                        type: "KYC",
                        title: `Vérification d'identité - ${user.name || user.email}`,
                        description: `Le marchand a soumis son dossier KYC (Pièces d'identité, informations). Action requise pour l'approbation.`,
                        status: "Urgent",
                        time: new Date(user.createdAt).toLocaleDateString('fr-FR'),
                        color: "amber",
                        link: `/dashboard/admin/users`
                    });
                });

                // Support Tickets Tasks
                const openTickets = ticketsRes.data.filter((t: any) => t.status === 'OPEN' || t.status === 'IN_PROGRESS');
                openTickets.forEach((ticket: any) => {
                    newTasks.push({
                        id: `ticket-${ticket.id}`,
                        type: "SUPPORT",
                        title: `Demande d'assistance - ${ticket.seller?.name || 'Vendeur'}`,
                        description: `Sujet : ${ticket.subject} (${ticket.category}). Un retour est attendu du support.`,
                        status: ticket.status === 'OPEN' ? "Urgent" : "Normal",
                        time: new Date(ticket.createdAt).toLocaleDateString('fr-FR'),
                        color: "blue",
                        link: `/dashboard/admin/support/${ticket.id}`
                    });
                });

                // Sort tasks: Urgent first, then by date
                newTasks.sort((a, b) => {
                    if (a.status === 'Urgent' && b.status !== 'Urgent') return -1;
                    if (a.status !== 'Urgent' && b.status === 'Urgent') return 1;
                    return 0; // Kept simple for now
                });

                setTasks(newTasks);
            } catch {
                console.error("Erreur lors du chargement des tâches admin");
            } finally {
                setIsLoading(false);
            }
        };

        fetchTasks();
    }, []);

    const kycCount = tasks.filter(t => t.type === 'KYC').length;
    const supportCount = tasks.filter(t => t.type === 'SUPPORT').length;
    const securityCount = tasks.filter(t => t.type === 'SECURITY').length;

    if (isLoading) {
        return (
            <div className="flex bg-[#F8FAFC] min-h-screen">
                <Sidebar mode="admin" />
                <main className="flex-1 ml-64 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Sidebar mode="admin" />
            <div className="lg:pl-64 flex flex-col min-h-screen">
                <TopNav title="Centre de Tâches" isAdmin={true} />
                
                <main className="p-8 space-y-10">
                    
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                                Tâches en <span className="text-emerald-500">attente</span>
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
                        <TaskStatCard icon={<UserCheck className="text-amber-500" />} label="Dossiers KYC" count={kycCount} color="amber" />
                        <TaskStatCard icon={<ShieldAlert className="text-rose-500" />} label="Alertes Sécurité" count={securityCount} color="rose" />
                        <TaskStatCard icon={<MessageSquare className="text-blue-500" />} label="Tickets Support" count={supportCount} color="blue" />
                    </div>

                    {/* Task List */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-6 pb-2 border-b border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description de la tâche</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status / Temps</span>
                        </div>
                        
                        {tasks.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                                <CheckCircle2 size={48} className="mx-auto text-emerald-500 opacity-50 mb-4" />
                                <h3 className="font-bold text-slate-800 text-lg">Aucune tâche en attente !</h3>
                                <p className="text-slate-400 text-sm mt-1">Excellent travail, la plateforme est à jour.</p>
                            </div>
                        ) : tasks.map((task) => (
                            <Link 
                                href={task.link}
                                key={task.id} 
                                className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
                            >
                                <div className="flex items-start gap-6">
                                    <div className={`w-14 h-14 rounded-3xl flex items-center justify-center border-2 transition-all group-hover:scale-110 ${getTaskColorStyles(task.color)}`}>
                                        <TaskIcon type={task.type} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-800 text-lg tracking-tight group-hover:text-emerald-500 transition-colors uppercase italic">{task.title}</h3>
                                        <p className="text-sm text-slate-400 font-medium leading-relaxed mt-1 max-w-xl">{task.description}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-10">
                                    <div className="text-right">
                                        <TaskStatusBadge status={task.status} />
                                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mt-2">{task.time}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-inner">
                                        <ChevronRight size={20} />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                </main>
            </div>
        </div>
    );
}

function getTaskColorStyles(color: string) {
    switch (color) {
        case 'amber': return 'bg-amber-50 border-amber-100 text-amber-500';
        case 'rose': return 'bg-rose-50 border-rose-100 text-rose-500';
        default: return 'bg-blue-50 border-blue-100 text-blue-500';
    }
}

function TaskIcon({ type }: { readonly type: string }) {
    switch (type) {
        case 'KYC': return <Clock size={24} />;
        case 'SECURITY': return <ShieldAlert size={24} />;
        case 'SUPPORT': return <MessageSquare size={24} />;
        default: return null;
    }
}

function TaskStatusBadge({ status }: { readonly status: string }) {
    let classes = 'bg-blue-500 text-white';
    if (status === 'Critique') classes = 'bg-rose-500 text-white';
    if (status === 'Urgent') classes = 'bg-amber-500 text-white';
    
    return (
        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${classes}`}>
            {status}
        </span>
    );
}

function TaskStatCard({ icon, label, count, color }: { readonly icon: React.ReactNode, readonly label: string, readonly count: number, readonly color: string }) {
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


