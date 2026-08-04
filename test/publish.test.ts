import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { HttpClient } from '../lib/http.js';
import {
  createSchedule,
  deleteSchedule,
  listPublished,
  listQueued,
  listSchedules,
  publishAll,
  queueAll,
  unpublishChapter,
} from '../lib/publish.js';
import type { PublishRecord, QueueItem, ScheduleItem, Tier } from '../lib/types.js';

const BASE_URL = 'http://localhost';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function createClient(): HttpClient {
  return new HttpClient({ baseUrl: BASE_URL, maxRetries: 0 });
}

const MOCK_TIER: Tier = {
  TierKey: 'tier1',
  PageKey: 'page1',
  Name: 'Followers',
  Level: '0',
  DescHidden: 0,
  Description: '',
  Cost: 0,
  CostType: 'usd',
  Frequency: 'never',
  IsArchived: 0,
  MemberLimit: null,
  MembersNumber: 0,
  Color: null,
  CreatedDate: '2026-08-04T10:56:36.000Z',
  StripeLinkId: null,
  StripeLinkUrl: null,
  StripePriceItemId: null,
  StripeProductId: null,
  StripeAccountId: null,
  IsPublicTier: 0,
  IsFollowingTier: 1,
  IncludesPhysicalGoods: 0,
  CustomWelcomeMessage: null,
  NoShipSetting: null,
};

const MOCK_PUBLISH_RECORD: PublishRecord = {
  PublishRecordKey: 2481972,
  TierKey: 'tier1',
  PageKey: 'page1',
  ChapterKey: 'chapter1',
  StoryKey: 'story1',
  PublishDate: '2026-08-04T11:16:27.000Z',
  IsPublic: 0,
  StripeProductId: null,
  MediaType: 'ebook',
};

describe('publish', () => {
  describe('listPublished', () => {
    it('should return publish records', async () => {
      server.use(
        http.post(`${BASE_URL}:5002/api/story/publish/list`, async ({ request }) => {
          const body = (await request.json()) as Record<string, string>;
          expect(body.StoryKey).toBe('story1');
          expect(body.PageKey).toBe('page1');
          expect(body.MediaType).toBe('ebook');

          return HttpResponse.json([MOCK_PUBLISH_RECORD]);
        }),
      );

      const client = createClient();
      const records = await listPublished(client, 'story1', 'page1', 'ebook');

      expect(records).toHaveLength(1);
      expect(records[0].PublishRecordKey).toBe(2481972);
      expect(records[0].ChapterKey).toBe('chapter1');
    });
  });

  describe('publishAll', () => {
    it('should publish chapters to tiers', async () => {
      server.use(
        http.post(`${BASE_URL}:5002/api/story/publish/all`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body.StoryKey).toBe('story1');
          expect(body.PageKey).toBe('page1');
          expect(body.MediaType).toBe('ebook');

          const publishObject = body.PublishObject as Array<Record<string, unknown>>;
          expect(publishObject).toHaveLength(1);
          expect(publishObject[0].ChapterKey).toBe('chapter1');

          return HttpResponse.json({ Message: 'Success.' });
        }),
      );

      const client = createClient();
      await expect(
        publishAll(client, {
          PublishDate: '2026-08-04T13:16:22.882+02:00',
          PublishObject: [{ ChapterKey: 'chapter1', Tiers: [MOCK_TIER] }],
          PageKey: 'page1',
          StoryKey: 'story1',
          MediaType: 'ebook',
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('unpublishChapter', () => {
    it('should unpublish a chapter by record key', async () => {
      server.use(
        http.post(`${BASE_URL}:5002/api/story/publish/delete`, async ({ request }) => {
          const body = (await request.json()) as Record<string, number>;
          expect(body.PublishRecordKey).toBe(2481972);

          return HttpResponse.json({ Message: 'Chapter Unpublished.' });
        }),
      );

      const client = createClient();
      await expect(unpublishChapter(client, 2481972)).resolves.toBeUndefined();
    });
  });

  describe('queueAll', () => {
    it('should queue all chapters', async () => {
      server.use(
        http.post(`${BASE_URL}:5002/api/story/queue/all`, async ({ request }) => {
          const body = (await request.json()) as Record<string, string>;
          expect(body.PageKey).toBe('page1');
          expect(body.StoryKey).toBe('story1');
          expect(body.MediaType).toBe('ebook');

          return HttpResponse.json({ Message: 'Success.' });
        }),
      );

      const client = createClient();
      await expect(queueAll(client, 'page1', 'story1', 'ebook')).resolves.toBeUndefined();
    });
  });

  describe('listQueued', () => {
    it('should return queued chapters', async () => {
      const mockQueueItem: QueueItem = {
        PublishQueueKey: 'queue1',
        ChapterKey: 'chapter1',
        PageKey: 'page1',
        StoryKey: 'story1',
        MediaType: 'ebook',
      };

      server.use(
        http.post(`${BASE_URL}:5002/api/story/queue/list`, () => {
          return HttpResponse.json([mockQueueItem]);
        }),
      );

      const client = createClient();
      const queued = await listQueued(client, 'story1', 'page1', 'ebook');

      expect(queued).toHaveLength(1);
      expect(queued[0].PublishQueueKey).toBe('queue1');
    });
  });

  describe('createSchedule', () => {
    it('should create a publishing schedule', async () => {
      server.use(
        http.post(`${BASE_URL}:5002/api/story/schedule/create`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body.PageKey).toBe('page1');
          expect(body.StoryKey).toBe('story1');
          expect(body.Interval).toBe('1week');
          expect(body.NumberOfChapters).toBe(1);
          expect(body.TimeZone).toBe('Europe/Rome');

          return HttpResponse.json({ Message: 'Success.' });
        }),
      );

      const client = createClient();
      await expect(
        createSchedule(client, {
          PageKey: 'page1',
          StoryKey: 'story1',
          dateOfEachDay: ['2026-08-10 12:00:00.000'],
          Interval: '1week',
          Tiers: [MOCK_TIER],
          NumberOfChapters: 1,
          TimeZone: 'Europe/Rome',
          MediaType: 'ebook',
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('listSchedules', () => {
    it('should return schedule groups', async () => {
      const mockSchedule: ScheduleItem = {
        NumberOfChapters: 1,
        TierKeys: 'tier1',
        Starts: '2026-08-10T14:00:00.000Z',
        ScheduleKey: 'sched1',
        PageKey: 'page1',
        ScheduleGroupKey: 'group1',
        DateInterval: '1week',
        TimeZone: 'Europe/Rome',
        Interval: 'WEEK',
        IntervalValue: '1',
      };

      server.use(
        http.post(`${BASE_URL}:5002/api/story/schedule/list`, () => {
          return HttpResponse.json([[mockSchedule]]);
        }),
      );

      const client = createClient();
      const schedules = await listSchedules(client, 'story1', 'page1', 'ebook');

      expect(schedules).toHaveLength(1);
      expect(schedules[0]).toHaveLength(1);
      expect(schedules[0][0].ScheduleGroupKey).toBe('group1');
    });
  });

  describe('deleteSchedule', () => {
    it('should delete a schedule group', async () => {
      server.use(
        http.post(`${BASE_URL}:5002/api/story/schedule/delete`, async ({ request }) => {
          const body = (await request.json()) as Record<string, string>;
          expect(body.ScheduleGroupKey).toBe('group1');
          expect(body.PageKey).toBe('page1');
          expect(body.StoryKey).toBe('story1');
          expect(body.MediaType).toBe('ebook');

          return HttpResponse.json({ Message: 'Schedule Deleted' });
        }),
      );

      const client = createClient();
      await expect(
        deleteSchedule(client, 'group1', 'page1', 'story1', 'ebook'),
      ).resolves.toBeUndefined();
    });
  });
});
