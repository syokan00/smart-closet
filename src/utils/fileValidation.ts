/**
 * File validation and security utilities
 */

/**
 * Valid image file extensions
 */
const VALID_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * Maximum file size (10MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Validate image file extension
 */
export const validateImageExtension = (uri: string): boolean => {
  if (!uri || typeof uri !== 'string') {
    return false;
  }

  const extension = uri.toLowerCase().slice(uri.lastIndexOf('.'));
  return VALID_IMAGE_EXTENSIONS.includes(extension);
};

/**
 * Sanitize filename to prevent path traversal attacks
 */
export const sanitizeFileName = (filename: string): string => {
  if (!filename || typeof filename !== 'string') {
    return 'unnamed';
  }

  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Only allow safe characters
    .replace(/\.{2,}/g, '_') // Replace multiple dots
    .slice(0, 100); // Limit length
};

/**
 * Validate file URI format
 */
export const validateFileUri = (uri: string): boolean => {
  if (!uri || typeof uri !== 'string') {
    return false;
  }

  // Check for valid URI schemes
  const validSchemes = ['file://', 'content://', 'assets-library://', 'ph://'];
  const hasValidScheme = validSchemes.some(scheme => uri.startsWith(scheme));

  if (!hasValidScheme && !uri.startsWith('/')) {
    return false;
  }

  // Check for path traversal attempts
  if (uri.includes('..')) {
    console.error('Path traversal attempt detected');
    return false;
  }

  return true;
};

/**
 * Extract file extension from URI
 */
export const getFileExtension = (uri: string): string => {
  if (!uri || typeof uri !== 'string') {
    return '';
  }

  const lastDot = uri.lastIndexOf('.');
  const lastSlash = uri.lastIndexOf('/');

  if (lastDot === -1 || lastDot < lastSlash) {
    return '';
  }

  return uri.slice(lastDot).toLowerCase();
};

/**
 * Validate image dimensions (optional, requires react-native-image-size)
 */
export const isReasonableImageSize = (width: number, height: number): boolean => {
  const MAX_DIMENSION = 10000;
  const MIN_DIMENSION = 10;

  return (
    width >= MIN_DIMENSION &&
    height >= MIN_DIMENSION &&
    width <= MAX_DIMENSION &&
    height <= MAX_DIMENSION
  );
};

/**
 * Generate safe file path
 */
export const generateSafeFileName = (prefix: string = 'img'): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${sanitizeFileName(prefix)}_${timestamp}_${random}.jpg`;
};

/**
 * Validate that a path doesn't escape the app directory
 */
export const isPathSafe = (path: string, baseDir: string): boolean => {
  if (!path || !baseDir) {
    return false;
  }

  // Check for path traversal
  if (path.includes('..')) {
    return false;
  }

  // Normalize paths for comparison
  const normalizedPath = path.replace(/\\/g, '/');
  const normalizedBase = baseDir.replace(/\\/g, '/');

  // Check if path starts with base directory
  return normalizedPath.startsWith(normalizedBase);
};
