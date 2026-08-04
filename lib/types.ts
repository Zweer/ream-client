// =============================================================================
// Auth
// =============================================================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface DeviceFingerprint {
  userAgent: string;
  languages: string[];
  hardwareConcurrency: number;
  deviceMemory: number;
  webglVendor: string;
  webglRenderer: string;
}

export interface Session {
  authToken: string;
  userKey: string;
  sid: string;
  displayName: string;
  email: string;
  handle: string;
  isAuthor: boolean;
  canSeeMature: boolean;
  stripeAccountId: string | null;
  stripeAccountType: string | null;
  stripeCustomerId: string | null;
  deviceKey: string;
  deviceFingerprint: string;
  timezone: string;
}

export interface LoginResponse {
  AuthToken: string;
  StripeAccountId: string | null;
  StripeAccountType: string | null;
  StripeCustomerId: string | null;
  UserKey: string;
  DisplayName: string;
  SID: string;
  IsAuthor: number;
  Email: string;
  EmailVerified: number;
  NeverShowFollowAgain: number;
  CanSeeMature: number;
  Handle: string;
  Message: string;
}

// =============================================================================
// Pages
// =============================================================================

export interface Page {
  PageKey: string;
  UserKey: string;
  Name: string | null;
  CreatingSmallDesc: string | null;
  Description: string | null;
  VideoUrl: string | null;
  IsLaunched: number;
  CreatedDate: string;
  IsIncomePrivate: number;
  IsSubPrivate: number;
  IsFollowersPrivate: number;
  PageMoniker: string | null;
  LastPayoutDate: string | null;
  DisableAutoPayout: number;
  Paused: number;
  BrandColor: string | null;
}

export interface Tier {
  TierKey: string;
  PageKey: string;
  Name: string;
  Level: string;
  DescHidden: number;
  Description: string;
  Cost: number;
  CostType: string;
  Frequency: string;
  IsArchived: number;
  MemberLimit: number | null;
  MembersNumber: number;
  Color: string | null;
  CreatedDate: string;
  StripeLinkId: string | null;
  StripeLinkUrl: string | null;
  StripePriceItemId: string | null;
  StripeProductId: string | null;
  StripeAccountId: string | null;
  IsPublicTier: number;
  IsFollowingTier: number;
  IncludesPhysicalGoods: number;
  CustomWelcomeMessage: string | null;
  NoShipSetting: string | null;
  ImageUrl?: string;
  ExcludedCountries?: string | null;
}

export interface MemberTotals {
  Followers: number;
  Members: number;
  Subscriptions: unknown[];
}

// =============================================================================
// Stories
// =============================================================================

export interface Genre {
  Name: string;
  Type: string;
  GenreKey: number;
}

export interface Story {
  UserKey: string;
  Title: string;
  Description: string;
  LastUpdated: string;
  StoryKey: string;
  Tags: string[];
  Categories: unknown | null;
  TriggerWarnings: string[];
  Audience: number;
  IsMature: number;
  BookBlurb: string;
  DateFirstPublished: string | null;
  ShowInSearch: number;
  MediaTypes: string[];
  LanguageKey: string;
  GAIUsed: number;
  Genres: Genre[];
  Completed: boolean;
  SubGenres: unknown[];
  DiversityDesignations?: unknown | null;
  RomancePairings?: unknown | null;
  DateFirstPublishedAudio?: string | null;
  DateFirstPublishedComic?: string | null;
}

export interface CreateStoryInput {
  Title: string;
  Genre: Genre[];
  SubGenre: unknown[];
  Tags: string[];
  TriggerWarnings: string[];
  Audience: number;
  RomancePairings: unknown | null;
  DiversityDesignations: unknown | null;
  CoverData: string;
  SmallCover: string;
  IsMature: boolean;
  GAIUsed: boolean;
  HasPublishingRights: boolean;
  BookBlurb: string;
  Description: string;
  LanguageKey: string;
  MediaType: string;
}

export interface UpdateStoryInput {
  StoryKey: string;
  Title: string;
  Genre: Genre[];
  SubGenre: unknown[];
  Tags: string[];
  TriggerWarnings: string[];
  Audience: number;
  RomancePairings: unknown | null;
  DiversityDesignations: unknown | null;
  IsMature: boolean;
  GAIUsed: boolean;
  HasPublishingRights: boolean;
  BookBlurb: string;
  Description: string;
  LanguageKey: string;
  CoverData?: string;
  SmallCover?: string;
  MediaType?: string;
}

export interface Category {
  CategoryKey: number;
  Name: string;
}

export interface Language {
  LanguagesKey: string;
  Name: string;
}

export interface TriggerWarning {
  TriggerWarningKey: number;
  Name: string;
}

// =============================================================================
// Chapters
// =============================================================================

export interface ChapterListItem {
  ChapterKey: string;
  Title: string;
  DraftTitle: string;
  ChapterOrder: number;
}

export interface Paragraph {
  ParagraphKey: string;
  ChapterKey: string;
  ParagraphOrder: number;
  Text: string;
  Comments: number;
}

export interface Chapter {
  ChapterKey: string;
  StoryKey: string;
  Title: string;
  DraftTitle: string;
  ChapterOrder: number;
  IsPublished: number;
  RawEBookData: number;
  SalesIncluded: number;
  Paragraphs: Paragraph[];
}

export interface AddChapterInput {
  ChapterOrder: number;
  StoryKey: string;
  DraftTitle: string;
}

export interface SaveParagraphInput {
  Text: string;
  ParagraphOrder: number;
  ChapterKey: string;
}

export interface SaveContentInput {
  Paragraphs: SaveParagraphInput[];
  ImageKeys: string[];
  StoryKey: string;
}

// =============================================================================
// Media
// =============================================================================

export interface UploadTokenResponse {
  Token: string;
  Expiration: string;
  Message: string;
  AUTHOR_USER_KEY: string;
  HAS_ACCESS: boolean;
}

export interface ElementCreateResponse {
  ElementKey: string;
  Message: string;
}

// =============================================================================
// Publishing
// =============================================================================

export interface PublishRecord {
  PublishRecordKey: number;
  TierKey: string;
  PageKey: string;
  ChapterKey: string;
  StoryKey: string;
  PublishDate: string;
  IsPublic: number;
  StripeProductId: string | null;
  MediaType: string;
}

export interface PublishChapterInput {
  ChapterKey: string;
  Tiers: Tier[];
}

export interface PublishAllInput {
  PublishDate: string;
  PublishObject: PublishChapterInput[];
  PageKey: string;
  StoryKey: string;
  MediaType: string;
}

export interface QueueItem {
  PublishQueueKey: string;
  ChapterKey: string;
  PageKey: string;
  StoryKey: string;
  MediaType: string;
}

export interface ScheduleItem {
  NumberOfChapters: number;
  TierKeys: string;
  Starts: string;
  ScheduleKey: string;
  PageKey: string;
  ScheduleGroupKey: string;
  DateInterval: string;
  TimeZone: string;
  Interval: string;
  IntervalValue: string;
}

export interface CreateScheduleInput {
  PageKey: string;
  StoryKey: string;
  dateOfEachDay: string[];
  Interval: string;
  Tiers: Tier[];
  NumberOfChapters: number;
  TimeZone: string;
  MediaType: string;
}

// =============================================================================
// Posts
// =============================================================================

export interface Post {
  PostKey: string;
  PageKey: string;
  UserKey: string;
  CreatedDate: string;
  LastEdit: string | null;
  Content: string;
  Comments: number;
  TierKeys: string;
  RelatedTo: string | null;
  PostTitle: string;
  IsScheduled: number;
  ReleaseDate: string | null;
  Pinned: number;
  TimeZone: string;
  PageName: string | null;
  HasPoll: number;
  TierNames: string[];
  HasAccess: boolean;
}

export interface CreatePostInput {
  PageKey: string;
  PostTitle: string;
  Content: string;
  UserKey: string;
  TierKeys: string;
  RelatedTo: string | null;
  ReleaseDate: string | null;
  IsScheduled: boolean;
  TimeZone: string;
  CreatedDate: string;
}

export interface UpdatePostInput {
  PostKey: string;
  Content: string;
  PostTitle: string;
  IsScheduled: boolean;
  ReleaseDate: string | null;
}

// =============================================================================
// Notifications
// =============================================================================

export interface NotificationCount {
  contentUpdates: { ebook: number; audio: number; comic: number };
  socialUpdates: {
    post: number;
    followed: number;
    followRequest: number;
    reaction: number;
    reply: number;
    mention: number;
    chat: number;
    comment: number;
  };
  total: number;
}

export interface Notification {
  IsRead: number;
  Type: string;
  SubType: string;
  Message: string;
  Title: string;
  RelativeURL: string;
  NotificationKey: string;
  CreatedDate: string;
  ReferenceKey: string;
  SubReferenceKey: string;
  Resolution: unknown | null;
}

// =============================================================================
// Client Options
// =============================================================================

export interface ReamClientOptions {
  email: string;
  password: string;
  baseUrl?: string;
  timezone?: string;
  deviceFingerprint?: DeviceFingerprint;
}
