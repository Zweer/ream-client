import { describe, expect, it } from 'vitest';

import {
  ReamApiError,
  ReamAuthError,
  ReamNotFoundError,
  ReamRateLimitError,
  ReamServerError,
} from '../lib/errors.js';

describe('errors', () => {
  describe('ReamApiError', () => {
    it('should store status and body', () => {
      const error = new ReamApiError('test error', 400, { detail: 'bad request' });

      expect(error.message).toBe('test error');
      expect(error.status).toBe(400);
      expect(error.body).toEqual({ detail: 'bad request' });
      expect(error.name).toBe('ReamApiError');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('ReamAuthError', () => {
    it('should default to 401 status', () => {
      const error = new ReamAuthError();

      expect(error.message).toBe('Authentication failed');
      expect(error.status).toBe(401);
      expect(error.name).toBe('ReamAuthError');
      expect(error).toBeInstanceOf(ReamApiError);
    });

    it('should accept custom message and body', () => {
      const error = new ReamAuthError('Invalid credentials', { Message: 'Bad login' });

      expect(error.message).toBe('Invalid credentials');
      expect(error.body).toEqual({ Message: 'Bad login' });
    });
  });

  describe('ReamNotFoundError', () => {
    it('should default to 404 status', () => {
      const error = new ReamNotFoundError();

      expect(error.message).toBe('Resource not found');
      expect(error.status).toBe(404);
      expect(error.name).toBe('ReamNotFoundError');
      expect(error).toBeInstanceOf(ReamApiError);
    });
  });

  describe('ReamRateLimitError', () => {
    it('should default to 429 status with null retryAfter', () => {
      const error = new ReamRateLimitError();

      expect(error.status).toBe(429);
      expect(error.retryAfter).toBeNull();
      expect(error.name).toBe('ReamRateLimitError');
      expect(error).toBeInstanceOf(ReamApiError);
    });

    it('should store retryAfter value', () => {
      const error = new ReamRateLimitError(60);

      expect(error.retryAfter).toBe(60);
    });
  });

  describe('ReamServerError', () => {
    it('should default to 500 status', () => {
      const error = new ReamServerError();

      expect(error.message).toBe('Internal server error');
      expect(error.status).toBe(500);
      expect(error.name).toBe('ReamServerError');
      expect(error).toBeInstanceOf(ReamApiError);
    });
  });
});
