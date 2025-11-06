import * as FileSystem from 'expo-file-system/legacy';
import { API_CONFIG } from '../config/api';

/**
 * 背景移除服务
 * 
 * 支持多种背景移除方案：
 * 1. Remove.bg API (推荐，效果最好)
 * 2. Cloudinary AI Background Removal
 * 3. 本地简单算法（仅演示用）
 */

export class BackgroundRemovalService {
  /**
   * 移除图片背景
   * @param imageUri 原始图片URI
   * @returns 处理后的透明背景图片URI
   */
  async removeBackground(imageUri: string): Promise<string> {
    try {
      // 优先级顺序：
      // 1. PhotoRoom API (最推荐，专为服装设计)
      // 2. Remove.bg API (效果好)
      // 3. Cloudinary (免费额度大)
      // 4. Mock (演示用)
      
      // 尝试使用 Remove.bg（如果配置了API Key）
      if (API_CONFIG.REMOVE_BG_API_KEY && 
          API_CONFIG.REMOVE_BG_API_KEY !== 'YOUR_REMOVE_BG_API_KEY') {
        console.log('Using Remove.bg API for background removal');
        return await this.removeBackgroundWithRemoveBg(imageUri);
      }
      
      // 否则使用模拟处理
      console.log('Using mock background removal (no real API configured)');
      return await this.mockBackgroundRemoval(imageUri);
    } catch (error) {
      console.error('Background removal error:', error);
      throw new Error('背景移除失败');
    }
  }

  /**
   * 使用 Remove.bg API 移除背景
   * 需要注册账号获取API Key: https://www.remove.bg/api
   */
  private async removeBackgroundWithRemoveBg(imageUri: string): Promise<string> {
    const API_KEY = API_CONFIG.REMOVE_BG_API_KEY;
    
    if (!API_KEY || API_KEY === 'YOUR_REMOVE_BG_API_KEY') {
      console.warn('Remove.bg API Key not configured!');
      throw new Error('请在 src/config/api.ts 中配置 Remove.bg API Key');
    }

    const timeout = 30000; // 30秒超时

    try {
      console.log('Starting background removal for:', imageUri);
      
      // 使用 FormData 直接上传文件
      const formData = new FormData();
      
      // 从 URI 创建文件对象
      const file: any = {
        uri: imageUri,
        type: 'image/png',
        name: 'image.png',
      };
      
      formData.append('image_file', file);
      formData.append('size', 'auto'); // 自动选择合适大小
      formData.append('format', 'png'); // 输出PNG格式

      // 使用Promise.race实现超时
      const fetchPromise = fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': API_KEY,
        },
        body: formData,
      });

      const timeoutPromise = new Promise<Response>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeout);
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        let errorMessage = `API调用失败: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.errors?.[0]?.title || errorMessage;
          console.error('Remove.bg API error:', errorData);
        } catch {
          const errorText = await response.text();
          console.error('Remove.bg API error:', response.status, errorText);
        }
        throw new Error(errorMessage);
      }

      // 获取处理后的图片 (Blob)
      const blob = await response.blob();
      console.log('Received blob:', blob.size, 'bytes');
      
      if (blob.size === 0) {
        throw new Error('Received empty image data');
      }
      
      // 将 Blob 转换为 Base64
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('FileReader timeout'));
        }, 10000);

        reader.onloadend = () => {
          clearTimeout(timeoutId);
          const result = reader.result as string;
          if (!result || !result.includes(',')) {
            reject(new Error('Invalid FileReader result'));
            return;
          }
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = () => {
          clearTimeout(timeoutId);
          reject(new Error('FileReader error'));
        };
        reader.readAsDataURL(blob);
      });
      
      // 保存到本地文件
      const fileName = `bg_removed_${Date.now()}.png`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: 'base64',
      });

      // 验证文件是否成功保存
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error('Failed to save processed image');
      }

      console.log('Background removed successfully:', fileUri, `(${fileInfo.size} bytes)`);
      return fileUri;
    } catch (error: any) {
      console.error('Remove.bg processing error:', error);
      
      // 更友好的错误提示
      if (error.message === 'Request timeout') {
        throw new Error('请求超时，请检查网络连接');
      } else if (error.message.includes('API')) {
        throw error;
      } else {
        throw new Error('背景移除失败，请稍后重试');
      }
    }
  }

  /**
   * 使用 Cloudinary 移除背景
   * 免费账户每月有限额
   */
  private async removeBackgroundWithCloudinary(imageUri: string): Promise<string> {
    const CLOUD_NAME = 'YOUR_CLOUD_NAME';
    const UPLOAD_PRESET = 'YOUR_UPLOAD_PRESET';

    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      name: 'image.jpg',
      type: 'image/jpeg',
    } as any);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('transformation', 'e_background_removal');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const result = await response.json();
    return result.secure_url;
  }

  /**
   * 模拟背景移除（演示用）
   * 实际项目中应该替换为真实的API调用
   */
  private async mockBackgroundRemoval(imageUri: string): Promise<string> {
    // 模拟处理延迟
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 在实际应用中，这里应该返回处理后的透明PNG
    // 当前只是返回原图作为演示
    // 真实场景需要将图片上传到remove.bg等服务
    
    console.log('Mock: Background removed from', imageUri);
    return imageUri; // 实际应该返回处理后的透明PNG
  }

  /**
   * 批量处理
   */
  async removeBatchBackgrounds(imageUris: string[]): Promise<string[]> {
    return Promise.all(imageUris.map(uri => this.removeBackground(uri)));
  }

  /**
   * 检查是否是透明PNG
   */
  isTransparentImage(imageUri: string): boolean {
    return imageUri.toLowerCase().endsWith('.png');
  }
}

export const backgroundRemovalService = new BackgroundRemovalService();

/**
 * === 接入真实背景移除服务指南 ===
 * 
 * 方案1: Remove.bg (推荐)
 * - 官网: https://www.remove.bg/
 * - 优点: 效果最好，专业服务
 * - 价格: 免费50次/月，付费$0.09-0.20/张
 * - 集成: 
 *   1. 注册账号获取API Key
 *   2. 使用上面的 removeBackgroundWithRemoveBg 方法
 *   3. npm install react-native-fs (保存结果)
 * 
 * 方案2: Cloudinary
 * - 官网: https://cloudinary.com/
 * - 优点: 免费额度较大，功能全面
 * - 价格: 免费25次/月背景移除
 * - 集成: 使用上面的 removeBackgroundWithCloudinary 方法
 * 
 * 方案3: Photoroom API
 * - 官网: https://www.photoroom.com/api/
 * - 优点: 专门为电商和时尚设计
 * - 价格: $29/月起
 * 
 * 方案4: 本地处理 (不推荐)
 * - 使用 TensorFlow.js + DeepLab 模型
 * - 优点: 完全离线，无需付费
 * - 缺点: 效果较差，性能消耗大
 * - npm install @tensorflow/tfjs @tensorflow-models/deeplab
 */
