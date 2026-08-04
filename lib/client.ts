import { login, logout } from './auth.js';
import {
  addChapter,
  deleteChapter,
  getChapter,
  listChapters,
  saveContent,
  updateChapterTitle,
} from './chapters.js';
import { HttpClient } from './http.js';
import { uploadImage } from './media.js';
import { getMemberTotals, getPage, listPages, listTiers } from './pages.js';
import {
  createPost,
  deletePost,
  getPost,
  listPinnedPosts,
  listPosts,
  updatePost,
} from './posts.js';
import {
  createSchedule,
  deleteSchedule,
  listPublished,
  listQueued,
  listSchedules,
  publishAll,
  queueAll,
  unpublishChapter,
} from './publish.js';
import {
  createStory,
  deleteStory,
  getStory,
  listGenres,
  listLanguages,
  listStories,
  listTriggerWarnings,
  updateStory,
} from './stories.js';
import type {
  AddChapterInput,
  Category,
  Chapter,
  ChapterListItem,
  CreatePostInput,
  CreateScheduleInput,
  CreateStoryInput,
  Language,
  MemberTotals,
  Page,
  Post,
  PublishAllInput,
  PublishRecord,
  QueueItem,
  ReamClientOptions,
  SaveContentInput,
  ScheduleItem,
  Session,
  Story,
  Tier,
  TriggerWarning,
  UpdatePostInput,
  UpdateStoryInput,
} from './types.js';

/**
 * Main client for interacting with the Ream API.
 *
 * Uses a facade pattern: delegates all operations to domain modules
 * and handles lazy authentication on first API call.
 */
export class ReamClient {
  private readonly httpClient: HttpClient;
  private readonly email: string;
  private readonly password: string;
  private readonly timezone: string;
  private loginPromise: Promise<Session> | null = null;

  constructor(options: ReamClientOptions) {
    this.email = options.email;
    this.password = options.password;
    this.timezone = options.timezone ?? 'Europe/Rome';
    this.httpClient = new HttpClient({
      baseUrl: options.baseUrl,
      timezone: this.timezone,
    });
  }

  // ===========================================================================
  // Auth
  // ===========================================================================

  /**
   * Ensure the client is authenticated. Calls login lazily on first use.
   * Subsequent calls return the cached session.
   */
  async ensureAuthenticated(): Promise<Session> {
    const existingSession = this.httpClient.getSession();
    if (existingSession) {
      return existingSession;
    }

    if (!this.loginPromise) {
      this.loginPromise = login(this.httpClient, this.email, this.password, {
        timezone: this.timezone,
      });
    }

    return this.loginPromise;
  }

  /** Get the current session (null if not yet authenticated). */
  getSession(): Session | null {
    return this.httpClient.getSession();
  }

  /** Logout (client-side only). */
  logout(): void {
    this.loginPromise = null;
    logout(this.httpClient);
  }

  // ===========================================================================
  // Pages
  // ===========================================================================

  /** List all pages for the authenticated user. */
  async listPages(): Promise<Page[]> {
    const session = await this.ensureAuthenticated();
    return listPages(this.httpClient, session.userKey);
  }

  /** Get a single page by key. */
  async getPage(pageKey: string): Promise<Page> {
    await this.ensureAuthenticated();
    return getPage(this.httpClient, pageKey);
  }

  /** List tiers for a page. */
  async listTiers(pageKey: string): Promise<Tier[]> {
    await this.ensureAuthenticated();
    return listTiers(this.httpClient, pageKey);
  }

  /** Get member/follower totals for a page. */
  async getMemberTotals(pageKey: string): Promise<MemberTotals> {
    await this.ensureAuthenticated();
    return getMemberTotals(this.httpClient, pageKey);
  }

  // ===========================================================================
  // Stories
  // ===========================================================================

  /** List all stories for the authenticated user. */
  async listStories(): Promise<Story[]> {
    const session = await this.ensureAuthenticated();
    return listStories(this.httpClient, session.userKey);
  }

  /** Get story details by key. */
  async getStory(storyKey: string): Promise<Story> {
    await this.ensureAuthenticated();
    return getStory(this.httpClient, storyKey);
  }

  /** Create a new story. Returns the story key. */
  async createStory(input: CreateStoryInput): Promise<string> {
    await this.ensureAuthenticated();
    return createStory(this.httpClient, input);
  }

  /** Update an existing story. Returns the story key. */
  async updateStory(input: UpdateStoryInput): Promise<string> {
    await this.ensureAuthenticated();
    return updateStory(this.httpClient, input);
  }

  /** Delete a story permanently. */
  async deleteStory(storyKey: string): Promise<void> {
    await this.ensureAuthenticated();
    return deleteStory(this.httpClient, storyKey);
  }

  /** List available genres/categories. */
  async listGenres(): Promise<Category[]> {
    await this.ensureAuthenticated();
    return listGenres(this.httpClient);
  }

  /** List available languages. */
  async listLanguages(): Promise<Language[]> {
    await this.ensureAuthenticated();
    return listLanguages(this.httpClient);
  }

  /** List available trigger warnings. */
  async listTriggerWarnings(): Promise<TriggerWarning[]> {
    await this.ensureAuthenticated();
    return listTriggerWarnings(this.httpClient);
  }

  // ===========================================================================
  // Chapters
  // ===========================================================================

  /** List chapters for a story. */
  async listChapters(storyKey: string): Promise<ChapterListItem[]> {
    await this.ensureAuthenticated();
    return listChapters(this.httpClient, storyKey);
  }

  /** Get a chapter with full content. */
  async getChapter(chapterKey: string): Promise<Chapter> {
    await this.ensureAuthenticated();
    return getChapter(this.httpClient, chapterKey);
  }

  /** Add a new empty chapter. Returns the chapter key. */
  async addChapter(input: AddChapterInput): Promise<string> {
    await this.ensureAuthenticated();
    return addChapter(this.httpClient, input);
  }

  /** Update a chapter's title. */
  async updateChapterTitle(chapterKey: string, title: string): Promise<void> {
    await this.ensureAuthenticated();
    return updateChapterTitle(this.httpClient, chapterKey, title);
  }

  /** Save chapter content (full replace). */
  async saveContent(input: SaveContentInput): Promise<void> {
    await this.ensureAuthenticated();
    return saveContent(this.httpClient, input);
  }

  /** Delete a chapter permanently. */
  async deleteChapter(chapterKey: string, storyKey: string): Promise<void> {
    await this.ensureAuthenticated();
    return deleteChapter(this.httpClient, chapterKey, storyKey);
  }

  // ===========================================================================
  // Media
  // ===========================================================================

  /** Upload an image to a chapter. Returns the element key. */
  async uploadImage(
    storyKey: string,
    chapterKey: string,
    data: Uint8Array,
    contentType: string,
  ): Promise<string> {
    await this.ensureAuthenticated();
    return uploadImage(this.httpClient, storyKey, chapterKey, data, contentType);
  }

  // ===========================================================================
  // Publishing
  // ===========================================================================

  /** List published chapters for a story. */
  async listPublished(
    storyKey: string,
    pageKey: string,
    mediaType: string,
  ): Promise<PublishRecord[]> {
    await this.ensureAuthenticated();
    return listPublished(this.httpClient, storyKey, pageKey, mediaType);
  }

  /** Publish chapters to tiers. */
  async publishAll(input: PublishAllInput): Promise<void> {
    await this.ensureAuthenticated();
    return publishAll(this.httpClient, input);
  }

  /** Unpublish a chapter by publish record key. */
  async unpublishChapter(publishRecordKey: number): Promise<void> {
    await this.ensureAuthenticated();
    return unpublishChapter(this.httpClient, publishRecordKey);
  }

  /** Queue all chapters for scheduled publishing. */
  async queueAll(pageKey: string, storyKey: string, mediaType: string): Promise<void> {
    await this.ensureAuthenticated();
    return queueAll(this.httpClient, pageKey, storyKey, mediaType);
  }

  /** List queued chapters. */
  async listQueued(storyKey: string, pageKey: string, mediaType: string): Promise<QueueItem[]> {
    await this.ensureAuthenticated();
    return listQueued(this.httpClient, storyKey, pageKey, mediaType);
  }

  /** Create a publishing schedule. */
  async createSchedule(input: CreateScheduleInput): Promise<void> {
    await this.ensureAuthenticated();
    return createSchedule(this.httpClient, input);
  }

  /** List schedules for a story. */
  async listSchedules(
    storyKey: string,
    pageKey: string,
    mediaType: string,
  ): Promise<ScheduleItem[][]> {
    await this.ensureAuthenticated();
    return listSchedules(this.httpClient, storyKey, pageKey, mediaType);
  }

  /** Delete a schedule group. */
  async deleteSchedule(
    scheduleGroupKey: string,
    pageKey: string,
    storyKey: string,
    mediaType: string,
  ): Promise<void> {
    await this.ensureAuthenticated();
    return deleteSchedule(this.httpClient, scheduleGroupKey, pageKey, storyKey, mediaType);
  }

  // ===========================================================================
  // Posts
  // ===========================================================================

  /** List all posts for a page. */
  async listPosts(pageKey: string): Promise<Post[]> {
    await this.ensureAuthenticated();
    return listPosts(this.httpClient, pageKey);
  }

  /** Get a single post by key. */
  async getPost(postKey: string): Promise<Post | null> {
    await this.ensureAuthenticated();
    return getPost(this.httpClient, postKey);
  }

  /** Create a new community post. Returns the post key. */
  async createPost(input: CreatePostInput): Promise<string> {
    await this.ensureAuthenticated();
    return createPost(this.httpClient, input);
  }

  /** Update an existing post. */
  async updatePost(input: UpdatePostInput): Promise<void> {
    await this.ensureAuthenticated();
    return updatePost(this.httpClient, input);
  }

  /** Delete a post permanently. */
  async deletePost(postKey: string, pageKey: string): Promise<void> {
    await this.ensureAuthenticated();
    return deletePost(this.httpClient, postKey, pageKey);
  }

  /** List pinned posts for a page. */
  async listPinnedPosts(pageKey: string): Promise<Post[]> {
    await this.ensureAuthenticated();
    return listPinnedPosts(this.httpClient, pageKey);
  }
}
