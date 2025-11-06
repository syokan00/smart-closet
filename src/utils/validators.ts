import { ClothingItem, ClothingCategory, OOTD } from '../types';

/**
 * Validate clothing category
 */
export const isValidCategory = (category: any): category is ClothingCategory => {
  const validCategories: ClothingCategory[] = [
    'top',
    'bottom',
    'dress',
    'outerwear',
    'shoes',
    'accessories',
  ];
  return validCategories.includes(category);
};

/**
 * Validate clothing item structure and data
 */
export const validateClothingItem = (item: any): item is ClothingItem => {
  try {
    // Check required fields
    if (!item || typeof item !== 'object') {
      console.error('Invalid item: not an object');
      return false;
    }

    if (!item.id || typeof item.id !== 'string') {
      console.error('Invalid item: missing or invalid id');
      return false;
    }

    if (!item.imageUri || typeof item.imageUri !== 'string') {
      console.error('Invalid item: missing or invalid imageUri');
      return false;
    }

    if (!isValidCategory(item.category)) {
      console.error('Invalid item: invalid category');
      return false;
    }

    // Validate optional fields
    if (item.tags && !Array.isArray(item.tags)) {
      console.error('Invalid item: tags must be an array');
      return false;
    }

    if (item.tags && item.tags.length > 50) {
      console.error('Invalid item: too many tags');
      return false;
    }

    if (item.createdAt && !(item.createdAt instanceof Date) && isNaN(new Date(item.createdAt).getTime())) {
      console.error('Invalid item: invalid createdAt date');
      return false;
    }

    if (item.isFavorite !== undefined && typeof item.isFavorite !== 'boolean') {
      console.error('Invalid item: isFavorite must be boolean');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Validation error:', error);
    return false;
  }
};

/**
 * Validate OOTD structure
 */
export const validateOOTD = (ootd: any): ootd is OOTD => {
  try {
    if (!ootd || typeof ootd !== 'object') {
      return false;
    }

    if (!ootd.id || typeof ootd.id !== 'string') {
      return false;
    }

    if (!ootd.imageUri || typeof ootd.imageUri !== 'string') {
      return false;
    }

    if (!Array.isArray(ootd.clothingItems)) {
      return false;
    }

    // Validate date
    if (!ootd.date || (!(ootd.date instanceof Date) && isNaN(new Date(ootd.date).getTime()))) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('OOTD validation error:', error);
    return false;
  }
};

/**
 * Validate tags array
 */
export const validateTags = (tags: any): boolean => {
  if (!Array.isArray(tags)) {
    return false;
  }

  if (tags.length > 50) {
    return false;
  }

  return tags.every(tag => typeof tag === 'string' && tag.length > 0 && tag.length <= 100);
};

/**
 * Validate subscription tier
 */
export const isValidSubscriptionTier = (tier: any): boolean => {
  return ['free', 'basic', 'premium'].includes(tier);
};

/**
 * Validate usage stats
 */
export const validateUsageStats = (stats: any): boolean => {
  if (!stats || typeof stats !== 'object') {
    return false;
  }

  if (typeof stats.itemsCount !== 'number' || stats.itemsCount < 0) {
    return false;
  }

  if (typeof stats.segmentationsThisMonth !== 'number' || stats.segmentationsThisMonth < 0) {
    return false;
  }

  // Sanity check: prevent unreasonable values
  if (stats.itemsCount > 100000 || stats.segmentationsThisMonth > 10000) {
    return false;
  }

  return true;
};

/**
 * Validate email format (for future use)
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL format
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
