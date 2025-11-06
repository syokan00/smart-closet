import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, Image } from 'react-native';
import { Text, IconButton, Card } from 'react-native-paper';
import { subscriptionService } from '../services/subscriptionService';
import { useLanguage } from '../contexts/LanguageContext';

interface AdCardProps {
  onUpgrade?: () => void;
}

export default function AdCard({ onUpgrade }: AdCardProps) {
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

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.adBadge}>
          <Text style={styles.adBadgeText}>{t.ad.badge}</Text>
        </View>
        <IconButton
          icon="close"
          size={18}
          onPress={handleClose}
          iconColor="#999"
        />
      </View>
      
      <TouchableOpacity 
        onPress={handleAdClick}
        activeOpacity={0.8}
      >
        <View style={styles.adContent}>
          <Image
            source={{ uri: 'https://via.placeholder.com/300x150?text=Ad+Space' }}
            style={styles.adImage}
          />
          <View style={styles.textContent}>
            <Text style={styles.title}>{t.ad.cardTitle}</Text>
            <Text style={styles.description}>
              {t.ad.cardDescription}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {onUpgrade && (
        <TouchableOpacity 
          style={styles.upgradeButton}
          onPress={onUpgrade}
        >
          <Text style={styles.upgradeText}>{t.ad.upgradeToRemove}</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 12,
    paddingTop: 4,
  },
  adBadge: {
    backgroundColor: '#ffa500',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  adBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  adContent: {
    padding: 12,
  },
  adImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginBottom: 12,
  },
  textContent: {
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  upgradeButton: {
    backgroundColor: '#f0f0ff',
    marginHorizontal: 12,
    marginBottom: 12,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  upgradeText: {
    fontSize: 13,
    color: '#6200ee',
    fontWeight: '600',
  },
});
