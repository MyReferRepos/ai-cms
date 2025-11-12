import { S3Client, PutObjectCommand, DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'

// S3 Configuration
const s3Config = {
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
  region: process.env.S3_REGION || 'auto',
  ...(process.env.S3_ENDPOINT && { endpoint: process.env.S3_ENDPOINT }),
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true', // Required for MinIO and some providers
}

export const s3Client = new S3Client(s3Config)

export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || ''
export const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL || ''

// Validate S3 configuration
export function validateS3Config(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!process.env.S3_ACCESS_KEY_ID) errors.push('S3_ACCESS_KEY_ID is not set')
  if (!process.env.S3_SECRET_ACCESS_KEY) errors.push('S3_SECRET_ACCESS_KEY is not set')
  if (!process.env.S3_BUCKET_NAME) errors.push('S3_BUCKET_NAME is not set')
  if (!process.env.S3_REGION) errors.push('S3_REGION is not set')

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Upload file to S3-compatible storage
 */
export async function uploadToS3(
  fileBuffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const key = `media/${filename}`

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      // Make the file publicly accessible
      ACL: 'public-read',
    },
  })

  await upload.done()

  // Generate public URL
  if (S3_PUBLIC_URL) {
    // Use custom CDN/public URL if provided
    return `${S3_PUBLIC_URL}/${key}`
  } else if (process.env.S3_ENDPOINT) {
    // Use custom endpoint (e.g., MinIO, DigitalOcean Spaces)
    const endpoint = process.env.S3_ENDPOINT.replace(/\/$/, '')
    return `${endpoint}/${S3_BUCKET_NAME}/${key}`
  } else {
    // Default AWS S3 URL format
    return `https://${S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`
  }
}

/**
 * Delete file from S3-compatible storage
 */
export async function deleteFromS3(fileUrl: string): Promise<void> {
  // Extract the key from URL
  const key = extractKeyFromUrl(fileUrl)

  if (!key) {
    throw new Error('Invalid S3 URL')
  }

  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: key,
  })

  await s3Client.send(command)
}

/**
 * Delete multiple files from S3-compatible storage
 */
export async function deleteManyFromS3(fileUrls: string[]): Promise<void> {
  const keys = fileUrls.map(url => extractKeyFromUrl(url)).filter(Boolean) as string[]

  if (keys.length === 0) return

  const command = new DeleteObjectsCommand({
    Bucket: S3_BUCKET_NAME,
    Delete: {
      Objects: keys.map(key => ({ Key: key })),
      Quiet: true,
    },
  })

  await s3Client.send(command)
}

/**
 * Extract S3 key from URL
 */
function extractKeyFromUrl(url: string): string | null {
  try {
    // Handle custom public URL
    if (S3_PUBLIC_URL && url.startsWith(S3_PUBLIC_URL)) {
      return url.replace(`${S3_PUBLIC_URL}/`, '')
    }

    // Handle custom endpoint URL
    if (process.env.S3_ENDPOINT) {
      const endpoint = process.env.S3_ENDPOINT.replace(/\/$/, '')
      const pattern = new RegExp(`${endpoint}/${S3_BUCKET_NAME}/(.+)`)
      const match = url.match(pattern)
      return match ? match[1] : null
    }

    // Handle AWS S3 URL
    const awsPattern = new RegExp(`https://${S3_BUCKET_NAME}\\.s3\\..*\\.amazonaws\\.com/(.+)`)
    const awsMatch = url.match(awsPattern)
    if (awsMatch) return awsMatch[1]

    // Handle path-style URL
    const pathPattern = new RegExp(`/${S3_BUCKET_NAME}/(.+)`)
    const pathMatch = url.match(pathPattern)
    if (pathMatch) return pathMatch[1]

    return null
  } catch (error) {
    console.error('Error extracting key from URL:', error)
    return null
  }
}
