/**
 * End-to-end test script for @zweer/ream-client.
 *
 * Runs against the real Ream API using credentials from .env.
 * Safety: aborts if the page has any followers/members to avoid sending notifications.
 *
 * Usage: npx tsx scripts/e2e.ts
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { ReamClient } from '../lib/client.js';
import { ReamNotFoundError } from '../lib/errors.js';

// =============================================================================
// Load .env
// =============================================================================

function loadEnv(): { email: string; password: string } {
  const envPath = resolve(import.meta.dirname, '..', '.env');
  const content = readFileSync(envPath, 'utf-8');
  const vars: Record<string, string> = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...valueParts] = trimmed.split('=');
    vars[key.trim()] = valueParts.join('=').trim();
  }

  const email = vars.REAM_EMAIL;
  const password = vars.REAM_PASSWORD;

  if (!email || !password) {
    throw new Error('Missing REAM_EMAIL or REAM_PASSWORD in .env');
  }

  return { email, password };
}

// =============================================================================
// Helpers
// =============================================================================

let passCount = 0;
let failCount = 0;

function pass(label: string): void {
  passCount++;
  console.log(`  ✓ ${label}`);
}

function fail(label: string, error: unknown): void {
  failCount++;
  console.error(`  ✗ ${label}`);
  console.error(`    ${error instanceof Error ? error.message : String(error)}`);
}

async function step<T>(label: string, fn: () => Promise<T>): Promise<T | undefined> {
  try {
    const result = await fn();
    pass(label);
    return result;
  } catch (error) {
    fail(label, error);
    return undefined;
  }
}

// =============================================================================
// E2E Test Flow
// =============================================================================

async function run(): Promise<void> {
  const { email, password } = loadEnv();

  console.log('\n🚀 Ream Client E2E Test');
  console.log('='.repeat(60));

  const client = new ReamClient({ email, password, timezone: 'Europe/Rome' });

  // --------------------------------------------------------------------------
  // 1. Auth
  // --------------------------------------------------------------------------
  console.log('\n📦 Auth');

  const session = await step('Login', async () => {
    const s = await client.ensureAuthenticated();
    if (!s.authToken || !s.userKey) throw new Error('Missing session fields');
    return s;
  });

  if (!session) {
    console.error('\n💀 Cannot continue without auth. Aborting.');
    process.exit(1);
  }

  console.log(`    UserKey: ${session.userKey}`);
  console.log(`    IsAuthor: ${session.isAuthor}`);

  // --------------------------------------------------------------------------
  // 2. Pages & Safety Check
  // --------------------------------------------------------------------------
  console.log('\n📦 Pages');

  const pages = await step('List pages', () => client.listPages());

  if (!pages || pages.length === 0) {
    console.error('\n💀 No pages found. Aborting.');
    process.exit(1);
  }

  const pageKey = pages[0].PageKey;
  console.log(`    PageKey: ${pageKey}`);

  await step('Get page', async () => {
    const page = await client.getPage(pageKey);
    if (page.PageKey !== pageKey) throw new Error('PageKey mismatch');
    return page;
  });

  const tiers = await step('List tiers', () => client.listTiers(pageKey));

  if (!tiers || tiers.length === 0) {
    console.error('\n💀 No tiers found. Aborting.');
    process.exit(1);
  }

  const followersTier = tiers.find((t) => t.IsFollowingTier === 1);
  if (!followersTier) {
    console.error('\n💀 No followers tier found. Aborting.');
    process.exit(1);
  }

  console.log(`    Followers tier: ${followersTier.TierKey}`);

  // Safety check: abort if there are followers
  const totals = await step('Get member totals', () => client.getMemberTotals(pageKey));

  if (totals && (totals.Followers > 0 || totals.Members > 0)) {
    console.error(
      `\n🛑 SAFETY ABORT: Page has ${totals.Followers} followers and ${totals.Members} members.`,
    );
    console.error('   Publishing would send notifications. Aborting e2e test.');
    process.exit(1);
  }

  pass('Safety check: 0 followers, 0 members');

  // --------------------------------------------------------------------------
  // 3. Reference Data
  // --------------------------------------------------------------------------
  console.log('\n📦 Reference Data');

  await step('List genres', async () => {
    const genres = await client.listGenres();
    if (genres.length === 0) throw new Error('No genres returned');
    return genres;
  });

  await step('List languages', async () => {
    const languages = await client.listLanguages();
    if (languages.length === 0) throw new Error('No languages returned');
    return languages;
  });

  await step('List trigger warnings', async () => {
    const warnings = await client.listTriggerWarnings();
    if (warnings.length === 0) throw new Error('No trigger warnings returned');
    return warnings;
  });

  // --------------------------------------------------------------------------
  // 4. Story CRUD
  // --------------------------------------------------------------------------
  console.log('\n📦 Story CRUD');

  // Create a minimal 1x1 white JPEG for the cover
  const TINY_JPEG_BASE64 =
    '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxBn/9k=';
  const coverData = `data:image/jpeg;base64,${TINY_JPEG_BASE64}`;

  const storyKey = await step('Create story', () =>
    client.createStory({
      Title: '[E2E Test] Automated Story',
      Genre: [{ Type: 'primary', Name: 'Fantasy', GenreKey: 16 }],
      SubGenre: [],
      Tags: [],
      TriggerWarnings: [],
      Audience: 0,
      RomancePairings: null,
      DiversityDesignations: null,
      CoverData: coverData,
      SmallCover: coverData,
      IsMature: false,
      GAIUsed: false,
      HasPublishingRights: true,
      BookBlurb: '<p>E2E test blurb — will be deleted.</p>',
      Description: '<p>E2E test tagline</p>',
      LanguageKey: 'EN',
      MediaType: 'ebook',
    }),
  );

  if (!storyKey) {
    console.error('\n💀 Failed to create story. Aborting.');
    process.exit(1);
  }

  console.log(`    StoryKey: ${storyKey}`);

  await step('Get story', async () => {
    const story = await client.getStory(storyKey);
    if (story.Title !== '[E2E Test] Automated Story') throw new Error('Title mismatch');
    return story;
  });

  await step('Update story', async () => {
    const updatedKey = await client.updateStory({
      StoryKey: storyKey,
      Title: '[E2E Test] Updated Story',
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
    if (!updatedKey) throw new Error('No story key returned');
    return updatedKey;
  });

  await step('List stories (should include new one)', async () => {
    const stories = await client.listStories();
    const found = stories.find((s) => s.StoryKey === storyKey);
    if (!found) throw new Error('Created story not found in list');
    return found;
  });

  // --------------------------------------------------------------------------
  // 5. Chapters
  // --------------------------------------------------------------------------
  console.log('\n📦 Chapters');

  const chapterKey = await step('Add chapter', () =>
    client.addChapter({
      StoryKey: storyKey,
      DraftTitle: 'E2E Chapter 1',
      ChapterOrder: 0,
    }),
  );

  if (!chapterKey) {
    console.error('\n💀 Failed to create chapter. Cleaning up...');
    await client.deleteStory(storyKey);
    process.exit(1);
  }

  console.log(`    ChapterKey: ${chapterKey}`);

  await step('Update chapter title', () =>
    client.updateChapterTitle(chapterKey, 'E2E Chapter 1 — Renamed'),
  );

  await step('Save chapter content', () =>
    client.saveContent({
      Paragraphs: [
        {
          Text: '<p>This is the first paragraph of the e2e test.</p>',
          ParagraphOrder: 0,
          ChapterKey: chapterKey,
        },
        { Text: '<p>This is the second paragraph.</p>', ParagraphOrder: 1, ChapterKey: chapterKey },
      ],
      ImageKeys: [],
      StoryKey: storyKey,
    }),
  );

  await step('Get chapter (verify content)', async () => {
    const chapter = await client.getChapter(chapterKey);
    if (chapter.Paragraphs.length !== 2) {
      throw new Error(`Expected 2 paragraphs, got ${chapter.Paragraphs.length}`);
    }
    return chapter;
  });

  await step('List chapters', async () => {
    const chapters = await client.listChapters(storyKey);
    if (chapters.length !== 1) throw new Error(`Expected 1 chapter, got ${chapters.length}`);
    return chapters;
  });

  // --------------------------------------------------------------------------
  // 6. Publishing
  // --------------------------------------------------------------------------
  console.log('\n📦 Publishing');

  await step('Publish chapter', () =>
    client.publishAll({
      PublishDate: new Date().toISOString(),
      PublishObject: [{ ChapterKey: chapterKey, Tiers: [followersTier] }],
      PageKey: pageKey,
      StoryKey: storyKey,
      MediaType: 'ebook',
    }),
  );

  const publishRecords = await step('List published (verify)', async () => {
    const records = await client.listPublished(storyKey, pageKey, 'ebook');
    if (records.length === 0) throw new Error('No publish records found');
    return records;
  });

  if (publishRecords && publishRecords.length > 0) {
    await step('Unpublish chapter', () =>
      client.unpublishChapter(publishRecords[0].PublishRecordKey),
    );

    await step('List published (verify empty)', async () => {
      const records = await client.listPublished(storyKey, pageKey, 'ebook');
      if (records.length !== 0) throw new Error(`Expected 0 records, got ${records.length}`);
      return records;
    });
  }

  // --------------------------------------------------------------------------
  // 7. Queue & Schedule
  // --------------------------------------------------------------------------
  console.log('\n📦 Queue & Schedule');

  await step('Queue all chapters', () => client.queueAll(pageKey, storyKey, 'ebook'));

  await step('List queued (verify)', async () => {
    const queued = await client.listQueued(storyKey, pageKey, 'ebook');
    if (queued.length === 0) throw new Error('No queued chapters found');
    return queued;
  });

  await step('Create schedule', () =>
    client.createSchedule({
      PageKey: pageKey,
      StoryKey: storyKey,
      dateOfEachDay: ['2099-12-31 12:00:00.000'], // Far future — won't trigger
      Interval: '1week',
      Tiers: [followersTier],
      NumberOfChapters: 1,
      TimeZone: 'Europe/Rome',
      MediaType: 'ebook',
    }),
  );

  const schedules = await step('List schedules (verify)', async () => {
    const result = await client.listSchedules(storyKey, pageKey, 'ebook');
    if (result.length === 0) throw new Error('No schedules found');
    return result;
  });

  if (schedules && schedules.length > 0 && schedules[0].length > 0) {
    const scheduleGroupKey = schedules[0][0].ScheduleGroupKey;

    await step('Delete schedule', () =>
      client.deleteSchedule(scheduleGroupKey, pageKey, storyKey, 'ebook'),
    );

    await step('List schedules (verify empty)', async () => {
      const result = await client.listSchedules(storyKey, pageKey, 'ebook');
      if (result.length !== 0) throw new Error(`Expected 0 schedules, got ${result.length}`);
      return result;
    });
  }

  // --------------------------------------------------------------------------
  // 8. Posts
  // --------------------------------------------------------------------------
  console.log('\n📦 Posts');

  const postKey = await step('Create post', () =>
    client.createPost({
      PageKey: pageKey,
      PostTitle: '[E2E Test] Automated Post',
      Content: '<p>This post was created by the e2e test and will be deleted.</p>',
      UserKey: session.userKey,
      TierKeys: followersTier.TierKey,
      RelatedTo: null,
      ReleaseDate: null,
      IsScheduled: false,
      TimeZone: 'Europe/Rome',
      CreatedDate: new Date().toISOString().replace('T', ' ').slice(0, 19),
    }),
  );

  if (postKey) {
    console.log(`    PostKey: ${postKey}`);

    await step('Get post', async () => {
      const post = await client.getPost(postKey);
      if (!post) throw new Error('Post not found');
      if (post.PostTitle !== '[E2E Test] Automated Post') throw new Error('Title mismatch');
      return post;
    });

    await step('Update post', () =>
      client.updatePost({
        PostKey: postKey,
        PostTitle: '[E2E Test] Updated Post',
        Content: '<p>Updated content.</p>',
        IsScheduled: false,
        ReleaseDate: null,
      }),
    );

    await step('List posts (verify)', async () => {
      const posts = await client.listPosts(pageKey);
      const found = posts.find((p) => p.PostKey === postKey);
      if (!found) throw new Error('Created post not found in list');
      return found;
    });

    await step('Delete post', () => client.deletePost(postKey, pageKey));

    await step('Get post (verify deleted)', async () => {
      const post = await client.getPost(postKey);
      if (post !== null) throw new Error('Post still exists after deletion');
    });
  }

  // --------------------------------------------------------------------------
  // 9. Cleanup
  // --------------------------------------------------------------------------
  console.log('\n📦 Cleanup');

  await step('Delete chapter', () => client.deleteChapter(chapterKey, storyKey));

  await step('Delete story', () => client.deleteStory(storyKey));

  await step('Verify story deleted (404)', async () => {
    try {
      await client.getStory(storyKey);
      throw new Error('Story still exists');
    } catch (error) {
      if (!(error instanceof ReamNotFoundError)) {
        throw error;
      }
    }
  });

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Results: ${passCount} passed, ${failCount} failed\n`);

  if (failCount > 0) {
    process.exit(1);
  }
}

run().catch((error) => {
  console.error('\n💀 Unhandled error:', error);
  process.exit(1);
});
