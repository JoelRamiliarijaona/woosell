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
  Badge
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

const SiteGrid: FC<SiteGridProps> = ({ sites, onSiteClick }) => {
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);

  return (
    <>
      <Grid container spacing={3}>
        {sites.map((site) => (
          <Grid item xs={12} sm={6} md={4} key={site._id}>
            <Card 
              elevation={2}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
                position: 'relative',
                overflow: 'visible'
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
                      fontSize: '0.8rem',
                      height: '22px',
                      minWidth: '22px',
                      borderRadius: '11px',
                    }
                  }}
                >
                  <ShoppingCart />
                </Badge>
              )}
              
              <CardActionArea onClick={() => setSelectedSite(site)}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Store sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                      {site.name}
                    </Typography>
                    <Chip
                      size="small"
                      label={getStatusText(site.status)}
                      color={getStatusColor(site.status) as any}
                      sx={{ ml: 1 }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, color: 'text.secondary' }}>
                    <Language sx={{ mr: 1, fontSize: '1rem' }} />
                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                      {site.domain}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Store sx={{ mr: 1, fontSize: '1rem', color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {site.productType}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                    <AccessTime sx={{ mr: 1, fontSize: '1rem' }} />
                    <Typography variant="body2">
                      {formatDistanceToNow(new Date(site.createdAt), { 
                        addSuffix: true,
                        locale: fr 
                      })}
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>

              <Box 
                sx={{ 
                  mt: 'auto', 
                  display: 'flex', 
                  justifyContent: 'flex-end',
                  p: 1,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Tooltip title="Paramètres">
                  <IconButton size="small" onClick={() => setSelectedSite(site)}>
                    <Settings fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Ouvrir le site">
                  <IconButton 
                    size="small" 
                    href={`https://${site.domain}`}
                    target="_blank"
                    sx={{ ml: 1 }}
                  >
                    <Launch fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <SiteDetails
        site={selectedSite}
        open={!!selectedSite}
        onClose={() => setSelectedSite(null)}
      />
    </>
  );
};

export default SiteGrid;
