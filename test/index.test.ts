import { describe, expect, it } from 'vitest';

import { HttpClient, ReamApiError } from '../lib/index.js';

describe('ream-client exports', () => {
  it('should export HttpClient', () => {
    expect(HttpClient).toBeDefined();
  });

  it('should export error classes', () => {
    expect(ReamApiError).toBeDefined();
  });
});
