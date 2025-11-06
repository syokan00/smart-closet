import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity, Alert } from 'react-native';
import { Text, SegmentedButtons, FAB, IconButton, Searchbar, Chip } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { ClothingItem } from '../types';
import { clothingStorage } from '../services/storage';
import { useLanguage } from '../contexts/LanguageContext';
import AdBanner from '../components/AdBanner';
import AdCard from '../components/AdCard';

export default function WardrobeScreen({ navigation }: any) {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { t } = useLanguage();

  // 页面聚焦时自动刷新
  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [])
  );

  const loadItems = async () => {
    const allItems = await clothingStorage.getAll();
    setItems(allItems);
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      await clothingStorage.toggleFavorite(id);
      await loadItems();
    } catch (error) {
      Alert.alert(t.common.error, t.wardrobe.operationFailed);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      t.wardrobe.deleteConfirm,
      t.wardrobe.deleteMessage,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await clothingStorage.delete(id);
              await loadItems();
            } catch (error) {
              Alert.alert(t.common.error, t.wardrobe.deleteFailed);
            }
          },
        },
      ]
    );
  };

  // 获取所有独特的标签
  const allTags = Array.from(new Set(items.flatMap(item => item.tags || [])));

  // 多层筛选：收藏 -> 类别 -> 标签搜索
  const filteredItems = items
    .filter(item => filter === 'all' || item.isFavorite)
    .filter(item => !selectedCategory || item.category === selectedCategory)
    .filter(item => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      // 搜索类别、标签
      const categoryMatch = t.categories[item.category]?.toLowerCase().includes(query);
      const tagsMatch = item.tags?.some(tag => tag.toLowerCase().includes(query));
      return categoryMatch || tagsMatch;
    });

  const renderItem = ({ item, index }: { item: ClothingItem; index: number }) => {
    // 每8个衣物后插入一个广告
    const shouldShowAd = index > 0 && index % 8 === 0;
    
    return (
      <>
        {shouldShowAd && (
          <View style={styles.adCardContainer}>
            <AdCard onUpgrade={() => navigation.navigate('Subscription')} />
          </View>
        )}
        <View style={styles.itemContainer}>
          <Image source={{ uri: item.imageUri }} style={styles.itemImage} />
          <View style={styles.itemOverlay}>
            <View style={styles.itemActions}>
              <IconButton
                icon={item.isFavorite ? 'heart' : 'heart-outline'}
                iconColor={item.isFavorite ? '#e74c3c' : '#fff'}
                size={24}
                onPress={() => handleToggleFavorite(item.id)}
              />
              <IconButton
                icon="delete"
                iconColor="#fff"
                size={24}
                onPress={() => handleDelete(item.id)}
              />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemCategory}>
                {t.categories[item.category]}
              </Text>
              {item.tags && item.tags.length > 0 && (
                <Text style={styles.itemTags}>
                  {item.tags.join(', ')}
                </Text>
              )}
            </View>
          </View>
        </View>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {t.wardrobe.title}
      </Text>

      {/* 搜索框 */}
      <Searchbar
        placeholder={t.wardrobe.searchPlaceholder}
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
        icon="magnify"
        clearIcon="close"
      />

      {/* 类别快速筛选 */}
      <View style={styles.categoryFilterContainer}>
        <Chip
          selected={!selectedCategory}
          onPress={() => setSelectedCategory(null)}
          style={styles.filterChip}
        >
          {t.wardrobe.allCategories}
        </Chip>
        {(['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessories'] as const).map((cat) => (
          <Chip
            key={cat}
            selected={selectedCategory === cat}
            onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            style={styles.filterChip}
          >
            {t.categories[cat]}
          </Chip>
        ))}
      </View>

      <SegmentedButtons
        value={filter}
        onValueChange={(value) => setFilter(value as 'all' | 'favorites')}
        buttons={[
          { value: 'all', label: t.wardrobe.all },
          { value: 'favorites', label: t.wardrobe.favorites },
        ]}
        style={styles.segmentedButtons}
      />

      {filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {t.wardrobe.empty}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
        />
      )}
      
      <AdBanner placement="bottom" onUpgrade={() => navigation.navigate('Subscription')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1C1B1F',
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
  searchbar: {
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
  },
  categoryFilterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    marginRight: 4,
    marginBottom: 4,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 80,
  },
  itemContainer: {
    flex: 1,
    margin: 4,
    aspectRatio: 0.75,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 4,
  },
  itemInfo: {
    padding: 8,
  },
  itemCategory: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  itemTags: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
  adCardContainer: {
    width: '100%',
    marginVertical: 8,
  },
});
