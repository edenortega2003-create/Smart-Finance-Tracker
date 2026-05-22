'use client';

import { useEffect, useState } from 'react';

/**
 * Returns the current browser online status and updates reactively
 * when the network state changes (navigator.onLine + online/offline events).
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(
    () => (typeof navigator !== 'undefined' ? navigator.onLine : true),
  );

  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    window.addEventListener('online',  update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online',  update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return isOnline;
}
