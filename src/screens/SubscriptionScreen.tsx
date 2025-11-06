import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Chip, Surface, ProgressBar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { subscriptionService, getLocalizedPlans } from '../services/subscriptionService';
import { UserSubscription, SubscriptionTier, SubscriptionPlan } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { formatPrice } from '../utils/currency';

export default function SubscriptionScreen({ navigation }: any) {
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [remainingUsage, setRemainingUsage] = useState<{
    items: number | 'unlimited';
    segmentations: number | 'unlimited';
  } | null>(null);
  const { t, language } = useLanguage();
  
  // Get localized subscription plans
  const subscriptionPlans = useMemo(() => getLocalizedPlans(language), [language]);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    const subscription = await subscriptionService.getCurrentSubscription();
    const remaining = await subscriptionService.getRemainingUsage();
    setCurrentSubscription(subscription);
    setRemainingUsage(remaining);
  };

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (currentSubscription && tier === currentSubscription.tier) {
      Alert.alert(t.subscription.alreadySubscribed, t.subscription.alreadyOnPlan);
      return;
    }

    Alert.alert(
      t.subscription.confirmUpgrade,
      `${t.subscription.upgradeTo} ${subscriptionPlans.find(p => p.id === tier)?.name}？`,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.confirm,
          onPress: async () => {
            const success = await subscriptionService.upgradeTo(tier);
            if (success) {
              Alert.alert(t.common.success, t.subscription.upgradeSuccess);
              loadSubscriptionData();
            } else {
              Alert.alert(t.common.error, t.subscription.upgradeFailed);
            }
          },
        },
      ]
    );
  };

  const getCurrentPlanIndex = () => {
    return subscriptionPlans.findIndex(p => p.id === currentSubscription?.tier);
  };

  const renderUsageProgress = () => {
    if (!currentSubscription || !remainingUsage) return null;

    const currentPlan = subscriptionPlans.find(p => p.id === currentSubscription.tier);
    if (!currentPlan) return null;

    return (
      <Surface style={styles.usageCard} elevation={1}>
        <Text style={styles.usageTitle}>{t.subscription.usageStats}</Text>
        
        {/* 衣物数量 */}
        <View style={styles.usageItem}>
          <View style={styles.usageHeader}>
            <Text style={styles.usageLabel}>{t.subscription.itemsCount}</Text>
            <Text style={styles.usageValue}>
              {remainingUsage.items === 'unlimited'
                ? t.subscription.unlimited
                : `${currentSubscription.usageStats.itemsCount} / ${currentPlan.limits.maxItems}`}
            </Text>
          </View>
          {remainingUsage.items !== 'unlimited' && currentPlan.limits.maxItems && (
            <ProgressBar
              progress={currentSubscription.usageStats.itemsCount / currentPlan.limits.maxItems}
              color="#6200ee"
              style={styles.progressBar}
            />
          )}
        </View>

        {/* 智能分割次数 */}
        <View style={styles.usageItem}>
          <View style={styles.usageHeader}>
            <Text style={styles.usageLabel}>{t.subscription.segmentationsCount}</Text>
            <Text style={styles.usageValue}>
              {remainingUsage.segmentations === 'unlimited'
                ? t.subscription.unlimited
                : `${currentSubscription.usageStats.segmentationsThisMonth} / ${currentPlan.limits.maxSegmentations}`}
            </Text>
          </View>
          {remainingUsage.segmentations !== 'unlimited' && currentPlan.limits.maxSegmentations && (
            <ProgressBar
              progress={currentSubscription.usageStats.segmentationsThisMonth / currentPlan.limits.maxSegmentations}
              color="#03a9f4"
              style={styles.progressBar}
            />
          )}
        </View>
      </Surface>
    );
  };

  const renderPlanCard = (plan: SubscriptionPlan, index: number) => {
    const isCurrentPlan = currentSubscription?.tier === plan.id;
    const isPremium = plan.id === 'premium';
    const isBasic = plan.id === 'basic';

    return (
      <Card
        key={plan.id}
        style={[
          styles.planCard,
          isCurrentPlan && styles.currentPlanCard,
          isPremium && styles.premiumCard,
        ]}
      >
        {isPremium && (
          <View style={styles.recommendedBadge}>
            <Text style={styles.recommendedText}>{t.subscription.recommended}</Text>
          </View>
        )}

        <View style={styles.planHeader}>
          <Text style={[styles.planName, isPremium && styles.premiumText]}>
            {plan.name}
          </Text>
          {isCurrentPlan && (
            <Chip mode="flat" style={styles.currentChip}>
              {t.subscription.current}
            </Chip>
          )}
        </View>

        <View style={styles.priceContainer}>
          <Text style={[styles.price, isPremium && styles.premiumText]}>
            {formatPrice(plan.id as SubscriptionTier, language)}
          </Text>
          {plan.id !== 'free' && (
            <Text style={styles.period}>/{t.subscription.month}</Text>
          )}
        </View>

        <View style={styles.featuresContainer}>
          {plan.features.map((feature: string, idx: number) => (
            <View key={idx} style={styles.featureItem}>
              <Icon
                name="check-circle"
                size={18}
                color={isPremium ? '#6200ee' : '#4caf50'}
              />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {!isCurrentPlan && (
          <Button
            mode={isPremium ? 'contained' : 'outlined'}
            onPress={() => handleUpgrade(plan.id)}
            style={styles.upgradeButton}
          >
            {index > getCurrentPlanIndex()
              ? t.subscription.upgrade
              : t.subscription.downgrade}
          </Button>
        )}
      </Card>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{t.subscription.title}</Text>
      <Text style={styles.subtitle}>{t.subscription.subtitle}</Text>

      {renderUsageProgress()}

      <View style={styles.plansContainer}>
        {subscriptionPlans.map((plan, index) => renderPlanCard(plan, index))}
      </View>

      <Surface style={styles.infoCard} elevation={0}>
        <Icon name="information" size={24} color="#6200ee" />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>{t.subscription.note}</Text>
          <Text style={styles.infoText}>{t.subscription.noteText}</Text>
        </View>
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1B1F',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  usageCard: {
    backgroundColor: '#f9f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  usageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  usageItem: {
    marginBottom: 16,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  usageLabel: {
    fontSize: 14,
    color: '#666',
  },
  usageValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  plansContainer: {
    marginBottom: 24,
  },
  planCard: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
  },
  currentPlanCard: {
    borderWidth: 2,
    borderColor: '#6200ee',
  },
  premiumCard: {
    backgroundColor: '#f5f0ff',
    borderWidth: 2,
    borderColor: '#6200ee',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#6200ee',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  premiumText: {
    color: '#6200ee',
  },
  currentChip: {
    backgroundColor: '#e3f2fd',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  period: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  upgradeButton: {
    marginTop: 8,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 40,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});
