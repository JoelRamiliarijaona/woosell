'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

interface SessionData {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  roles?: string[];
  expires: string;
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/login');
      return;
    }

    const sessionData = session as SessionData;
    const roles = sessionData.roles || [];
    const hasAllowedRole = allowedRoles.some(role => roles.includes(role));

    if (!hasAllowedRole) {
      router.push('/unauthorized');
    }
  }, [session, status, router, allowedRoles]);

  if (status === 'loading') {
    return <div>Chargement...</div>;
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
