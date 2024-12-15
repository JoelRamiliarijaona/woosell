'use client';

import { Button } from '@mui/material';

export default function ClearCollections() {
  const clearCollections = async () => {
    try {
      const response = await fetch('/api/admin/clear-collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      alert(JSON.stringify(data, null, 2));
    } catch (error) {
      alert('Erreur: ' + (error as Error).message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Administration - Nettoyage des collections</h1>
      <Button 
        variant="contained" 
        color="error" 
        onClick={clearCollections}
        style={{ marginTop: '20px' }}
      >
        Vider les collections sites et billing
      </Button>
    </div>
  );
}
