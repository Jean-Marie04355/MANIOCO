"use client";
import { useAuth } from '@/features/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user.role !== 'vendeur') {
      if (user.role === 'super_admin' || user.role === 'admin') {
        router.push('/dashboard/super-admin');
      } else {
        router.push('/dashboard/client');
      }
      return;
    }

    setAuthorized(true);
  }, [user, isLoading, router]);

  if (isLoading || !authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
