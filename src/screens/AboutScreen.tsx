import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, Card, List } from 'react-native-paper';
import { useLanguage } from '../contexts/LanguageContext';

export default function AboutScreen() {
  const { t } = useLanguage();
  
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineMedium" style={styles.title}>{t.about.title} 📱</Text>
          <Text variant="bodyLarge" style={styles.version}>{t.about.version} 1.0.0</Text>
          
          <Text variant="titleMedium" style={styles.sectionTitle}>{t.about.aboutApp}</Text>
          <Text variant="bodyMedium" style={styles.text}>
            {t.about.description}
          </Text>

          <Text variant="titleMedium" style={styles.sectionTitle}>{t.about.features}</Text>
          <List.Item
            title={`📸 ${t.about.feature1Title}`}
            description={t.about.feature1Desc}
            left={props => <List.Icon {...props} icon="camera" />}
          />
          <List.Item
            title={`🧥 ${t.about.feature2Title}`}
            description={t.about.feature2Desc}
            left={props => <List.Icon {...props} icon="hanger" />}
          />
          <List.Item
            title={`📅 ${t.about.feature3Title}`}
            description={t.about.feature3Desc}
            left={props => <List.Icon {...props} icon="calendar" />}
          />
          <List.Item
            title={`🌐 ${t.about.feature4Title}`}
            description={t.about.feature4Desc}
            left={props => <List.Icon {...props} icon="translate" />}
          />

          <Text variant="titleMedium" style={styles.sectionTitle}>{t.about.developer}</Text>
          <Text variant="bodyMedium" style={styles.text}>
            {t.about.madeWith}
          </Text>
          <Text variant="bodySmall" style={styles.text}>
            {t.about.copyright}
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
    textAlign: 'center',
    marginBottom: 8,
  },
  version: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  text: {
    marginBottom: 8,
    lineHeight: 24,
  },
});
