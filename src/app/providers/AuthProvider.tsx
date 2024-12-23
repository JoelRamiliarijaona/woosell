'use client';

import { SessionProvider } from 'next-auth/react';

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider 
      refetchInterval={5 * 60} // Vérifier toutes les 5 minutes
      refetchOnWindowFocus={false} // Ne pas vérifier quand la fenêtre reprend le focus
    >
      {children}
    </SessionProvider>
  );
}
