import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  addChapter,
  deleteChapter,
  getChapter,
  listChapters,
  saveContent,
  updateChapterTitle,
} from '../lib/chapters.js';
import { HttpClient } from '../lib/http.js';
import type { Chapter, ChapterListItem } from '../lib/types.js';

const BASE_URL = 'http://localhost';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function createClient(): HttpClient {
  return new HttpClient({ baseUrl: BASE_URL, maxRetries: 0 });
}

const MOCK_CHAPTER_LIST_ITEM: ChapterListItem = {
  ChapterKey: 'msek7pghd4ee4a0',
  Title: 'Chapter 1',
  DraftTitle: 'Chapter 1',
  ChapterOrder: 0,
};

const MOCK_CHAPTER: Chapter = {
  ChapterKey: 'msek7pghd4ee4a0',
  StoryKey: 'msek72jsdd2f8c',
  Title: 'Chapter 1',
  DraftTitle: 'Chapter 1',
  ChapterOrder: 0,
  IsPublished: 0,
  RawEBookData: 0,
  SalesIncluded: 1,
  Paragraphs: [
    {
      ParagraphKey: 'msek8yis42e772',
      ChapterKey: 'msek7pghd4ee4a0',
      ParagraphOrder: 0,
      Text: '<p data-pkey="msek8yis42e772">Hello world</p>',
      Comments: 0,
    },
  ],
};

describe('chapters', () => {
  describe('listChapters', () => {
    it('should return chapters for a story', async () => {
      server.use(
        http.post(`${BASE_URL}:5002/api/story/chapter/list`, async ({ request }) => {
          const body = (await request.json()) as Record<string, string>;
          expect(body.StoryKey).toBe('msek72jsdd2f8c');

          return HttpResponse.json({
            Chapters: [MOCK_CHAPTER_LIST_ITEM],
            Message: 'Success.',
          });
        }),
      );

      const client = createClient();
      const chapters = await listChapters(client, 'msek72jsdd2f8c');

      expect(chapters).toHaveLength(1);
      expect(chapters[0].Title).toBe('Chapter 1');
      expect(chapters[0].ChapterOrder).toBe(0);
    });
  });

  describe('getChapter', () => {
    it('should return chapter with paragraphs', async () => {
      server.use(
        http.post(`${BASE_URL}:5002/api/story/chapter/get`, async ({ request }) => {
          const body = (await request.json()) as Record<string, string>;
          expect(body.ChapterKey).toBe('msek7pghd4ee4a0');

          return HttpResponse.json({ Chapter: MOCK_CHAPTER, Message: 'Success.' });
        }),
      );

      const client = createClient();
      const chapter = await getChapter(client, 'msek7pghd4ee4a0');

      expect(chapter.Title).toBe('Chapter 1');
      expect(chapter.Paragraphs).toHaveLength(1);
      expect(chapter.Paragraphs[0].Text).toContain('Hello world');
    });
  });

  describe('addChapter', () => {
    it('should create a chapter and return the key', async () => {
      server.use(
        http.post(`${BASE_URL}:5002/api/story/chapter/add`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body.StoryKey).toBe('msek72jsdd2f8c');
          expect(body.DraftTitle).toBe('New Chapter');
          expect(body.ChapterOrder).toBe(1);

          return HttpResponse.json({
            ChapterKey: 'new-chapter-key',
            Message: 'Chapter Created.',
          });
        }),
      );

      const client = createClient();
      const chapterKey = await addChapter(client, {
        StoryKey: 'msek72jsdd2f8c',
        DraftTitle: 'New Chapter',
        ChapterOrder: 1,
      });

      expect(chapterKey).toBe('new-chapter-key');
    });
  });

  describe('updateChapterTitle', () => {
    it('should update the chapter title', async () => {
      server.use(
        http.post(`${BASE_URL}:5002/api/story/chapter/update/title`, async ({ request }) => {
          const body = (await request.json()) as Record<string, string>;
          expect(body.ChapterKey).toBe('msek7pghd4ee4a0');
          expect(body.Title).toBe('Renamed Chapter');

          return HttpResponse.json({ Message: 'Success.' });
        }),
      );

      const client = createClient();
      await expect(
        updateChapterTitle(client, 'msek7pghd4ee4a0', 'Renamed Chapter'),
      ).resolves.toBeUndefined();
    });
  });

  describe('saveContent', () => {
    it('should save paragraphs for a chapter', async () => {
      server.use(
        http.post(`${BASE_URL}:5002/api/story/chapter/paragraphs/add`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body.StoryKey).toBe('msek72jsdd2f8c');
          expect(body.ImageKeys).toEqual(['img1']);

          const paragraphs = body.Paragraphs as Array<Record<string, unknown>>;
          expect(paragraphs).toHaveLength(2);
          expect(paragraphs[0].ParagraphOrder).toBe(0);
          expect(paragraphs[1].ParagraphOrder).toBe(1);

          return HttpResponse.json({ Message: 'Success.' });
        }),
      );

      const client = createClient();
      await expect(
        saveContent(client, {
          Paragraphs: [
            { Text: '<p>First</p>', ParagraphOrder: 0, ChapterKey: 'msek7pghd4ee4a0' },
            {
              Text: '<p><img data-imgkey="img1"></p>',
              ParagraphOrder: 1,
              ChapterKey: 'msek7pghd4ee4a0',
            },
          ],
          ImageKeys: ['img1'],
          StoryKey: 'msek72jsdd2f8c',
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('deleteChapter', () => {
    it('should delete a chapter', async () => {
      server.use(
        http.post(`${BASE_URL}:5002/api/story/chapter/delete`, async ({ request }) => {
          const body = (await request.json()) as Record<string, string>;
          expect(body.ChapterKey).toBe('msek7pghd4ee4a0');
          expect(body.StoryKey).toBe('msek72jsdd2f8c');

          return HttpResponse.json({ Message: 'Chapter Deleted.' });
        }),
      );

      const client = createClient();
      await expect(
        deleteChapter(client, 'msek7pghd4ee4a0', 'msek72jsdd2f8c'),
      ).resolves.toBeUndefined();
    });
  });
});
