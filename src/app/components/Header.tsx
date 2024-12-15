'use client';

import { AppBar, Toolbar, Button, Box, Typography } from '@mui/material';
import { useSession, signOut } from 'next-auth/react';

export default function Header() {
  const { data: session, status } = useSession();

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

      // Redirection vers la page de déconnexion Keycloak
      window.location.href = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/logout?redirect_uri=${redirectUri}`;
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      window.location.href = '/';
    }
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          WooSell
        </Typography>
        {status === 'loading' ? null : session ? (
          <Button color="inherit" onClick={handleLogout}>
            Se déconnecter
          </Button>
        ) : (
          <Button color="inherit" onClick={handleLogin}>
            Se connecter
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}
