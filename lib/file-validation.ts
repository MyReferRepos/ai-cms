// File validation configuration
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760') // Default: 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg']
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm']
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
]

const ALLOWED_MIME_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
  ...ALLOWED_AUDIO_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
]

// Dangerous file extensions to block
const BLOCKED_EXTENSIONS = [
  '.exe', '.dll', '.bat', '.cmd', '.sh', '.bash',
  '.ps1', '.vbs', '.js', '.jar', '.app', '.deb',
  '.rpm', '.dmg', '.pkg', '.run', '.bin',
]

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validate file size
 */
export function validateFileSize(size: number): ValidationResult {
  if (size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${formatFileSize(MAX_FILE_SIZE)}`,
    }
  }
  return { valid: true }
}

/**
 * Validate file type/MIME type
 */
export function validateFileType(mimeType: string, filename: string): ValidationResult {
  // Check MIME type whitelist
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: `File type '${mimeType}' is not allowed`,
    }
  }

  // Check for dangerous extensions
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'))
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `File extension '${ext}' is not allowed for security reasons`,
    }
  }

  return { valid: true }
}

/**
 * Validate file name
 */
export function validateFileName(filename: string): ValidationResult {
  if (!filename || filename.trim().length === 0) {
    return {
      valid: false,
      error: 'Filename cannot be empty',
    }
  }

  if (filename.length > 255) {
    return {
      valid: false,
      error: 'Filename is too long (max 255 characters)',
    }
  }

  // Check for path traversal attempts
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return {
      valid: false,
      error: 'Filename contains invalid characters',
    }
  }

  return { valid: true }
}

/**
 * Comprehensive file validation
 */
export function validateFile(file: File): ValidationResult {
  // Validate filename
  const nameValidation = validateFileName(file.name)
  if (!nameValidation.valid) return nameValidation

  // Validate file size
  const sizeValidation = validateFileSize(file.size)
  if (!sizeValidation.valid) return sizeValidation

  // Validate file type
  const typeValidation = validateFileType(file.type, file.name)
  if (!typeValidation.valid) return typeValidation

  return { valid: true }
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove or replace unsafe characters
  let sanitized = filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores

  // Ensure filename is not empty after sanitization
  if (sanitized.length === 0) {
    sanitized = 'file'
  }

  return sanitized
}

/**
 * Generate unique filename with timestamp
 */
export function generateUniqueFilename(originalFilename: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const sanitized = sanitizeFilename(originalFilename)

  // Split filename and extension
  const lastDotIndex = sanitized.lastIndexOf('.')
  if (lastDotIndex === -1) {
    return `${timestamp}-${random}-${sanitized}`
  }

  const name = sanitized.substring(0, lastDotIndex)
  const ext = sanitized.substring(lastDotIndex)

  return `${timestamp}-${random}-${name}${ext}`
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Check if file is an image
 */
export function isImage(mimeType: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(mimeType)
}

/**
 * Check if file is a video
 */
export function isVideo(mimeType: string): boolean {
  return ALLOWED_VIDEO_TYPES.includes(mimeType)
}

/**
 * Get file category
 */
export function getFileCategory(mimeType: string): 'image' | 'video' | 'audio' | 'document' | 'other' {
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) return 'image'
  if (ALLOWED_VIDEO_TYPES.includes(mimeType)) return 'video'
  if (ALLOWED_AUDIO_TYPES.includes(mimeType)) return 'audio'
  if (ALLOWED_DOCUMENT_TYPES.includes(mimeType)) return 'document'
  return 'other'
}
