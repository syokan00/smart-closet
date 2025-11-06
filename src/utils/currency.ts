import { Language } from '../i18n';

// 价格映射表（基础版/高级版）
const PRICE_MAP = {
  zh: {
    basic: 9.9,
    premium: 19.9,
    currency: '¥',
    symbol: 'CNY',
  },
  en: {
    basic: 1.99,
    premium: 2.99,
    currency: '$',
    symbol: 'USD',
  },
  ja: {
    basic: 199,
    premium: 299,
    currency: '¥',
    symbol: 'JPY',
  },
};

/**
 * 根据语言格式化价格
 * @param price 价格（基于中文价格）
 * @param language 语言代码
 * @param tier 订阅层级
 */
export function formatPrice(
  tier: 'free' | 'basic' | 'premium',
  language: Language = 'zh'
): string {
  if (tier === 'free') {
    return language === 'zh' ? '免费' : language === 'en' ? 'Free' : '無料';
  }

  const priceInfo = PRICE_MAP[language];
  const price = tier === 'basic' ? priceInfo.basic : priceInfo.premium;

  // 日文价格不需要小数点
  if (language === 'ja') {
    return `${priceInfo.currency}${Math.floor(price)}`;
  }

  // 中文和英文保留小数
  return `${priceInfo.currency}${price.toFixed(2)}`;
}

/**
 * 获取货币符号
 */
export function getCurrencySymbol(language: Language = 'zh'): string {
  return PRICE_MAP[language].currency;
}

/**
 * 获取货币代码
 */
export function getCurrencyCode(language: Language = 'zh'): string {
  return PRICE_MAP[language].symbol;
}

/**
 * 获取价格数值
 */
export function getPrice(
  tier: 'free' | 'basic' | 'premium',
  language: Language = 'zh'
): number {
  if (tier === 'free') return 0;
  const priceInfo = PRICE_MAP[language];
  return tier === 'basic' ? priceInfo.basic : priceInfo.premium;
}
