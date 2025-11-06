// 衣物类别
export type ClothingCategory = 
  | 'top' // 上衣
  | 'bottom' // 下装
  | 'dress' // 连衣裙
  | 'outerwear' // 外套
  | 'shoes' // 鞋子
  | 'accessories'; // 配饰

// 季节
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

// 颜色
export type Color = 
  | 'black' | 'white' | 'gray' 
  | 'red' | 'pink' | 'orange' 
  | 'yellow' | 'green' | 'blue' 
  | 'purple' | 'brown' | 'beige' 
  | 'multi'; // 多色

// 风格
export type Style = 
  | 'casual' // 休闲
  | 'formal' // 正式
  | 'sporty' // 运动
  | 'elegant' // 优雅
  | 'street' // 街头
  | 'vintage'; // 复古

// 衣物项目
export interface ClothingItem {
  id: string;
  imageUri: string;
  transparentImageUri?: string; // 抠图后的透明背景PNG
  category: ClothingCategory;
  color?: Color[];
  season?: Season[];
  style?: Style[];
  tags?: string[];
  createdAt: Date;
  isFavorite?: boolean;
}

// OOTD（当日穿搭）
export interface OOTD {
  id: string;
  date: Date;
  imageUri: string; // 组合后的完整穿搭图
  clothingItems: string[]; // 衣物ID数组
  isVirtual?: boolean; // 是否是虚拟搭配生成
  occasion?: string; // 场合
  weather?: {
    temperature?: number;
    condition?: string;
  };
  notes?: string;
  isFavorite?: boolean;
}

// 虚拟搭配项（画布上的单个衣物）
export interface VirtualStylingItem {
  clothingId: string;
  x: number; // 位置 x
  y: number; // 位置 y
  scale: number; // 缩放比例
  rotation: number; // 旋转角度
  zIndex: number; // 层级
}

// 用户偏好设置
export interface UserPreferences {
  defaultSeason?: Season;
  favoriteColors?: Color[];
  favoriteStyles?: Style[];
  language?: 'zh' | 'en' | 'ja';
  theme?: 'light' | 'dark';
}

// 订阅计划类型
export type SubscriptionTier = 'free' | 'basic' | 'premium';

// 订阅计划详情
export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  price: number;
  period: 'month' | 'year';
  features: string[];
  limits: {
    maxItems?: number; // 最大衣物数量
    maxSegmentations?: number; // 每月智能分割次数
    aiRecognition?: boolean; // AI识别
    adFree?: boolean; // 无广告
    cloudBackup?: boolean; // 云备份
    prioritySupport?: boolean; // 优先支持
  };
}

// 用户订阅状态
export interface UserSubscription {
  tier: SubscriptionTier;
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
  usageStats: {
    itemsCount: number;
    segmentationsThisMonth: number;
  };
}

// 支付方式
export type PaymentMethod = 
  | 'apple_pay'      // Apple Pay
  | 'google_pay'     // Google Pay
  | 'credit_card'    // 信用卡
  | 'alipay'         // 支付宝
  | 'wechat_pay'     // 微信支付
  | 'demo';          // 演示模式

// 支付状态
export type PaymentStatus = 
  | 'pending'        // 待支付
  | 'processing'     // 处理中
  | 'completed'      // 已完成
  | 'failed'         // 失败
  | 'cancelled'      // 已取消
  | 'refunded';      // 已退款

// 支付记录
export interface PaymentRecord {
  id: string;
  userId?: string;
  subscriptionTier: SubscriptionTier;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  createdAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  metadata?: {
    orderId?: string;
    receiptData?: string;
    productId?: string;
  };
}

// 支付请求
export interface PaymentRequest {
  subscriptionTier: SubscriptionTier;
  paymentMethod: PaymentMethod;
  amount: number;
  currency: string;
  returnUrl?: string;
}

// 支付结果
export interface PaymentResult {
  success: boolean;
  paymentRecord?: PaymentRecord;
  error?: {
    code: string;
    message: string;
  };
}
