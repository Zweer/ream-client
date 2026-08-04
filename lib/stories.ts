import type { HttpClient } from './http.js';
import type {
  Category,
  CreateStoryInput,
  Language,
  Story,
  TriggerWarning,
  UpdateStoryInput,
} from './types.js';

/**
 * List all stories for a given user.
 *
 * @param httpClient - The HTTP client instance
 * @param userKey - The user's key
 * @returns Array of stories
 */
export async function listStories(httpClient: HttpClient, userKey: string): Promise<Story[]> {
  const response = await httpClient.request<{ Stories: Story[]; Message: string }>(
    '/api/story/user/list',
    { body: { UserKey: userKey } },
  );

  return response.Stories;
}

/**
 * Get a single story's details by its key.
 *
 * @param httpClient - The HTTP client instance
 * @param storyKey - The story key
 * @returns The story details
 */
export async function getStory(httpClient: HttpClient, storyKey: string): Promise<Story> {
  const response = await httpClient.request<{ Story: Story; Message: string }>(
    '/api/story/details/get',
    { body: { StoryKey: storyKey } },
  );

  return response.Story;
}

/**
 * Create a new story.
 *
 * @param httpClient - The HTTP client instance
 * @param input - Story creation fields
 * @returns The new story's key
 */
export async function createStory(
  httpClient: HttpClient,
  input: CreateStoryInput,
): Promise<string> {
  const response = await httpClient.request<{ StoryKey: string; Message: string }>(
    '/api/story/details/create',
    { body: input },
  );

  return response.StoryKey;
}

/**
 * Update an existing story's details.
 *
 * @param httpClient - The HTTP client instance
 * @param input - Story update fields (must include StoryKey)
 * @returns The updated story's key
 */
export async function updateStory(
  httpClient: HttpClient,
  input: UpdateStoryInput,
): Promise<string> {
  const response = await httpClient.request<{ StoryKey: string; Message: string }>(
    '/api/story/details/update',
    { body: input },
  );

  return response.StoryKey;
}

/**
 * Delete a story permanently.
 *
 * @param httpClient - The HTTP client instance
 * @param storyKey - The story key to delete
 */
export async function deleteStory(httpClient: HttpClient, storyKey: string): Promise<void> {
  await httpClient.request('/api/story/delete', { body: { StoryKey: storyKey } });
}

/**
 * List all available genres (categories).
 *
 * @param httpClient - The HTTP client instance
 * @returns Array of categories/genres
 */
export async function listGenres(httpClient: HttpClient): Promise<Category[]> {
  const response = await httpClient.request<{ Categories: Category[]; Message: string }>(
    '/api/story/categories',
    { method: 'GET' },
  );

  return response.Categories;
}

/**
 * List all available languages.
 *
 * @param httpClient - The HTTP client instance
 * @returns Array of languages
 */
export async function listLanguages(httpClient: HttpClient): Promise<Language[]> {
  return httpClient.request<Language[]>('/api/story/languages', { method: 'GET' });
}

/**
 * List all available trigger warnings.
 *
 * @param httpClient - The HTTP client instance
 * @returns Array of trigger warnings
 */
export async function listTriggerWarnings(httpClient: HttpClient): Promise<TriggerWarning[]> {
  const response = await httpClient.request<{
    TriggerWarnings: TriggerWarning[];
    Message: string;
  }>('/api/story/trigger-warnings', { method: 'GET' });

  return response.TriggerWarnings;
}
