import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, List, Divider, Dialog, Portal, RadioButton, Switch, Button } from 'react-native-paper';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Language } from '../i18n';
import { clothingStorage, ootdStorage, preferencesStorage } from '../services/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen({ navigation }: any) {
  const { t, language, setLanguage } = useLanguage();
  const [languageDialogVisible, setLanguageDialogVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language);

  const handleLanguageChange = async () => {
    await setLanguage(selectedLanguage);
    setLanguageDialogVisible(false);
    Alert.alert(t.common.success, t.settings.languageChanged);
  };

  const getLanguageLabel = (lang: Language) => {
    switch (lang) {
      case 'zh': return '中文';
      case 'en': return 'English';
      case 'ja': return '日本語';
      default: return '中文';
    }
  };

  const handleExportData = async () => {
    try {
      const clothing = await clothingStorage.getAll();
      const ootds = await ootdStorage.getAll();
      const prefs = await preferencesStorage.get();

      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        data: {
          clothing,
          ootds,
          preferences: prefs,
        },
      };

      const fileName = `smart-closet-backup-${Date.now()}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(
        fileUri,
        JSON.stringify(exportData, null, 2)
      );

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
        Alert.alert(t.common.success, t.settings.exportSuccess);
      } else {
        Alert.alert(t.common.success, `${t.settings.exportSaved}: ${fileUri}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(t.common.error, t.settings.exportFailed);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      t.settings.clearConfirm,
      t.settings.clearMessage,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.settings.confirmClear,
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert(t.common.success, t.settings.clearSuccess);
            } catch (error) {
              Alert.alert(t.common.error, t.settings.clearFailed);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {t.settings.title}
      </Text>

      <List.Section>
        <List.Item
          title={t.subscription.title}
          description={t.subscription.upgradePrompt}
          left={(props) => <List.Icon {...props} icon="star" color="#6200ee" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('Subscription')}
        />
      </List.Section>

      <List.Section>
        
        <List.Item
          title={t.settings.language}
          description={getLanguageLabel(language)}
          left={(props) => <List.Icon {...props} icon="translate" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {
            setSelectedLanguage(language);
            setLanguageDialogVisible(true);
          }}
        />
      </List.Section>

      <List.Section>
        <List.Subheader>{t.settings.dataManagement}</List.Subheader>
        
        <List.Item
          title={t.settings.exportData}
          description={t.settings.exportDescription}
          left={(props) => <List.Icon {...props} icon="export" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={handleExportData}
        />

        <Divider />

        <List.Item
          title={t.settings.clearCache}
          description={t.settings.clearDescription}
          left={(props) => <List.Icon {...props} icon="delete-sweep" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={handleClearCache}
        />
      </List.Section>

      <List.Section>
        <List.Subheader>{t.settings.about}</List.Subheader>
        
        <List.Item
          title={t.settings.about}
          description="Smart Closet v1.0.0"
          left={(props) => <List.Icon {...props} icon="information" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('About')}
        />

        <Divider />

        <List.Item
          title={t.settings.privacy}
          left={(props) => <List.Icon {...props} icon="shield-account" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('Privacy')}
        />

        <Divider />

        <List.Item
          title={t.settings.help}
          left={(props) => <List.Icon {...props} icon="help-circle" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('Help')}
        />
      </List.Section>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Made with ❤️ for fashion lovers
        </Text>
        <Text style={styles.footerText}>
          © 2025 Smart Closet
        </Text>
      </View>

      {/* 语言选择对话框 */}
      <Portal>
        <Dialog visible={languageDialogVisible} onDismiss={() => setLanguageDialogVisible(false)}>
          <Dialog.Title>{t.settings.selectLanguage}</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group onValueChange={(value) => setSelectedLanguage(value as Language)} value={selectedLanguage}>
              <View style={styles.radioItem}>
                <RadioButton value="zh" />
                <Text style={styles.radioLabel} onPress={() => setSelectedLanguage('zh')}>
                  中文 (Chinese)
                </Text>
              </View>
              <View style={styles.radioItem}>
                <RadioButton value="en" />
                <Text style={styles.radioLabel} onPress={() => setSelectedLanguage('en')}>
                  English
                </Text>
              </View>
              <View style={styles.radioItem}>
                <RadioButton value="ja" />
                <Text style={styles.radioLabel} onPress={() => setSelectedLanguage('ja')}>
                  日本語 (Japanese)
                </Text>
              </View>
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLanguageDialogVisible(false)}>{t.common.cancel}</Button>
            <Button onPress={handleLanguageChange}>{t.common.confirm}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1C1B1F',
    marginTop: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    padding: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginVertical: 4,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  radioLabel: {
    marginLeft: 8,
    fontSize: 16,
  },
});
