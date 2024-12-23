'use client';

import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import type { ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
  session?: Session | null;
}

export function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider 
      session={session}
      // Réduire la fréquence des vérifications de session
      refetchInterval={5 * 60}  // 5 minutes
      refetchOnWindowFocus={false}  // Désactiver le rafraîchissement au focus
      refetchWhenOffline={false}  // Désactiver le rafraîchissement hors ligne
    >
      {children}
    </SessionProvider>
  );
}
