'use client';

import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import { ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
  session?: Session | null;
}

export function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider 
      session={session}
      // Réduire drastiquement la fréquence des vérifications de session
      refetchInterval={60 * 60}  // 1 heure
      refetchOnWindowFocus={false}  // Désactiver le rafraîchissement au focus
      refetchWhenOffline={false}  // Désactiver le rafraîchissement hors ligne
    >
      {children}
    </SessionProvider>
  );
}
