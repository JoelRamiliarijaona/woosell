'use client';

import { signOut } from 'next-auth/react';
import { useEffect } from 'react';

export default function SignOutPage() {
  useEffect(() => {
    // Déconnexion avec redirection vers la page d'accueil
    signOut({ callbackUrl: '/' });
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Déconnexion en cours...</p>
    </div>
  );
}
