import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createSecureStorage } from "./storage";
import type { Locales } from "@/i18n/i18n-types";

interface LocaleState {
  locale: Locales;
  setLocale: (theme: Locales) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: "en",
      setLocale: (locale) =>
        set(() => {
          return { locale: locale };
        }),
    }),
    {
      name: "locale",
      storage: createJSONStorage(() => createSecureStorage()),
    },
  ),
);
