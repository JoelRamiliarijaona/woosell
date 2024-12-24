'use client';

import { signIn } from 'next-auth/react';
import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Box, Typography, CircularProgress, Button, Container } from '@mui/material';

function SignInContent() {
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  useEffect(() => {
    const initiateSignIn = async () => {
      try {
        await signIn('keycloak', {
          callbackUrl,
          redirect: true,
        });
      } catch (err) {
        console.error('Sign-in error:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la connexion');
      }
    };

    initiateSignIn();
  }, [callbackUrl]);

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Erreur de connexion
          </Typography>
          <Typography variant="body1" paragraph>
            {error}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => signIn('keycloak', { callbackUrl })}
          >
            Réessayer
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Box sx={{ textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Redirection vers la page de connexion...
        </Typography>
      </Box>
    </Container>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    }>
      <SignInContent />
    </Suspense>
  );
}
