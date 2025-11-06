import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Dimensions, Image } from 'react-native';
import { Text, Button, IconButton } from 'react-native-paper';
import { subscriptionService } from '../services/subscriptionService';
import { useLanguage } from '../contexts/LanguageContext';
import { formatPrice } from '../utils/currency';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AdInterstitialProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
}

export default function AdInterstitial({ visible, onClose, onUpgrade }: AdInterstitialProps) {
  const [isAdFree, setIsAdFree] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const { t, language } = useLanguage();

  useEffect(() => {
    checkAdStatus();
  }, []);

  useEffect(() => {
    if (visible && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [visible, countdown]);

  const checkAdStatus = async () => {
    const adFree = await subscriptionService.isAdFree();
    setIsAdFree(adFree);
  };

  const handleClose = () => {
    setCountdown(5); // 重置倒计时
    onClose();
  };

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    }
    handleClose();
  };

  // 如果用户已订阅无广告版本，不显示
  if (isAdFree || !visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* 关闭按钮（倒计时后才能点击） */}
          <View style={styles.header}>
            <View style={styles.adBadge}>
              <Text style={styles.adBadgeText}>{t.ad.badge}</Text>
            </View>
            {countdown > 0 ? (
              <View style={styles.countdownContainer}>
                <Text style={styles.countdownText}>{countdown}{t.ad.closeIn}</Text>
              </View>
            ) : (
              <IconButton
                icon="close"
                size={24}
                iconColor="#fff"
                onPress={handleClose}
                style={styles.closeButton}
              />
            )}
          </View>

          {/* 广告内容 */}
          <View style={styles.adContent}>
            <Image
              source={{ uri: 'https://via.placeholder.com/400x300?text=Premium+Ad+Space' }}
              style={styles.adImage}
            />
            <View style={styles.adTextContainer}>
              <Text style={styles.adTitle}>{t.ad.cardTitle}</Text>
              <Text style={styles.adDescription}>
                {t.ad.cardDescription}
              </Text>
              <Text style={styles.adCta}>{t.ad.clickToLearnMore}</Text>
            </View>
          </View>

          {/* 升级提示 */}
          <View style={styles.upgradeSection}>
            <Text style={styles.upgradeHint}>
              {t.ad.tiredOfAds}
            </Text>
            <Button
              mode="contained"
              onPress={handleUpgrade}
              style={styles.upgradeButton}
              labelStyle={styles.upgradeButtonText}
            >
              {t.subscription.removeAds} - {formatPrice('basic', language)}/{t.subscription.month}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#333',
  },
  adBadge: {
    backgroundColor: '#ffa500',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  adBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  countdownContainer: {
    backgroundColor: '#666',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countdownText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeButton: {
    margin: 0,
  },
  adContent: {
    backgroundColor: '#fff',
  },
  adImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#f0f0f0',
  },
  adTextContainer: {
    padding: 20,
  },
  adTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  adDescription: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 12,
  },
  adCta: {
    fontSize: 14,
    color: '#6200ee',
    fontWeight: '600',
  },
  upgradeSection: {
    backgroundColor: '#f9f9ff',
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  upgradeHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  upgradeButton: {
    width: '100%',
    backgroundColor: '#6200ee',
  },
  upgradeButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
