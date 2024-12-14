'use client';

import { useState, useEffect } from 'react';
import { Container, AppBar, Toolbar, Button, Box, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CreateSiteForm from './components/CreateSiteForm';
import EmptySiteState from './components/EmptySiteState';
import Logo from './components/Logo';
import SiteGrid from './components/SiteGrid';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export interface Site {
  _id: string;
  name: string;
  domain: string;
  productType: string;
  createdAt: string;
  orderCount: number;
  status: string;
}

interface CreateSiteFormData {
  domain: string;
  name: string;
  password: string;
  productType: string;
}

interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
  };
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div>Chargement...</div>;
  }

  if (!session) {
    return null;
  }

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sites`);
        const data = await response.json();
        setSites(data);
      } catch (error) {
        console.error('Error fetching sites:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSites();
  }, []);

  const handleCreateClick = () => {
    setShowCreateForm(true);
  };

  return (
    <>
      <AppBar 
        position="static" 
        elevation={1}
        sx={{
          backgroundColor: 'white',
          borderBottom: '1px solid #eaeaea',
        }}
      >
        <Toolbar 
          sx={{ 
            justifyContent: 'space-between',
            minHeight: '80px',
            padding: '0 24px',
          }}
        >
          <Logo />
          <Box>
            <Button
              startIcon={
                <AddIcon sx={{ 
                  fontSize: '20px',
                  transition: 'transform 0.2s ease-in-out',
                  transform: showCreateForm ? 'rotate(45deg)' : 'rotate(0)',
                }} />
              }
              variant="contained"
              onClick={() => setShowCreateForm(!showCreateForm)}
              sx={{
                backgroundColor: 'black',
                fontWeight: 600,
                padding: '10px 24px',
                borderRadius: '50px',
                textTransform: 'none',
                fontSize: '0.95rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '2px solid black',
                '&:hover': {
                  backgroundColor: 'white',
                  color: 'black',
                  border: '2px solid black',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              {showCreateForm ? 'Voir les sites' : 'Créer un site'}
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {showCreateForm ? (
          <CreateSiteForm
            onSuccess={(response: ApiResponse<CreateSiteFormData>) => {
              if (response.data) {
                const newSite: Site = {
                  _id: Date.now().toString(),
                  name: response.data.name,
                  domain: response.data.domain,
                  productType: response.data.productType,
                  createdAt: new Date().toISOString(),
                  orderCount: 0,
                  status: 'active'
                };
                setSites([...sites, newSite]);
                setShowCreateForm(false);
              }
            }}
            onCancel={() => setShowCreateForm(false)}
            onError={(error) => {
              console.error('Error creating site:', error);
            }}
          />
        ) : sites.length === 0 ? (
          <EmptySiteState onCreateClick={() => setShowCreateForm(true)} />
        ) : (
          <Box>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 4
            }}>
              <Typography variant="h5" component="h1">
                Vos sites ({sites.length})
              </Typography>
            </Box>
            <SiteGrid 
              sites={sites} 
              onSiteClick={(site) => {
                // TODO: Implémenter la gestion du clic sur un site
                console.log('Site clicked:', site);
              }} 
            />
          </Box>
        )}
      </Container>
    </>
  );
}
