import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { apiUrl } from '../lib/api';

export function useNotifications() {
  const { user, token } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isPushLoading, setIsPushLoading] = useState(false);
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
      fetch(apiUrl('/api/notifications/preferences'), {
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
      const existing = await navigator.serviceWorker.getRegistration();
      const registration = existing || (await navigator.serviceWorker.register('/sw.js'));
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err) {
      console.error('Error checking subscription', err);
    }
  };

  const subscribe = async () => {
    if (!isSupported) return false;
    
    try {
      if (!user || !token) {
        return false;
      }
      setIsPushLoading(true);
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      
      if (permissionResult !== 'granted') {
        throw new Error('Notification permission denied');
      }

      const existing = await navigator.serviceWorker.getRegistration();
      const registration = existing || (await navigator.serviceWorker.register('/sw.js'));
      
      // Fetch VAPID public key from backend
      const res = await fetch(apiUrl('/api/notifications/public-key'));
      const publicKey = await res.text();

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      // Send to backend
      const saveRes = await fetch(apiUrl('/api/notifications/subscribe'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subscription })
      });
      if (!saveRes.ok) {
        try {
          await subscription.unsubscribe();
        } catch {}
        setIsSubscribed(false);
        return false;
      }

      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error('Failed to subscribe the user: ', err);
      return false;
    } finally {
      setIsPushLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!isSupported) return false;
    
    try {
      if (!user || !token) {
        return false;
      }
      setIsPushLoading(true);
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
      }

      // Send to backend to remove subscription
      await fetch(apiUrl('/api/notifications/subscribe'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subscription: null })
      });

      setIsSubscribed(false);
      return true;
    } catch (err) {
      console.error('Failed to unsubscribe the user: ', err);
      return false;
    } finally {
      setIsPushLoading(false);
    }
  };

  const toggleEmailSubscription = async () => {
    if (!user || !token) return;
    setIsEmailLoading(true);
    const newStatus = !isEmailSubscribed;
    setIsEmailSubscribed(newStatus);
    try {
      const res = await fetch(apiUrl('/api/notifications/email-subscribe'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ enabled: newStatus })
      });
      
      if (!res.ok) {
        setIsEmailSubscribed(!newStatus);
      }
    } catch (err) {
      setIsEmailSubscribed(!newStatus);
      console.error('Failed to update email preferences', err);
    } finally {
      setIsEmailLoading(false);
    }
  };

  return {
    isSupported,
    isSubscribed,
    permission,
    isPushLoading,
    subscribe,
    unsubscribe,
    isEmailSubscribed,
    isEmailLoading,
    toggleEmailSubscription
  };
}
