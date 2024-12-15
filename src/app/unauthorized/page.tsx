'use client';

import { Button } from '@mui/material';
import { useRouter } from 'next/navigation';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold mb-4">Accès Refusé</h1>
      <p className="text-gray-600 mb-8">
        Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.
      </p>
      <Button
        variant="contained"
        onClick={() => router.push('/')}
      >
        Retour à l&apos;accueil
      </Button>
    </div>
  );
}
