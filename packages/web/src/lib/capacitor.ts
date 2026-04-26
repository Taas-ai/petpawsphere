import { Capacitor } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'

export function getApiBaseUrl(): string {
  if (isNative) {
    // In native app, API rewrites are handled by Firebase Hosting → Functions
    return import.meta.env.VITE_API_URL || 'https://petapp-38f4a.web.app';
  }
  // In web production (Firebase Hosting), /api/* is rewritten to Functions
  // In development, Vite proxy handles /api
  return '';
}
