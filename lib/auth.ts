import { randomBytes } from 'node:crypto';

import type { HttpClient } from './http.js';
import type { DeviceFingerprint, LoginResponse, Session } from './types.js';

const DEFAULT_DEVICE_FINGERPRINT: DeviceFingerprint = {
  userAgent: 'ream-client/1.0.0 (Node.js)',
  languages: ['en-US', 'en'],
  hardwareConcurrency: 4,
  deviceMemory: 8,
  webglVendor: 'Node.js',
  webglRenderer: 'Software',
};

/**
 * Generate a random device key (hex string).
 */
export function generateDeviceKey(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Encode a device fingerprint as base64 JSON string.
 */
export function encodeFingerprint(fingerprint: DeviceFingerprint): string {
  return Buffer.from(JSON.stringify(fingerprint)).toString('base64');
}

/**
 * Authenticate with Ream using email/password credentials.
 *
 * @param httpClient - The HTTP client instance
 * @param email - User email
 * @param password - User password
 * @param options - Optional device fingerprint and timezone
 * @returns The authenticated session
 */
export async function login(
  httpClient: HttpClient,
  email: string,
  password: string,
  options: { fingerprint?: DeviceFingerprint; timezone?: string; deviceKey?: string } = {},
): Promise<Session> {
  const fingerprint = options.fingerprint ?? DEFAULT_DEVICE_FINGERPRINT;
  const timezone = options.timezone ?? 'Europe/Rome';
  const deviceKey = options.deviceKey ?? generateDeviceKey();
  const encodedFingerprint = encodeFingerprint(fingerprint);

  const response = await httpClient.request<LoginResponse>('/api/user/authenticate', {
    body: { Email: email, Password: password },
    port: 5001,
    skipAuth: true,
    headers: {
      'x-ream-device-key': deviceKey,
      'x-ream-device-fingerprint': encodedFingerprint,
      'x-ream-timezone': timezone,
    },
  });

  const session: Session = {
    authToken: response.AuthToken,
    userKey: response.UserKey,
    sid: response.SID,
    displayName: response.DisplayName,
    email: response.Email,
    handle: response.Handle,
    isAuthor: response.IsAuthor === 1,
    canSeeMature: response.CanSeeMature === 1,
    stripeAccountId: response.StripeAccountId,
    stripeAccountType: response.StripeAccountType,
    stripeCustomerId: response.StripeCustomerId,
    deviceKey,
    deviceFingerprint: encodedFingerprint,
    timezone,
  };

  httpClient.setSession(session);

  return session;
}

/**
 * Clear the active session (client-side only, no API call).
 */
export function logout(httpClient: HttpClient): void {
  httpClient.clearSession();
}
