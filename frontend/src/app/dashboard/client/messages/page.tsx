"use client";
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';
import ClientChatWindow from '../components/ClientChatWindow';

export default function ClientMessages() {
  return (
    <div className="flex bg-luxury-cream/30 min-h-screen font-sans text-forest-night selection:bg-afrigari-gold selection:text-white">
      <Sidebar mode="client" />
      
      <main className="flex-1 ml-64 flex flex-col h-screen">
        <TopNav title="Mes Discussions" isAdmin={false} />
        
        <div className="p-8 flex-1 overflow-hidden">
           <div className="h-full bg-white rounded-[3rem] shadow-xl border border-forest-night/5 overflow-hidden animate-reveal">
              <ClientChatWindow />
           </div>
        </div>
      </main>
    </div>
  );
}
