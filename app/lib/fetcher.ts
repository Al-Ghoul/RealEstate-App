import xior, { merge } from "xior";

export const xiorInstance = xior.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
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
