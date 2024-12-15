'use client';

import { signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Box, Typography, CircularProgress, Button } from '@mui/material';

export default function SignInPage() {
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  useEffect(() => {
    const initiateSignIn = async () => {
      try {
        console.log('Initiating Keycloak sign-in...');
        console.log('Callback URL:', callbackUrl);
        
        const result = await signIn('keycloak', {
          callbackUrl,
          redirect: true,
        });
        
        console.log('Sign-in result:', result);
        
        if (result?.error) {
          setError(result.error);
        }
      } catch (err) {
        console.error('Sign-in error:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la connexion');
      }
    };

    initiateSignIn();
  }, [callbackUrl]);

  if (error) {
    return (
      <Box className="flex flex-col items-center justify-center min-h-screen p-4">
        <Typography variant="h5" color="error" gutterBottom>
          Erreur de connexion
        </Typography>
        <Typography color="text.secondary" paragraph>
          {error}
        </Typography>
        <Button
          variant="contained"
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Réessayer
        </Button>
      </Box>
    );
  }

  return (
    <Box className="flex flex-col items-center justify-center min-h-screen p-4">
      <CircularProgress size={40} sx={{ mb: 2 }} />
      <Typography>
        Redirection vers la page de connexion...
      </Typography>
    </Box>
  );
}
