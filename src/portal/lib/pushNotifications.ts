// OntarioReno Portal — Web Push registration helpers (frontend-only, $0 cost)

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

/** Returns true if push is supported and permission is already granted */
export function getPushPermissionState(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window) || !('PushManager' in window)) return 'unsupported';
  return Notification.permission;
}

/**
 * Registers the service worker, requests notification permission, subscribes,
 * and persists the PushSubscription to the server for the given userId.
 * Returns true on success, false on any failure/denial.
 */
export async function registerPushNotifications(userId: string): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (!vapidPublicKey) {
    console.warn('[Push] VITE_VAPID_PUBLIC_KEY is not set — push notifications disabled.');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    // Re-use existing subscription if present (avoids unnecessary re-subscription)
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    }

    const p256dhBuffer = subscription.getKey('p256dh');
    const authBuffer = subscription.getKey('auth');
    if (!p256dhBuffer || !authBuffer) return false;

    const p256dh = btoa(String.fromCharCode(...new Uint8Array(p256dhBuffer)));
    const auth = btoa(String.fromCharCode(...new Uint8Array(authBuffer)));

    const response = await fetch(`/api/users/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        _action: 'push_subscribe',
        endpoint: subscription.endpoint,
        p256dh,
        auth,
      }),
    });

    return response.ok;
  } catch (error) {
    // Surface the real error so we can diagnose
    throw error;
  }
}

/** Unsubscribes from push on both the browser and server */
export async function unregisterPushNotifications(userId: string): Promise<void> {
  try {
    await fetch(`/api/users/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ _action: 'push_unsubscribe' }),
    });
  } catch {
    // best-effort
  }

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration('/');
    const subscription = await registration?.pushManager.getSubscription();
    await subscription?.unsubscribe().catch(() => {});
  }
}
