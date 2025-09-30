import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './locales/en/translation.json';
import translationFR from './locales/fr/translation.json';

const resources = {
    en: {
        translation: translationEN,
    },
    fr: {
        translation: translationFR,
    },
};

i18n.use(LanguageDetector) // Détecte la langue du navigateur
    .use(initReactI18next) // Passe l'instance i18n à react-i18next
    .init({
        resources,
        fallbackLng: 'fr', // Langue par défaut si la détection échoue
        interpolation: {
            escapeValue: false, // React échappe déjà les valeurs
        },
    });

export default i18n;
