import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { subscriptionService } from '../services/subscriptionService';
import { useLanguage } from '../contexts/LanguageContext';

interface AdBannerProps {
  placement?: 'top' | 'bottom';
  onUpgrade?: () => void;
}

export default function AdBanner({ placement = 'bottom', onUpgrade }: AdBannerProps) {
  const [showAd, setShowAd] = useState(true);
  const [isAdFree, setIsAdFree] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    checkAdStatus();
  }, []);

  const checkAdStatus = async () => {
    const adFree = await subscriptionService.isAdFree();
    setIsAdFree(adFree);
  };

  // 如果用户已订阅无广告版本，不显示广告
  if (isAdFree || !showAd) {
    return null;
  }

  const handleAdClick = () => {
    // 这里可以接入真实的广告服务
    Linking.openURL('https://example.com/ad');
  };

  const handleClose = () => {
    setShowAd(false);
  };

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    }
  };

  return (
    <View style={[styles.container, placement === 'top' && styles.topPlacement]}>
      <TouchableOpacity 
        style={styles.adContent} 
        onPress={handleAdClick}
        activeOpacity={0.8}
      >
        <View style={styles.adBadge}>
          <Text style={styles.adBadgeText}>{t.ad.badge}</Text>
        </View>
        <View style={styles.adTextContainer}>
          <Text style={styles.adTitle}>{t.ad.title}</Text>
          <Text style={styles.adSubtitle}>{t.ad.subtitle}</Text>
        </View>
      </TouchableOpacity>
      
      <View style={styles.actions}>
        <TouchableOpacity onPress={handleUpgrade} style={styles.upgradeButton}>
          <Text style={styles.upgradeText}>{t.subscription.removeAds}</Text>
        </TouchableOpacity>
        <IconButton
          icon="close"
          size={16}
          onPress={handleClose}
          iconColor="#666"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topPlacement: {
    borderTopWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  adContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  adBadge: {
    backgroundColor: '#ffa500',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  adBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  adTextContainer: {
    flex: 1,
  },
  adTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  adSubtitle: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upgradeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  upgradeText: {
    fontSize: 11,
    color: '#6200ee',
    fontWeight: '600',
  },
});
