import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { encodeFingerprint, generateDeviceKey, login, logout } from '../lib/auth.js';
import { ReamAuthError } from '../lib/errors.js';
import { HttpClient } from '../lib/http.js';
import type { DeviceFingerprint } from '../lib/types.js';

const BASE_URL = 'http://localhost';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function createClient(): HttpClient {
  return new HttpClient({ baseUrl: BASE_URL, maxRetries: 0 });
}

const MOCK_LOGIN_RESPONSE = {
  AuthToken: 'U2FsdGVkX1_test_token',
  StripeAccountId: null,
  StripeAccountType: null,
  StripeCustomerId: null,
  UserKey: 'mmwj4ghge2bdc8',
  DisplayName: 'TestUser',
  SID: 'msej9s0711f26b',
  IsAuthor: 1,
  Email: 'test@example.com',
  EmailVerified: 1,
  NeverShowFollowAgain: 0,
  CanSeeMature: 1,
  Handle: 'testuser',
  Message: 'Authenticated.',
};

describe('auth', () => {
  describe('generateDeviceKey', () => {
    it('should generate a 32-char hex string', () => {
      const key = generateDeviceKey();

      expect(key).toHaveLength(32);
      expect(key).toMatch(/^[a-f0-9]+$/);
    });

    it('should generate unique keys', () => {
      const key1 = generateDeviceKey();
      const key2 = generateDeviceKey();

      expect(key1).not.toBe(key2);
    });
  });

  describe('encodeFingerprint', () => {
    it('should encode fingerprint as base64 JSON', () => {
      const fingerprint: DeviceFingerprint = {
        userAgent: 'test-agent',
        languages: ['en'],
        hardwareConcurrency: 4,
        deviceMemory: 8,
        webglVendor: 'Test',
        webglRenderer: 'Test',
      };

      const encoded = encodeFingerprint(fingerprint);
      const decoded = JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'));

      expect(decoded).toEqual(fingerprint);
    });
  });

  describe('login', () => {
    it('should authenticate and set session on httpClient', async () => {
      server.use(
        http.post(`${BASE_URL}:5001/api/user/authenticate`, () => {
          return HttpResponse.json(MOCK_LOGIN_RESPONSE);
        }),
      );

      const client = createClient();
      const session = await login(client, 'test@example.com', 'password123');

      expect(session.authToken).toBe('U2FsdGVkX1_test_token');
      expect(session.userKey).toBe('mmwj4ghge2bdc8');
      expect(session.sid).toBe('msej9s0711f26b');
      expect(session.displayName).toBe('TestUser');
      expect(session.email).toBe('test@example.com');
      expect(session.handle).toBe('testuser');
      expect(session.isAuthor).toBe(true);
      expect(session.canSeeMature).toBe(true);

      // Session should be set on the client
      expect(client.getSession()).toEqual(session);
    });

    it('should send credentials in request body', async () => {
      server.use(
        http.post(`${BASE_URL}:5001/api/user/authenticate`, async ({ request }) => {
          const body = (await request.json()) as Record<string, string>;

          expect(body.Email).toBe('user@test.com');
          expect(body.Password).toBe('secret');

          return HttpResponse.json(MOCK_LOGIN_RESPONSE);
        }),
      );

      const client = createClient();
      await login(client, 'user@test.com', 'secret');
    });

    it('should send device headers', async () => {
      server.use(
        http.post(`${BASE_URL}:5001/api/user/authenticate`, ({ request }) => {
          expect(request.headers.get('x-ream-device-key')).toBe('custom-device-key');
          expect(request.headers.get('x-ream-device-fingerprint')).toBeTruthy();
          expect(request.headers.get('x-ream-timezone')).toBe('America/New_York');

          return HttpResponse.json(MOCK_LOGIN_RESPONSE);
        }),
      );

      const client = createClient();
      await login(client, 'test@example.com', 'pass', {
        deviceKey: 'custom-device-key',
        timezone: 'America/New_York',
      });
    });

    it('should throw ReamAuthError on failed login', async () => {
      server.use(
        http.post(`${BASE_URL}:5001/api/user/authenticate`, () => {
          return HttpResponse.json({ Message: 'Invalid credentials' }, { status: 401 });
        }),
      );

      const client = createClient();

      await expect(login(client, 'bad@example.com', 'wrong')).rejects.toThrow(ReamAuthError);
      expect(client.getSession()).toBeNull();
    });

    it('should map IsAuthor: 0 to false', async () => {
      server.use(
        http.post(`${BASE_URL}:5001/api/user/authenticate`, () => {
          return HttpResponse.json({ ...MOCK_LOGIN_RESPONSE, IsAuthor: 0 });
        }),
      );

      const client = createClient();
      const session = await login(client, 'test@example.com', 'pass');

      expect(session.isAuthor).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear the session', async () => {
      server.use(
        http.post(`${BASE_URL}:5001/api/user/authenticate`, () => {
          return HttpResponse.json(MOCK_LOGIN_RESPONSE);
        }),
      );

      const client = createClient();
      await login(client, 'test@example.com', 'pass');

      expect(client.getSession()).not.toBeNull();

      logout(client);

      expect(client.getSession()).toBeNull();
    });
  });
});
