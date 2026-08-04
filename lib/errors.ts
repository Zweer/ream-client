/**
 * Base error for all Ream API errors.
 */
export class ReamApiError extends Error {
  public readonly status: number;
  public readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'ReamApiError';
    this.status = status;
    this.body = body;
  }
}

/**
 * Thrown when authentication fails (401).
 */
export class ReamAuthError extends ReamApiError {
  constructor(message = 'Authentication failed', body?: unknown) {
    super(message, 401, body);
    this.name = 'ReamAuthError';
  }
}

/**
 * Thrown when a resource is not found (404).
 */
export class ReamNotFoundError extends ReamApiError {
  constructor(message = 'Resource not found', body?: unknown) {
    super(message, 404, body);
    this.name = 'ReamNotFoundError';
  }
}

/**
 * Thrown when the server returns a rate limit response (429).
 */
export class ReamRateLimitError extends ReamApiError {
  public readonly retryAfter: number | null;

  constructor(retryAfter: number | null = null, body?: unknown) {
    super('Rate limit exceeded', 429, body);
    this.name = 'ReamRateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Thrown when the server returns an internal error (500).
 */
export class ReamServerError extends ReamApiError {
  constructor(message = 'Internal server error', body?: unknown) {
    super(message, 500, body);
    this.name = 'ReamServerError';
  }
}
