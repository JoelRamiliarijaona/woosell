'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import {
  Box,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Alert,
  Typography,
  Paper,
  Link,
  MenuItem,
  Category,
  ArrowBack
} from '@mui/material';
import { Visibility, VisibilityOff, Language, Store, Key, Close } from '@mui/icons-material';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';

interface CreateSiteFormData {
  domain: string;
  name: string;
  password: string;
}

interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
  };
}

interface CreateSiteFormProps {
  open: boolean;
  onClose: () => void;
  onSiteCreated: (site: any) => void;
}

const CreateSiteForm: React.FC<CreateSiteFormProps> = ({ open, onClose, onSiteCreated }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateSiteFormData>();

  const handleFormSubmit: SubmitHandler<CreateSiteFormData> = async (data) => {
    setIsLoading(true);
    setError('');

    try {
      // Créer d'abord le site
      const wooCommerceResponse = await axios.post('http://51.159.14.225:7999/v3/create_woo_instance', {
        name: data.name,
        domain: data.domain,
        password: data.password,
        thematic: "general",
        target_audience: "all",
        key_seo_term: "ecommerce"
      }, {
        timeout: 1800000 // 30 minutes
      });

      if (wooCommerceResponse.data) {
        // Créer le site dans notre base de données
        const siteResponse = await axios.post('/api/sites', {
          name: data.name,
          domain: data.domain,
          wooCommerceDetails: wooCommerceResponse.data
        });

        if (siteResponse.data) {
          // Créer la session Stripe
          const stripeResponse = await axios.post('/api/stripe/create-checkout-session', {
            siteId: siteResponse.data.site._id,
            planType: 'standard' // ou 'premium' selon votre logique
          });

          // Rediriger vers la page de paiement Stripe
          const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
          if (stripe) {
            await stripe.redirectToCheckout({
              sessionId: stripeResponse.data.sessionId
            });
          }

          onSiteCreated(siteResponse.data.site);
          reset();
          onClose();
        }
      }
    } catch (error) {
      console.error('Error creating site:', error);
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || error.message || 'Une erreur est survenue lors de la création du site');
      } else {
        setError('Une erreur inattendue est survenue');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          m: { xs: 2, sm: 4 }
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        pb: 1
      }}>
        <Typography variant="h6" component="h2">
          Créer un nouveau site
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box
          component="form"
          onSubmit={handleSubmit(handleFormSubmit)}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            pt: 1
          }}
        >
          <TextField
            label="Nom du site"
            {...register('name', { required: 'Le nom du site est requis' })}
            error={!!errors.name}
            helperText={errors.name?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Store />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Nom de domaine"
            {...register('domain', { 
              required: 'Le domaine est requis',
              pattern: {
                value: /^[a-zA-Z0-9][a-zA-Z0-9-_.]*[a-zA-Z0-9]\.([a-zA-Z]{2,})+$/,
                message: 'Format de domaine invalide. Exemple: mon-site.com'
              }
            })}
            error={!!errors.domain}
            helperText={errors.domain?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Language />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            type={showPassword ? 'text' : 'password'}
            label="Mot de passe administrateur"
            {...register('password', { 
              required: 'Le mot de passe est requis',
              minLength: {
                value: 8,
                message: 'Le mot de passe doit contenir au moins 8 caractères'
              }
            })}
            error={!!errors.password}
            helperText={errors.password?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Key />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            fullWidth
            sx={{ mt: 2 }}
            startIcon={isLoading ? <CircularProgress size={20} /> : <Store />}
          >
            Créer le site
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSiteForm;
