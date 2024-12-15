'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user';
}

export default function RoleGuard({ children, requiredRole = 'user' }: RoleGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/login');
      return;
    }

    const roles = (session as any).roles || [];
    const isAdmin = roles.includes('admin');
    const isUser = roles.includes('user') || isAdmin;

    if (requiredRole === 'admin' && !isAdmin) {
      router.push('/unauthorized');
    } else if (requiredRole === 'user' && !isUser) {
      router.push('/unauthorized');
    }
  }, [session, status, router, requiredRole]);

  if (status === 'loading') {
    return <div>Chargement...</div>;
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
