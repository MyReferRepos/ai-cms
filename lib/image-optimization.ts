import sharp from 'sharp'
import { isImage as isImageType } from './file-validation'

// Re-export for convenience
export { isImage } from './file-validation'

export interface OptimizedImage {
  original: Buffer
  thumbnail?: Buffer
  medium?: Buffer
  optimized: Buffer
}

export interface ImageDimensions {
  width: number
  height: number
}

// Image optimization configuration
const THUMBNAIL_SIZE = 200 // Max dimension for thumbnails
const MEDIUM_SIZE = 800 // Max dimension for medium images
const MAX_QUALITY = 90 // Quality for optimized images
const THUMBNAIL_QUALITY = 80 // Quality for thumbnails

/**
 * Optimize and resize images
 */
export async function optimizeImage(
  buffer: Buffer,
  mimeType: string,
  generateThumbnail = true
): Promise<OptimizedImage> {
  if (!isImageType(mimeType)) {
    return {
      original: buffer,
      optimized: buffer,
    }
  }

  // Skip SVG optimization (they're already optimized)
  if (mimeType === 'image/svg+xml') {
    return {
      original: buffer,
      optimized: buffer,
    }
  }

  try {
    const image = sharp(buffer)
    const metadata = await image.metadata()

    // Determine output format
    const format = getOptimalFormat(mimeType)

    // Generate optimized version (maintain aspect ratio, max 2000px)
    const optimized = await image
      .resize(2000, 2000, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      [format]({ quality: MAX_QUALITY })
      .toBuffer()

    const result: OptimizedImage = {
      original: buffer,
      optimized,
    }

    // Generate thumbnail if requested
    if (generateThumbnail) {
      result.thumbnail = await sharp(buffer)
        .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
          fit: 'cover',
          position: 'center',
        })
        [format]({ quality: THUMBNAIL_QUALITY })
        .toBuffer()
    }

    // Generate medium size for galleries
    if (metadata.width && metadata.width > MEDIUM_SIZE) {
      result.medium = await sharp(buffer)
        .resize(MEDIUM_SIZE, MEDIUM_SIZE, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        [format]({ quality: MAX_QUALITY })
        .toBuffer()
    }

    return result
  } catch (error) {
    console.error('Error optimizing image:', error)
    // Return original if optimization fails
    return {
      original: buffer,
      optimized: buffer,
    }
  }
}

/**
 * Get optimal output format for image
 */
function getOptimalFormat(mimeType: string): 'jpeg' | 'png' | 'webp' {
  switch (mimeType) {
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    case 'image/jpeg':
    case 'image/jpg':
    default:
      return 'jpeg'
  }
}

/**
 * Get image dimensions
 */
export async function getImageDimensions(buffer: Buffer): Promise<ImageDimensions | null> {
  try {
    const metadata = await sharp(buffer).metadata()
    if (metadata.width && metadata.height) {
      return {
        width: metadata.width,
        height: metadata.height,
      }
    }
    return null
  } catch (error) {
    console.error('Error getting image dimensions:', error)
    return null
  }
}

/**
 * Generate thumbnail filename
 */
export function getThumbnailFilename(originalFilename: string): string {
  const lastDotIndex = originalFilename.lastIndexOf('.')
  if (lastDotIndex === -1) {
    return `${originalFilename}-thumb`
  }

  const name = originalFilename.substring(0, lastDotIndex)
  const ext = originalFilename.substring(lastDotIndex)

  return `${name}-thumb${ext}`
}

/**
 * Generate medium size filename
 */
export function getMediumFilename(originalFilename: string): string {
  const lastDotIndex = originalFilename.lastIndexOf('.')
  if (lastDotIndex === -1) {
    return `${originalFilename}-medium`
  }

  const name = originalFilename.substring(0, lastDotIndex)
  const ext = originalFilename.substring(lastDotIndex)

  return `${name}-medium${ext}`
}
