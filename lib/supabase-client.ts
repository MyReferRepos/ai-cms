import { createClient } from '@supabase/supabase-js'

// Supabase Storage Configuration - Using ANON key for better security
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const storageBucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'cms-media'

/**
 * Create Supabase client for client-side operations
 * Uses anon key which respects Row Level Security policies
 */
export function createSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration is missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: false
    }
  })
}

// Export bucket name for use in components
export const STORAGE_BUCKET = storageBucket

// Validate Supabase configuration
export function validateSupabaseConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!supabaseUrl) errors.push('NEXT_PUBLIC_SUPABASE_URL is not set')
  if (!supabaseAnonKey) errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
  if (!storageBucket) errors.push('NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET is not set')

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Upload file to Supabase Storage (Client-side)
 * This function should be called from the browser, not from API routes
 */
export async function uploadToSupabaseClient(
  file: File,
  filename: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const supabase = createSupabaseClient()
  const filePath = `media/${filename}`

  // Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer()

  const { data, error } = await supabase.storage
    .from(storageBucket)
    .upload(filePath, arrayBuffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Supabase upload error:', error)
    throw new Error(`Failed to upload to Supabase: ${error.message}`)
  }

  // Generate public URL
  const { data: { publicUrl } } = supabase.storage
    .from(storageBucket)
    .getPublicUrl(filePath)

  return publicUrl
}

/**
 * Delete file from Supabase Storage (Client-side)
 */
export async function deleteFromSupabaseClient(filePath: string): Promise<void> {
  const supabase = createSupabaseClient()

  const { error } = await supabase.storage
    .from(storageBucket)
    .remove([filePath])

  if (error) {
    console.error('Supabase delete error:', error)
    throw new Error(`Failed to delete from Supabase: ${error.message}`)
  }
}

/**
 * Extract file path from Supabase URL
 */
export function extractFilePathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')

    const bucketIndex = pathParts.indexOf(storageBucket)
    if (bucketIndex === -1) return null

    const filePath = pathParts.slice(bucketIndex + 1).join('/')
    return filePath || null
  } catch (error) {
    console.error('Error extracting file path from URL:', error)
    return null
  }
}
