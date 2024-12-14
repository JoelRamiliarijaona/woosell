'use client';

import { useState } from 'react';
import type { FC } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { 
  TextField, 
  Button, 
  Box, 
  Paper,
  Typography,
  CircularProgress,
  InputAdornment,
  IconButton,
  MenuItem,
  Link
} from '@mui/material';
import { Visibility, VisibilityOff, Language, Store, Key, Category, ArrowBack } from '@mui/icons-material';

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

interface CreateSiteFormProps {
  onSuccess?: (site: ApiResponse<CreateSiteFormData>) => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
}

const CreateSiteForm: FC<CreateSiteFormProps> = ({ onSuccess, onError, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<CreateSiteFormData>();

  const onSubmit: SubmitHandler<CreateSiteFormData> = async (data) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<CreateSiteFormData> = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Échec de la création du site');
      }

      onSuccess?.(result);
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Paper elevation={2} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Link
          component="button"
          onClick={onCancel}
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: 'text.secondary',
            textDecoration: 'none',
            '&:hover': {
              color: 'primary.main',
            },
          }}
        >
          <ArrowBack sx={{ mr: 1 }} />
          Retour à la liste
        </Link>
      </Box>

      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 4 }}>
        Créer un nouveau site
      </Typography>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <TextField
          {...register('domain', { 
            required: 'Le domaine est requis',
            pattern: {
              value: /^[a-zA-Z0-9][a-zA-Z0-9-]*\.([a-zA-Z]{2,}|[a-zA-Z0-9-]{2,}\.[a-zA-Z]{2,})$/,
              message: 'Format de domaine invalide. Exemple: monsite.com'
            }
          })}
          margin="normal"
          required
          fullWidth
          id="domain"
          label="Nom de domaine"
          placeholder="monsite.com"
          error={!!errors.domain}
          helperText={errors.domain?.message || 'Exemple: monsite.com'}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Language color="action" />
              </InputAdornment>
            ),
          }}
          disabled={isLoading}
        />

        <TextField
          {...register('name', { 
            required: 'Le nom est requis',
            minLength: {
              value: 2,
              message: 'Le nom doit contenir au moins 2 caractères'
            }
          })}
          margin="normal"
          required
          fullWidth
          id="name"
          label="Nom du site"
          error={!!errors.name}
          helperText={errors.name?.message}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Store color="action" />
              </InputAdornment>
            ),
          }}
          disabled={isLoading}
        />

        <TextField
          {...register('password', { 
            required: 'Le mot de passe est requis',
            minLength: {
              value: 8,
              message: 'Le mot de passe doit contenir au moins 8 caractères'
            }
          })}
          margin="normal"
          required
          fullWidth
          id="password"
          label="Mot de passe"
          type={showPassword ? 'text' : 'password'}
          error={!!errors.password}
          helperText={errors.password?.message}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Key color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleClickShowPassword}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          disabled={isLoading}
        />

        <TextField
          {...register('productType', { 
            required: 'Le type de produit est requis' 
          })}
          margin="normal"
          required
          fullWidth
          id="productType"
          label="Type de produit"
          select
          error={!!errors.productType}
          helperText={errors.productType?.message}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Category color="action" />
              </InputAdornment>
            ),
          }}
          disabled={isLoading}
        >
          <MenuItem value="hairbrush">Brosse à cheveux</MenuItem>
          <MenuItem value="clothing">Vêtements</MenuItem>
          <MenuItem value="electronics">Électronique</MenuItem>
          <MenuItem value="jewelry">Bijoux</MenuItem>
          <MenuItem value="beauty">Beauté</MenuItem>
          <MenuItem value="home">Maison</MenuItem>
          <MenuItem value="sports">Sports</MenuItem>
          <MenuItem value="toys">Jouets</MenuItem>
          <MenuItem value="books">Livres</MenuItem>
          <MenuItem value="other">Autre</MenuItem>
        </TextField>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          sx={{ mt: 4 }}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              Création en cours...
            </>
          ) : (
            'Créer le site'
          )}
        </Button>
      </Box>
    </Paper>
  );
};

export default CreateSiteForm;
