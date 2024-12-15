import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  ShoppingCart,
  Dashboard,
  Store,
  Euro,
  Receipt,
  Delete as DeleteIcon
} from '@mui/icons-material';

interface SiteDetailsProps {
  site: Site | null;
  onClose: () => void;
  open: boolean;
}

interface BillingInfo {
  currentMonth: {
    orderCount: number;
    amount: number;
    startDate: string;
    endDate: string;
  };
  previousMonth: {
    orderCount: number;
    amount: number;
    startDate: string;
    endDate: string;
  };
}

const SiteDetails: FC<SiteDetailsProps> = ({ site, onClose, open }) => {
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (site && open) {
      fetchBillingInfo();
    }
  }, [site, open]);

  const fetchBillingInfo = async () => {
    if (!site) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/sites/${site._id}/billing`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch billing information');
      }
      
      const data = await response.json();
      setBillingInfo(data);
    } catch (err) {
      console.error('Error fetching billing info:', err);
      setError('Une erreur est survenue lors du chargement des informations de facturation');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!site) return;
    
    setDeleteLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/sites/${site._id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete site');
      }
      
      onClose();
      window.location.reload(); // Rafraîchir la page pour mettre à jour la liste
    } catch (err) {
      console.error('Error deleting site:', err);
      setError('Une erreur est survenue lors de la suppression du site');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!site) return null;

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

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Store sx={{ color: 'primary.main' }} />
            <Typography variant="h6">{site.name}</Typography>
            <Chip
              size="small"
              label={site.status}
              color={getStatusColor(site.status)}
              sx={{ ml: 1 }}
            />
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            {/* Informations du site */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Informations du site
              </Typography>
              <Box sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Domaine
                    </Typography>
                    <Typography sx={{ display: 'block', wordBreak: 'break-all' }}>
                      {site.domain}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Type de produit
                    </Typography>
                    <Typography>{site.productType}</Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid>

            {/* Accès rapides */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Accès rapides
              </Typography>
              <Box sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Dashboard />}
                      href={`https://${site.domain}/wp-admin`}
                      target="_blank"
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      WordPress Admin
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<ShoppingCart />}
                      href={`https://${site.domain}/wp-admin/admin.php?page=wc-admin`}
                      target="_blank"
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      WooCommerce Dashboard
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Grid>

            {/* Facturation */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Facturation
              </Typography>
              <Box sx={{ p: 2 }}>
                <Grid container spacing={3}>
                  {/* Mois en cours */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ 
                      p: 2, 
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      height: '100%'
                    }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Mois en cours
                      </Typography>
                      {loading ? (
                        <Typography variant="body2" color="text.secondary">
                          Chargement...
                        </Typography>
                      ) : error ? (
                        <Typography variant="body2" color="error.main">
                          {error}
                        </Typography>
                      ) : billingInfo ? (
                        <>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <ShoppingCart sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography>
                              {billingInfo.currentMonth.orderCount} commandes
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Euro sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography>
                              {billingInfo.currentMonth.amount.toFixed(2)}€
                            </Typography>
                          </Box>
                        </>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Aucune donnée disponible
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  {/* Mois précédent */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ 
                      p: 2, 
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      height: '100%',
                      bgcolor: 'action.hover'
                    }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Mois précédent
                      </Typography>
                      {loading ? (
                        <Typography variant="body2" color="text.secondary">
                          Chargement...
                        </Typography>
                      ) : error ? (
                        <Typography variant="body2" color="error.main">
                          {error}
                        </Typography>
                      ) : billingInfo ? (
                        <>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <ShoppingCart sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography>
                              {billingInfo.previousMonth.orderCount} commandes
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Euro sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography>
                              {billingInfo.previousMonth.amount.toFixed(2)}€
                            </Typography>
                          </Box>
                        </>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Aucune donnée disponible
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ borderTop: '1px solid', borderColor: 'divider', p: 2 }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleteLoading}
          >
            Supprimer le site
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue de confirmation de suppression */}
      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirmer la suppression
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Êtes-vous sûr de vouloir supprimer le site "{site?.name}" ?
            Cette action est irréversible et supprimera également toutes les données associées.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowDeleteConfirm(false)}
            disabled={deleteLoading}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deleteLoading ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SiteDetails;
