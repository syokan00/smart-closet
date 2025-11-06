import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language } from '../i18n';
import { preferencesStorage } from '../services/storage';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: typeof translations.zh;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('zh');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    const prefs = await preferencesStorage.get();
    if (prefs.language) {
      setLanguageState(prefs.language);
    }
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    const prefs = await preferencesStorage.get();
    await preferencesStorage.save({ ...prefs, language: lang });
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
