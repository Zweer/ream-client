import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { ReamClient } from '../lib/client.js';

const BASE_URL = 'http://localhost';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const MOCK_LOGIN_RESPONSE = {
  AuthToken: 'test-token',
  StripeAccountId: null,
  StripeAccountType: null,
  StripeCustomerId: null,
  UserKey: 'user1',
  DisplayName: 'Test',
  SID: 'sid1',
  IsAuthor: 1,
  Email: 'test@example.com',
  EmailVerified: 1,
  NeverShowFollowAgain: 0,
  CanSeeMature: 1,
  Handle: 'test',
  Message: 'Authenticated.',
};

function setupLoginHandler(): void {
  server.use(
    http.post(`${BASE_URL}:5001/api/user/authenticate`, () => {
      return HttpResponse.json(MOCK_LOGIN_RESPONSE);
    }),
  );
}

function createReamClient(): ReamClient {
  return new ReamClient({
    email: 'test@example.com',
    password: 'password',
    baseUrl: BASE_URL,
  });
}

describe('ReamClient', () => {
  describe('authentication', () => {
    it('should lazy-login on first API call', async () => {
      setupLoginHandler();
      server.use(
        http.post(`${BASE_URL}:5002/api/story/user/list`, () => {
          return HttpResponse.json({ Stories: [], Message: 'Success.' });
        }),
      );

      const client = createReamClient();

      expect(client.getSession()).toBeNull();

      const stories = await client.listStories();

      expect(stories).toEqual([]);
      expect(client.getSession()).not.toBeNull();
      expect(client.getSession()?.userKey).toBe('user1');
    });

    it('should not re-login on subsequent calls', async () => {
      let loginCount = 0;

      server.use(
        http.post(`${BASE_URL}:5001/api/user/authenticate`, () => {
          loginCount++;
          return HttpResponse.json(MOCK_LOGIN_RESPONSE);
        }),
        http.post(`${BASE_URL}:5002/api/story/user/list`, () => {
          return HttpResponse.json({ Stories: [], Message: 'Success.' });
        }),
      );

      const client = createReamClient();
      await client.listStories();
      await client.listStories();

      expect(loginCount).toBe(1);
    });

    it('should clear session on logout', async () => {
      setupLoginHandler();
      server.use(
        http.post(`${BASE_URL}:5002/api/story/user/list`, () => {
          return HttpResponse.json({ Stories: [], Message: 'Success.' });
        }),
      );

      const client = createReamClient();
      await client.listStories();

      expect(client.getSession()).not.toBeNull();

      client.logout();

      expect(client.getSession()).toBeNull();
    });
  });

  describe('stories', () => {
    it('should list stories for the authenticated user', async () => {
      setupLoginHandler();
      server.use(
        http.post(`${BASE_URL}:5002/api/story/user/list`, async ({ request }) => {
          const body = (await request.json()) as Record<string, string>;
          expect(body.UserKey).toBe('user1');

          return HttpResponse.json({
            Stories: [{ StoryKey: 's1', Title: 'Test Story' }],
            Message: 'Success.',
          });
        }),
      );

      const client = createReamClient();
      const stories = await client.listStories();

      expect(stories).toHaveLength(1);
      expect(stories[0].Title).toBe('Test Story');
    });
  });

  describe('pages', () => {
    it('should list pages for the authenticated user', async () => {
      setupLoginHandler();
      server.use(
        http.post(`${BASE_URL}:5003/api/page/list`, async ({ request }) => {
          const body = (await request.json()) as Record<string, string>;
          expect(body.UserKey).toBe('user1');

          return HttpResponse.json({
            Pages: [{ PageKey: 'p1', Name: 'My Page' }],
            Message: 'Pages Found.',
          });
        }),
      );

      const client = createReamClient();
      const pages = await client.listPages();

      expect(pages).toHaveLength(1);
      expect(pages[0].PageKey).toBe('p1');
    });
  });

  describe('posts', () => {
    it('should create a post', async () => {
      setupLoginHandler();
      server.use(
        http.post(`${BASE_URL}:5003/api/page/post/add`, () => {
          return HttpResponse.json({ PostKey: 'new-post', Message: 'Post Created.' });
        }),
      );

      const client = createReamClient();
      const postKey = await client.createPost({
        PageKey: 'page1',
        PostTitle: 'Hello',
        Content: '<p>World</p>',
        UserKey: 'user1',
        TierKeys: 'tier1',
        RelatedTo: null,
        ReleaseDate: null,
        IsScheduled: false,
        TimeZone: 'Europe/Rome',
        CreatedDate: '2026-08-04 12:38:13',
      });

      expect(postKey).toBe('new-post');
    });
  });
});
