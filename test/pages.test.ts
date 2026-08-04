import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { HttpClient } from '../lib/http.js';
import { getMemberTotals, getPage, listPages, listTiers } from '../lib/pages.js';
import type { Page, Tier } from '../lib/types.js';

const BASE_URL = 'http://localhost';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function createClient(): HttpClient {
  return new HttpClient({ baseUrl: BASE_URL, maxRetries: 0 });
}

const MOCK_PAGE: Page = {
  PageKey: 'msejmbmp09b640',
  UserKey: 'mmwj4ghge2bdc8',
  Name: 'Test Author',
  CreatingSmallDesc: null,
  Description: null,
  VideoUrl: null,
  IsLaunched: 1,
  CreatedDate: '2026-08-04T10:56:36.000Z',
  IsIncomePrivate: 1,
  IsSubPrivate: 0,
  IsFollowersPrivate: 0,
  PageMoniker: 'testauthor',
  LastPayoutDate: null,
  DisableAutoPayout: 0,
  Paused: 0,
  BrandColor: null,
};

const MOCK_TIER: Tier = {
  TierKey: 'msejmbmp09f1fe11',
  PageKey: 'msejmbmp09b640',
  Name: 'Followers',
  Level: '0',
  DescHidden: 0,
  Description: 'This tier is for giving followers access to follower content.',
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
  ImageUrl: '',
};

describe('pages', () => {
  describe('listPages', () => {
    it('should return pages for a user', async () => {
      server.use(
        http.post(`${BASE_URL}:5003/api/page/list`, async ({ request }) => {
          const body = (await request.json()) as Record<string, string>;
          expect(body.UserKey).toBe('mmwj4ghge2bdc8');

          return HttpResponse.json({ Pages: [MOCK_PAGE], Message: 'Pages Found.' });
        }),
      );

      const client = createClient();
      const pages = await listPages(client, 'mmwj4ghge2bdc8');

      expect(pages).toHaveLength(1);
      expect(pages[0].PageKey).toBe('msejmbmp09b640');
      expect(pages[0].PageMoniker).toBe('testauthor');
    });
  });

  describe('getPage', () => {
    it('should return a single page', async () => {
      server.use(
        http.post(`${BASE_URL}:5003/api/page/get`, async ({ request }) => {
          const body = (await request.json()) as Record<string, string>;
          expect(body.PageKey).toBe('msejmbmp09b640');

          return HttpResponse.json({ Page: MOCK_PAGE, Message: 'Success.' });
        }),
      );

      const client = createClient();
      const page = await getPage(client, 'msejmbmp09b640');

      expect(page.PageKey).toBe('msejmbmp09b640');
      expect(page.IsLaunched).toBe(1);
    });
  });

  describe('listTiers', () => {
    it('should return tiers for a page', async () => {
      server.use(
        http.post(`${BASE_URL}:5003/api/page/tier/list`, async ({ request }) => {
          const body = (await request.json()) as Record<string, string>;
          expect(body.PageKey).toBe('msejmbmp09b640');

          return HttpResponse.json({ Tiers: [MOCK_TIER], Message: 'Success.' });
        }),
      );

      const client = createClient();
      const tiers = await listTiers(client, 'msejmbmp09b640');

      expect(tiers).toHaveLength(1);
      expect(tiers[0].Name).toBe('Followers');
      expect(tiers[0].IsFollowingTier).toBe(1);
      expect(tiers[0].Cost).toBe(0);
    });
  });

  describe('getMemberTotals', () => {
    it('should return member totals for a page', async () => {
      server.use(
        http.post(`${BASE_URL}:5001/api/user/member/totals`, async ({ request }) => {
          const body = (await request.json()) as Record<string, string>;
          expect(body.PageKey).toBe('msejmbmp09b640');

          return HttpResponse.json({ Followers: 10, Members: 5, Subscriptions: [] });
        }),
      );

      const client = createClient();
      const totals = await getMemberTotals(client, 'msejmbmp09b640');

      expect(totals.Followers).toBe(10);
      expect(totals.Members).toBe(5);
      expect(totals.Subscriptions).toEqual([]);
    });
  });
});
