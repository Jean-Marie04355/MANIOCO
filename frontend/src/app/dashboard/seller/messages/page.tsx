"use client";
import { Suspense } from 'react';
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';
import ChatWindow from '../components/ChatWindow';

export default function SellerMessages() {
  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar mode="seller" />
      
      <main className="flex-1 ml-64">
        <TopNav title="Messagerie Clients" isAdmin={false} />
        
        <div className="p-2 h-[calc(100vh-64px)]">
           <Suspense fallback={<div className="flex-1 flex items-center justify-center bg-white rounded-3xl m-2 shadow-sm border border-slate-100">Chargement de la messagerie...</div>}>
              <ChatWindow />
           </Suspense>
        </div>
      </main>
    </div>
  );
}
