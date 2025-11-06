import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Text, Card, List } from 'react-native-paper';
import { useLanguage } from '../contexts/LanguageContext';

export default function HelpScreen() {
  const { t } = useLanguage();
  
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>{t.help.title} ❓</Text>
          
          <Text variant="titleMedium" style={styles.sectionTitle}>📸 {t.help.uploadTitle}</Text>
          <Text variant="bodyMedium" style={styles.text}>
            {t.help.uploadSteps}
          </Text>

          <Text variant="titleMedium" style={styles.sectionTitle}>🧥 {t.help.manageTitle}</Text>
          <Text variant="bodyMedium" style={styles.text}>
            {t.help.manageSteps}
          </Text>

          <Text variant="titleMedium" style={styles.sectionTitle}>📅 {t.help.calendarTitle}</Text>
          <Text variant="bodyMedium" style={styles.text}>
            {t.help.calendarSteps}
          </Text>

          <Text variant="titleMedium" style={styles.sectionTitle}>🌐 {t.help.languageTitle}</Text>
          <Text variant="bodyMedium" style={styles.text}>
            {t.help.languageSteps}
          </Text>

          <Text variant="titleMedium" style={styles.sectionTitle}>💾 {t.help.backupTitle}</Text>
          <Text variant="bodyMedium" style={styles.text}>
            {t.help.backupSteps}
          </Text>

          <Text variant="titleMedium" style={styles.sectionTitle}>🗑️ {t.help.clearTitle}</Text>
          <Text variant="bodyMedium" style={styles.text}>
            {t.help.clearSteps}
          </Text>

          <Text variant="titleMedium" style={styles.sectionTitle}>💡 {t.help.tipsTitle}</Text>
          <List.Item
            title={t.help.tip1Title}
            description={t.help.tip1Desc}
            left={props => <List.Icon {...props} icon="lightbulb" />}
          />
          <List.Item
            title={t.help.tip2Title}
            description={t.help.tip2Desc}
            left={props => <List.Icon {...props} icon="broom" />}
          />
          <List.Item
            title={t.help.tip3Title}
            description={t.help.tip3Desc}
            left={props => <List.Icon {...props} icon="calendar-check" />}
          />

          <Text variant="titleMedium" style={styles.sectionTitle}>❓ {t.help.faqTitle}</Text>
          <Text variant="bodyMedium" style={styles.text}>
            <Text style={styles.bold}>{t.help.faq1Q}</Text>{'\n'}
            {t.help.faq1A}
          </Text>
          <Text variant="bodyMedium" style={styles.text}>
            <Text style={styles.bold}>{t.help.faq2Q}</Text>{'\n'}
            {t.help.faq2A}
          </Text>
          <Text variant="bodyMedium" style={styles.text}>
            <Text style={styles.bold}>{t.help.faq3Q}</Text>{'\n'}
            {t.help.faq3A}
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
