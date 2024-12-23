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
  status: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  billing: {
    status: string;
    plan: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    currentPeriodEnd?: string;
  };
  stats: {
    orderCount: number;
    revenue: number;
    lastSync?: string;
  };
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
          setLoading(true);
          const response = await fetch('/api/sites');
          if (!response.ok) {
            throw new Error('Failed to fetch sites');
          }
          const { data } = await response.json();
          setSites(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error('Error fetching sites:', error);
          setSites([]);
        } finally {
          setLoading(false);
        }
      } else {
        setSites([]);
        setLoading(false);
      }
    };

    initializePage();
  }, [session, status]);

  const handleCreateSite = () => {
    setShowCreateForm(true);
  };

  if (status === 'loading' || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!session) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h5">
          Veuillez vous connecter pour voir vos sites
        </Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Mes Sites
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateForm(true)}
        >
          Créer un site
        </Button>
      </Box>

      {sites.length === 0 ? (
        <EmptySiteState onCreateClick={() => setShowCreateForm(true)} />
      ) : (
        <SiteGrid sites={sites} />
      )}

      <CreateSiteForm
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSiteCreated={(newSite) => {
          setSites((prevSites) => [...prevSites, newSite]);
        }}
      />
    </Box>
  );
}
