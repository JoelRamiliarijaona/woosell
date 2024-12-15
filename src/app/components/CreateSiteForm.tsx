import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
  Alert
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Language,
  Store,
  Key,
  Close
} from '@mui/icons-material';
import axios from 'axios';

interface CreateSiteFormData {
  name: string;
  domain: string;
  password: string;
}

interface SiteResponse {
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

interface CreateSiteFormProps {
  open: boolean;
  onClose: () => void;
  onSiteCreated: (site: SiteResponse) => void;
}

export default function CreateSiteForm({ open, onClose, onSiteCreated }: CreateSiteFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateSiteFormData>();

  const onSubmit = async (data: CreateSiteFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post<{ site: SiteResponse }>('/api/sites', data);
      onSiteCreated(response.data.site);
      reset();
      onClose();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || 'Une erreur est survenue');
      } else {
        setError('Une erreur inattendue est survenue');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          Créer un nouveau site
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            mt: 2
          }}
        >
          <TextField
            label="Nom du site"
            {...register('name', {
              required: 'Le nom du site est requis',
              minLength: {
                value: 3,
                message: 'Le nom doit contenir au moins 3 caractères'
              }
            })}
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
            label="Domaine"
            {...register('domain', {
              required: 'Le domaine est requis',
              pattern: {
                value: /^[a-zA-Z0-9][a-zA-Z0-9-_.]*[a-zA-Z0-9]\.([a-zA-Z]{2,})+$/,
                message: 'Format de domaine invalide (ex: mon-site.com)'
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
}
