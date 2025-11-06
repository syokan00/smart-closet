import AsyncStorage from '@react-native-async-storage/async-storage';
import { ClothingItem, OOTD, UserPreferences } from '../types';

const KEYS = {
  CLOTHING_ITEMS: '@smart_closet:clothing_items',
  OOTDS: '@smart_closet:ootds',
  PREFERENCES: '@smart_closet:preferences',
};

// 衣物管理
export const clothingStorage = {
  async getAll(): Promise<ClothingItem[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.CLOTHING_ITEMS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading clothing items:', error);
      return [];
    }
  },

  async save(item: ClothingItem): Promise<void> {
    try {
      const items = await this.getAll();
      const index = items.findIndex(i => i.id === item.id);
      
      if (index >= 0) {
        items[index] = item;
      } else {
        items.push(item);
      }
      
      await AsyncStorage.setItem(KEYS.CLOTHING_ITEMS, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving clothing item:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const items = await this.getAll();
      const filtered = items.filter(i => i.id !== id);
      await AsyncStorage.setItem(KEYS.CLOTHING_ITEMS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting clothing item:', error);
      throw error;
    }
  },

  async toggleFavorite(id: string): Promise<void> {
    try {
      const items = await this.getAll();
      const item = items.find(i => i.id === id);
      if (item) {
        item.isFavorite = !item.isFavorite;
        await this.save(item);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  },
};

// OOTD 管理
export const ootdStorage = {
  async getAll(): Promise<OOTD[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.OOTDS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading OOTDs:', error);
      return [];
    }
  },

  async save(ootd: OOTD): Promise<void> {
    try {
      const ootds = await this.getAll();
      const index = ootds.findIndex(o => o.id === ootd.id);
      
      if (index >= 0) {
        ootds[index] = ootd;
      } else {
        ootds.push(ootd);
      }
      
      await AsyncStorage.setItem(KEYS.OOTDS, JSON.stringify(ootds));
    } catch (error) {
      console.error('Error saving OOTD:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const ootds = await this.getAll();
      const filtered = ootds.filter(o => o.id !== id);
      await AsyncStorage.setItem(KEYS.OOTDS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting OOTD:', error);
      throw error;
    }
  },
};

// 用户偏好管理
export const preferencesStorage = {
  async get(): Promise<UserPreferences> {
    try {
      const data = await AsyncStorage.getItem(KEYS.PREFERENCES);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error loading preferences:', error);
      return {};
    }
  },

  async save(preferences: UserPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving preferences:', error);
      throw error;
    }
  },
};
