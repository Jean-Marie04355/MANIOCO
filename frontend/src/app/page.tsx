"use client";

import { useAuth } from '@/features/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import HomeView from '@/features/home/components/HomeView';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      if (user.role === 'vendeur') {
        router.push('/dashboard/seller');
      } else if (user.role === 'super_admin' || user.role === 'admin') {
        router.push('/dashboard/super-admin');
      }
      // If client, we stay on this page which now shows the HomeView
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fcfbf7]">
        <Loader2 className="w-12 h-12 text-[#c5a059] animate-spin" />
      </div>
    );
  }

  // If user is a seller or admin, they will be redirected by the useEffect.
  // We render HomeView for both Guests (user === null) and Clients (user.role === 'client').
  return <HomeView />;
}
