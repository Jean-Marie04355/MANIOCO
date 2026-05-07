"use client";
import { useState, useEffect } from 'react';
import { 
    ShieldCheck, 
    Upload, 
    FileText, 
    User, 
    AlertCircle, 
    CheckCircle2, 
    Clock, 
    ArrowRight,
    Camera,
    Info,
    Loader2,
    ShieldAlert
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import api from '@/lib/axios';
import Link from 'next/link';

export default function SellerVerificationPage() {
    const { user, fetchUser } = useAuth();
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        dob: '',
        nationality: '',
        phoneNumber: '',
    });
    const [files, setFiles] = useState<{ [key: string]: string | null }>({
        idCardFront: null,
        idCardBack: null,
        sellerSelfie: null,
    });

    const [started, setStarted] = useState(false);

    // Initialisation des données si déjà présentes (utile pour les corrections)
    useEffect(() => {
        if (user) {
            setFormData({
                dob: user.dob || '',
                nationality: user.nationality || '',
                phoneNumber: user.phoneNumber || '',
            });
        }
    }, [user]);

    // Parse rejection reasons if any
    const rejectionReasons = user?.kycRejectionReasons ? JSON.parse(user.kycRejectionReasons) : {};

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFiles(prev => ({ ...prev, [field]: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await api.patch(`/users/${user?.id}/kyc/submit`, {
                ...formData,
                ...files
            });
            alert("✅ Dossier envoyé avec succès !");
            setTimeout(async () => {
                await fetchUser();
            }, 500);
        } catch (error: any) {
            console.error("Erreur soumission KYC:");
            const msg = error.response?.data?.message || "Une erreur est survenue lors de l'envoi.";
            alert(`❌ Erreur : ${msg}`);
        } finally {
            setSubmitting(false);
        }
    };

    // --- ÉCRANS D'ÉTAT (HUB) ---

    if (user?.kycStatus === 'APPROVED' || user?.isVerified) {
        return (
            <StatusView 
                icon={<CheckCircle2 className="text-emerald-500" size={64} />}
                title="Compte validé avec succès !"
                message="Félicitations ! Votre identité a été confirmée. Vous faites désormais partie de la communauté des marchands Afrigari."
                badge="Vérifié"
                actionLabel="Veuillez continuer"
                onAction={() => window.location.href = '/dashboard/seller/onboarding'}
            />
        );
    }

    if (user?.kycStatus === 'PENDING') {
        return (
            <StatusView 
                icon={<Clock className="text-amber-500" size={64} />}
                title="Validation en attente"
                message="Vos documents sont en cours d'examen par notre équipe de sécurité. Cette opération prend généralement moins de 24h."
                badge="Analyse en cours"
                actionLabel="Vérification en cours..."
                disabledAction={true}
            />
        );
    }

    if (user?.kycStatus === 'REJECTED' && !started) {
        return (
            <StatusView 
                icon={<ShieldAlert className="text-rose-500" size={64} />}
                title="Validation en attente"
                message="Votre dossier n'a pas pu être validé. Veuillez consulter les motifs de rejet et renvoyer les documents nécessaires."
                badge="Dossier à corriger"
                rejectionReasons={rejectionReasons}
                actionLabel="Modifier mon dossier"
                onAction={() => setStarted(true)}
            />
        );
    }

    if (user?.kycStatus === 'NOT_SUBMITTED' && !started) {
        return (
            <StatusView 
                icon={<ShieldCheck className="text-emerald-500" size={64} />}
                title="Validation en attente"
                message="Avant de pouvoir vendre sur Afrigari, vous devez soumettre vos pièces d'identité pour validation administrative."
                badge="Action Requise"
                actionLabel="Démarrer ma vérification"
                onAction={() => setStarted(true)}
            />
        );
    }

    // --- FORMULAIRE DE SOUMISSION ---

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8">
            <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Information Side */}
                <div className="lg:col-span-5 space-y-8 py-8">
                    <div>
                        <Link href="/dashboard/seller" className="text-orange-500 font-black text-2xl tracking-tighter italic">Afrigari</Link>
                        <h1 className="text-3xl font-black text-slate-900 mt-6 tracking-tight leading-tight">Soumission de votre dossier</h1>
                        <p className="text-slate-500 mt-4 font-medium italic text-sm">Remplissez les informations suivantes pour activer votre compte marchand.</p>
                    </div>

                    <div className="space-y-6">
                        <InfoItem icon={<ShieldCheck className="text-emerald-500" />} title="Sécurité" text="Données cryptées aux standards bancaires." />
                        <InfoItem icon={<FileText className="text-blue-500" />} title="Confiance" text="Vendez en toute sérénité sur la plateforme." />
                    </div>

                    {user?.kycStatus === 'REJECTED' && (
                        <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem] space-y-3">
                            <div className="flex items-center gap-2 text-rose-600 font-black text-xs uppercase tracking-widest">
                                <AlertCircle size={16} /> Rectifications demandées
                            </div>
                            <div className="space-y-2">
                                {Object.entries(rejectionReasons).map(([field, reason]: [any, any]) => (
                                    <p key={field} className="text-[10px] text-rose-500 font-bold leading-relaxed italic">• {reason}</p>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Form Side */}
                <div className="lg:col-span-7 bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 p-8 md:p-10 border border-slate-100 relative">
                    
                    {step === 1 ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Étape 01/02</span>
                                <h3 className="text-lg font-black text-slate-800 uppercase italic">Profil</h3>
                            </div>

                            <div className="space-y-6">
                                <InputField label="Date de naissance" value={formData.dob} onChange={(v: string) => setFormData({...formData, dob: v})} type="date" error={rejectionReasons.dob} />
                                <InputField label="Nationalité" value={formData.nationality} onChange={(v: string) => setFormData({...formData, nationality: v})} placeholder="Ex: Béninoise" error={rejectionReasons.nationality} />
                                <InputField label="Téléphone" value={formData.phoneNumber} onChange={(v: string) => setFormData({...formData, phoneNumber: v})} placeholder="+229 ..." error={rejectionReasons.phoneNumber} />
                            </div>

                            <button onClick={() => setStep(2)} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 hover:scale-[1.02] transition-all">
                                Continuer <ArrowRight size={18} />
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex justify-between items-center">
                                <button onClick={() => setStep(1)} className="text-[10px] font-black uppercase tracking-widest text-slate-400">← Retour</button>
                                <h3 className="text-lg font-black text-slate-800 uppercase italic">Documents</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FileLoader label="CNI Recto" field="idCardFront" value={files.idCardFront} onUpload={handleFileUpload} error={rejectionReasons.idCardFront} />
                                <FileLoader label="CNI Verso" field="idCardBack" value={files.idCardBack} onUpload={handleFileUpload} error={rejectionReasons.idCardBack} />
                                <FileLoader label="Selfie Vendeur" field="sellerSelfie" value={files.sellerSelfie} onUpload={handleFileUpload} isFull error={rejectionReasons.sellerSelfie} />
                            </div>

                            <button onClick={handleSubmit} disabled={submitting} className="w-full bg-emerald-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 hover:scale-[1.02] disabled:opacity-50 transition-all">
                                {submitting ? <Loader2 className="animate-spin" /> : "Soumettre le dossier"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatusView({ icon, title, message, badge, showHome, actionLabel, onAction, disabledAction, rejectionReasons }: any) {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-lg w-full p-12 rounded-[3rem] shadow-2xl shadow-slate-200/50 text-center space-y-8 border border-slate-100">
                <div className="flex justify-center">{icon}</div>
                <div>
                    <span className="px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 inline-block">{badge}</span>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">{title}</h2>
                    <p className="text-slate-400 font-medium text-sm mt-4 leading-relaxed italic">{message}</p>
                </div>

                {rejectionReasons && Object.keys(rejectionReasons).length > 0 && (
                    <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-2xl text-left space-y-1">
                        <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Motifs du rejet :</span>
                        {Object.entries(rejectionReasons).map(([field, reason]: [any, any]) => (
                            <p key={field} className="text-xs font-bold text-rose-500 italic">• {reason}</p>
                        ))}
                    </div>
                )}

                {actionLabel && (
                    <button 
                        onClick={onAction}
                        disabled={disabledAction}
                        className={`block w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all shadow-xl ${
                            disabledAction ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-orange-500 text-white hover:scale-[1.02] shadow-orange-100'
                        }`}
                    >
                        {actionLabel}
                    </button>
                )}
                {showHome ? (
                    <Link href="/dashboard/seller" className="block w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:scale-[1.02] shadow-xl shadow-slate-200">
                        Accéder à ma boutique
                    </Link>
                ) : (
                    <Link href="/auth/login" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 mt-4 block">Se déconnecter</Link>
                )}
            </div>
        </div>
    );
}

function InfoItem({ icon, title, text }: any) {
    return (
        <div className="flex gap-4 items-start">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">{icon}</div>
            <div>
                <h4 className="font-black text-slate-800 text-sm italic">{title}</h4>
                <p className="text-xs text-slate-500 font-medium">{text}</p>
            </div>
        </div>
    );
}

function InputField({ label, value, onChange, type = "text", placeholder, error }: any) {
    return (
        <div className="space-y-2 text-left">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-4">{label}</label>
            <input 
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`w-full bg-slate-50 border px-6 py-4 rounded-2xl text-sm font-bold focus:outline-none transition-all ${error ? 'border-rose-300 bg-rose-50 text-rose-600' : 'border-slate-100 bg-slate-50'}`}
            />
            {error && <p className="text-[9px] font-black italic text-rose-500 ml-4 animate-pulse">Rectifier : {error}</p>}
        </div>
    );
}

function FileLoader({ label, field, value, onUpload, isFull, error }: any) {
    return (
        <div className={`space-y-2 text-left ${isFull ? 'md:col-span-2' : ''}`}>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-4">{label}</label>
            <div className={`relative h-40 group cursor-pointer overflow-hidden rounded-[2rem] border-2 border-dashed transition-all ${error ? 'border-rose-300 bg-rose-50' : 'border-slate-100 bg-slate-50 hover:bg-orange-50/20'}`}>
                {value ? (
                    <img src={value} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center space-y-2 text-slate-300">
                        <Upload size={24} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Choisir un fichier</span>
                    </div>
                )}
                <input type="file" accept="image/*" onChange={(e) => onUpload(e, field)} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
            {error && <p className="text-[9px] font-black italic text-rose-500 ml-4 animate-pulse">Rectifier : {error}</p>}
        </div>
    );
}
