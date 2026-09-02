import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations, getLocalizedCategory, getLocalizedUnit, getLocalizedReason } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['id'];
  getCategoryName: (category: string) => string;
  getUnitName: (unit: string) => string;
  getReasonLabel: (reason: string) => string;
}

const LANGUAGE_KEY = 'angkringan_pos_language';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_KEY);
      if (saved === 'en' || saved === 'id') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'id'; // default to Indonesian for Angkringan, easily toggled to English
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_KEY, lang);
    } catch {
      // ignore
    }
    // Update HTML lang attribute
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translations[language],
    getCategoryName: (category: string) => getLocalizedCategory(category, language),
    getUnitName: (unit: string) => getLocalizedUnit(unit, language),
    getReasonLabel: (reason: string) => getLocalizedReason(reason, language),
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
