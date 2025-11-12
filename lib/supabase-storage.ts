import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Supabase Storage Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const storageBucket = process.env.SUPABASE_STORAGE_BUCKET || 'cms-media'

// Lazy-initialized Supabase client
let supabase: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration is missing')
    }

    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  return supabase
}

// Validate Supabase configuration
export function validateSupabaseConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!supabaseUrl) errors.push('NEXT_PUBLIC_SUPABASE_URL is not set')
  if (!supabaseServiceKey) errors.push('SUPABASE_SERVICE_ROLE_KEY is not set')
  if (!storageBucket) errors.push('SUPABASE_STORAGE_BUCKET is not set')

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadToSupabase(
  fileBuffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const client = getSupabaseClient()
  const filePath = `media/${filename}`

  const { data, error} = await client.storage
    .from(storageBucket)
    .upload(filePath, fileBuffer, {
      contentType: mimeType,
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Supabase upload error:', error)
    throw new Error(`Failed to upload to Supabase: ${error.message}`)
  }

  // Generate public URL
  const { data: { publicUrl } } = client.storage
    .from(storageBucket)
    .getPublicUrl(filePath)

  return publicUrl
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFromSupabase(fileUrl: string): Promise<void> {
  const client = getSupabaseClient()
  // Extract the file path from URL
  const filePath = extractFilePathFromUrl(fileUrl)

  if (!filePath) {
    throw new Error('Invalid Supabase URL')
  }

  const { error } = await client.storage
    .from(storageBucket)
    .remove([filePath])

  if (error) {
    console.error('Supabase delete error:', error)
    throw new Error(`Failed to delete from Supabase: ${error.message}`)
  }
}

/**
 * Delete multiple files from Supabase Storage
 */
export async function deleteManyFromSupabase(fileUrls: string[]): Promise<void> {
  const client = getSupabaseClient()
  const filePaths = fileUrls
    .map(url => extractFilePathFromUrl(url))
    .filter(Boolean) as string[]

  if (filePaths.length === 0) return

  const { error } = await client.storage
    .from(storageBucket)
    .remove(filePaths)

  if (error) {
    console.error('Supabase batch delete error:', error)
    throw new Error(`Failed to batch delete from Supabase: ${error.message}`)
  }
}

/**
 * Extract file path from Supabase URL
 */
function extractFilePathFromUrl(url: string): string | null {
  try {
    // Supabase URL format: https://[project-ref].supabase.co/storage/v1/object/public/[bucket]/[path]
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')

    // Find the bucket name in the path
    const bucketIndex = pathParts.indexOf(storageBucket)
    if (bucketIndex === -1) return null

    // Everything after the bucket name is the file path
    const filePath = pathParts.slice(bucketIndex + 1).join('/')
    return filePath || null
  } catch (error) {
    console.error('Error extracting file path from URL:', error)
    return null
  }
}

/**
 * Check if bucket exists and is accessible
 */
export async function checkBucketAccess(): Promise<boolean> {
  try {
    const client = getSupabaseClient()
    const { data, error } = await client.storage.getBucket(storageBucket)

    if (error) {
      console.error('Bucket access error:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Error checking bucket access:', error)
    return false
  }
}
