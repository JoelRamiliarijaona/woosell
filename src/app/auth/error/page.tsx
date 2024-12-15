'use client';

import { useSearchParams } from 'next/navigation';
import { Box, Typography, Paper, Container, Button } from '@mui/material';
import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';

const ERROR_MESSAGES: { [key: string]: string } = {
  'Configuration': 'Erreur de configuration de l\'authentification',
  'AccessDenied': 'Accès refusé',
  'Verification': 'Erreur de vérification du compte',
  'Default': 'Une erreur inattendue s\'est produite'
};

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [errorDetails, setErrorDetails] = useState<string>('');

  useEffect(() => {
    // Log les paramètres d'URL pour le débogage
    console.error('Auth Error:', {
      error,
      fullUrl: typeof window !== 'undefined' ? window.location.href : '',
      searchParams: Object.fromEntries(searchParams.entries())
    });

    // Récupérer plus de détails sur l'erreur si disponible
    const errorMessage = ERROR_MESSAGES[error || ''] || ERROR_MESSAGES.Default;
    setErrorDetails(errorMessage);
  }, [error, searchParams]);

  const handleRetry = async () => {
    try {
      await signIn('keycloak', { callbackUrl: '/dashboard' });
    } catch (err) {
      console.error('Retry error:', err);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Erreur d'authentification
          </Typography>
          
          <Typography variant="body1" color="error" paragraph>
            {errorDetails}
          </Typography>

          <Typography variant="body2" color="text.secondary" paragraph>
            Une erreur s'est produite lors de la tentative de connexion.
          </Typography>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleRetry}
            >
              Réessayer la connexion
            </Button>
            
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => window.location.href = '/'}
            >
              Retour à l'accueil
            </Button>
          </Box>

          {process.env.NODE_ENV === 'development' && (
            <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="caption" display="block" gutterBottom>
                Détails techniques (mode développement) :
              </Typography>
              <Typography variant="caption" display="block" sx={{ wordBreak: 'break-all' }}>
                Code erreur : {error}
              </Typography>
              <Typography variant="caption" display="block" sx={{ wordBreak: 'break-all' }}>
                URL : {typeof window !== 'undefined' ? window.location.href : ''}
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
}
