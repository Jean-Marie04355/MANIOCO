"use client";
import { ShoppingCart, Search, Plus, Star, ArrowRight, Heart, Grid, Package, Wallet, UserCircle, Settings, HelpCircle, ChevronDown, Clock, ShieldCheck, MapPin, Sparkles, Filter, Store, PackageCheck, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ClientDashboardV3() {
  const [scrolled, setScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-organic-cream min-h-screen text-forest-green selection:bg-afrigari-gold selection:text-white font-sans">
      
      {/* 1. Header & Navigation (Afrigari Agro-Alimentaire) */}
      <nav className={`fixed top-0 left-0 right-0 z-[200] transition-all duration-700 px-8 ${scrolled ? 'py-4' : 'py-10'}`}>
         <div className={`max-w-7xl mx-auto flex justify-between items-center px-10 py-5 transition-all duration-500 ${scrolled ? 'glass-premium rounded-full px-12' : ''}`}>
            <div className="flex items-center gap-12">
               <Link href="/dashboard/client" className="flex items-center gap-2 group">
                  <div className="w-8 h-8 rounded-lg bg-forest-green flex items-center justify-center text-white scale-110 group-hover:rotate-12 transition-transform">
                     <PackageCheck size={16} />
                  </div>
                  <span className="font-black text-2xl tracking-tighter uppercase font-display italic">AFRIGARI</span>
               </Link>
               <div className="hidden lg:flex gap-10 text-[10px] font-black uppercase tracking-[0.4em]">
                  <button 
                    onMouseEnter={() => setIsExploreOpen(true)}
                    className="hover:text-afrigari-gold transition-colors underline decoration-2 underline-offset-8 decoration-afrigari-gold flex items-center gap-2"
                  >
                    Explorateur <ChevronDown size={12} />
                  </button>
                  <Link href="/dashboard/client/shops" className="hover:text-afrigari-gold transition-colors">Nos Producteurs</Link>
                  <a href="#" className="hover:text-afrigari-gold transition-colors opacity-40">Authenticité</a>
               </div>
            </div>

            <div className="flex items-center gap-8">
               <div className="flex gap-6 items-center border-r border-forest-green/10 pr-8">
                  <Search size={18} className="cursor-pointer hover:scale-110 transition-transform" />
                  <div className="relative cursor-pointer group">
                    <ShoppingCart size={18} />
                    <span className="absolute -top-2 -right-2 w-4 h-4 bg-forest-green text-white text-[8px] flex items-center justify-center rounded-full font-black">5</span>
                  </div>
               </div>
               <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="w-10 h-10 rounded-full border-2 border-white shadow-xl hover:scale-110 transition-transform overflow-hidden relative">
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100" />
               </button>
            </div>
         </div>

         {/* Mega Menu Explorateur (Variétés & Régions) */}
         {isExploreOpen && (
            <div 
              onMouseLeave={() => setIsExploreOpen(false)}
              className="absolute top-24 left-1/2 -translate-x-1/2 w-full max-w-5xl bg-white/95 backdrop-blur-2xl rounded-[48px] shadow-[0_50px_100px_-20px_rgba(45,70,53,0.15)] p-16 animate-reveal border border-white"
            >
               <div className="grid grid-cols-3 gap-20">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-10">Filières Agricoles</h4>
                    <ul className="space-y-5">
                      <MegaMenuItem label="Manioc (Gari, Tapioca, Farine)" icon={Package} />
                      <MegaMenuItem label="Céréales (Maïs, Mil, Sorgho)" icon={Package} />
                      <MegaMenuItem label="Huiles & Épices" icon={Package} />
                      <MegaMenuItem label="Produits Séchés" icon={Package} />
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-10">Régions d'Origine</h4>
                    <ul className="space-y-5">
                      <MegaMenuItem label="Afrique de l'Ouest" icon={MapPin} />
                      <MegaMenuItem label="Afrique Centrale" icon={MapPin} />
                      <MegaMenuItem label="Afrique de l'Est" icon={MapPin} />
                      <MegaMenuItem label="Maghreb" icon={MapPin} />
                    </ul>
                  </div>
                  <div className="bg-organic-cream rounded-[32px] p-8 flex flex-col justify-between overflow-hidden relative border border-forest-green/5">
                    <div className="relative z-10">
                        <h4 className="font-black text-lg mb-2">Vente en Gros</h4>
                        <p className="text-xs opacity-60">Commandez vos sacs de 50kg directement auprès des coopératives.</p>
                    </div>
                    <button className="relative z-10 text-[10px] font-black uppercase tracking-widest text-afrigari-gold flex items-center gap-1">Voir les tarifs <ArrowRight size={14} /></button>
                    <Package size={100} className="absolute -right-5 -bottom-5 text-forest-green/5" />
                  </div>
               </div>
            </div>
          )}
      </nav>

      <main className="max-w-7xl mx-auto pt-40 px-8">
        
        {/* 2. Hero Section (Afrigari Agro Objective) */}
        <section className="relative grid grid-cols-1 lg:grid-cols-2 gap-16 mb-40 items-center animate-reveal">
           <div className="z-20 order-2 lg:order-1">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-6 h-6 rounded-full bg-forest-green/10 flex items-center justify-center text-forest-green"><ShieldCheck size={12} /></div>
                 <span className="text-xs font-black uppercase tracking-[0.3em]">Qualité Supérieure & Transformation Locale</span>
              </div>
              <h1 className="text-huge text-white absolute top-40 left-0 -translate-x-20 pointer-events-none z-0 hidden lg:block">Organic</h1>
              <h1 className="text-huge text-white absolute top-60 left-0 -translate-x-20 pointer-events-none z-0 hidden lg:block">Africa</h1>
              
              <div className="relative z-10 space-y-8">
                 <h2 className="text-8xl font-black leading-[0.9] tracking-tighter text-white drop-shadow-2xl lg:text-forest-green lg:drop-shadow-none">Gari Élite. <br/> <span className="text-white lg:text-slate-200 lg:bg-forest-green/5 lg:px-4">Naturellement Pur.</span></h2>
                 <p className="text-sm font-bold text-forest-green/60 max-w-sm leading-relaxed">Découvrez des produits transformés avec soin : du Gari extra-fin au Tapioca croquant, directement issus des meilleures coopératives du continent.</p>
                 <button className="bg-forest-green text-white px-12 py-5 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-2xl flex items-center gap-3">
                    Voir les Arrivages <ArrowRight size={18} />
                 </button>
              </div>
           </div>
           
           <div className="relative order-1 lg:order-2">
              <div className="relative w-full aspect-square rounded-[64px] overflow-hidden shadow-[0_50px_100px_-20px_rgba(45,70,53,0.3)]">
                 <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=1000" className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-gradient-to-t from-forest-green/20 to-transparent"></div>
              </div>
              
              <div className="absolute -bottom-10 -left-10 glass-premium p-6 rounded-[42px] flex items-center gap-5 shadow-2xl animate-slow-bounce border border-white">
                 <div className="w-16 h-16 rounded-3xl bg-amber-100 flex items-center justify-center text-3xl">🌽</div>
                 <div>
                    <h4 className="font-black text-sm">Farine de Maïs Blanche</h4>
                    <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-1">Sachet de 5Kg • Bénin</p>
                 </div>
                 <button className="bg-forest-green text-white w-8 h-8 rounded-full flex items-center justify-center ml-4 shadow-lg"><Plus size={14} /></button>
              </div>
           </div>
        </section>

        {/* 3. Steps Infrastructure (Afrigari Agro Workflow) */}
        <section className="mb-40">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StepItem num="01" label="Précisez votre Région" />
              <div className="h-px bg-forest-green/5 self-center hidden md:block"></div>
              <StepItem num="02" label="Choisissez vos Produits" />
              <div className="h-px bg-forest-green/5 self-center hidden md:block"></div>
              <StepItem num="03" label="Contrôle de Traçabilité" active={true} />
              <div className="h-px bg-forest-green/5 self-center hidden md:block"></div>
              <StepItem num="04" label="Livraison à Domicile" />
           </div>
        </section>

        {/* 4. Products Grid with REAL Agro Specs */}
        <section className="mb-20 px-4">
           <div className="flex justify-between items-end mb-16">
              <div className="flex gap-16 overflow-x-auto no-scrollbar pb-4 font-display">
                 <CategoryTab label="Manioc & Dérivés" count="12" active={true} />
                 <CategoryTab label="Farines & Poudres" count="08" />
                 <CategoryTab label="Graines & Céréales" count="15" />
                 <CategoryTab label="Filières Bio" count="24" />
              </div>
              <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border-b-2 border-forest-green pb-2">Actions <Grid size={14} /></button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              <AfrigariAgroCard 
                name="Gari Jaune Extra" 
                unit="Sachet 1kg" 
                producer="Coopérative d'Ibadan" 
                price="2.500 FCFA" 
                img="https://images.unsplash.com/photo-1549439602-43ebcb232811?auto=format&fit=crop&q=80&w=400" 
                badge="Best Seller" 
              />
              <AfrigariAgroCard 
                name="Tapioca Granulé" 
                unit="Sac de 5kg" 
                producer="Maison Manioc" 
                price="4.800 FCFA" 
                img="https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&q=80&w=400" 
                badge="Premium" 
              />
              <AfrigariAgroCard 
                name="Farine de Tapioca" 
                unit="Sachet 500g" 
                producer="Artisan Local" 
                price="1.200 FCFA" 
                img="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=400" 
              />
              <AfrigariAgroCard 
                name="Gari Blanc Fin" 
                unit="Seau de 10kg" 
                producer="Ferme Togolaise" 
                price="8.500 FCFA" 
                img="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400" 
                badge="Bio" 
              />
           </div>
        </section>

        {/* 5. Traceability Section (Raw vs High-Quality Processed) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-40">
           <div className="bg-peach rounded-[64px] p-16 flex flex-col justify-center items-center text-center relative overflow-hidden group border border-forest-green/5 shadow-xl">
              <div className="w-16 h-16 rounded-full bg-forest-green flex items-center justify-center text-white mb-8 shadow-2xl group-hover:rotate-12 transition-transform">
                 <ShieldCheck size={24} />
              </div>
              <p className="text-xs font-black uppercase text-forest-green/40 mb-6 tracking-widest">Le Label AFRIGARI</p>
              <h4 className="text-4xl font-black leading-tight italic max-w-sm">"Du champ à votre table, chaque sac est scellé pour garantir l'absence totale d'impuretés."</h4>
              <p className="mt-8 text-[11px] font-black uppercase tracking-[0.5em] text-forest-green/60">Garantie Traçabilité Totale</p>
           </div>

           <div className="bg-forest-green/5 rounded-[64px] p-16 grid grid-cols-2 gap-8 items-center relative overflow-hidden group border border-white">
              <div className="space-y-4">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-forest-green/40">La Transformation</h4>
                 <h3 className="text-4xl font-black tracking-tighter">Pureté Absolue des Dérivés du Manioc.</h3>
                 <p className="text-xs font-bold text-forest-green/50">Un lavage rigoureux et un séchage artisanal pour un produit final d'une blancheur irréprochable.</p>
              </div>
              <div className="flex gap-4">
                 <ProgressCard label="Racines" img="https://images.unsplash.com/photo-1590736704728-f4730bb3c3af?auto=format&fit=crop&q=80&w=400" />
                 <ProgressCard label="Gari Fini" img="https://images.unsplash.com/photo-1549439602-43ebcb232811?auto=format&fit=crop&q=80&w=400" />
              </div>
           </div>
        </section>

        {/* 6. Footer CTA Section (Join Agro Community) */}
        <section className="bg-forest-green rounded-[64px] px-20 py-24 text-white overflow-hidden relative mb-40 shadow-[0_60px_120px_-30px_rgba(45,70,53,0.3)]">
           <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-20 relative z-10">
              <div>
                 <h4 className="text-7xl font-black tracking-tighter leading-[0.9] mb-12">Le Meilleur Des <br/> <span className="text-afrigari-gold">Terroirs</span> Africains <br/> Dans Votre Cuisine.</h4>
                 <div className="flex gap-6">
                    <button className="bg-white text-forest-green px-12 py-5 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-2xl">
                       S'inscrire Maintenant
                    </button>
                    <Link href="/dashboard/client/shops" className="border border-white/20 px-12 py-5 rounded-full font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all">
                       Nos Producteurs
                    </Link>
                 </div>
              </div>
              <div className="flex justify-center">
                 <div className="relative w-80 h-96">
                    <img src="https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover rounded-[56px] shadow-2xl animate-slow-bounce ring-8 ring-white/5" />
                    <div className="absolute -bottom-6 -right-6 glass-premium p-6 rounded-3xl shadow-xl flex flex-col items-center gap-2 border border-white">
                       <Sparkles size={24} className="text-afrigari-gold" />
                       <p className="text-forest-green text-[9px] font-black uppercase tracking-widest">100% Naturel</p>
                    </div>
                 </div>
              </div>
           </div>
           <span className="absolute bottom-[-100px] left-[-100px] text-[20rem] font-black opacity-10 pointer-events-none select-none tracking-tighter">AGRO</span>
        </section>

      </main>

      {/* Profile Dropdown Component (Mock) */}
      {isProfileOpen && (
          <div className="fixed top-24 right-8 w-72 glass-premium rounded-[40px] p-8 z-[300] animate-reveal">
             <div className="flex flex-col items-center mb-8">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100" className="w-20 h-20 rounded-full border-4 border-afrigari-gold/20 p-1 mb-4" />
                <h4 className="font-black text-xl">Jean Bosco</h4>
                <p className="text-[10px] font-black text-afrigari-gold uppercase tracking-[0.4em] mt-1">Client Fidèle</p>
             </div>
             <div className="space-y-2">
                <button className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-forest-green/5 transition-all text-left">
                   <div className="flex items-center gap-4">
                      <UserCircle size={20} className="text-forest-green/40" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Espace Personnel</span>
                   </div>
                </button>
                <button className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-forest-green/5 transition-all text-left">
                   <div className="flex items-center gap-4">
                      <Clock size={20} className="text-forest-green/40" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Mes Commandes</span>
                   </div>
                </button>
                <div className="h-px bg-forest-green/5 my-4"></div>
                <button className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-red-50 text-red-500 transition-all">
                   <LogOut size={20} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Se Déconnecter</span>
                </button>
             </div>
          </div>
      )}

    </div>
  );
}

// Internal Logic Components
function StepItem({ num, label, active = false }: any) {
   return (
      <div className={`flex flex-col items-center gap-3 transition-opacity ${active ? 'opacity-100' : 'opacity-20 hover:opacity-100 cursor-pointer'}`}>
         <div className={`w-14 h-14 rounded-full border-2 border-forest-green flex items-center justify-center text-sm font-black transition-all ${active ? 'bg-forest-green text-white scale-110 shadow-xl' : ''}`}>
            ({num})
         </div>
         <p className="text-[10px] font-black uppercase text-center tracking-widest max-w-[100px] leading-tight">{label}</p>
      </div>
   );
}

function CategoryTab({ label, count, active = false }: any) {
   return (
      <div className={`flex gap-1 relative cursor-pointer group transition-all`}>
         <span className={`text-4xl font-black whitespace-nowrap tracking-tighter ${active ? 'text-forest-green' : 'text-slate-200 group-hover:text-forest-green/50'}`}>{label}</span>
         <span className={`text-[11px] font-black mt-2 ${active ? 'text-forest-green' : 'text-slate-200 group-hover:text-forest-green/50'}`}>{count}</span>
         {active && <div className="absolute bottom-[-10px] left-0 w-12 h-1 bg-forest-green rounded-full shadow-lg"></div>}
      </div>
   );
}

function AfrigariAgroCard({ name, unit, producer, price, img, badge }: any) {
   return (
      <div className="group animate-reveal">
         <div className="relative aspect-[4/5] rounded-[56px] overflow-hidden mb-10 shadow-2xl group-hover:-translate-y-4 transition-all duration-700 ring-1 ring-forest-green/5">
            <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s]" />
            <div className="absolute inset-0 bg-gradient-to-t from-forest-green/60 to-transparent"></div>
            {badge && <span className="absolute top-8 left-8 bg-forest-green text-white px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-2xl border border-white/20">{badge}</span>}
            <button className="absolute bottom-8 right-8 w-14 h-14 bg-white text-forest-green rounded-full flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 hover:rotate-90">
               <Plus size={24} />
            </button>
         </div>
         <div className="px-4">
            <p className="text-[9px] font-black text-afrigari-gold uppercase tracking-[0.4em] mb-2">{unit}</p>
            <h4 className="text-2xl font-black mb-3 tracking-tighter group-hover:text-amber-700 transition-colors uppercase">{name}</h4>
            <div className="flex items-center gap-3 text-[10px] font-bold text-forest-green/40 uppercase tracking-widest mb-6 border-b border-forest-green/5 pb-6">
                <Store size={14} className="text-afrigari-gold" />
                <span>{producer}</span>
            </div>
            <div className="flex justify-between items-center bg-white p-2 rounded-3xl border border-forest-green/5 group-hover:border-forest-green/20 transition-all">
               <span className="text-xl font-black text-forest-green ml-4">{price}</span>
               <div className="w-12 h-12 rounded-2xl bg-forest-green flex items-center justify-center text-white cursor-pointer hover:bg-afrigari-gold transition-all shadow-lg">
                  <ShoppingCart size={18} />
               </div>
            </div>
         </div>
      </div>
   );
}

function ProgressCard({ label, img }: any) {
   return (
      <div className="flex flex-col items-center gap-4">
         <div className="w-28 h-44 rounded-[40px] overflow-hidden shadow-2xl border-4 border-white transform hover:rotate-3 transition-transform ring-4 ring-forest-green/5">
            <img src={img} className="w-full h-full object-cover" />
         </div>
         <p className="text-[10px] font-black uppercase tracking-widest text-forest-green/60">{label}</p>
      </div>
   );
}

function MegaMenuItem({ label, icon: Icon }: any) {
  return (
    <li className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-forest-green cursor-pointer group transition-colors">
       <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-forest-green group-hover:text-white transition-all shadow-sm">
          <Icon size={14} />
       </div>
       {label}
    </li>
  );
}
