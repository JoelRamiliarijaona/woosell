'use client';

import { Box, Typography, Paper, Button } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import StorefrontIcon from '@mui/icons-material/Storefront';

interface EmptySiteStateProps {
  onCreateClick: () => void;
}

const EmptySiteState = ({ onCreateClick }: EmptySiteStateProps) => {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="60vh"
      p={3}
    >
      <Paper
        elevation={0}
        sx={{
          p: 4,
          textAlign: 'center',
          backgroundColor: 'transparent',
          maxWidth: 600,
        }}
      >
        <Box
          sx={{
            mb: 3,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <StorefrontIcon
            sx={{
              fontSize: 80,
              color: 'primary.main',
              opacity: 0.7,
            }}
          />
        </Box>
        
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          Aucun site pour le moment
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
          Commencez votre aventure e-commerce en créant votre premier site WooCommerce.
          Notre plateforme vous accompagne dans la gestion de vos boutiques en ligne.
        </Typography>

        <Button
          variant="contained"
          size="large"
          startIcon={<AddCircleOutlineIcon />}
          onClick={onCreateClick}
          sx={{
            borderRadius: 2,
            py: 1.5,
            px: 4,
            textTransform: 'none',
            fontSize: '1.1rem',
          }}
        >
          Créer mon premier site
        </Button>
      </Paper>
    </Box>
  );
};

export default EmptySiteState;
