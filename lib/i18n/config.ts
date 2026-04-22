import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { supportedLocales } from './locales';
import { defaultLocale } from './types';

import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';
import jaJP from './locales/ja-JP.json';
import ruRU from './locales/ru-RU.json';
import arSA from './locales/ar-SA.json';

const resources = {
  'zh-CN': { translation: zhCN },
  'en-US': { translation: enUS },
  'ja-JP': { translation: jaJP },
  'ru-RU': { translation: ruRU },
  'ar-SA': { translation: arSA },
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: defaultLocale,
    fallbackLng: defaultLocale,
    supportedLngs: supportedLocales.map((l) => l.code),
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });
}

export default i18n;
