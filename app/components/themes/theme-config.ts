import { StatusBarStyle } from "expo-status-bar";
import { vars } from "nativewind";

export type ThemesVariant = "light" | "dark";

export const Themes = {
  light: vars({
    "--color-primary": "#000000",
    "--color-secondary": "#ffffffff",
    "--color-outstand": "#7dd1fc",
  }),
  dark: vars({
    "--color-primary": "#ffffff",
    "--color-secondary": "#222",
    "--color-outstand": "#0c496e",
  }),
};

type StatusBarThemeStyle = {
  [keys in ThemesVariant]: {
    style: StatusBarStyle;
    background: string;
  };
};

export const StatusBarTheme: StatusBarThemeStyle = {
  light: {
    style: "dark",
    background: "#fff",
  },
  dark: {
    style: "light",
    background: "#222",
  },
};
