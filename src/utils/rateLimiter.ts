/**
 * Rate limiter to prevent abuse and excessive API calls
 */

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

class RateLimiter {
  private actions: Map<string, number[]> = new Map();
  private configs: Map<string, RateLimitConfig> = new Map();

  constructor() {
    // Define rate limit configurations for different actions
    this.configs.set('ai-recognition', { maxAttempts: 10, windowMs: 60000 }); // 10 per minute
    this.configs.set('image-upload', { maxAttempts: 20, windowMs: 60000 }); // 20 per minute
    this.configs.set('smart-segmentation', { maxAttempts: 5, windowMs: 60000 }); // 5 per minute
    this.configs.set('save-item', { maxAttempts: 30, windowMs: 60000 }); // 30 per minute
    this.configs.set('delete-item', { maxAttempts: 20, windowMs: 60000 }); // 20 per minute
  }

  /**
   * Check if an action can be performed
   */
  canPerformAction(
    actionId: string,
    maxAttempts?: number,
    windowMs?: number
  ): boolean {
    const config = this.configs.get(actionId);
    const attempts = maxAttempts || config?.maxAttempts || 5;
    const window = windowMs || config?.windowMs || 60000;

    const now = Date.now();
    const actionHistory = this.actions.get(actionId) || [];

    // Remove expired attempts
    const validAttempts = actionHistory.filter(time => now - time < window);

    if (validAttempts.length >= attempts) {
      console.warn(`Rate limit exceeded for action: ${actionId}`);
      return false;
    }

    // Record this attempt
    validAttempts.push(now);
    this.actions.set(actionId, validAttempts);
    return true;
  }

  /**
   * Get remaining attempts for an action
   */
  getRemainingAttempts(actionId: string): number {
    const config = this.configs.get(actionId);
    if (!config) return 0;

    const now = Date.now();
    const actionHistory = this.actions.get(actionId) || [];
    const validAttempts = actionHistory.filter(
      time => now - time < config.windowMs
    );

    return Math.max(0, config.maxAttempts - validAttempts.length);
  }

  /**
   * Get time until next available attempt
   */
  getTimeUntilReset(actionId: string): number {
    const config = this.configs.get(actionId);
    if (!config) return 0;

    const actionHistory = this.actions.get(actionId) || [];
    if (actionHistory.length === 0) return 0;

    const now = Date.now();
    const oldestAttempt = actionHistory[0];
    const resetTime = oldestAttempt + config.windowMs;

    return Math.max(0, resetTime - now);
  }

  /**
   * Reset rate limit for a specific action
   */
  reset(actionId: string): void {
    this.actions.delete(actionId);
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    this.actions.clear();
  }

  /**
   * Clean up expired entries (call periodically)
   */
  cleanup(): void {
    const now = Date.now();
    
    for (const [actionId, attempts] of this.actions.entries()) {
      const config = this.configs.get(actionId);
      const windowMs = config?.windowMs || 60000;
      
      const validAttempts = attempts.filter(time => now - time < windowMs);
      
      if (validAttempts.length === 0) {
        this.actions.delete(actionId);
      } else {
        this.actions.set(actionId, validAttempts);
      }
    }
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Run cleanup every 5 minutes
setInterval(() => {
  rateLimiter.cleanup();
}, 5 * 60 * 1000);
