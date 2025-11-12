/**
 * Unified Storage Interface
 * Automatically switches between S3 and Supabase based on configuration
 */

import {
  uploadToS3,
  deleteFromS3,
  deleteManyFromS3,
  validateS3Config
} from './s3'

import {
  uploadToSupabase,
  deleteFromSupabase,
  deleteManyFromSupabase,
  validateSupabaseConfig
} from './supabase-storage'

// Determine which storage provider to use
const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL
const useS3 = !!process.env.S3_ACCESS_KEY_ID

/**
 * Validate storage configuration
 */
export function validateStorageConfig(): { valid: boolean; errors: string[]; provider: string } {
  if (useSupabase) {
    const result = validateSupabaseConfig()
    return { ...result, provider: 'Supabase Storage' }
  }

  if (useS3) {
    const result = validateS3Config()
    return { ...result, provider: 'S3-Compatible Storage' }
  }

  return {
    valid: false,
    errors: ['No storage provider configured. Please set either Supabase or S3 environment variables.'],
    provider: 'None'
  }
}

/**
 * Upload file to storage (auto-detect provider)
 */
export async function uploadToStorage(
  fileBuffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  if (useSupabase) {
    return uploadToSupabase(fileBuffer, filename, mimeType)
  }

  if (useS3) {
    return uploadToS3(fileBuffer, filename, mimeType)
  }

  throw new Error('No storage provider configured')
}

/**
 * Delete file from storage (auto-detect provider)
 */
export async function deleteFromStorage(fileUrl: string): Promise<void> {
  if (useSupabase) {
    return deleteFromSupabase(fileUrl)
  }

  if (useS3) {
    return deleteFromS3(fileUrl)
  }

  throw new Error('No storage provider configured')
}

/**
 * Delete multiple files from storage (auto-detect provider)
 */
export async function deleteManyFromStorage(fileUrls: string[]): Promise<void> {
  if (useSupabase) {
    return deleteManyFromSupabase(fileUrls)
  }

  if (useS3) {
    return deleteManyFromS3(fileUrls)
  }

  throw new Error('No storage provider configured')
}

/**
 * Get current storage provider name
 */
export function getStorageProvider(): string {
  if (useSupabase) return 'Supabase Storage'
  if (useS3) return 'S3-Compatible Storage'
  return 'None'
}
