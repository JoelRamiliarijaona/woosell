'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Grid, Card, CardContent, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import { Store, Language, Timeline, Refresh } from '@mui/icons-material';

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchSites = useCallback(async (force = false) => {
    // Ne pas recharger si les données sont déjà présentes et que ce n'est pas un rechargement forcé
    if (!force && isInitialized && sites.length > 0) {
      return;
    }

    try {
      setIsLoading(true);
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
      setIsInitialized(true);
    } catch (err) {
      setError('Erreur lors du chargement des sites');
      console.error('Error fetching sites:', err);
    } finally {
      setIsLoading(false);
    }
  }, [sites.length, isInitialized]);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  const handleRefresh = () => {
    fetchSites(true); // Force le rechargement
  };

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

  const renderHeader = () => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="h6" component="h2">
        Mes Sites
      </Typography>
      <Tooltip title="Rafraîchir la liste">
        <IconButton 
          onClick={handleRefresh} 
          disabled={isLoading}
          size="small"
        >
          <Refresh />
        </IconButton>
      </Tooltip>
    </Box>
  );

  if (isLoading && !isInitialized) {
    return (
      <Box sx={{ p: 4 }}>
        {renderHeader()}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Typography>Chargement des sites...</Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        {renderHeader()}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Typography color="error">{error}</Typography>
        </Box>
      </Box>
    );
  }

  if (!isLoading && sites.length === 0) {
    return (
      <Box sx={{ p: 4 }}>
        {renderHeader()}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Typography>Aucun site trouvé</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      {renderHeader()}
      <Grid container spacing={3}>
        {sites.map((site) => (
          <Grid item xs={12} sm={6} md={4} key={site._id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  boxShadow: 6,
                  cursor: 'pointer'
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Store color="primary" />
                  <Chip 
                    label={site.status} 
                    size="small"
                    color={getStatusColor(site.status)}
                  />
                </Box>
                
                <Typography variant="h6" component="h3" gutterBottom>
                  {site.name}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Language sx={{ mr: 1, fontSize: 'small' }} />
                  <Typography variant="body2" color="text.secondary">
                    {site.domain}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Timeline sx={{ mr: 1, fontSize: 'small' }} />
                  <Typography variant="body2" color="text.secondary">
                    {new Date(site.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Commandes: {site.stats.orderCount}
                  </Typography>
                  <Typography variant="body2">
                    Revenus: {site.stats.revenue}€
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
