import type { HttpClient } from './http.js';
import type { AddChapterInput, Chapter, ChapterListItem, SaveContentInput } from './types.js';

/**
 * List all chapters for a story.
 *
 * @param httpClient - The HTTP client instance
 * @param storyKey - The story key
 * @returns Array of chapter list items
 */
export async function listChapters(
  httpClient: HttpClient,
  storyKey: string,
): Promise<ChapterListItem[]> {
  const response = await httpClient.request<{ Chapters: ChapterListItem[]; Message: string }>(
    '/api/story/chapter/list',
    { body: { StoryKey: storyKey } },
  );

  return response.Chapters;
}

/**
 * Get a chapter with its full content (paragraphs).
 *
 * @param httpClient - The HTTP client instance
 * @param chapterKey - The chapter key
 * @returns The chapter with paragraphs
 */
export async function getChapter(httpClient: HttpClient, chapterKey: string): Promise<Chapter> {
  const response = await httpClient.request<{ Chapter: Chapter; Message: string }>(
    '/api/story/chapter/get',
    { body: { ChapterKey: chapterKey } },
  );

  return response.Chapter;
}

/**
 * Add a new (empty) chapter to a story.
 *
 * @param httpClient - The HTTP client instance
 * @param input - Chapter creation fields
 * @returns The new chapter's key
 */
export async function addChapter(httpClient: HttpClient, input: AddChapterInput): Promise<string> {
  const response = await httpClient.request<{ ChapterKey: string; Message: string }>(
    '/api/story/chapter/add',
    { body: input },
  );

  return response.ChapterKey;
}

/**
 * Update a chapter's title.
 *
 * @param httpClient - The HTTP client instance
 * @param chapterKey - The chapter key
 * @param title - The new title
 */
export async function updateChapterTitle(
  httpClient: HttpClient,
  chapterKey: string,
  title: string,
): Promise<void> {
  await httpClient.request('/api/story/chapter/update/title', {
    body: { ChapterKey: chapterKey, Title: title },
  });
}

/**
 * Save chapter content (full replace of all paragraphs).
 *
 * @param httpClient - The HTTP client instance
 * @param input - Paragraphs, image keys, and story key
 */
export async function saveContent(httpClient: HttpClient, input: SaveContentInput): Promise<void> {
  await httpClient.request('/api/story/chapter/paragraphs/add', { body: input });
}

/**
 * Delete a chapter permanently.
 *
 * @param httpClient - The HTTP client instance
 * @param chapterKey - The chapter key to delete
 * @param storyKey - The story the chapter belongs to
 */
export async function deleteChapter(
  httpClient: HttpClient,
  chapterKey: string,
  storyKey: string,
): Promise<void> {
  await httpClient.request('/api/story/chapter/delete', {
    body: { ChapterKey: chapterKey, StoryKey: storyKey },
  });
}
