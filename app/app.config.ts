import type { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Real Estate",
  slug: "real-estate",
  version: "1.0.0",
  scheme: "myapp",
  jsEngine: "hermes",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    infoPlist: {
      CFBundleAllowMixedLocalizations: true,
      SKAdNetworkItems: [
        {
          SKAdNetworkIdentifier: "v9wttpbfk9.skadnetwork",
        },
        {
          SKAdNetworkIdentifier: "n38lu8286q.skadnetwork",
        },
        {
          SKAdNetworkIdentifier: "v9wttpbfk9.skadnetwork",
        },
        {
          SKAdNetworkIdentifier: "n38lu8286q.skadnetwork",
        },
      ],
    },
    bundleIdentifier: "com.alghoul.realestate",
  },
  android: {
    softwareKeyboardLayoutMode: "pan",
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#fdfcff",
    },
    package: "com.alghoul.realestate",
    permissions: ["android.permission.INTERNET"],
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#fdfcff",
        dark: {
          image: "./assets/images/splash-icon.png",
          backgroundColor: "#1a1c1e",
        },
      },
    ],
    "expo-secure-store",
    [
      "react-native-fbsdk-next",
      {
        appID: "200512010539718",
        clientToken: "f22c843d4f139cd1ad31d692a160d775",
        displayName: "Real Estate",
        scheme: "fb200512010539718",
        advertiserIDCollectionEnabled: false,
        autoLogAppEventsEnabled: false,
        isAutoInitEnabled: true,
        iosUserTrackingPermission: false,
      },
    ],
    [
      "@react-native-google-signin/google-signin",
      {
        iosUrlScheme:
          "com.googleusercontent.apps.475890293518-ou9s9e2akugm76jttb5mnl2ed7g8vo6v",
      },
    ],
    "expo-localization",
    [
      "expo-video",
      {
        supportsBackgroundPlayback: true,
        supportsPictureInPicture: true,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  locales: {
    ar: "./assets/i18n/arabic.json",
  },
});
