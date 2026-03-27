import { useTranslation } from "react-i18next";

export type Language =
  | "pt-PT"
  | "pt-BR"
  | "en"
  | "es"
  | "fr"
  | "de"
  | "it"
  | "nl"
  | "ru"
  | "zh"
  | "ja"
  | "ko";

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

export const languages: LanguageOption[] = [
  { code: "pt-PT", name: "Portuguese (Portugal)", nativeName: "Português (Portugal)", flag: "🇵🇹" },
  { code: "pt-BR", name: "Portuguese (Brazil)", nativeName: "Português (Brasil)", flag: "🇧🇷" },
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
];

/**
 * Wrapper around react-i18next that maintains the same API 
 * as the original useLanguage hook — no component changes needed.
 */
export const useLanguage = () => {
  const { t: i18nT, i18n } = useTranslation();

  const language = (i18n.language || "pt-PT") as Language;

  const setLanguage = (lang: Language) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("liftmate_language", lang);
  };

  // Wrapper that supports flat dot-notation keys like "auth.welcomeTo"
  // i18next uses nested JSON, so "auth.welcomeTo" becomes t("auth.welcomeTo")
  const t = (key: string): string => {
    const result = i18nT(key);
    return typeof result === "string" ? result : key;
  };

  const getLanguageOption = (code: Language) => {
    return languages.find((l) => l.code === code);
  };

  return { language, setLanguage, t, getLanguageOption };
};
