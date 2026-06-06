"use client";
import { useAuth } from '@/features/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import ClientNavbar from '@/components/ClientNavbar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user.role === 'vendeur') {
      router.push('/dashboard/seller');
      return;
    }

    if (user.role === 'super_admin' || user.role === 'admin') {
      router.push('/dashboard/super-admin');
      return;
    }

    setAuthorized(true);
  }, [user, isLoading, router]);

  if (isLoading || !authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAF7F2]">
        <Loader2 className="w-8 h-8 text-manioco-terracotta animate-spin" />
      </div>
    );
  }

  return (
    <>
      <ClientNavbar />
      <div className="pt-[72px]">
        {children}
      </div>
    </>
  );
}

