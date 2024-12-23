'use client';

import { Alert, Snackbar } from '@mui/material';
import { useEffect, useState } from 'react';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  timestamp: Date;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications');
        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
          if (data.length > 0) {
            setCurrentNotification(data[0]);
            setOpen(true);
          }
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    // Fetch notifications only once at component mount
    fetchNotifications();
  }, []);

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpen(false);
    
    // Remove the current notification and show the next one if available
    if (currentNotification) {
      setNotifications(prev => prev.filter(n => n.id !== currentNotification.id));
      const nextNotification = notifications.find(n => n.id !== currentNotification.id);
      if (nextNotification) {
        setTimeout(() => {
          setCurrentNotification(nextNotification);
          setOpen(true);
        }, 500);
      }
    }
  };

  if (!currentNotification) {
    return null;
  }

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={handleClose}
        severity={currentNotification.type}
        variant="filled"
      >
        {currentNotification.message}
      </Alert>
    </Snackbar>
  );
}
