'use client';

import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      // Installability is best-effort in local/dev; commercial APIs stay network-only in sw.js.
    });
  }, []);
  return null;
}
