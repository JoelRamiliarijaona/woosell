'use client';

import { useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  Dialog,
} from '@mui/material';
import { useSession } from 'next-auth/react';
import CreateSiteForm from '../components/CreateSiteForm';
import SiteList from '../components/SiteList';
import BillingStatus from '../components/BillingStatus';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);

  if (!session) {
    return null; // Le middleware redirigera vers la page de connexion
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Tableau de bord
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setIsCreateFormOpen(true)}
        >
          Créer un site
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Liste des sites */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <SiteList />
          </Paper>
        </Grid>

        {/* Facturation */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <BillingStatus />
          </Paper>
        </Grid>
      </Grid>

      {/* Modal de création de site */}
      <Dialog
        open={isCreateFormOpen}
        onClose={() => setIsCreateFormOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <CreateSiteForm 
          open={isCreateFormOpen}
          onClose={() => setIsCreateFormOpen(false)}
          onSiteCreated={() => setIsCreateFormOpen(false)}
        />
      </Dialog>
    </Container>
  );
}
