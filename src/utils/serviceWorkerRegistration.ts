export function registerServiceWorker(onStatusChange?: (isOnline: boolean) => void) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[SW] ServiceWorker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.warn('[SW] ServiceWorker registration failed:', error);
        });
    });
  }

  // Monitor online/offline state
  window.addEventListener('online', () => {
    onStatusChange?.(true);
  });
  window.addEventListener('offline', () => {
    onStatusChange?.(false);
  });
}
