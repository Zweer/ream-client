import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { HttpClient } from '../lib/http.js';
import {
  createPost,
  deletePost,
  getPost,
  listPinnedPosts,
  listPosts,
  updatePost,
} from '../lib/posts.js';
import type { Post } from '../lib/types.js';

const BASE_URL = 'http://localhost';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function createClient(): HttpClient {
  return new HttpClient({ baseUrl: BASE_URL, maxRetries: 0 });
}

const MOCK_POST: Post = {
  PostKey: 'post1',
  PageKey: 'page1',
  UserKey: 'user1',
  CreatedDate: '2026-08-04T12:38:13.000Z',
  LastEdit: null,
  Content: '<p>Hello world</p>',
  Comments: 0,
  TierKeys: 'tier1',
  RelatedTo: null,
  PostTitle: 'Test Post',
  IsScheduled: 0,
  ReleaseDate: null,
  Pinned: 0,
  TimeZone: 'Europe/Rome',
  PageName: null,
  HasPoll: 0,
  TierNames: ['Followers'],
  HasAccess: true,
};

describe('posts', () => {
  describe('listPosts', () => {
    it('should return posts for a page', async () => {
      server.use(
        http.post(`${BASE_URL}:5003/api/page/post/list`, async ({ request }) => {
          const body = (await request.json()) as Record<string, string>;
          expect(body.PageKey).toBe('page1');

          return HttpResponse.json({ Posts: [MOCK_POST], Message: 'Post Found.' });
        }),
      );

      const client = createClient();
      const posts = await listPosts(client, 'page1');

      expect(posts).toHaveLength(1);
      expect(posts[0].PostTitle).toBe('Test Post');
    });

    it('should return empty array when no posts', async () => {
      server.use(
        http.post(`${BASE_URL}:5003/api/page/post/list`, () => {
          return HttpResponse.json({ Posts: [], Message: 'No Posts Found.' });
        }),
      );

      const client = createClient();
      const posts = await listPosts(client, 'page1');

      expect(posts).toEqual([]);
    });
  });

  describe('getPost', () => {
    it('should return a single post', async () => {
      server.use(
        http.post(`${BASE_URL}:5003/api/page/post/get`, async ({ request }) => {
          const body = (await request.json()) as Record<string, string>;
          expect(body.PostKey).toBe('post1');

          return HttpResponse.json({
            Post: MOCK_POST,
            HasAccess: true,
            Message: 'Post Found.',
          });
        }),
      );

      const client = createClient();
      const post = await getPost(client, 'post1');

      expect(post).not.toBeNull();
      expect(post?.PostTitle).toBe('Test Post');
    });

    it('should return null for deleted/missing post', async () => {
      server.use(
        http.post(`${BASE_URL}:5003/api/page/post/get`, () => {
          return HttpResponse.json({
            Post: null,
            HasAccess: false,
            Message: 'No Posts Found.',
          });
        }),
      );

      const client = createClient();
      const post = await getPost(client, 'nonexistent');

      expect(post).toBeNull();
    });
  });

  describe('createPost', () => {
    it('should create a post and return the key', async () => {
      server.use(
        http.post(`${BASE_URL}:5003/api/page/post/add`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body.PageKey).toBe('page1');
          expect(body.PostTitle).toBe('New Post');
          expect(body.Content).toBe('<p>Content</p>');
          expect(body.TierKeys).toBe('tier1');

          return HttpResponse.json({ PostKey: 'new-post-key', Message: 'Post Created.' });
        }),
      );

      const client = createClient();
      const postKey = await createPost(client, {
        PageKey: 'page1',
        PostTitle: 'New Post',
        Content: '<p>Content</p>',
        UserKey: 'user1',
        TierKeys: 'tier1',
        RelatedTo: null,
        ReleaseDate: null,
        IsScheduled: false,
        TimeZone: 'Europe/Rome',
        CreatedDate: '2026-08-04 12:38:13',
      });

      expect(postKey).toBe('new-post-key');
    });
  });

  describe('updatePost', () => {
    it('should update a post', async () => {
      server.use(
        http.post(`${BASE_URL}:5003/api/page/post/update`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body.PostKey).toBe('post1');
          expect(body.PostTitle).toBe('Updated Title');
          expect(body.Content).toBe('<p>Updated</p>');

          return HttpResponse.json({ Message: 'Post Updated.' });
        }),
      );

      const client = createClient();
      await expect(
        updatePost(client, {
          PostKey: 'post1',
          PostTitle: 'Updated Title',
          Content: '<p>Updated</p>',
          IsScheduled: false,
          ReleaseDate: null,
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('deletePost', () => {
    it('should delete a post', async () => {
      server.use(
        http.post(`${BASE_URL}:5003/api/page/post/delete`, async ({ request }) => {
          const body = (await request.json()) as Record<string, string>;
          expect(body.PostKey).toBe('post1');
          expect(body.PageKey).toBe('page1');

          return HttpResponse.json({ Message: 'Post Deleted.' });
        }),
      );

      const client = createClient();
      await expect(deletePost(client, 'post1', 'page1')).resolves.toBeUndefined();
    });
  });

  describe('listPinnedPosts', () => {
    it('should return pinned posts', async () => {
      const pinnedPost = { ...MOCK_POST, Pinned: 1 };

      server.use(
        http.post(`${BASE_URL}:5003/api/page/post/pin/list`, () => {
          return HttpResponse.json({ Posts: [pinnedPost], Message: 'Post Found.' });
        }),
      );

      const client = createClient();
      const posts = await listPinnedPosts(client, 'page1');

      expect(posts).toHaveLength(1);
      expect(posts[0].Pinned).toBe(1);
    });
  });
});
