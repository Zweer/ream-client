import type { HttpClient } from './http.js';
import type {
  CreateScheduleInput,
  PublishAllInput,
  PublishRecord,
  QueueItem,
  ScheduleItem,
} from './types.js';

/**
 * List published chapters for a story.
 *
 * @param httpClient - The HTTP client instance
 * @param storyKey - The story key
 * @param pageKey - The page key
 * @param mediaType - Media type ("ebook", "audio", "comic")
 * @returns Array of publish records
 */
export async function listPublished(
  httpClient: HttpClient,
  storyKey: string,
  pageKey: string,
  mediaType: string,
): Promise<PublishRecord[]> {
  return httpClient.request<PublishRecord[]>('/api/story/publish/list', {
    body: { StoryKey: storyKey, PageKey: pageKey, MediaType: mediaType },
  });
}

/**
 * Publish chapters to specified tiers.
 *
 * @param httpClient - The HTTP client instance
 * @param input - Publish configuration (chapters, tiers, date, story/page keys)
 */
export async function publishAll(httpClient: HttpClient, input: PublishAllInput): Promise<void> {
  await httpClient.request('/api/story/publish/all', { body: input });
}

/**
 * Unpublish a single chapter-tier record.
 *
 * @param httpClient - The HTTP client instance
 * @param publishRecordKey - The publish record key to remove
 */
export async function unpublishChapter(
  httpClient: HttpClient,
  publishRecordKey: number,
): Promise<void> {
  await httpClient.request('/api/story/publish/delete', {
    body: { PublishRecordKey: publishRecordKey },
  });
}

/**
 * Queue all unpublished chapters for scheduled publishing.
 *
 * @param httpClient - The HTTP client instance
 * @param pageKey - The page key
 * @param storyKey - The story key
 * @param mediaType - Media type
 */
export async function queueAll(
  httpClient: HttpClient,
  pageKey: string,
  storyKey: string,
  mediaType: string,
): Promise<void> {
  await httpClient.request('/api/story/queue/all', {
    body: { PageKey: pageKey, StoryKey: storyKey, MediaType: mediaType },
  });
}

/**
 * List queued chapters for a story.
 *
 * @param httpClient - The HTTP client instance
 * @param storyKey - The story key
 * @param pageKey - The page key
 * @param mediaType - Media type
 * @returns Array of queue items
 */
export async function listQueued(
  httpClient: HttpClient,
  storyKey: string,
  pageKey: string,
  mediaType: string,
): Promise<QueueItem[]> {
  return httpClient.request<QueueItem[]>('/api/story/queue/list', {
    body: { StoryKey: storyKey, PageKey: pageKey, MediaType: mediaType },
  });
}

/**
 * Create a schedule for auto-publishing queued chapters.
 *
 * @param httpClient - The HTTP client instance
 * @param input - Schedule configuration
 */
export async function createSchedule(
  httpClient: HttpClient,
  input: CreateScheduleInput,
): Promise<void> {
  await httpClient.request('/api/story/schedule/create', { body: input });
}

/**
 * List schedules for a story.
 *
 * @param httpClient - The HTTP client instance
 * @param storyKey - The story key
 * @param pageKey - The page key
 * @param mediaType - Media type
 * @returns Nested array of schedule groups
 */
export async function listSchedules(
  httpClient: HttpClient,
  storyKey: string,
  pageKey: string,
  mediaType: string,
): Promise<ScheduleItem[][]> {
  return httpClient.request<ScheduleItem[][]>('/api/story/schedule/list', {
    body: { StoryKey: storyKey, PageKey: pageKey, MediaType: mediaType },
  });
}

/**
 * Delete a schedule group.
 *
 * @param httpClient - The HTTP client instance
 * @param scheduleGroupKey - The schedule group key
 * @param pageKey - The page key
 * @param storyKey - The story key
 * @param mediaType - Media type
 */
export async function deleteSchedule(
  httpClient: HttpClient,
  scheduleGroupKey: string,
  pageKey: string,
  storyKey: string,
  mediaType: string,
): Promise<void> {
  await httpClient.request('/api/story/schedule/delete', {
    body: {
      ScheduleGroupKey: scheduleGroupKey,
      PageKey: pageKey,
      StoryKey: storyKey,
      MediaType: mediaType,
    },
  });
}
