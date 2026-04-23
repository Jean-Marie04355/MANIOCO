"use client";
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';
import ChatWindow from '../components/ChatWindow';

export default function SellerMessages() {
  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar mode="seller" />
      
      <main className="flex-1 ml-64">
        <TopNav title="Messagerie Clients" isAdmin={true} />
        
        <div className="p-2 h-[calc(100vh-64px)]">
           <ChatWindow />
        </div>
      </main>
    </div>
  );
}
