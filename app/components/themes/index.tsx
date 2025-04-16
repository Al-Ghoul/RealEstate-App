import { useState, useCallback, createContext, useContext } from "react";
import { View, ViewProps } from "react-native";
import { StatusBarTheme, Themes, ThemesVariant } from "./theme-config";
import clsx from "clsx";
import { StatusBar } from "expo-status-bar";

type ThemeContextValues = {
  theme: ThemesVariant;
};

const ThemeProviderValues = createContext<ThemeContextValues>({
  theme: "light",
});

export function useThemeContextValues() {
  return useContext(ThemeProviderValues);
}

type ThemeContextActions = {
  handleThemeSwitch: (newTheme: ThemesVariant) => void;
};

const ThemeProviderActions = createContext<ThemeContextActions>(
  {} as ThemeContextActions,
);

export function useThemeContextActions() {
  return useContext(ThemeProviderActions);
}

type ThemeProps = ViewProps;

export function Theme(props: ThemeProps) {
  const [theme, setTheme] = useState<ThemesVariant>("light");

  const handleThemeSwitch = useCallback((newTheme: ThemesVariant) => {
    setTheme(newTheme);
  }, []);

  return (
    <View style={Themes[theme]} className={clsx("flex-1", props.className)}>
      <ThemeProviderValues.Provider value={{ theme }}>
        <ThemeProviderActions.Provider value={{ handleThemeSwitch }}>
          <StatusBar
            style={StatusBarTheme[theme].style}
            backgroundColor={StatusBarTheme[theme].background}
          />
          {props.children}
        </ThemeProviderActions.Provider>
      </ThemeProviderValues.Provider>
    </View>
  );
}
