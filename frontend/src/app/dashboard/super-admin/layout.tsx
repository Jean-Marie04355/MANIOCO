"use client";
import { useAuth } from '@/features/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user.role !== 'super_admin' && user.role !== 'admin') {
      if (user.role === 'vendeur') {
        router.push('/dashboard/seller');
      } else {
        router.push('/dashboard/client');
      }
      return;
    }

    setAuthorized(true);
  }, [user, isLoading, router]);

  if (isLoading || !authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F4F7FE]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
