/**
 * Security utilities for input sanitization and validation
 */

/**
 * Sanitize user input to prevent XSS and injection attacks
 */
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/[<>]/g, '') // Prevent XSS
    .replace(/[;'"\\]/g, '') // Prevent injection
    .trim()
    .slice(0, 500); // Limit length
};

/**
 * Sanitize an array of strings
 */
export const sanitizeArray = (items: string[]): string[] => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter(item => typeof item === 'string')
    .map(item => sanitizeInput(item))
    .filter(item => item.length > 0)
    .slice(0, 50); // Limit array size
};

/**
 * Validate string length
 */
export const validateLength = (
  input: string,
  min: number = 0,
  max: number = 500
): boolean => {
  if (typeof input !== 'string') {
    return false;
  }
  return input.length >= min && input.length <= max;
};

/**
 * Generate a simple checksum for data integrity
 * Note: This is NOT cryptographically secure, use only for basic integrity checks
 */
export const generateChecksum = (data: any): string => {
  const str = JSON.stringify(data);
  let hash = 0;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36);
};

/**
 * Verify data integrity using checksum
 */
export const verifyChecksum = (data: any, expectedChecksum: string): boolean => {
  const actualChecksum = generateChecksum(data);
  return actualChecksum === expectedChecksum;
};

/**
 * Sanitize object by removing potentially dangerous properties
 */
export const sanitizeObject = <T extends Record<string, any>>(
  obj: T,
  allowedKeys: string[]
): Partial<T> => {
  const sanitized: any = {};
  
  for (const key of allowedKeys) {
    if (obj.hasOwnProperty(key)) {
      sanitized[key] = obj[key];
    }
  }
  
  return sanitized;
};

/**
 * Check if a value is a valid date
 */
export const isValidDate = (date: any): boolean => {
  if (!date) return false;
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};
