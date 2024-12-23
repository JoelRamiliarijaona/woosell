import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  ShoppingCart,
  Dashboard,
  Store,
  Euro,
  Receipt,
  Delete as DeleteIcon,
  Language,
  AccessTime,
  Settings
} from '@mui/icons-material';
import { Site } from '../page';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SiteDetailsProps {
  site: Site;
  onClose: () => void;
  open: boolean;
}

interface BillingInfo {
  currentMonth: {
    orderCount: number;
    revenue: number;
    startDate: string;
    endDate: string;
  };
  previousMonth: {
    orderCount: number;
    revenue: number;
    startDate: string;
    endDate: string;
  };
  subscription: {
    plan: string;
    status: string;
    currentPeriodEnd: string;
  };
}

const SiteDetails: React.FC<SiteDetailsProps> = ({ site, onClose, open }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchBillingInfo = async () => {
      if (!site) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/sites/${site._id}/billing`);
        if (!response.ok) throw new Error('Erreur lors de la récupération des informations de facturation');
        
        const data = await response.json();
        setBillingInfo(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchBillingInfo();
    }
  }, [site, open]);

  const handleDelete = async () => {
    if (!site) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/sites/${site._id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Erreur lors de la suppression du site');
      
      setDeleteDialogOpen(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  if (!site) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box display="flex" alignItems="center">
          <Store sx={{ mr: 1 }} />
          <Typography variant="h6" component="span">
            {site.name}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Informations générales */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Informations générales
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Language sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {site.domain}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" mb={1}>
                      <AccessTime sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        Créé {formatDistanceToNow(new Date(site.createdAt), { addSuffix: true, locale: fr })}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center">
                      <Settings sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        Status: {site.status}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <ShoppingCart sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {site.stats.orderCount} commandes
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Euro sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        Revenu total: {site.stats.revenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </Typography>
                    </Box>
                    {site.stats.lastSync && (
                      <Box display="flex" alignItems="center">
                        <AccessTime sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          Dernière synchronisation: {formatDistanceToNow(new Date(site.stats.lastSync), { addSuffix: true, locale: fr })}
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Facturation */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Facturation
                </Typography>
                {loading ? (
                  <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress />
                  </Box>
                ) : billingInfo ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Plan actuel
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {site.billing.plan}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Status: {site.billing.status}
                      </Typography>
                      {site.billing.currentPeriodEnd && (
                        <Typography variant="body2" color="text.secondary">
                          Renouvellement: {format(new Date(site.billing.currentPeriodEnd), 'dd/MM/yyyy')}
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Ce mois-ci
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Commandes: {billingInfo.currentMonth.orderCount}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Revenu: {billingInfo.currentMonth.revenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </Typography>
                    </Grid>
                  </Grid>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Aucune information de facturation disponible
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between', px: 3, py: 2 }}>
        <Button
          startIcon={<DeleteIcon />}
          color="error"
          onClick={() => setDeleteDialogOpen(true)}
          disabled={loading}
        >
          Supprimer le site
        </Button>
        <Button onClick={onClose} color="primary">
          Fermer
        </Button>
      </DialogActions>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer le site {site.name} ? Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleDelete} color="error" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default SiteDetails;
