'use client';

import { FC, useState } from 'react';
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  IconButton, 
  Chip,
  CardActionArea,
  Tooltip,
  Badge,
  CircularProgress
} from '@mui/material';
import { 
  Language, 
  ShoppingCart, 
  Settings, 
  Launch,
  Store,
  AccessTime
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Site } from '../page';
import SiteDetails from './SiteDetails';

interface Site {
  _id: string;
  name: string;
  domain: string;
  status: string;
  createdAt: string;
  billing: {
    status: string;
    plan: string;
  };
  orderCount: number;
  productType: string;
  lastSync: string;
}

interface SiteGridProps {
  sites?: Site[];
  onSiteClick: (site: Site) => void;
}

const getStatusColor = (status: string) => {
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

const getStatusText = (status: string) => {
  switch (status) {
    case 'active':
      return 'Actif';
    case 'pending':
      return 'En attente';
    case 'error':
      return 'Erreur';
    default:
      return status;
  }
};

const SiteGrid: FC<SiteGridProps> = ({ sites = [], onSiteClick }) => {
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleCardClick = (site: Site) => {
    setSelectedSite(site);
    setDetailsOpen(true);
    onSiteClick(site);
  };

  if (!Array.isArray(sites)) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (sites.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography variant="body1" color="textSecondary">
          Aucun site trouvé
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ p: { xs: 2, sm: 3 } }}>
        {sites.map((site) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={site._id}>
            <Card 
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'visible',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                },
              }}
            >
              {site.orderCount > 0 && (
                <Badge
                  badgeContent={site.orderCount}
                  color="primary"
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    '& .MuiBadge-badge': {
                      fontSize: { xs: '0.7rem', sm: '0.8rem' },
                      height: { xs: '20px', sm: '22px' },
                      minWidth: { xs: '20px', sm: '22px' },
                      borderRadius: '11px',
                    }
                  }}
                >
                  <Box sx={{ width: 4 }} />
                </Badge>
              )}
              
              <CardActionArea 
                onClick={() => handleCardClick(site)}
                sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
              >
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="div" sx={{ wordBreak: 'break-word' }}>
                      {site.name}
                    </Typography>
                    <Chip
                      label={getStatusText(site.status)}
                      color={getStatusColor(site.status)}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Language sx={{ mr: 1, fontSize: '1rem', color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                      {site.domain}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Store sx={{ mr: 1, fontSize: '1rem', color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {site.productType}
                    </Typography>
                  </Box>

                  {site.lastSync && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccessTime sx={{ mr: 1, fontSize: '1rem', color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        Dernière synchro: {formatDistanceToNow(new Date(site.lastSync), { addSuffix: true, locale: fr })}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ 
                    mt: 'auto', 
                    pt: 2, 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    alignItems: 'center'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ShoppingCart sx={{ mr: 0.5, fontSize: '1.1rem', color: 'primary.main' }} />
                      <Typography variant="body2" color="primary">
                        {site.orderCount} commandes
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Tooltip title="Paramètres">
                        <IconButton size="small" color="inherit">
                          <Settings fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Ouvrir le site">
                        <IconButton 
                          size="small" 
                          color="primary"
                          component="a"
                          href={`https://${site.domain}`}
                          target="_blank"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Launch fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {selectedSite && (
        <SiteDetails
          site={selectedSite}
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
        />
      )}
    </>
  );
};

export default SiteGrid;
