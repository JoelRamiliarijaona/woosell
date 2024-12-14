'use client';

import { Button } from '@mui/material';
import { signIn, signOut, useSession } from 'next-auth/react';

export default function LoginButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <Button disabled>Loading...</Button>;
  }

  if (session) {
    return (
      <Button
        onClick={() => signOut()}
        variant="outlined"
      >
        Se déconnecter ({session.user?.name})
      </Button>
    );
  }

  return (
    <Button
      onClick={() => signIn('keycloak')}
      variant="contained"
    >
      Se connecter
    </Button>
  );
}
