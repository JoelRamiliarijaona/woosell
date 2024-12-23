'use client';

import { AppBar, Toolbar, Button, Box } from '@mui/material';
import { useSession, signOut } from 'next-auth/react';
import Logo from './Logo';

export default function NavBar() {
  const { data: session } = useSession();
  console.log(session)

  const handleLogin = () => {
    const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL;
    const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM;
    const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID;
    const redirectUri = encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/keycloak`);
    
    // Construire l'URL avec les paramètres nécessaires
    const loginUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/auth?` +
      `client_id=${clientId}` +
      `&response_type=code` +
      `&scope=openid%20email%20profile` +
      `&redirect_uri=${redirectUri}`;
    
    window.location.href = loginUrl;
  };

  const handleLogout = async () => {
    try {
      // Déconnexion de NextAuth
      await signOut({ 
        callbackUrl: process.env.NEXT_PUBLIC_APP_URL,
        redirect: true 
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Logo />
        <Box>
          {session ? (
            <Button
              variant="outlined"
              onClick={handleLogout}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontSize: '0.95rem',
                py: 1,
                px: 3,
                borderColor: 'grey.300',
                color: 'text.secondary',
                '&:hover': {
                  borderColor: 'grey.400',
                  backgroundColor: 'grey.50',
                },
              }}
            >
              Se déconnecter
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleLogin}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontSize: '0.95rem',
                py: 1,
                px: 3,
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }}
            >
              Se connecter
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
