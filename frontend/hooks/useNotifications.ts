import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export function useNotifications() {
  const { user, token } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isEmailSubscribed, setIsEmailSubscribed] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      checkSubscription();
    }

    // Fetch user preferences for email notifications
    if (user && token) {
      fetch('https://versiculus.onrender.com/api/notifications/preferences', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.email_notifications !== undefined) {
          setIsEmailSubscribed(data.email_notifications);
        }
      })
      .catch(err => console.error('Failed to fetch notification preferences', err));
    }
  }, [user, token]);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
  
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
  
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err) {
      console.error('Error checking subscription', err);
    }
  };

  const subscribe = async () => {
    if (!isSupported) return false;
    
    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      
      if (permissionResult !== 'granted') {
        throw new Error('Notification permission denied');
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Fetch VAPID public key from backend
      const res = await fetch('https://versiculus.onrender.com/api/notifications/public-key');
      const publicKey = await res.text();

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      // Send to backend
      if (user && token) {
        await fetch('https://versiculus.onrender.com/api/notifications/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ subscription })
        });
      }

      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error('Failed to subscribe the user: ', err);
      return false;
    }
  };

  const toggleEmailSubscription = async () => {
    if (!user || !token) return;
    setIsEmailLoading(true);
    try {
      const newStatus = !isEmailSubscribed;
      const res = await fetch('https://versiculus.onrender.com/api/notifications/email-subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ enabled: newStatus })
      });
      
      if (res.ok) {
        setIsEmailSubscribed(newStatus);
      }
    } catch (err) {
      console.error('Failed to update email preferences', err);
    } finally {
      setIsEmailLoading(false);
    }
  };

  return {
    isSupported,
    isSubscribed,
    permission,
    subscribe,
    isEmailSubscribed,
    isEmailLoading,
    toggleEmailSubscription
  };
}