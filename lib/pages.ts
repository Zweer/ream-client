import type { HttpClient } from './http.js';
import type { MemberTotals, Page, Tier } from './types.js';

/**
 * List all pages for a given user.
 *
 * @param httpClient - The HTTP client instance
 * @param userKey - The user's key
 * @returns Array of pages
 */
export async function listPages(httpClient: HttpClient, userKey: string): Promise<Page[]> {
  const response = await httpClient.request<{ Pages: Page[]; Message: string }>('/api/page/list', {
    body: { UserKey: userKey },
  });

  return response.Pages;
}

/**
 * Get a single page by its key.
 *
 * @param httpClient - The HTTP client instance
 * @param pageKey - The page key
 * @returns The page details
 */
export async function getPage(httpClient: HttpClient, pageKey: string): Promise<Page> {
  const response = await httpClient.request<{ Page: Page; Message: string }>('/api/page/get', {
    body: { PageKey: pageKey },
  });

  return response.Page;
}

/**
 * List all tiers for a given page.
 *
 * @param httpClient - The HTTP client instance
 * @param pageKey - The page key
 * @returns Array of tiers
 */
export async function listTiers(httpClient: HttpClient, pageKey: string): Promise<Tier[]> {
  const response = await httpClient.request<{ Tiers: Tier[]; Message: string }>(
    '/api/page/tier/list',
    { body: { PageKey: pageKey } },
  );

  return response.Tiers;
}

/**
 * Get member/follower totals for a page.
 *
 * @param httpClient - The HTTP client instance
 * @param pageKey - The page key
 * @returns Member totals (followers, members, subscriptions)
 */
export async function getMemberTotals(
  httpClient: HttpClient,
  pageKey: string,
): Promise<MemberTotals> {
  return httpClient.request<MemberTotals>('/api/user/member/totals', {
    body: { PageKey: pageKey },
  });
}
