import { useI18nContext } from "@/i18n/i18n-react";
import { type Locales } from "@/i18n/i18n-types";
import { loadLocale } from "@/i18n/i18n-util.sync";
import { configureZodI18n } from "@/lib/dtos";
import { addLanguageHeader } from "@/lib/fetcher";
import { useLocaleStore } from "@/lib/stores/localeStore";
import { focusManager, onlineManager } from "@tanstack/react-query";
import { getLocales } from "expo-localization";
import { useEffect } from "react";
import { AppState, type AppStateStatus } from "react-native";
import * as Network from "expo-network";
import { useWebSocketStore } from "@/lib/stores/useWebSocketStore";
import dayjs from "dayjs";

interface I18NWrapperProps {
  children: React.ReactNode;
}

export default function I18NWrapper({ children }: I18NWrapperProps) {
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const { setLocale: setCtxLocale, LL } = useI18nContext();
  const { checkNetworkAndReconnect } = useWebSocketStore();
  useEffect(() => {
    const appStateSubscription = AppState.addEventListener(
      "change",
      (status: AppStateStatus) => {
        const currentLocale = (getLocales()[0].languageCode as Locales) ?? "en";
        setLocale(currentLocale);
        dayjs.locale(currentLocale.toLowerCase());
        focusManager.setFocused(status === "active");
        const checkNetwork = async () => {
          await checkNetworkAndReconnect();
        };
        checkNetwork();
      },
    );

    return () => {
      appStateSubscription.remove();
    };
  }, [setLocale, checkNetworkAndReconnect]);

  onlineManager.setEventListener((setOnline) => {
    const eventSubscription = Network.addNetworkStateListener((state) => {
      setOnline(!!state.isConnected);
    });
    return eventSubscription.remove;
  });

  useEffect(() => {
    addLanguageHeader(locale);
    loadLocale(locale);
    dayjs.locale(locale.toLowerCase());
    setCtxLocale(locale);
  }, [locale, setCtxLocale]);

  configureZodI18n(LL);

  return <>{children}</>;
}
