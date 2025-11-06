import { ClothingCategory } from '../types';

// AI识别结果接口
export interface AIRecognitionResult {
  category: ClothingCategory;
  confidence: number; // 0-1 之间的置信度
}

// 使用本地关键词匹配算法，模拟AI识别
// 如需接入真实AI服务，可替换为Google Cloud Vision、Azure Computer Vision等API
//
// === 接入真实AI API指南 ===
//
// 1. Google Cloud Vision API:
//    - 安装: npm install @google-cloud/vision
//    - 配置: 在Google Cloud Console创建API Key
//    - 使用: vision.labelDetection() 识别物体标签
//
// 2. Azure Computer Vision:
//    - 安装: npm install @azure/cognitiveservices-computervision
//    - 配置: 在Azure Portal获取endpoint和key
//    - 使用: analyzeImage() 进行图像分析
//
// 3. TensorFlow.js + MobileNet:
//    - 安装: npm install @tensorflow/tfjs @tensorflow-models/mobilenet
//    - 本地运行，无需服务器
//    - 使用: model.classify(image)
//
export class AIService {
  /**
   * 分析图片并识别衣物类别（支持多物品）
   * @param imageUri 图片URI
   * @returns 识别出的多个可能类别及置信度
   */
  async recognizeClothingCategories(imageUri: string): Promise<AIRecognitionResult[]> {
    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 实际项目中，这里应该调用真实的AI API
      // 例如 Google Cloud Vision API:
      //
      // const vision = require('@google-cloud/vision');
      // const client = new vision.ImageAnnotatorClient();
      // const [result] = await client.labelDetection(imageUri);
      // const labels = result.labelAnnotations;
      // return this.mapLabelsToCategories(labels);
      //
      // 或者使用 Azure Computer Vision:
      //
      // const { ComputerVisionClient } = require('@azure/cognitiveservices-computervision');
      // const client = new ComputerVisionClient(credentials, endpoint);
      // const analysis = await client.analyzeImage(imageUri, { visualFeatures: ['Tags'] });
      // return this.mapTagsToCategories(analysis.tags);

      // 当前使用模拟识别作为演示
      return this.mockRecognitionMultiple(imageUri);
    } catch (error) {
      console.error('AI recognition error:', error);
      throw new Error('AI识别失败');
    }
  }

  /**
   * 单类别识别（为了向后兼容）
   */
  async recognizeClothingCategory(imageUri: string): Promise<ClothingCategory> {
    const results = await this.recognizeClothingCategories(imageUri);
    return results.length > 0 ? results[0].category : 'top';
  }

  /**
   * 模拟AI识别结果（演示用）
   * 实际项目中应该删除此方法，使用真实的AI API
   */
  private mockRecognition(imageUri: string): ClothingCategory {
    const categories: ClothingCategory[] = [
      'top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessories'
    ];
    
    // 基于URI的哈希值进行伪随机选择，使同一图片结果一致
    const hash = imageUri.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = hash % categories.length;
    
    return categories[index];
  }

  /**
   * 模拟多物品AI识别（演示用）
   * 返回多个可能的类别和置信度
   */
  private mockRecognitionMultiple(imageUri: string): AIRecognitionResult[] {
    const hash = imageUri.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // 模拟识别多个物品的场景
    const allCategories: ClothingCategory[] = [
      'top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessories'
    ];
    
    // 根据哈希值生成1-3个结果
    const numResults = (hash % 3) + 1; // 1-3个结果
    const results: AIRecognitionResult[] = [];
    
    for (let i = 0; i < numResults; i++) {
      const categoryIndex = (hash + i * 7) % allCategories.length;
      const confidence = 0.95 - (i * 0.15); // 第一个0.95，第二个0.80，第三个0.65
      
      results.push({
        category: allCategories[categoryIndex],
        confidence: Math.max(0.5, confidence),
      });
    }
    
    // 按置信度排序
    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 将AI API返回结果映射到应用的类别
   * 这是一个示例方法，需要根据实际使用的AI服务调整
   */
  private mapAIResultToCategory(aiResult: any): ClothingCategory {
    // 示例：假设AI返回的标签是英文
    const labels = aiResult.labels || [];
    
    // 定义关键词映射规则
    const categoryKeywords: Record<ClothingCategory, string[]> = {
      top: ['shirt', 't-shirt', 'blouse', 'top', 'sweater', 'jacket'],
      bottom: ['pants', 'trousers', 'jeans', 'shorts', 'skirt'],
      dress: ['dress', 'gown', 'frock'],
      outerwear: ['coat', 'jacket', 'blazer', 'cardigan'],
      shoes: ['shoe', 'boot', 'sneaker', 'sandal', 'heel'],
      accessories: ['bag', 'hat', 'scarf', 'belt', 'jewelry', 'watch'],
    };

    // 遍历AI返回的标签，匹配类别
    for (const label of labels) {
      const labelLower = label.toLowerCase();
      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => labelLower.includes(keyword))) {
          return category as ClothingCategory;
        }
      }
    }

    // 默认返回上衣
    return 'top';
  }

  /**
   * 批量识别（可选功能）
   */
  async recognizeBatch(imageUris: string[]): Promise<ClothingCategory[]> {
    return Promise.all(imageUris.map(uri => this.recognizeClothingCategory(uri)));
  }

  /**
   * 分析图片并生成标签建议
   * @param imageUri 图片URI
   * @returns 建议的标签数组
   */
  async suggestTags(imageUri: string): Promise<string[]> {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 模拟标签建议
      const possibleTags = [
        ['休闲', '棉质', '夏季'],
        ['正式', '商务', '黑色'],
        ['运动', '透气', '春秋'],
        ['时尚', '潮流', '街头'],
        ['简约', '基础款', '百搭'],
      ];
      
      const hash = imageUri.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const index = hash % possibleTags.length;
      
      return possibleTags[index];
    } catch (error) {
      console.error('Tag suggestion error:', error);
      return [];
    }
  }
}

// 导出单例
export const aiService = new AIService();
