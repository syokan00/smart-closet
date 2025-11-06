import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateChecksum, verifyChecksum } from '../utils/security';
import { errorHandler, ErrorType } from '../utils/errorHandler';

/**
 * Secure storage wrapper with data integrity checks
 */

interface StoredData<T> {
  value: T;
  timestamp: number;
  checksum: string;
  version: string;
}

const STORAGE_VERSION = '1.0.0';

class SecureStorage {
  /**
   * Store data with integrity check
   */
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      // Validate key
      if (!key || typeof key !== 'string') {
        throw new Error('Invalid storage key');
      }

      // Create data package with checksum
      const data: StoredData<T> = {
        value,
        timestamp: Date.now(),
        checksum: generateChecksum(value),
        version: STORAGE_VERSION,
      };

      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      errorHandler.logError(
        error as Error,
        `SecureStorage.setItem: ${key}`,
        ErrorType.STORAGE
      );
      throw error;
    }
  }

  /**
   * Retrieve data with integrity check
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      // Validate key
      if (!key || typeof key !== 'string') {
        throw new Error('Invalid storage key');
      }

      const stored = await AsyncStorage.getItem(key);
      if (!stored) return null;

      const data: StoredData<T> = JSON.parse(stored);

      // Verify data integrity
      if (!verifyChecksum(data.value, data.checksum)) {
        errorHandler.logError(
          'Data integrity check failed',
          `SecureStorage.getItem: ${key}`,
          ErrorType.STORAGE
        );
        console.warn(`Data integrity check failed for key: ${key}`);
        return null;
      }

      // Check version compatibility (for future migrations)
      if (data.version !== STORAGE_VERSION) {
        console.warn(`Storage version mismatch for key: ${key}`);
        // In the future, perform migration here
      }

      return data.value;
    } catch (error) {
      errorHandler.logError(
        error as Error,
        `SecureStorage.getItem: ${key}`,
        ErrorType.STORAGE
      );
      return null;
    }
  }

  /**
   * Remove item from storage
   */
  async removeItem(key: string): Promise<void> {
    try {
      if (!key || typeof key !== 'string') {
        throw new Error('Invalid storage key');
      }

      await AsyncStorage.removeItem(key);
    } catch (error) {
      errorHandler.logError(
        error as Error,
        `SecureStorage.removeItem: ${key}`,
        ErrorType.STORAGE
      );
      throw error;
    }
  }

  /**
   * Get all keys
   */
  async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      errorHandler.logError(
        error as Error,
        'SecureStorage.getAllKeys',
        ErrorType.STORAGE
      );
      return [];
    }
  }

  /**
   * Clear all data
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      errorHandler.logError(
        error as Error,
        'SecureStorage.clear',
        ErrorType.STORAGE
      );
      throw error;
    }
  }

  /**
   * Get multiple items
   */
  async multiGet<T>(keys: string[]): Promise<Array<[string, T | null]>> {
    try {
      const results: Array<[string, T | null]> = [];

      for (const key of keys) {
        const value = await this.getItem<T>(key);
        results.push([key, value]);
      }

      return results;
    } catch (error) {
      errorHandler.logError(
        error as Error,
        'SecureStorage.multiGet',
        ErrorType.STORAGE
      );
      return [];
    }
  }

  /**
   * Set multiple items
   */
  async multiSet<T>(keyValuePairs: Array<[string, T]>): Promise<void> {
    try {
      for (const [key, value] of keyValuePairs) {
        await this.setItem(key, value);
      }
    } catch (error) {
      errorHandler.logError(
        error as Error,
        'SecureStorage.multiSet',
        ErrorType.STORAGE
      );
      throw error;
    }
  }

  /**
   * Check if key exists
   */
  async hasItem(key: string): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value !== null;
    } catch (error) {
      errorHandler.logError(
        error as Error,
        `SecureStorage.hasItem: ${key}`,
        ErrorType.STORAGE
      );
      return false;
    }
  }

  /**
   * Get storage info (size estimation)
   */
  async getStorageInfo(): Promise<{ keys: number; estimatedSize: number }> {
    try {
      const keys = await this.getAllKeys();
      let estimatedSize = 0;

      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          estimatedSize += value.length;
        }
      }

      return {
        keys: keys.length,
        estimatedSize,
      };
    } catch (error) {
      errorHandler.logError(
        error as Error,
        'SecureStorage.getStorageInfo',
        ErrorType.STORAGE
      );
      return { keys: 0, estimatedSize: 0 };
    }
  }
}

// Export singleton instance
export const secureStorage = new SecureStorage();
