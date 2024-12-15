'use client';

import { useState, useEffect } from 'react';
import { Button, Box, Typography, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CreateSiteForm from './components/CreateSiteForm';
import EmptySiteState from './components/EmptySiteState';
import SiteGrid from './components/SiteGrid';
import { useSession } from 'next-auth/react';

export interface Site {
  _id: string;
  name: string;
  domain: string;
  productType: string;
  createdAt: string;
  orderCount: number;
  status: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializePage = async () => {
      if (status === 'loading') {
        return;
      }

      if (session) {
        try {
          const response = await fetch('/api/sites');
          const data = await response.json();
          setSites(data);
        } catch (error) {
          console.error('Error fetching sites:', error);
        }
      }
      setLoading(false);
    };

    initializePage();
  }, [session, status]);

  const handleCreateSite = () => {
    setShowCreateForm(true);
  };

  // Afficher le loader pendant la vérification de la session
  if (status === 'loading') {
    return (
      <>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="calc(100vh - 64px)">
          <CircularProgress />
        </Box>
      </>
    );
  }

  return (
    <>
      <Box sx={{ p: 3 }}>
        {!session ? (
          <Box 
            display="flex" 
            flexDirection="column" 
            justifyContent="center" 
            alignItems="center" 
            minHeight="calc(100vh - 128px)"
            gap={3}
          >
            <Typography variant="h4" component="h1">
              Bienvenue sur WooSell
            </Typography>
            <Typography variant="body1" color="textSecondary" align="center">
              Connectez-vous pour gérer vos sites WooCommerce
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleCreateSite}
              >
                Nouveau site
              </Button>
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
              </Box>
            ) : sites.length === 0 ? (
              <EmptySiteState onCreateClick={handleCreateSite} />
            ) : (
              <SiteGrid sites={sites} />
            )}

            <CreateSiteForm
              open={showCreateForm}
              onClose={() => setShowCreateForm(false)}
              onSiteCreated={(newSite) => {
                setSites([...sites, newSite]);
                setShowCreateForm(false);
              }}
            />
          </>
        )}
      </Box>
    </>
  );
}
