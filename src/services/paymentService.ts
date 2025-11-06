import { 
  PaymentMethod, 
  PaymentRecord, 
  PaymentRequest, 
  PaymentResult,
  PaymentStatus,
  SubscriptionTier 
} from '../types';
import { secureStorage } from './secureStorage';
import { errorHandler, ErrorType } from '../utils/errorHandler';
import { subscriptionService } from './subscriptionService';

const PAYMENT_HISTORY_KEY = '@smart_closet_payment_history';
const DEMO_MODE = __DEV__; // 开发环境默认使用演示模式

/**
 * Payment Service
 * Supports demo payments and real payment integrations (Apple Pay, Google Pay, etc.)
 */
class PaymentService {
  private paymentHistory: PaymentRecord[] = [];

  /**
   * Initialize payment service
   */
  async initialize(): Promise<void> {
    try {
      const history = await secureStorage.getItem<PaymentRecord[]>(PAYMENT_HISTORY_KEY);
      if (history && Array.isArray(history)) {
        // Convert date strings back to Date objects
        this.paymentHistory = history.map(record => ({
          ...record,
          createdAt: new Date(record.createdAt),
          completedAt: record.completedAt ? new Date(record.completedAt) : undefined,
        }));
      }
    } catch (error) {
      errorHandler.logError(
        error as Error,
        'PaymentService.initialize',
        ErrorType.STORAGE
      );
    }
  }

  /**
   * Process payment
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      // Create payment record
      const paymentRecord: PaymentRecord = {
        id: this.generatePaymentId(),
        subscriptionTier: request.subscriptionTier,
        amount: request.amount,
        currency: request.currency,
        paymentMethod: request.paymentMethod,
        status: 'pending',
        createdAt: new Date(),
      };

      // Add to history
      this.paymentHistory.push(paymentRecord);
      await this.savePaymentHistory();

      // Process based on payment method
      let result: PaymentResult;
      
      if (DEMO_MODE || request.paymentMethod === 'demo') {
        result = await this.processDemoPayment(paymentRecord);
      } else {
        result = await this.processRealPayment(paymentRecord, request);
      }

      // Update payment record status
      if (result.success && result.paymentRecord) {
        await this.updatePaymentRecord(result.paymentRecord);
        
        // Update subscription on successful payment
        await subscriptionService.upgradeTo(request.subscriptionTier);
      }

      return result;
    } catch (error) {
      errorHandler.logError(
        error as Error,
        'PaymentService.processPayment',
        ErrorType.UNKNOWN
      );
      
      return {
        success: false,
        error: {
          code: 'PAYMENT_ERROR',
          message: '支付处理失败,请重试',
        },
      };
    }
  }

  /**
   * Process demo payment (for testing)
   */
  private async processDemoPayment(record: PaymentRecord): Promise<PaymentResult> {
    // Simulate payment processing delay
    await this.delay(1500);

    // Simulate 90% success rate
    const success = Math.random() > 0.1;

    if (success) {
      record.status = 'completed';
      record.completedAt = new Date();
      record.transactionId = `DEMO_${Date.now()}`;

      return {
        success: true,
        paymentRecord: record,
      };
    } else {
      record.status = 'failed';
      record.errorMessage = '演示支付失败(随机模拟)';

      return {
        success: false,
        paymentRecord: record,
        error: {
          code: 'DEMO_PAYMENT_FAILED',
          message: '演示支付失败',
        },
      };
    }
  }

  /**
   * Process real payment
   */
  private async processRealPayment(
    record: PaymentRecord,
    request: PaymentRequest
  ): Promise<PaymentResult> {
    try {
      switch (request.paymentMethod) {
        case 'apple_pay':
          return await this.processApplePay(record, request);
        case 'google_pay':
          return await this.processGooglePay(record, request);
        case 'alipay':
          return await this.processAlipay(record, request);
        case 'wechat_pay':
          return await this.processWechatPay(record, request);
        case 'credit_card':
          return await this.processCreditCard(record, request);
        default:
          throw new Error('Unsupported payment method');
      }
    } catch (error) {
      record.status = 'failed';
      record.errorMessage = (error as Error).message;

      return {
        success: false,
        paymentRecord: record,
        error: {
          code: 'PAYMENT_METHOD_ERROR',
          message: '支付方式处理失败',
        },
      };
    }
  }

  /**
   * Process Apple Pay (placeholder)
   */
  private async processApplePay(
    record: PaymentRecord,
    request: PaymentRequest
  ): Promise<PaymentResult> {
    // TODO: Integrate with react-native-iap for Apple Pay
    // For now, return not implemented
    record.status = 'failed';
    record.errorMessage = 'Apple Pay integration not yet implemented';

    return {
      success: false,
      paymentRecord: record,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Apple Pay 暂未实现,请使用演示模式',
      },
    };
  }

  /**
   * Process Google Pay (placeholder)
   */
  private async processGooglePay(
    record: PaymentRecord,
    request: PaymentRequest
  ): Promise<PaymentResult> {
    // TODO: Integrate with react-native-iap for Google Pay
    record.status = 'failed';
    record.errorMessage = 'Google Pay integration not yet implemented';

    return {
      success: false,
      paymentRecord: record,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Google Pay 暂未实现,请使用演示模式',
      },
    };
  }

  /**
   * Process Alipay (placeholder)
   */
  private async processAlipay(
    record: PaymentRecord,
    request: PaymentRequest
  ): Promise<PaymentResult> {
    // TODO: Integrate with Alipay SDK
    record.status = 'failed';
    record.errorMessage = 'Alipay integration not yet implemented';

    return {
      success: false,
      paymentRecord: record,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: '支付宝支付暂未实现,请使用演示模式',
      },
    };
  }

  /**
   * Process WeChat Pay (placeholder)
   */
  private async processWechatPay(
    record: PaymentRecord,
    request: PaymentRequest
  ): Promise<PaymentResult> {
    // TODO: Integrate with WeChat Pay SDK
    record.status = 'failed';
    record.errorMessage = 'WeChat Pay integration not yet implemented';

    return {
      success: false,
      paymentRecord: record,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: '微信支付暂未实现,请使用演示模式',
      },
    };
  }

  /**
   * Process credit card payment (placeholder)
   */
  private async processCreditCard(
    record: PaymentRecord,
    request: PaymentRequest
  ): Promise<PaymentResult> {
    // TODO: Integrate with payment gateway (Stripe, etc.)
    record.status = 'failed';
    record.errorMessage = 'Credit card integration not yet implemented';

    return {
      success: false,
      paymentRecord: record,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: '信用卡支付暂未实现,请使用演示模式',
      },
    };
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(): Promise<PaymentRecord[]> {
    return [...this.paymentHistory];
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(id: string): Promise<PaymentRecord | null> {
    return this.paymentHistory.find(p => p.id === id) || null;
  }

  /**
   * Get successful payments
   */
  async getSuccessfulPayments(): Promise<PaymentRecord[]> {
    return this.paymentHistory.filter(p => p.status === 'completed');
  }

  /**
   * Calculate price based on tier and currency
   */
  getPriceForTier(tier: SubscriptionTier, currency: string = 'CNY'): number {
    const prices: Record<SubscriptionTier, Record<string, number>> = {
      free: { CNY: 0, USD: 0, JPY: 0 },
      basic: { CNY: 9.9, USD: 1.99, JPY: 199 },
      premium: { CNY: 19.9, USD: 2.99, JPY: 299 },
    };

    return prices[tier][currency] || prices[tier]['CNY'];
  }

  /**
   * Get available payment methods
   */
  getAvailablePaymentMethods(): PaymentMethod[] {
    const methods: PaymentMethod[] = ['demo']; // Demo always available

    // Add platform-specific methods based on environment
    // TODO: Detect platform and add appropriate methods
    if (__DEV__) {
      methods.push('demo');
    }

    return methods;
  }

  /**
   * Cancel payment
   */
  async cancelPayment(paymentId: string): Promise<boolean> {
    const payment = await this.getPaymentById(paymentId);
    
    if (!payment) {
      return false;
    }

    if (payment.status === 'pending' || payment.status === 'processing') {
      payment.status = 'cancelled';
      await this.updatePaymentRecord(payment);
      return true;
    }

    return false;
  }

  /**
   * Refund payment (placeholder)
   */
  async refundPayment(paymentId: string): Promise<PaymentResult> {
    const payment = await this.getPaymentById(paymentId);
    
    if (!payment) {
      return {
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: '支付记录不存在',
        },
      };
    }

    if (payment.status !== 'completed') {
      return {
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: '只能退款已完成的支付',
        },
      };
    }

    // TODO: Implement real refund logic
    payment.status = 'refunded';
    await this.updatePaymentRecord(payment);

    return {
      success: true,
      paymentRecord: payment,
    };
  }

  /**
   * Private: Update payment record
   */
  private async updatePaymentRecord(record: PaymentRecord): Promise<void> {
    const index = this.paymentHistory.findIndex(p => p.id === record.id);
    if (index !== -1) {
      this.paymentHistory[index] = record;
      await this.savePaymentHistory();
    }
  }

  /**
   * Private: Save payment history
   */
  private async savePaymentHistory(): Promise<void> {
    try {
      await secureStorage.setItem(PAYMENT_HISTORY_KEY, this.paymentHistory);
    } catch (error) {
      errorHandler.logError(
        error as Error,
        'PaymentService.savePaymentHistory',
        ErrorType.STORAGE
      );
    }
  }

  /**
   * Private: Generate unique payment ID
   */
  private generatePaymentId(): string {
    return `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Private: Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear all payment history (for testing/development)
   */
  async clearPaymentHistory(): Promise<void> {
    this.paymentHistory = [];
    await secureStorage.removeItem(PAYMENT_HISTORY_KEY);
  }
}

export const paymentService = new PaymentService();
