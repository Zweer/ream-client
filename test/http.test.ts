import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  ReamAuthError,
  ReamNotFoundError,
  ReamRateLimitError,
  ReamServerError,
} from '../lib/errors.js';
import { HttpClient } from '../lib/http.js';
import type { Session } from '../lib/types.js';

const BASE_URL = 'http://localhost';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function createClient(): HttpClient {
  return new HttpClient({ baseUrl: BASE_URL, maxRetries: 0, retryDelayMs: 10 });
}

function createSession(): Session {
  return {
    authToken: 'test-token',
    userKey: 'test-user-key',
    sid: 'test-sid',
    displayName: 'Test User',
    email: 'test@example.com',
    handle: 'testuser',
    isAuthor: true,
    canSeeMature: true,
    stripeAccountId: null,
    stripeAccountType: null,
    stripeCustomerId: null,
    deviceKey: 'test-device-key',
    deviceFingerprint: 'dGVzdA==',
    timezone: 'Europe/Rome',
  };
}

describe('HttpClient', () => {
  describe('request routing', () => {
    it('should route /api/user/* requests', async () => {
      server.use(
        http.post(`${BASE_URL}:5001/api/user/settings/get`, () => {
          return HttpResponse.json({ Message: 'Success.' });
        }),
      );

      const client = createClient();
      const result = await client.request('/api/user/settings/get', { body: {} });

      expect(result).toEqual({ Message: 'Success.' });
    });

    it('should route /api/page/* requests', async () => {
      server.use(
        http.post(`${BASE_URL}:5003/api/page/get`, () => {
          return HttpResponse.json({ Page: {}, Message: 'Success.' });
        }),
      );

      const client = createClient();
      const result = await client.request('/api/page/get', { body: {} });

      expect(result).toEqual({ Page: {}, Message: 'Success.' });
    });

    it('should route /api/story/* requests', async () => {
      server.use(
        http.post(`${BASE_URL}:5002/api/story/user/list`, () => {
          return HttpResponse.json({ Stories: [], Message: 'Success.' });
        }),
      );

      const client = createClient();
      const result = await client.request('/api/story/user/list', { body: {} });

      expect(result).toEqual({ Stories: [], Message: 'Success.' });
    });

    it('should allow port override', async () => {
      server.use(
        http.post(`${BASE_URL}:5001/api/story/something`, () => {
          return HttpResponse.json({ Message: 'Overridden.' });
        }),
      );

      const client = createClient();
      const result = await client.request('/api/story/something', { body: {}, port: 5001 });

      expect(result).toEqual({ Message: 'Overridden.' });
    });
  });

  describe('authentication headers', () => {
    it('should include auth headers when session is set', async () => {
      server.use(
        http.post(`${BASE_URL}:5002/api/story/user/list`, ({ request }) => {
          expect(request.headers.get('authorization')).toBe('test-token');
          expect(request.headers.get('userkey')).toBe('test-user-key');
          expect(request.headers.get('sid')).toBe('test-sid');
          expect(request.headers.get('x-ream-device-key')).toBe('test-device-key');
          expect(request.headers.get('x-ream-device-fingerprint')).toBe('dGVzdA==');
          expect(request.headers.get('x-ream-timezone')).toBe('Europe/Rome');
          expect(request.headers.get('ngsw-bypass')).toBe('true');

          return HttpResponse.json({ Stories: [] });
        }),
      );

      const client = createClient();
      client.setSession(createSession());
      await client.request('/api/story/user/list', { body: {} });
    });

    it('should not include auth headers when skipAuth is true', async () => {
      server.use(
        http.post(`${BASE_URL}:5001/api/user/authenticate`, ({ request }) => {
          expect(request.headers.get('authorization')).toBeNull();
          expect(request.headers.get('userkey')).toBeNull();
          expect(request.headers.get('sid')).toBeNull();

          return HttpResponse.json({ AuthToken: 'new-token' });
        }),
      );

      const client = createClient();
      client.setSession(createSession());
      await client.request('/api/user/authenticate', { body: {}, skipAuth: true });
    });

    it('should not include auth headers when no session', async () => {
      server.use(
        http.post(`${BASE_URL}:5002/api/story/user/list`, ({ request }) => {
          expect(request.headers.get('authorization')).toBeNull();
          expect(request.headers.get('userkey')).toBeNull();

          return HttpResponse.json({ Stories: [] });
        }),
      );

      const client = createClient();
      await client.request('/api/story/user/list', { body: {} });
    });
  });

  describe('error mapping', () => {
    it('should throw ReamAuthError on 401', async () => {
      server.use(
        http.post(`${BASE_URL}:5002/api/story/user/list`, () => {
          return HttpResponse.json({ Message: 'Unauthorized' }, { status: 401 });
        }),
      );

      const client = createClient();

      await expect(client.request('/api/story/user/list')).rejects.toThrow(ReamAuthError);
    });

    it('should throw ReamNotFoundError on 404', async () => {
      server.use(
        http.post(`${BASE_URL}:5002/api/story/details/get`, () => {
          return HttpResponse.json({ Message: 'Could not find that story.' }, { status: 404 });
        }),
      );

      const client = createClient();

      await expect(client.request('/api/story/details/get')).rejects.toThrow(ReamNotFoundError);
    });

    it('should throw ReamRateLimitError on 429 with retryAfter', async () => {
      server.use(
        http.post(`${BASE_URL}:5002/api/story/user/list`, () => {
          return HttpResponse.json(
            { Message: 'Too many requests' },
            { status: 429, headers: { 'retry-after': '30' } },
          );
        }),
      );

      const client = createClient();

      try {
        await client.request('/api/story/user/list');
      } catch (error) {
        expect(error).toBeInstanceOf(ReamRateLimitError);
        expect((error as ReamRateLimitError).retryAfter).toBe(30);
      }
    });

    it('should throw ReamServerError on 500', async () => {
      server.use(
        http.post(`${BASE_URL}:5002/api/story/details/update`, () => {
          return HttpResponse.json({ Message: 'Maturity rating should be set' }, { status: 500 });
        }),
      );

      const client = createClient();

      await expect(client.request('/api/story/details/update')).rejects.toThrow(ReamServerError);
    });
  });

  describe('retry logic', () => {
    it('should retry on 500 up to maxRetries', async () => {
      let attempts = 0;

      server.use(
        http.post(`${BASE_URL}:5002/api/story/user/list`, () => {
          attempts++;
          if (attempts < 3) {
            return HttpResponse.json({ Message: 'Error' }, { status: 500 });
          }
          return HttpResponse.json({ Stories: [], Message: 'Success.' });
        }),
      );

      const client = new HttpClient({ baseUrl: BASE_URL, maxRetries: 3, retryDelayMs: 10 });
      const result = await client.request('/api/story/user/list');

      expect(result).toEqual({ Stories: [], Message: 'Success.' });
      expect(attempts).toBe(3);
    });

    it('should not retry on 404', async () => {
      let attempts = 0;

      server.use(
        http.post(`${BASE_URL}:5002/api/story/details/get`, () => {
          attempts++;
          return HttpResponse.json({ Message: 'Not found' }, { status: 404 });
        }),
      );

      const client = new HttpClient({ baseUrl: BASE_URL, maxRetries: 3, retryDelayMs: 10 });

      await expect(client.request('/api/story/details/get')).rejects.toThrow(ReamNotFoundError);
      expect(attempts).toBe(1);
    });
  });

  describe('session management', () => {
    it('should return null session initially', () => {
      const client = createClient();
      expect(client.getSession()).toBeNull();
    });

    it('should store and retrieve session', () => {
      const client = createClient();
      const session = createSession();

      client.setSession(session);

      expect(client.getSession()).toEqual(session);
    });

    it('should clear session', () => {
      const client = createClient();
      client.setSession(createSession());
      client.clearSession();

      expect(client.getSession()).toBeNull();
    });
  });

  describe('GET requests', () => {
    it('should support GET method', async () => {
      server.use(
        http.get(`${BASE_URL}:5002/api/story/categories`, () => {
          return HttpResponse.json({ Categories: [], Message: 'Success.' });
        }),
      );

      const client = createClient();
      const result = await client.request('/api/story/categories', { method: 'GET' });

      expect(result).toEqual({ Categories: [], Message: 'Success.' });
    });
  });
});
