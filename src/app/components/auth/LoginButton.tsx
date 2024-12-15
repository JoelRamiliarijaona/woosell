'use client';

import { Button, CircularProgress, Box } from '@mui/material';
import { signIn, signOut, useSession } from 'next-auth/react';
import { Person, ExitToApp, Login } from '@mui/icons-material';

export default function LoginButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <Button
        disabled
        variant="outlined"
        sx={{
          minWidth: { xs: '120px', sm: '150px' },
          borderRadius: '8px',
          textTransform: 'none',
          fontSize: { xs: '0.85rem', sm: '0.95rem' },
          py: { xs: 0.75, sm: 1 },
        }}
      >
        <CircularProgress size={16} sx={{ mr: 1 }} />
        Chargement...
      </Button>
    );
  }

  if (session) {
    return (
      <Button
        onClick={() => signOut()}
        variant="outlined"
        startIcon={<ExitToApp sx={{ fontSize: { xs: '1.1rem', sm: '1.2rem' } }} />}
        sx={{
          borderRadius: '8px',
          textTransform: 'none',
          fontSize: { xs: '0.85rem', sm: '0.95rem' },
          py: { xs: 0.75, sm: 1 },
          px: { xs: 1.5, sm: 2 },
          borderColor: 'grey.300',
          color: 'text.secondary',
          '&:hover': {
            borderColor: 'grey.400',
            backgroundColor: 'grey.50',
          },
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 0.5, sm: 1 },
          minWidth: { xs: '120px', sm: '150px' },
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: { xs: 0.5, sm: 1 },
          '& .MuiSvgIcon-root': {
            fontSize: { xs: '1.1rem', sm: '1.2rem' }
          }
        }}>
          <Person />
          <span className="hidden sm:inline">{session.user?.name}</span>
          <span className="sm:hidden">{session.user?.name?.split(' ')[0]}</span>
        </Box>
      </Button>
    );
  }

  return (
    <Button
      onClick={() => signIn('keycloak')}
      variant="contained"
      startIcon={<Login sx={{ fontSize: { xs: '1.1rem', sm: '1.2rem' } }} />}
      sx={{
        borderRadius: '8px',
        textTransform: 'none',
        fontSize: { xs: '0.85rem', sm: '0.95rem' },
        py: { xs: 0.75, sm: 1 },
        px: { xs: 2, sm: 3 },
        minWidth: { xs: '120px', sm: '150px' },
        background: 'linear-gradient(45deg, #2563eb, #4f46e5)',
        boxShadow: '0 2px 4px rgba(37, 99, 235, 0.1)',
        '&:hover': {
          background: 'linear-gradient(45deg, #1d4ed8, #4338ca)',
          boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)',
        },
        transition: 'all 0.2s ease-in-out',
      }}
    >
      Se connecter
    </Button>
  );
}
