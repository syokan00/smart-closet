import AsyncStorage from '@react-native-async-storage/async-storage';
import { SubscriptionTier, SubscriptionPlan, UserSubscription } from '../types';
import { translations, Language } from '../i18n';
import { isValidSubscriptionTier, validateUsageStats } from '../utils/validators';
import { errorHandler, ErrorType } from '../utils/errorHandler';

const SUBSCRIPTION_KEY = '@smart_closet_subscription';

// Base subscription plan configuration (without localized text)
const BASE_SUBSCRIPTION_PLANS = [
  {
    id: 'free' as SubscriptionTier,
    price: 0,
    period: 'month' as const,
    limits: {
      maxItems: 30,
      maxSegmentations: 3,
      aiRecognition: true,
      adFree: false,
      cloudBackup: false,
      prioritySupport: false,
    },
  },
  {
    id: 'basic' as SubscriptionTier,
    price: 9.9, // CNY ￥9.9 / USD $1.99 / JPY ¥199
    period: 'month' as const,
    limits: {
      maxItems: 200,
      maxSegmentations: 20,
      aiRecognition: true,
      adFree: true,
      cloudBackup: true,
      prioritySupport: false,
    },
  },
  {
    id: 'premium' as SubscriptionTier,
    price: 19.9, // CNY ￥19.9 / USD $2.99 / JPY ¥299
    period: 'month' as const,
    limits: {
      maxItems: undefined, // Unlimited
      maxSegmentations: undefined, // Unlimited
      aiRecognition: true,
      adFree: true,
      cloudBackup: true,
      prioritySupport: true,
    },
  },
];

// Get localized subscription plans based on language
export const getLocalizedPlans = (language: Language): SubscriptionPlan[] => {
  const t = translations[language];
  
  return BASE_SUBSCRIPTION_PLANS.map(plan => {
    let name: string;
    let features: string[];
    
    switch (plan.id) {
      case 'free':
        name = t.subscription.freePlanName;
        features = [
          t.subscription.freeFeature1,
          t.subscription.freeFeature2,
          t.subscription.freeFeature3,
        ];
        break;
      case 'basic':
        name = t.subscription.basicPlanName;
        features = [
          t.subscription.basicFeature1,
          t.subscription.basicFeature2,
          t.subscription.basicFeature3,
        ];
        break;
      case 'premium':
        name = t.subscription.premiumPlanName;
        features = [
          t.subscription.premiumFeature1,
          t.subscription.premiumFeature2,
          t.subscription.premiumFeature3,
        ];
        break;
      default:
        name = '';
        features = [];
    }
    
    return {
      ...plan,
      name,
      features,
    };
  });
};

// Deprecated: Use getLocalizedPlans() instead
// Kept for backwards compatibility with default Chinese locale
export const SUBSCRIPTION_PLANS = getLocalizedPlans('zh');

class SubscriptionService {
  private currentSubscription: UserSubscription | null = null;

  // Initialize subscription state with validation
  async initialize(): Promise<UserSubscription> {
    try {
      const stored = await AsyncStorage.getItem(SUBSCRIPTION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Validate subscription data
        if (!this.validateSubscription(parsed)) {
          errorHandler.logError(
            'Invalid subscription data in storage',
            'SubscriptionService.initialize',
            ErrorType.VALIDATION
          );
          // Reset to free tier if data is invalid
          this.currentSubscription = this.getDefaultSubscription();
          await this.saveSubscription();
          return this.currentSubscription;
        }
        
        // Convert date strings to Date objects
        if (parsed.startDate) parsed.startDate = new Date(parsed.startDate);
        if (parsed.endDate) parsed.endDate = new Date(parsed.endDate);
        this.currentSubscription = parsed;
      } else {
        // Default to free tier
        this.currentSubscription = this.getDefaultSubscription();
        await this.saveSubscription();
      }
    } catch (error) {
      errorHandler.logError(
        error as Error,
        'SubscriptionService.initialize',
        ErrorType.STORAGE
      );
      // Use free tier on error
      this.currentSubscription = this.getDefaultSubscription();
    }
    // TypeScript null check: currentSubscription is guaranteed to be set at this point
    return this.currentSubscription as UserSubscription;
  }

  // 获取当前订阅
  async getCurrentSubscription(): Promise<UserSubscription> {
    if (!this.currentSubscription) {
      await this.initialize();
    }
    return this.currentSubscription!;
  }

  // Get subscription plan details (with localized content)
  getPlan(tier: SubscriptionTier, language: Language = 'zh'): SubscriptionPlan {
    const plans = getLocalizedPlans(language);
    return plans.find(p => p.id === tier) || plans[0];
  }

  // Get current plan (with localized content)
  async getCurrentPlan(language: Language = 'zh'): Promise<SubscriptionPlan> {
    const subscription = await this.getCurrentSubscription();
    return this.getPlan(subscription.tier, language);
  }

  // 保存订阅状态
  private async saveSubscription(): Promise<void> {
    if (this.currentSubscription) {
      await AsyncStorage.setItem(
        SUBSCRIPTION_KEY,
        JSON.stringify(this.currentSubscription)
      );
    }
  }

  // 升级订阅
  async upgradeTo(tier: SubscriptionTier): Promise<boolean> {
    try {
      const now = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // 默认一个月

      this.currentSubscription = {
        tier,
        startDate: now,
        endDate,
        isActive: true,
        usageStats: {
          itemsCount: this.currentSubscription?.usageStats.itemsCount || 0,
          segmentationsThisMonth: 0, // 重置使用次数
        },
      };

      await this.saveSubscription();
      return true;
    } catch (error) {
      console.error('Failed to upgrade subscription:', error);
      return false;
    }
  }

  // Check if user can add item with validation
  async canAddItem(language: Language = 'zh'): Promise<{ allowed: boolean; reason?: string }> {
    const subscription = await this.getCurrentSubscription();
    
    // Validate usage stats
    if (!validateUsageStats(subscription.usageStats)) {
      errorHandler.logError(
        'Invalid usage stats detected',
        'SubscriptionService.canAddItem',
        ErrorType.VALIDATION
      );
      // Reset invalid stats
      subscription.usageStats.itemsCount = Math.max(0, subscription.usageStats.itemsCount || 0);
      await this.saveSubscription();
    }
    
    const plan = this.getPlan(subscription.tier, language);

    if (!plan.limits.maxItems) {
      return { allowed: true }; // Unlimited
    }

    if (subscription.usageStats.itemsCount >= plan.limits.maxItems) {
      return {
        allowed: false,
        reason: `已达到${plan.name}最大衣物数量限制（${plan.limits.maxItems}件）`,
      };
    }

    return { allowed: true };
  }

  // Check if user can use segmentation
  async canUseSegmentation(language: Language = 'zh'): Promise<{ allowed: boolean; reason?: string }> {
    const subscription = await this.getCurrentSubscription();
    const plan = this.getPlan(subscription.tier, language);

    if (!plan.limits.maxSegmentations) {
      return { allowed: true }; // Unlimited
    }

    if (subscription.usageStats.segmentationsThisMonth >= plan.limits.maxSegmentations) {
      return {
        allowed: false,
        reason: `本月智能分割次数已用完（${plan.limits.maxSegmentations}次）`,
      };
    }

    return { allowed: true };
  }

  // Increment item count with bounds checking
  async incrementItemCount(): Promise<void> {
    if (this.currentSubscription) {
      // Sanity check: prevent unreasonable values
      if (this.currentSubscription.usageStats.itemsCount >= 100000) {
        errorHandler.logError(
          'Item count exceeded maximum',
          'SubscriptionService.incrementItemCount',
          ErrorType.VALIDATION
        );
        return;
      }
      
      this.currentSubscription.usageStats.itemsCount++;
      await this.saveSubscription();
    }
  }

  // Decrement item count with bounds checking
  async decrementItemCount(): Promise<void> {
    if (this.currentSubscription) {
      // Ensure count doesn't go negative
      if (this.currentSubscription.usageStats.itemsCount > 0) {
        this.currentSubscription.usageStats.itemsCount--;
      } else {
        this.currentSubscription.usageStats.itemsCount = 0;
      }
      await this.saveSubscription();
    }
  }

  // 增加分割使用次数
  async incrementSegmentationCount(): Promise<void> {
    if (this.currentSubscription) {
      this.currentSubscription.usageStats.segmentationsThisMonth++;
      await this.saveSubscription();
    }
  }

  // Check if user is ad-free
  async isAdFree(): Promise<boolean> {
    const plan = await this.getCurrentPlan();
    return plan.limits.adFree || false;
  }

  // Reset monthly usage stats (should be called on the 1st of each month)
  async resetMonthlyStats(): Promise<void> {
    if (this.currentSubscription) {
      this.currentSubscription.usageStats.segmentationsThisMonth = 0;
      await this.saveSubscription();
    }
  }

  // Get remaining usage
  async getRemainingUsage(): Promise<{
    items: number | 'unlimited';
    segmentations: number | 'unlimited';
  }> {
    const subscription = await this.getCurrentSubscription();
    const plan = this.getPlan(subscription.tier);

    return {
      items: plan.limits.maxItems
        ? plan.limits.maxItems - subscription.usageStats.itemsCount
        : 'unlimited',
      segmentations: plan.limits.maxSegmentations
        ? plan.limits.maxSegmentations - subscription.usageStats.segmentationsThisMonth
        : 'unlimited',
    };
  }

  // Private: Get default subscription
  private getDefaultSubscription(): UserSubscription {
    return {
      tier: 'free',
      isActive: true,
      usageStats: {
        itemsCount: 0,
        segmentationsThisMonth: 0,
      },
    };
  }

  // Private: Validate subscription data
  private validateSubscription(subscription: any): boolean {
    if (!subscription || typeof subscription !== 'object') {
      return false;
    }

    if (!isValidSubscriptionTier(subscription.tier)) {
      return false;
    }

    if (typeof subscription.isActive !== 'boolean') {
      return false;
    }

    if (!validateUsageStats(subscription.usageStats)) {
      return false;
    }

    return true;
  }
}

export const subscriptionService = new SubscriptionService();
