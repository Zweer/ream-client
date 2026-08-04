import { randomBytes } from 'node:crypto';

import type { HttpClient } from './http.js';
import type { ElementCreateResponse, UploadTokenResponse } from './types.js';

const AZURE_BLOB_BASE_URL = 'https://reamebook.blob.core.windows.net';

/**
 * Generate a unique element key for an image upload.
 */
export function generateElementKey(): string {
  return randomBytes(8).toString('hex');
}

/**
 * Get a SAS token for uploading to Azure Blob Storage.
 *
 * @param httpClient - The HTTP client instance
 * @param storyKey - The story key (container)
 * @param chapterKey - The chapter key
 * @param elementKey - The element key (blob name)
 * @returns Upload token response with SAS token and expiration
 */
export async function getUploadToken(
  httpClient: HttpClient,
  storyKey: string,
  chapterKey: string,
  elementKey: string,
): Promise<UploadTokenResponse> {
  return httpClient.request<UploadTokenResponse>('/api/story/ebook/token/get', {
    body: {
      StoryKey: storyKey,
      ChapterKey: chapterKey,
      ElementKey: elementKey,
      PermissionRequested: 'owner',
    },
  });
}

/**
 * Register an element (file metadata) with Ream's database.
 *
 * @param httpClient - The HTTP client instance
 * @param storyKey - The story key
 * @param chapterKey - The chapter key
 * @param elementKey - The element key
 * @param bytes - File size in bytes
 * @returns Element creation response
 */
export async function registerElement(
  httpClient: HttpClient,
  storyKey: string,
  chapterKey: string,
  elementKey: string,
  bytes: number,
): Promise<ElementCreateResponse> {
  return httpClient.request<ElementCreateResponse>('/api/story/ebook/element/create', {
    body: {
      StoryKey: storyKey,
      ChapterKey: chapterKey,
      ElementKey: elementKey,
      Bytes: bytes,
    },
  });
}

/**
 * Upload raw file bytes to Azure Blob Storage.
 *
 * @param httpClient - The HTTP client instance
 * @param storyKey - The story key (container name)
 * @param elementKey - The element key (blob name)
 * @param token - SAS token string
 * @param data - Raw file bytes
 * @param contentType - MIME type of the file
 */
export async function uploadToAzure(
  httpClient: HttpClient,
  storyKey: string,
  elementKey: string,
  token: string,
  data: Uint8Array,
  contentType: string,
): Promise<void> {
  const url = `${AZURE_BLOB_BASE_URL}/${storyKey}/${elementKey}?${token}`;

  await httpClient.rawRequest(url, {
    method: 'PUT',
    headers: {
      'content-type': 'application/octet-stream',
      'x-ms-blob-type': 'BlockBlob',
      'x-ms-blob-content-type': contentType,
      'x-ms-version': '2024-05-04',
    },
    body: data,
  });
}

/**
 * Upload an image to a chapter (orchestrates the full 3-step flow).
 *
 * @param httpClient - The HTTP client instance
 * @param storyKey - The story key
 * @param chapterKey - The chapter key
 * @param data - Raw file bytes
 * @param contentType - MIME type (e.g., "image/png")
 * @returns The element key that can be referenced in chapter content
 */
export async function uploadImage(
  httpClient: HttpClient,
  storyKey: string,
  chapterKey: string,
  data: Uint8Array,
  contentType: string,
): Promise<string> {
  const elementKey = generateElementKey();

  // Step 1: Get SAS token
  const { Token } = await getUploadToken(httpClient, storyKey, chapterKey, elementKey);

  // Step 2: Register element metadata
  await registerElement(httpClient, storyKey, chapterKey, elementKey, data.byteLength);

  // Step 3: Upload to Azure
  await uploadToAzure(httpClient, storyKey, elementKey, Token, data, contentType);

  return elementKey;
}
