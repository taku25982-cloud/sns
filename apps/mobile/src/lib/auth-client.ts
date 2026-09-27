import { expoClient } from '@better-auth/expo/client';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const apiBaseURL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

export const authClient = apiBaseURL ? createAuthClient({
  baseURL: apiBaseURL,
  plugins: [expoClient({ scheme: 'tracksocial', storagePrefix: 'tracksocial', storage: SecureStore })],
}) : null;

export async function apiRequest(path: string, init: RequestInit = {}) {
  if (!apiBaseURL || !authClient) throw new Error('api_not_configured');
  const headers = new Headers(init.headers);
  if (Platform.OS !== 'web') {
    const cookie = await authClient.getCookie();
    if (!cookie) throw new Error('authentication_required');
    headers.set('Cookie', cookie);
  }
  return fetch(`${apiBaseURL}${path}`, {
    ...init,
    credentials: Platform.OS === 'web' ? 'include' : 'omit',
    headers,
  });
}
