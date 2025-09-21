import { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
const functions = getFunctions();

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Define the callable function for subscribing
const subscribeToPushCallable = httpsCallable(functions, 'subscribeToPush');

export function useWebPush() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(sub => {
          if (sub) {
            setIsSubscribed(true);
            setSubscription(sub);
          }
          setLoading(false);
        });
      });
    } else {
      setLoading(false);
    }
  }, []);

  const subscribe = async () => {
    if (!isSupported) {
      setError(new Error('?몄떆 ?뚮┝??吏?먮릺吏 ?딅뒗 釉뚮씪?곗??낅땲??'));
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error('VAPID public key is not configured.');
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Send the subscription to the backend
      await subscribeToPushCallable({ subscription: sub.toJSON() });

      setSubscription(sub);
      setIsSubscribed(true);
      setError(null);
      return sub;
    } catch (err: any) {
      console.error('?몄떆 援щ룆 ?ㅽ뙣:', err);
      setError(err);
      // If permission was denied, update state accordingly
      if (Notification.permission === 'denied') {
        // Handle denied permission state in the UI
      }
      throw err;
    }
  };

  // TODO: Implement unsubscribe logic

  return {
    isSupported,
    isSubscribed,
    subscription,
    subscribe,
    error,
    loading,
  };
}

