import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createSecureStorage } from "./storage";

type Themes = "light" | "dark";

interface ThemeState {
  theme: Themes | null;
  setTheme: (theme: Themes) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: null,
      setTheme: (theme) =>
        set(() => {
          return { theme };
        }),
    }),
    {
      name: "theme",
      storage: createJSONStorage(() => createSecureStorage()),
    },
  ),
);
