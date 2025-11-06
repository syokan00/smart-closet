import React, { useState } from 'react';
import { View, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import { Button, Text, Chip, TextInput, Switch, ActivityIndicator } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { ClothingCategory, ClothingItem, OOTD } from '../types';
import { clothingStorage, ootdStorage } from '../services/storage';
import { aiService, AIRecognitionResult } from '../services/aiService';
import { clothingSegmentationService, SegmentedClothingItem } from '../services/clothingSegmentationService';
import { useLanguage } from '../contexts/LanguageContext';
import AdBanner from '../components/AdBanner';

export default function UploadScreen({ navigation }: any) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [category, setCategory] = useState<ClothingCategory | null>(null);
  const [tags, setTags] = useState<string>('');
  const [saveAsOOTD, setSaveAsOOTD] = useState<boolean>(true);
  const [enableSmartSegmentation, setEnableSmartSegmentation] = useState<boolean>(false);
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);
  const [isSegmenting, setIsSegmenting] = useState<boolean>(false);
  const [segmentedItems, setSegmentedItems] = useState<SegmentedClothingItem[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AIRecognitionResult[]>([]);
  const { t } = useLanguage();

  const categories: ClothingCategory[] = [
    'top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessories'
  ];

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t.upload.title, t.upload.galleryPermission);
      return false;
    }
    return true;
  };

  const processImage = async (uri: string) => {
    try {
      // 压缩图片到合适的大小，节省存储空间
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [
          { resize: { width: 1200 } }, // 最大宽度 1200px
        ],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipResult.uri;
    } catch (error) {
      console.error('Image processing error:', error);
      return uri; // 如果失败，返回原图
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t.upload.title, t.upload.cameraPermission);
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      const processedUri = await processImage(result.assets[0].uri);
      setImageUri(processedUri);
      // 自动调用AI识别
      handleAIRecognition(processedUri);
    }
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      const processedUri = await processImage(result.assets[0].uri);
      setImageUri(processedUri);
      // 自动调用AI识别
      handleAIRecognition(processedUri);
    }
  };

  const handleAIRecognition = async (uri: string) => {
    setIsRecognizing(true);
    try {
      // 调用多物品识别
      const recognitionResults = await aiService.recognizeClothingCategories(uri);
      setAiSuggestions(recognitionResults);
      
      // 预填最高置信度的类别
      if (recognitionResults.length > 0) {
        setCategory(recognitionResults[0].category);
      }
      
      // 同时获取标签建议
      const suggestedTags = await aiService.suggestTags(uri);
      if (suggestedTags.length > 0 && !tags) {
        setTags(suggestedTags.join(','));
      }
      
      // 如果识别出多个结果，提示用户
      const message = recognitionResults.length > 1 
        ? t.upload.aiRecognitionMultiple.replace('{count}', recognitionResults.length.toString())
        : t.upload.aiRecognitionSuccess;
      
      Alert.alert(t.common.success, message);
    } catch (error) {
      console.error('AI recognition error:', error);
      Alert.alert(t.common.error, t.upload.aiRecognitionFailed);
    } finally {
      setIsRecognizing(false);
    }
  };

  const handleSmartSegmentation = async () => {
    if (!imageUri) {
      Alert.alert(t.common.error, t.upload.selectImageAndCategory);
      return;
    }

    setIsSegmenting(true);
    try {
      const items = await clothingSegmentationService.segmentClothing(imageUri);
      setSegmentedItems(items);
      
      Alert.alert(
        t.common.success,
        t.upload.segmentationSuccess.replace('{count}', items.length.toString()),
        [
          {
            text: t.upload.saveAllItems,
            onPress: () => handleSaveSegmentedItems(items),
          },
          {
            text: t.common.cancel,
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Segmentation error:', error);
      Alert.alert(t.common.error, t.upload.segmentationFailed);
    } finally {
      setIsSegmenting(false);
    }
  };

  const handleSaveSegmentedItems = async (items: SegmentedClothingItem[]) => {
    try {
      for (const item of items) {
        const newItem: ClothingItem = {
          id: `${Date.now()}_${Math.random()}`,
          imageUri: item.imageUri,
          transparentImageUri: item.imageUri, // 分割后的已经是透明的
          category: item.category,
          tags: tags.split(',').map(t => t.trim()).filter(t => t),
          createdAt: new Date(),
          isFavorite: false,
        };
        await clothingStorage.save(newItem);
      }
      
      Alert.alert(
        t.common.success,
        t.upload.allItemsSaved.replace('{count}', items.length.toString()),
        [
          {
            text: t.upload.viewWardrobe,
            onPress: () => navigation.navigate('Wardrobe'),
          },
        ]
      );
      
      // 重置表单
      setImageUri(null);
      setCategory(null);
      setTags('');
      setSegmentedItems([]);
      setEnableSmartSegmentation(false);
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert(t.common.error, t.upload.saveFailed);
    }
  };

  const handleSave = async () => {
    if (!imageUri || !category) {
      Alert.alert(t.upload.title, t.upload.selectImageAndCategory);
      return;
    }

    const itemId = Date.now().toString();
    const newItem: ClothingItem = {
      id: itemId,
      imageUri,
      category,
      tags: tags.split(',').map(t => t.trim()).filter(t => t),
      createdAt: new Date(),
      isFavorite: false,
    };

    try {
      // 保存衣物
      await clothingStorage.save(newItem);
      
      // 如果选中保存为OOTD，也保存到日历
      if (saveAsOOTD) {
        const ootd: OOTD = {
          id: `ootd_${itemId}`,
          date: new Date(),
          imageUri: imageUri,
          clothingItems: [itemId],
          notes: tags,
        };
        await ootdStorage.save(ootd);
      }
      
      Alert.alert(t.common.success, saveAsOOTD ? t.upload.saveSuccessWithOOTD : t.upload.saveSuccess, [
        {
          text: t.upload.viewWardrobe,
          onPress: () => navigation.navigate('Wardrobe'),
        },
        {
          text: saveAsOOTD ? t.upload.viewCalendar : t.upload.continueAdd,
          onPress: () => {
            if (saveAsOOTD) {
              navigation.navigate('Calendar');
            }
          },
        },
      ]);
      
      // 重置表单
      setImageUri(null);
      setCategory(null);
      setTags('');
      setSaveAsOOTD(true);
      setEnableSmartSegmentation(false);
      setAiSuggestions([]);
      setSegmentedItems([]);
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert(t.common.error, t.upload.saveFailed);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {t.upload.title}
      </Text>

      {/* 照片预览 */}
      <View style={styles.imageContainer}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Text>{t.upload.selectOrTake}</Text>
          </View>
        )}
      </View>

      {/* 拍照/选择按钮 */}
      <View style={styles.buttonRow}>
        <Button mode="contained" onPress={takePhoto} style={styles.button}>
          {t.upload.takePhoto}
        </Button>
        <Button mode="outlined" onPress={pickImage} style={styles.button}>
          {t.upload.choosePhoto}
        </Button>
      </View>

      {/* AI识别状态 */}
      {isRecognizing && (
        <View style={styles.aiRecognitionContainer}>
          <ActivityIndicator size="small" color="#6200ee" />
          <Text style={styles.aiRecognitionText}>{t.upload.aiRecognizing}</Text>
        </View>
      )}

      {/* AI识别建议 */}
      {aiSuggestions.length > 0 && (
        <View style={styles.aiSuggestionsContainer}>
          <Text style={styles.aiSuggestionsTitle}>
            {t.upload.aiSuggestions}
          </Text>
          <View style={styles.suggestionChips}>
            {aiSuggestions.map((result, index) => (
              <Chip
                key={index}
                selected={category === result.category}
                onPress={() => setCategory(result.category)}
                style={styles.suggestionChip}
                icon={category === result.category ? 'check' : undefined}
              >
                {t.categories[result.category]} ({Math.round(result.confidence * 100)}%)
              </Chip>
            ))}
          </View>
          <Text style={styles.aiHint}>{t.upload.aiHint}</Text>
        </View>
      )}

      {/* 类别选择 */}
      <View style={styles.categoryHeader}>
        <Text style={styles.sectionTitle}>
          {t.upload.selectCategory}
        </Text>
        {imageUri && !isRecognizing && (
          <Button
            mode="text"
            onPress={() => handleAIRecognition(imageUri)}
            icon="robot"
            compact
          >
            {t.upload.useAI}
          </Button>
        )}
      </View>
      <View style={styles.categoryContainer}>
        {categories.map((cat) => (
          <Chip
            key={cat}
            selected={category === cat}
            onPress={() => setCategory(cat)}
            style={styles.chip}
          >
            {t.categories[cat]}
          </Chip>
        ))}
      </View>

      {/* 标签输入 */}
      <Text style={styles.sectionTitle}>
        {t.upload.addTags}
      </Text>
      <TextInput
        value={tags}
        onChangeText={setTags}
        placeholder={t.upload.tagsPlaceholder}
        mode="outlined"
        style={styles.input}
      />

      {/* 保存为今日OOTD */}
      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>{t.upload.saveAsOOTD}</Text>
        <Switch value={saveAsOOTD} onValueChange={setSaveAsOOTD} />
      </View>

      {/* 智能分割 */}
      <View style={styles.switchContainer}>
        <View style={styles.switchLabelContainer}>
          <Text style={styles.switchLabel}>{t.upload.enableSmartSegmentation}</Text>
          <Text style={styles.switchHint}>{t.upload.segmentationHint}</Text>
        </View>
        <Switch 
          value={enableSmartSegmentation} 
          onValueChange={setEnableSmartSegmentation}
          disabled={!imageUri}
        />
      </View>

      {/* 智能分割按钮 */}
      {enableSmartSegmentation && imageUri && (
        <Button
          mode="contained"
          onPress={handleSmartSegmentation}
          loading={isSegmenting}
          disabled={isSegmenting}
          style={styles.segmentButton}
          icon="scissors-cutting"
        >
          {isSegmenting ? t.upload.segmenting : t.upload.startSegmentation}
        </Button>
      )}

      {/* 分割结果预览 */}
      {segmentedItems.length > 0 && (
        <View style={styles.segmentedItemsContainer}>
          <Text style={styles.sectionTitle}>{t.upload.segmentedItems}</Text>
          <View style={styles.segmentedGrid}>
            {segmentedItems.map((item, index) => (
              <View key={index} style={styles.segmentedItemCard}>
                <Image source={{ uri: item.imageUri }} style={styles.segmentedItemImage} />
                <Text style={styles.segmentedItemLabel}>
                  {t.categories[item.category]}
                </Text>
                <Text style={styles.segmentedItemConfidence}>
                  {Math.round(item.confidence * 100)}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 保存按钮 */}
      <Button
        mode="contained"
        onPress={handleSave}
        style={styles.saveButton}
        disabled={!imageUri || !category}
      >
        {t.upload.save}
      </Button>
      
      <AdBanner placement="bottom" onUpgrade={() => navigation.navigate('Subscription')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1C1B1F',
    marginTop: 8,
    marginBottom: 20,
    textAlign: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  image: {
    width: 300,
    height: 400,
    borderRadius: 12,
  },
  placeholder: {
    width: 300,
    height: 400,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  button: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1B1F',
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiRecognitionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#f0f0ff',
    borderRadius: 8,
    marginBottom: 16,
  },
  aiRecognitionText: {
    marginLeft: 8,
    color: '#6200ee',
    fontWeight: '500',
  },
  aiSuggestionsContainer: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#b3d9ff',
  },
  aiSuggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 8,
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  suggestionChip: {
    marginRight: 4,
    marginBottom: 4,
  },
  aiHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  switchLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1B1F',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  input: {
    marginBottom: 24,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 8,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 12,
  },
  switchHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff0f0',
    borderRadius: 8,
    marginBottom: 16,
  },
  processingText: {
    marginLeft: 8,
    color: '#ff6b6b',
    fontWeight: '500',
  },
  saveButton: {
    marginBottom: 40,
  },
  segmentButton: {
    marginBottom: 24,
    backgroundColor: '#9c27b0',
  },
  segmentedItemsContainer: {
    marginBottom: 24,
  },
  segmentedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  segmentedItemCard: {
    width: '30%',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  segmentedItemImage: {
    width: '100%',
    height: 80,
    borderRadius: 4,
    marginBottom: 4,
  },
  segmentedItemLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  segmentedItemConfidence: {
    fontSize: 10,
    color: '#666',
  },
});
