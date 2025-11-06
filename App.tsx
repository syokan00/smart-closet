import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaperProvider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// 导入页面组件
import WardrobeScreen from './src/screens/WardrobeScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import UploadScreen from './src/screens/UploadScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SubscriptionScreen from './src/screens/SubscriptionScreen';
import AboutScreen from './src/screens/AboutScreen';
import HelpScreen from './src/screens/HelpScreen';
import PrivacyScreen from './src/screens/PrivacyScreen';

// 导入上下文
import { LanguageProvider, useLanguage } from './src/contexts/LanguageContext';
import { ThemeProvider } from './src/contexts/ThemeContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// 设置页面堆栈
function SettingsStack() {
  const { t } = useLanguage();
  
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="SettingsMain" 
        component={SettingsScreen}
        options={{ title: t.tabs.settings }}
      />
      <Stack.Screen 
        name="Subscription" 
        component={SubscriptionScreen}
        options={{ title: t.subscription.title }}
      />
      <Stack.Screen 
        name="About" 
        component={AboutScreen}
        options={{ title: t.settings.about }}
      />
      <Stack.Screen 
        name="Help" 
        component={HelpScreen}
        options={{ title: t.settings.help }}
      />
      <Stack.Screen 
        name="Privacy" 
        component={PrivacyScreen}
        options={{ title: t.settings.privacy }}
      />
    </Stack.Navigator>
  );
}

// 主标签导航
function MainTabs() {
  const { t } = useLanguage();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Upload') {
            iconName = 'plus-circle';
          } else if (route.name === 'Wardrobe') {
            iconName = 'wardrobe';
          } else if (route.name === 'Calendar') {
            iconName = 'calendar';
          } else if (route.name === 'Settings') {
            iconName = 'cog';
          } else {
            iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Wardrobe" 
        component={WardrobeScreen}
        options={{ title: t.tabs.wardrobe }}
      />
      <Tab.Screen 
        name="Upload" 
        component={UploadScreen}
        options={{ title: t.tabs.upload }}
      />
      <Tab.Screen 
        name="Calendar" 
        component={CalendarScreen}
        options={{ title: t.tabs.calendar }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsStack}
        options={{ title: t.tabs.settings }}
      />
    </Tab.Navigator>
  );
}

// 主应用组件
function AppContent() {
  return (
    <NavigationContainer>
      <MainTabs />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <PaperProvider>
          <AppContent />
        </PaperProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}