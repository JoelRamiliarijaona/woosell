'use client';

import { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, Chip } from '@mui/material';
import { Store, Language, Timeline } from '@mui/icons-material';

interface Site {
  _id: string;
  name: string;
  domain: string;
  status: string;
  stats: {
    orderCount: number;
    revenue: number;
    lastSync?: string;
  };
  billing: {
    status: string;
    plan: string;
  };
  createdAt: string;
}

export default function SiteList() {
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await fetch('/api/sites', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch sites');
        }
        
        const data = await response.json();
        setSites(data);
      } catch (err) {
        setError('Erreur lors du chargement des sites');
        console.error('Error fetching sites:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSites();
  }, []);

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <Typography>Chargement des sites...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (sites.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <Typography>Aucun site trouvé</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3} sx={{ p: 3 }}>
      {sites.map((site) => (
        <Grid item xs={12} sm={6} md={4} key={site._id}>
          <Card 
            sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4
              }
            }}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Store sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
                  {site.name}
                </Typography>
                <Chip
                  size="small"
                  label={site.status}
                  color={getStatusColor(site.status)}
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Language sx={{ mr: 1, color: 'text.secondary', fontSize: '1.2rem' }} />
                <Typography variant="body2" color="text.secondary">
                  {site.domain}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Timeline sx={{ mr: 1, color: 'text.secondary', fontSize: '1.2rem' }} />
                <Typography variant="body2" color="text.secondary">
                  {site.stats.orderCount} commandes
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button
                  variant="contained"
                  size="small"
                  href={`https://${site.domain}/wp-admin`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ flexGrow: 1 }}
                >
                  Admin
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  href={`https://${site.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ flexGrow: 1 }}
                >
                  Voir le site
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
