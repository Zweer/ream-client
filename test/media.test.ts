import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { HttpClient } from '../lib/http.js';
import {
  generateElementKey,
  getUploadToken,
  registerElement,
  uploadImage,
  uploadToAzure,
} from '../lib/media.js';

const BASE_URL = 'http://localhost';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function createClient(): HttpClient {
  return new HttpClient({ baseUrl: BASE_URL, maxRetries: 0 });
}

describe('media', () => {
  describe('generateElementKey', () => {
    it('should generate a 16-char hex string', () => {
      const key = generateElementKey();

      expect(key).toHaveLength(16);
      expect(key).toMatch(/^[a-f0-9]+$/);
    });

    it('should generate unique keys', () => {
      const key1 = generateElementKey();
      const key2 = generateElementKey();

      expect(key1).not.toBe(key2);
    });
  });

  describe('getUploadToken', () => {
    it('should request a SAS token', async () => {
      server.use(
        http.post(`${BASE_URL}:5002/api/story/ebook/token/get`, async ({ request }) => {
          const body = (await request.json()) as Record<string, string>;
          expect(body.StoryKey).toBe('story1');
          expect(body.ChapterKey).toBe('chapter1');
          expect(body.ElementKey).toBe('element1');
          expect(body.PermissionRequested).toBe('owner');

          return HttpResponse.json({
            Token: 'sv=2024-05-04&sig=abc',
            Expiration: '2026-08-04T13:44:51.992Z',
            Message: 'Success',
            AUTHOR_USER_KEY: 'user1',
            HAS_ACCESS: true,
          });
        }),
      );

      const client = createClient();
      const response = await getUploadToken(client, 'story1', 'chapter1', 'element1');

      expect(response.Token).toBe('sv=2024-05-04&sig=abc');
      expect(response.HAS_ACCESS).toBe(true);
    });
  });

  describe('registerElement', () => {
    it('should register element metadata', async () => {
      server.use(
        http.post(`${BASE_URL}:5002/api/story/ebook/element/create`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body.StoryKey).toBe('story1');
          expect(body.ChapterKey).toBe('chapter1');
          expect(body.ElementKey).toBe('element1');
          expect(body.Bytes).toBe(1024);

          return HttpResponse.json({
            ElementKey: 'element1',
            Message: 'Element Data Stored.',
          });
        }),
      );

      const client = createClient();
      const response = await registerElement(client, 'story1', 'chapter1', 'element1', 1024);

      expect(response.ElementKey).toBe('element1');
    });
  });

  describe('uploadToAzure', () => {
    it('should PUT file bytes to Azure', async () => {
      server.use(
        http.put('https://reamebook.blob.core.windows.net/story1/element1', async ({ request }) => {
          expect(request.headers.get('x-ms-blob-type')).toBe('BlockBlob');
          expect(request.headers.get('x-ms-blob-content-type')).toBe('image/png');
          expect(request.headers.get('content-type')).toBe('application/octet-stream');

          const body = await request.arrayBuffer();
          expect(body.byteLength).toBe(4);

          return new HttpResponse(null, { status: 201 });
        }),
      );

      const client = createClient();
      const data = new Uint8Array([1, 2, 3, 4]);

      await expect(
        uploadToAzure(client, 'story1', 'element1', 'sv=2024&sig=abc', data, 'image/png'),
      ).resolves.toBeUndefined();
    });
  });

  describe('uploadImage', () => {
    it('should orchestrate the full 3-step upload flow', async () => {
      let capturedElementKey: string | null = null;

      server.use(
        http.post(`${BASE_URL}:5002/api/story/ebook/token/get`, async ({ request }) => {
          const body = (await request.json()) as Record<string, string>;
          capturedElementKey = body.ElementKey;

          return HttpResponse.json({
            Token: 'sv=2024-05-04&sig=test',
            Expiration: '2026-08-04T13:44:51.992Z',
            Message: 'Success',
            AUTHOR_USER_KEY: 'user1',
            HAS_ACCESS: true,
          });
        }),

        http.post(`${BASE_URL}:5002/api/story/ebook/element/create`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body.Bytes).toBe(4);

          return HttpResponse.json({
            ElementKey: body.ElementKey,
            Message: 'Element Data Stored.',
          });
        }),

        http.put('https://reamebook.blob.core.windows.net/:storyKey/:elementKey', () => {
          return new HttpResponse(null, { status: 201 });
        }),
      );

      const client = createClient();
      const data = new Uint8Array([1, 2, 3, 4]);
      const elementKey = await uploadImage(client, 'story1', 'chapter1', data, 'image/png');

      expect(elementKey).toHaveLength(16);
      expect(elementKey).toBe(capturedElementKey);
    });
  });
});
