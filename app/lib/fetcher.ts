import type { Locales } from "@/i18n/i18n-types";
import xior, { merge } from "xior";

export const xiorInstance = xior.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: {
    Accept: "application/json",
  },
});

export function addAuthHeader(token: string | null) {
  xiorInstance.interceptors.request.use((config) => {
    if (!token) return config;

    return merge(config, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  });
}

export function addLanguageHeader(lang: Locales) {
  xiorInstance.defaults.headers["Accept-Language"] = lang;
}
