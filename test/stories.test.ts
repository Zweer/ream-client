import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { ReamNotFoundError } from '../lib/errors.js';
import { HttpClient } from '../lib/http.js';
import {
  createStory,
  deleteStory,
  getStory,
  listGenres,
  listLanguages,
  listStories,
  listTriggerWarnings,
  updateStory,
} from '../lib/stories.js';
import type { Story } from '../lib/types.js';

const BASE_URL = 'http://localhost';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function createClient(): HttpClient {
  return new HttpClient({ baseUrl: BASE_URL, maxRetries: 0 });
}

const MOCK_STORY: Story = {
  UserKey: 'mmwj4ghge2bdc8',
  Title: 'My Story',
  Description: '<p>A tagline</p>',
  LastUpdated: '2026-08-04T11:04:59.000Z',
  StoryKey: 'msejx4002344c2',
  Tags: [],
  Categories: null,
  TriggerWarnings: [],
  Audience: 0,
  IsMature: 0,
  BookBlurb: '<p>A blurb</p>',
  DateFirstPublished: null,
  ShowInSearch: 0,
  MediaTypes: ['ebook'],
  LanguageKey: 'EN',
  GAIUsed: 0,
  Genres: [{ Name: 'Fantasy', Type: 'primary', GenreKey: 16 }],
  Completed: false,
  SubGenres: [],
};

describe('stories', () => {
  describe('listStories', () => {
    it('should return stories for a user', async () => {
      server.use(
        http.post(`${BASE_URL}:5002/api/story/user/list`, async ({ request }) => {
          const body = (await request.json()) as Record<string, string>;
          expect(body.UserKey).toBe('mmwj4ghge2bdc8');

          return HttpResponse.json({ Stories: [MOCK_STORY], Message: 'Success.' });
        }),
      );

      const client = createClient();
      const stories = await listStories(client, 'mmwj4ghge2bdc8');

      expect(stories).toHaveLength(1);
      expect(stories[0].Title).toBe('My Story');
      expect(stories[0].StoryKey).toBe('msejx4002344c2');
    });
  });

  describe('getStory', () => {
    it('should return story details', async () => {
      server.use(
        http.post(`${BASE_URL}:5002/api/story/details/get`, async ({ request }) => {
          const body = (await request.json()) as Record<string, string>;
          expect(body.StoryKey).toBe('msejx4002344c2');

          return HttpResponse.json({ Story: MOCK_STORY, Message: 'Success.' });
        }),
      );

      const client = createClient();
      const story = await getStory(client, 'msejx4002344c2');

      expect(story.Title).toBe('My Story');
      expect(story.Genres[0].Name).toBe('Fantasy');
    });

    it('should throw ReamNotFoundError for missing story', async () => {
      server.use(
        http.post(`${BASE_URL}:5002/api/story/details/get`, () => {
          return HttpResponse.json({ Message: 'Could not find that story.' }, { status: 404 });
        }),
      );

      const client = createClient();

      await expect(getStory(client, 'nonexistent')).rejects.toThrow(ReamNotFoundError);
    });
  });

  describe('createStory', () => {
    it('should create a story and return the key', async () => {
      server.use(
        http.post(`${BASE_URL}:5002/api/story/details/create`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body.Title).toBe('New Story');
          expect(body.MediaType).toBe('ebook');

          return HttpResponse.json({ StoryKey: 'new-story-key', Message: 'Story Created.' });
        }),
      );

      const client = createClient();
      const storyKey = await createStory(client, {
        Title: 'New Story',
        Genre: [{ Type: 'primary', Name: 'Fantasy', GenreKey: 16 }],
        SubGenre: [],
        Tags: [],
        TriggerWarnings: [],
        Audience: 0,
        RomancePairings: null,
        DiversityDesignations: null,
        CoverData: 'data:image/jpeg;base64,abc',
        SmallCover: 'data:image/jpeg;base64,abc',
        IsMature: false,
        GAIUsed: false,
        HasPublishingRights: true,
        BookBlurb: '<p>Blurb</p>',
        Description: '<p>Tagline</p>',
        LanguageKey: 'EN',
        MediaType: 'ebook',
      });

      expect(storyKey).toBe('new-story-key');
    });
  });

  describe('updateStory', () => {
    it('should update a story and return the key', async () => {
      server.use(
        http.post(`${BASE_URL}:5002/api/story/details/update`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body.StoryKey).toBe('msejx4002344c2');
          expect(body.Title).toBe('Updated Title');

          return HttpResponse.json({ StoryKey: 'msejx4002344c2', Message: 'Story Updated.' });
        }),
      );

      const client = createClient();
      const storyKey = await updateStory(client, {
        StoryKey: 'msejx4002344c2',
        Title: 'Updated Title',
        Genre: [{ Type: 'primary', Name: 'Fantasy', GenreKey: 16 }],
        SubGenre: [],
        Tags: [],
        TriggerWarnings: [],
        Audience: 0,
        RomancePairings: null,
        DiversityDesignations: null,
        IsMature: false,
        GAIUsed: false,
        HasPublishingRights: true,
        BookBlurb: '<p>Updated blurb</p>',
        Description: '<p>Updated tagline</p>',
        LanguageKey: 'EN',
      });

      expect(storyKey).toBe('msejx4002344c2');
    });
  });

  describe('deleteStory', () => {
    it('should delete a story', async () => {
      server.use(
        http.post(`${BASE_URL}:5002/api/story/delete`, async ({ request }) => {
          const body = (await request.json()) as Record<string, string>;
          expect(body.StoryKey).toBe('msejx4002344c2');

          return HttpResponse.json({ Message: 'Story Deleted.' });
        }),
      );

      const client = createClient();
      await expect(deleteStory(client, 'msejx4002344c2')).resolves.toBeUndefined();
    });
  });

  describe('listGenres', () => {
    it('should return available genres', async () => {
      server.use(
        http.get(`${BASE_URL}:5002/api/story/categories`, () => {
          return HttpResponse.json({
            Categories: [
              { CategoryKey: 16, Name: 'Fantasy' },
              { CategoryKey: 31, Name: 'Romance' },
            ],
            Message: 'Success.',
          });
        }),
      );

      const client = createClient();
      const genres = await listGenres(client);

      expect(genres).toHaveLength(2);
      expect(genres[0].Name).toBe('Fantasy');
      expect(genres[0].CategoryKey).toBe(16);
    });
  });

  describe('listLanguages', () => {
    it('should return available languages', async () => {
      server.use(
        http.get(`${BASE_URL}:5002/api/story/languages`, () => {
          return HttpResponse.json([
            { LanguagesKey: 'EN', Name: 'English' },
            { LanguagesKey: 'ITL', Name: 'Italian' },
          ]);
        }),
      );

      const client = createClient();
      const languages = await listLanguages(client);

      expect(languages).toHaveLength(2);
      expect(languages[0].LanguagesKey).toBe('EN');
    });
  });

  describe('listTriggerWarnings', () => {
    it('should return available trigger warnings', async () => {
      server.use(
        http.get(`${BASE_URL}:5002/api/story/trigger-warnings`, () => {
          return HttpResponse.json({
            TriggerWarnings: [
              { TriggerWarningKey: 2, Name: 'Abortion' },
              { TriggerWarningKey: 70, Name: 'Adult Language' },
            ],
            Message: 'Success.',
          });
        }),
      );

      const client = createClient();
      const warnings = await listTriggerWarnings(client);

      expect(warnings).toHaveLength(2);
      expect(warnings[0].Name).toBe('Abortion');
    });
  });
});
