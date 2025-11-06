import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { useLanguage } from '../contexts/LanguageContext';

export default function PrivacyScreen() {
  const { t } = useLanguage();
  
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>{t.privacy.title} 🔒</Text>
          
          <Text variant="bodyMedium" style={styles.text}>
            {t.privacy.lastUpdated}: 2025年1月
          </Text>

          <Text variant="titleMedium" style={styles.sectionTitle}>{t.privacy.dataCollection}</Text>
          <Text variant="bodyMedium" style={styles.text}>
            {t.privacy.dataCollectionText}
          </Text>

          <Text variant="titleMedium" style={styles.sectionTitle}>{t.privacy.localStorage}</Text>
          <Text variant="bodyMedium" style={styles.text}>
            {t.privacy.localStorageText}
          </Text>
          <Text variant="bodyMedium" style={styles.text}>
            {t.privacy.storageItems}
          </Text>

          <Text variant="titleMedium" style={styles.sectionTitle}>{t.privacy.permissions}</Text>
          <Text variant="bodyMedium" style={styles.text}>
            {t.privacy.cameraPermission}{'\n'}
            {t.privacy.galleryPermission}{'\n'}
            {t.privacy.storagePermission}
          </Text>

          <Text variant="titleMedium" style={styles.sectionTitle}>{t.privacy.dataSecurity}</Text>
          <Text variant="bodyMedium" style={styles.text}>
            {t.privacy.dataSecurityText}
          </Text>

          <Text variant="titleMedium" style={styles.sectionTitle}>{t.privacy.thirdParty}</Text>
          <Text variant="bodyMedium" style={styles.text}>
            {t.privacy.thirdPartyText}
          </Text>

          <Text variant="titleMedium" style={styles.sectionTitle}>{t.privacy.contact}</Text>
          <Text variant="bodyMedium" style={styles.text}>
            {t.privacy.contactText}
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  text: {
    marginBottom: 12,
    lineHeight: 24,
  },
  bold: {
    fontWeight: 'bold',
  },
});
