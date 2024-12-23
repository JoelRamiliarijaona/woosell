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

interface SiteGridProps {
  sites: Site[];
  onSiteClick?: (site: Site) => void;
}

const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
  switch (status) {
    case 'active':
      return 'success';
    case 'inactive':
      return 'error';
    case 'pending':
      return 'warning';
    default:
      return 'default';
  }
};

const getStatusText = (status: string): string => {
  switch (status) {
    case 'active':
      return 'Actif';
    case 'inactive':
      return 'Inactif';
    case 'pending':
      return 'En attente';
    default:
      return 'Inconnu';
  }
};

const SiteGrid: FC<SiteGridProps> = ({ sites = [], onSiteClick }) => {
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleSiteClick = (site: Site) => {
    setSelectedSite(site);
    setDetailsOpen(true);
    onSiteClick?.(site);
  };

  return (
    <>
      <Grid container spacing={3}>
        {sites.map((site) => (
          <Grid item xs={12} sm={6} md={4} key={site._id}>
            <Card 
              sx={{ 
                height: '100%',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
            >
              <CardActionArea onClick={() => handleSiteClick(site)}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Store sx={{ mr: 1 }} />
                    <Typography variant="h6" component="h2" noWrap>
                      {site.name}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" mb={1}>
                    <Language sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {site.domain}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" mb={2}>
                    <AccessTime sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {site.createdAt ? formatDistanceToNow(new Date(site.createdAt), { 
                        addSuffix: true,
                        locale: fr 
                      }) : 'Date inconnue'}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Chip
                      label={getStatusText(site.status)}
                      color={getStatusColor(site.status)}
                      size="small"
                    />
                    <Box display="flex" alignItems="center">
                      <Tooltip title="Commandes">
                        <Badge 
                          badgeContent={site.stats?.orderCount ?? 0} 
                          color="primary"
                          sx={{ mr: 1 }}
                        >
                          <ShoppingCart sx={{ color: 'text.secondary' }} />
                        </Badge>
                      </Tooltip>
                      <Tooltip title="Paramètres">
                        <IconButton size="small">
                          <Settings sx={{ color: 'text.secondary' }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Ouvrir le site">
                        <IconButton 
                          size="small"
                          component="a"
                          href={`https://${site.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Launch sx={{ color: 'text.secondary' }} />
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
