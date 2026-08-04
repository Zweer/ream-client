import {
  ReamApiError,
  ReamAuthError,
  ReamNotFoundError,
  ReamRateLimitError,
  ReamServerError,
} from './errors.js';
import type { Session } from './types.js';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface HttpRequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  /** Override the port (default: inferred from path) */
  port?: number;
  /** Skip authentication headers */
  skipAuth?: boolean;
}

export interface HttpClientOptions {
  baseUrl?: string;
  timezone?: string;
  maxRetries?: number;
  retryDelayMs?: number;
}

const DEFAULT_BASE_URL = 'https://reamstories.com';
const DEFAULT_TIMEZONE = 'Europe/Rome';
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 1000;

/**
 * Internal HTTP client that handles authentication headers, retry logic,
 * and error mapping for the Ream API.
 *
 * Ream exposes its API on dedicated ports:
 * - 5001: User API (auth, settings, notifications)
 * - 5002: Story API (stories, chapters, publish, media)
 * - 5003: Page API (pages, tiers, posts)
 */
export class HttpClient {
  private readonly baseUrl: string;
  private readonly timezone: string;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;
  private session: Session | null = null;

  constructor(options: HttpClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.timezone = options.timezone ?? DEFAULT_TIMEZONE;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
  }

  /** Set the active session (called after login). */
  setSession(session: Session): void {
    this.session = session;
  }

  /** Get the current session, or null if not logged in. */
  getSession(): Session | null {
    return this.session;
  }

  /** Clear the active session. */
  clearSession(): void {
    this.session = null;
  }

  /**
   * Make an authenticated request to the Ream API.
   *
   * @param path - API path (e.g., `/api/story/user/list`)
   * @param options - Request options
   * @returns Parsed JSON response
   */
  async request<T = unknown>(path: string, options: HttpRequestOptions = {}): Promise<T> {
    const { method = 'POST', body, headers = {}, port, skipAuth = false } = options;

    const targetPort = port ?? this.inferPort(path);
    const url = `${this.baseUrl}:${targetPort}${path}`;

    const requestHeaders: Record<string, string> = {
      'content-type': 'application/json',
      accept: 'application/json',
      'x-ream-timezone': this.timezone,
      'ngsw-bypass': 'true',
      ...headers,
    };

    if (!skipAuth && this.session) {
      requestHeaders.authorization = this.session.authToken;
      requestHeaders.userkey = this.session.userKey;
      requestHeaders.sid = this.session.sid;
      requestHeaders['x-ream-device-key'] = this.session.deviceKey;
      requestHeaders['x-ream-device-fingerprint'] = this.session.deviceFingerprint;
    }

    const fetchOptions: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body !== undefined) {
      fetchOptions.body = JSON.stringify(body);
    }

    return this.executeWithRetry<T>(url, fetchOptions);
  }

  /**
   * Make a raw request (for Azure blob uploads, etc.).
   * No JSON serialization, no auth headers, no retry.
   */
  async rawRequest(url: string, init: RequestInit): Promise<Response> {
    const response = await fetch(url, init);

    if (!response.ok) {
      throw new ReamApiError(
        `Raw request failed: ${response.status} ${response.statusText}`,
        response.status,
      );
    }

    return response;
  }

  private async executeWithRetry<T>(url: string, init: RequestInit): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, init);
        return await this.handleResponse<T>(response);
      } catch (error) {
        lastError = error as Error;

        const canRetry = attempt < this.maxRetries;

        if (error instanceof ReamRateLimitError && canRetry) {
          const delay = error.retryAfter
            ? error.retryAfter * 1000
            : this.retryDelayMs * 2 ** attempt;
          await this.sleep(delay);
          continue;
        }

        if (error instanceof ReamServerError && canRetry) {
          await this.sleep(this.retryDelayMs * 2 ** attempt);
          continue;
        }

        throw error;
      }
    }

    throw lastError ?? new Error('Request failed after retries');
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const body = await this.parseBody(response);

    if (response.ok) {
      return body as T;
    }

    const message =
      ((body as Record<string, unknown>)?.Message as string | undefined) ?? response.statusText;

    switch (response.status) {
      case 401:
      case 403:
        throw new ReamAuthError(message, body);
      case 404:
        throw new ReamNotFoundError(message, body);
      case 429: {
        const retryAfter = response.headers.get('retry-after');
        throw new ReamRateLimitError(retryAfter ? Number.parseInt(retryAfter, 10) : null, body);
      }
      case 500:
        throw new ReamServerError(message, body);
      default:
        throw new ReamApiError(message, response.status, body);
    }
  }

  private async parseBody(response: Response): Promise<unknown> {
    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      return response.json();
    }

    const text = await response.text();

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  private inferPort(path: string): number {
    if (path.startsWith('/api/user')) {
      return 5001;
    }
    if (path.startsWith('/api/page')) {
      return 5003;
    }
    // Default: story API
    return 5002;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
