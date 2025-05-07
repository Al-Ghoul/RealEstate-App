import { useI18nContext } from "@/i18n/i18n-react";
import { type Locales } from "@/i18n/i18n-types";
import { loadLocale } from "@/i18n/i18n-util.sync";
import { configureZodI18n } from "@/lib/dtos";
import { addLanguageHeader } from "@/lib/fetcher";
import { useLocaleStore } from "@/lib/stores/localeStore";
import { getLocales } from "expo-localization";
import { useEffect } from "react";
import { AppState } from "react-native";

interface I18NWrapperProps {
  children: React.ReactNode;
}

export default function I18NWrapper({ children }: I18NWrapperProps) {
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const { setLocale: setCtxLocale, LL } = useI18nContext();

  useEffect(() => {
    const subscription = AppState.addEventListener("change", () => {
      const currentLocale = (getLocales()[0].languageCode as Locales) ?? "en";
      setLocale(currentLocale);
    });

    return () => {
      subscription.remove();
    };
  }, [setLocale]);

  useEffect(() => {
    addLanguageHeader(locale);
    loadLocale(locale);
    setCtxLocale(locale);
  }, [locale, setCtxLocale]);

  configureZodI18n(LL);

  return <>{children}</>;
}
