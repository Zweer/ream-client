import type { HttpClient } from './http.js';
import type { CreatePostInput, Post, UpdatePostInput } from './types.js';

/**
 * List all posts for a page.
 *
 * @param httpClient - The HTTP client instance
 * @param pageKey - The page key
 * @returns Array of posts
 */
export async function listPosts(httpClient: HttpClient, pageKey: string): Promise<Post[]> {
  const response = await httpClient.request<{ Posts: Post[]; Message: string }>(
    '/api/page/post/list',
    { body: { PageKey: pageKey } },
  );

  return response.Posts;
}

/**
 * Get a single post by its key.
 *
 * @param httpClient - The HTTP client instance
 * @param postKey - The post key
 * @returns The post, or null if not found
 */
export async function getPost(httpClient: HttpClient, postKey: string): Promise<Post | null> {
  const response = await httpClient.request<{
    Post: Post | null;
    HasAccess: boolean;
    Message: string;
  }>('/api/page/post/get', { body: { PostKey: postKey } });

  return response.Post;
}

/**
 * Create a new community post.
 *
 * @param httpClient - The HTTP client instance
 * @param input - Post creation fields
 * @returns The new post's key
 */
export async function createPost(httpClient: HttpClient, input: CreatePostInput): Promise<string> {
  const response = await httpClient.request<{ PostKey: string; Message: string }>(
    '/api/page/post/add',
    { body: input },
  );

  return response.PostKey;
}

/**
 * Update an existing post.
 *
 * @param httpClient - The HTTP client instance
 * @param input - Post update fields (must include PostKey)
 */
export async function updatePost(httpClient: HttpClient, input: UpdatePostInput): Promise<void> {
  await httpClient.request('/api/page/post/update', { body: input });
}

/**
 * Delete a post permanently.
 *
 * @param httpClient - The HTTP client instance
 * @param postKey - The post key to delete
 * @param pageKey - The page the post belongs to
 */
export async function deletePost(
  httpClient: HttpClient,
  postKey: string,
  pageKey: string,
): Promise<void> {
  await httpClient.request('/api/page/post/delete', {
    body: { PostKey: postKey, PageKey: pageKey },
  });
}

/**
 * List pinned posts for a page.
 *
 * @param httpClient - The HTTP client instance
 * @param pageKey - The page key
 * @returns Array of pinned posts
 */
export async function listPinnedPosts(httpClient: HttpClient, pageKey: string): Promise<Post[]> {
  const response = await httpClient.request<{ Posts: Post[]; Message: string }>(
    '/api/page/post/pin/list',
    { body: { PageKey: pageKey } },
  );

  return response.Posts;
}
