'use client';

import { AppBar, Toolbar, Button, Box } from '@mui/material';
import { useSession, signOut } from 'next-auth/react';
import Logo from './Logo';

export default function NavBar() {
  const { data: session } = useSession();

  const handleLogin = () => {
    const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL;
    const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM;
    const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID;
    const redirectUri = encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/keycloak`);
    
    // Supprimer les cookies existants
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.split('=');
      if (name.trim().startsWith('KEYCLOAK_') || name.trim().startsWith('next-auth')) {
        document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.parapluigeiement.com`;
        document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    });

    // Construire l'URL avec les paramètres nécessaires
    const loginUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/auth?` +
      `client_id=${clientId}` +
      `&response_type=code` +
      `&scope=openid%20email%20profile` +
      `&redirect_uri=${redirectUri}` +
      `&prompt=login`;
    
    window.location.href = loginUrl;
  };

  const handleLogout = async () => {
    try {
      const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL;
      const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM;
      const redirectUri = encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}`);
      
      // Déconnexion de NextAuth
      await signOut({ redirect: false });

      // Supprimer tous les cookies
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.split('=');
        if (name.trim().startsWith('KEYCLOAK_') || name.trim().startsWith('next-auth')) {
          document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.parapluigeiement.com`;
          document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        }
      });

      // Rediriger vers la page de déconnexion de Keycloak
      window.location.href = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/logout?redirect_uri=${redirectUri}`;
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
