import * as FileSystem from 'expo-file-system/legacy';
import { ClothingCategory } from '../types';
import { backgroundRemovalService } from './backgroundRemovalService';
import { API_CONFIG } from '../config/api';

/**
 * 服装分割识别结果
 */
export interface SegmentedClothingItem {
  category: ClothingCategory;
  imageUri: string; // 分割后的单品图片
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
}

/**
 * 服装分割服务
 * 
 * 功能：从一张完整穿搭照中自动识别并分割出各个单品
 * 
 * 支持的方案：
 * 1. Remove.bg + AI识别（推荐）
 * 2. Segment Anything Model (SAM)
 * 3. DeepFashion API
 * 4. 模拟分割（演示用）
 */
export class ClothingSegmentationService {
  /**
   * 分析并分割穿搭照片
   * @param imageUri 完整的穿搭照片URI
   * @returns 分割出的各个单品数组
   */
  async segmentClothing(imageUri: string): Promise<SegmentedClothingItem[]> {
    try {
      console.log('Starting clothing segmentation for:', imageUri);
      
      // 尝试使用 Google Cloud Vision
      // 如果配置了API Key，使用真实分割
      // 否则使用模拟分割
      
      // 先尝试使用Google Vision
      try {
        return await this.segmentWithGoogleVision(imageUri);
      } catch (visionError) {
        console.log('Google Vision not available, using mock segmentation');
        return await this.mockSegmentation(imageUri);
      }
    } catch (error) {
      console.error('Segmentation error:', error);
      throw new Error('服装分割失败');
    }
  }

  /**
   * 使用 Google Cloud Vision API 进行服装分割
   */
  private async segmentWithGoogleVision(imageUri: string): Promise<SegmentedClothingItem[]> {
    const API_KEY = API_CONFIG.GOOGLE_VISION_API_KEY;
    
    if (!API_KEY || API_KEY === 'YOUR_GOOGLE_CLOUD_VISION_API_KEY') {
      throw new Error('Google Cloud Vision API Key not configured');
    }

    console.log('Using Google Cloud Vision for segmentation');

    try {
      // 1. 获取图片尺寸
      const ImageManipulator = require('expo-image-manipulator');
      const imageInfo = await ImageManipulator.manipulateAsync(
        imageUri,
        [],
        { format: ImageManipulator.SaveFormat.JPEG }
      );
      const { width: imageWidth, height: imageHeight } = imageInfo;
      console.log(`Image size: ${imageWidth}x${imageHeight}`);

      // 2. 读取图片为base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
      });

      // 3. 调用 Google Vision API - Object Localization
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                image: {
                  content: base64,
                },
                features: [
                  {
                    type: 'OBJECT_LOCALIZATION', // 物体定位
                    maxResults: 15,
                  },
                  {
                    type: 'LABEL_DETECTION', // 标签检测
                    maxResults: 20,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google Vision API error:', errorText);
        throw new Error(`API调用失败: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const annotations = result.responses[0];

      // 4. 解析结果，过滤出服装相关的物体
      const items: SegmentedClothingItem[] = [];
      const CONFIDENCE_THRESHOLD = 0.3; // 降低置信度阈值到 0.3，识别更多物体
      
      if (annotations.localizedObjectAnnotations) {
        console.log(`Found ${annotations.localizedObjectAnnotations.length} objects`);
        
        // 按置信度排序，优先处理高置信度的
        const sortedObjects = annotations.localizedObjectAnnotations.sort((a: any, b: any) => b.score - a.score);
        
        for (const obj of sortedObjects) {
          console.log(`Checking: ${obj.name} (confidence: ${obj.score.toFixed(2)})`);
          
          // 过滤低置信度的识别结果
          if (obj.score < CONFIDENCE_THRESHOLD) {
            console.log(`  → Skipped: Low confidence`);
            continue;
          }

          const category = this.mapGoogleLabelToCategory(obj.name);
          
          if (category) {
            console.log(`Processing ${obj.name} -> ${category} (confidence: ${obj.score})`);
            
            // 获取边界框坐标 (Google返回的是归一化坐标 0-1)
            const vertices = obj.boundingPoly.normalizedVertices;
            
            // 转换为实际像素坐标
            const x = Math.floor(vertices[0].x * imageWidth);
            const y = Math.floor(vertices[0].y * imageHeight);
            const width = Math.floor((vertices[2].x - vertices[0].x) * imageWidth);
            const height = Math.floor((vertices[2].y - vertices[0].y) * imageHeight);
            
            // 确保坐标有效
            if (width <= 0 || height <= 0) {
              console.log(`Invalid dimensions for ${obj.name}: ${width}x${height}`);
              continue;
            }

            const box = { x, y, width, height };
            console.log(`Bounding box: x=${x}, y=${y}, w=${width}, h=${height}`);

            try {
              // 裁剪该区域的图片
              const croppedUri = await this.cropImageRegion(imageUri, box);
              
              // 为裁剪后的图片抠图 (可选)
              let transparentUri = croppedUri;
              try {
                transparentUri = await backgroundRemovalService.removeBackground(croppedUri);
                console.log(`Background removed for ${obj.name}`);
              } catch (bgError) {
                console.log(`Background removal failed for ${obj.name}, using cropped image`);
              }

              items.push({
                category,
                imageUri: transparentUri,
                boundingBox: box,
                confidence: obj.score,
              });
            } catch (cropError) {
              console.error(`Failed to process ${obj.name}:`, cropError);
            }
          } else {
            console.log(`Not a clothing item: ${obj.name}`);
          }
        }
      }

      if (items.length === 0) {
        console.warn('No clothing items detected');
        throw new Error('未识别到服装物品，请尝试其他照片');
      }

      console.log(`Successfully segmented ${items.length} items`);
      return items;
    } catch (error) {
      console.error('Google Vision segmentation error:', error);
      throw error;
    }
  }

  /**
   * 将Google Vision返回的标签映射到服装类别
   */
  private mapGoogleLabelToCategory(label: string): ClothingCategory | null {
    const lowerLabel = label.toLowerCase();
    
    // 过滤掉人物相关的识别结果
    const excludeKeywords = [
      'person', 'people', 'human', 'man', 'woman', 'boy', 'girl',
      'face', 'head', 'body', 'hand', 'leg', 'arm', 'foot'
    ];
    
    for (const keyword of excludeKeywords) {
      if (lowerLabel.includes(keyword)) {
        console.log(`Filtered out: ${label} (person-related)`);
        return null; // 过滤掉人物
      }
    }
    
    // 服装类别关键词映射
    const categoryMap: Record<string, ClothingCategory> = {
      // 上衣
      'shirt': 'top',
      'top': 'top',
      't-shirt': 'top',
      'blouse': 'top',
      'sweater': 'top',
      'tank top': 'top',
      
      // 下装
      'pants': 'bottom',
      'trousers': 'bottom',
      'jeans': 'bottom',
      'shorts': 'bottom',
      'skirt': 'bottom',
      
      // 连衣裙
      'dress': 'dress',
      'gown': 'dress',
      
      // 外套
      'jacket': 'outerwear',
      'coat': 'outerwear',
      'blazer': 'outerwear',
      'cardigan': 'outerwear',
      
      // 鞋子
      'shoe': 'shoes',
      'shoes': 'shoes',
      'boot': 'shoes',
      'sneaker': 'shoes',
      'sandal': 'shoes',
      'heel': 'shoes',
      
      // 配饰
      'hat': 'accessories',
      'bag': 'accessories',
      'scarf': 'accessories',
      'belt': 'accessories',
      'sunglasses': 'accessories',
      'watch': 'accessories',
    };

    for (const [keyword, category] of Object.entries(categoryMap)) {
      if (lowerLabel.includes(keyword)) {
        return category;
      }
    }

    return null; // 不是服装相关的物体
  }

  /**
   * 裁剪图片指定区域
   */
  private async cropImageRegion(imageUri: string, box: any): Promise<string> {
    const ImageManipulator = require('expo-image-manipulator');
    
    try {
      // 确保裁剪坐标为整数且有效
      const crop = {
        originX: Math.max(0, Math.floor(box.x)),
        originY: Math.max(0, Math.floor(box.y)),
        width: Math.max(1, Math.floor(box.width)),
        height: Math.max(1, Math.floor(box.height)),
      };

      console.log('Cropping with:', crop);

      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ crop }],
        { 
          format: ImageManipulator.SaveFormat.PNG,
          compress: 0.9,
        }
      );
      
      console.log('Cropped successfully:', manipResult.uri);
      return manipResult.uri;
    } catch (error) {
      console.error('Crop error:', error);
      throw error; // 裁剪失败应该抛出错误，而不是返回原图
    }
  }

  /**
   * 模拟服装分割（演示用）
   * 实际项目中应该使用真实的AI分割服务
   */
  private async mockSegmentation(imageUri: string): Promise<SegmentedClothingItem[]> {
    console.log('Using mock segmentation...');
    
    // 模拟处理延迟
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 模拟识别到的单品
    // 实际应该返回真实分割的图片
    const mockItems: SegmentedClothingItem[] = [
      {
        category: 'top',
        imageUri: imageUri, // 实际应该是分割后的上衣部分
        boundingBox: { x: 100, y: 50, width: 200, height: 150 },
        confidence: 0.95,
      },
      {
        category: 'bottom',
        imageUri: imageUri, // 实际应该是分割后的裤子部分
        boundingBox: { x: 100, y: 200, width: 200, height: 200 },
        confidence: 0.92,
      },
    ];
    
    return mockItems;
  }

  /**
   * 使用 Remove.bg + 区域裁剪的方式分割
   * 适用于纯色背景的照片
   */
  private async segmentWithRemoveBg(imageUri: string): Promise<SegmentedClothingItem[]> {
    // 1. 先用 Remove.bg 抠图
    const transparentUri = await backgroundRemovalService.removeBackground(imageUri);
    
    // 2. 分析透明图，识别不同区域
    // 这需要使用图像处理库分析像素
    // 可以使用 expo-image-manipulator 或 react-native-image-crop-picker
    
    // 3. 根据区域位置判断是上衣/裤子/鞋子
    const segments = await this.analyzeTransparentImage(transparentUri);
    
    // 4. 裁剪各个区域保存为单独的图片
    const items: SegmentedClothingItem[] = [];
    for (const segment of segments) {
      const croppedUri = await this.cropImage(transparentUri, segment.boundingBox);
      items.push({
        category: segment.category,
        imageUri: croppedUri,
        boundingBox: segment.boundingBox,
        confidence: segment.confidence,
      });
    }
    
    return items;
  }

  /**
   * 分析透明图像，识别不同服装区域
   */
  private async analyzeTransparentImage(imageUri: string): Promise<any[]> {
    // 这里需要实现图像分析逻辑
    // 可以使用：
    // - TensorFlow.js
    // - OpenCV.js
    // - 云端AI服务
    
    // 简单的启发式规则：
    // - 图片上半部分通常是上衣
    // - 中间部分是裤子/裙子
    // - 下部分是鞋子
    
    return [
      {
        category: 'top' as ClothingCategory,
        boundingBox: { x: 0, y: 0, width: 100, height: 40 },
        confidence: 0.9,
      },
      {
        category: 'bottom' as ClothingCategory,
        boundingBox: { x: 0, y: 40, width: 100, height: 60 },
        confidence: 0.85,
      },
    ];
  }

  /**
   * 裁剪图片指定区域
   */
  private async cropImage(imageUri: string, box: any): Promise<string> {
    // 使用 expo-image-manipulator 裁剪
    // const manipResult = await ImageManipulator.manipulateAsync(
    //   imageUri,
    //   [{ crop: { originX: box.x, originY: box.y, width: box.width, height: box.height } }],
    //   { format: ImageManipulator.SaveFormat.PNG }
    // );
    // return manipResult.uri;
    
    return imageUri; // 占位
  }

  /**
   * 使用专业的服装分割API
   * 例如：DeepFashion、Fashwell等
   */
  private async segmentWithDeepFashionAPI(imageUri: string): Promise<SegmentedClothingItem[]> {
    // DeepFashion API调用示例
    const API_KEY = 'YOUR_DEEPFASHION_API_KEY';
    
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as any);
    
    const response = await fetch('https://api.deepfashion.com/segment', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: formData,
    });
    
    const result = await response.json();
    
    // 解析返回的分割结果
    const items: SegmentedClothingItem[] = [];
    for (const item of result.items) {
      items.push({
        category: this.mapToCategoryType(item.type),
        imageUri: item.segmented_image_url,
        boundingBox: item.bounding_box,
        confidence: item.confidence,
      });
    }
    
    return items;
  }

  /**
   * 映射API返回的类型到应用的类别
   */
  private mapToCategoryType(apiType: string): ClothingCategory {
    const mapping: Record<string, ClothingCategory> = {
      'shirt': 'top',
      'blouse': 'top',
      't-shirt': 'top',
      'pants': 'bottom',
      'jeans': 'bottom',
      'skirt': 'bottom',
      'dress': 'dress',
      'jacket': 'outerwear',
      'coat': 'outerwear',
      'shoes': 'shoes',
      'sneakers': 'shoes',
      'accessories': 'accessories',
    };
    
    return mapping[apiType.toLowerCase()] || 'top';
  }

  /**
   * 批量分割多张照片
   */
  async segmentBatch(imageUris: string[]): Promise<SegmentedClothingItem[][]> {
    return Promise.all(imageUris.map(uri => this.segmentClothing(uri)));
  }
}

export const clothingSegmentationService = new ClothingSegmentationService();


