import React, { createContext, useContext, ReactNode } from 'react';
import { MD3LightTheme } from 'react-native-paper';

interface ThemeContextType {
  isDark: boolean;
  theme: typeof MD3LightTheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const theme = {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      primary: '#6750A4',
      secondary: '#625B71',
      tertiary: '#7D5260',
      background: '#FFFBFE',
      surface: '#FFFBFE',
      surfaceVariant: '#E7E0EC',
      error: '#BA1A1A',
    },
  };

  return (
    <ThemeContext.Provider value={{ isDark: false, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
