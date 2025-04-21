import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";
import { addAuthHeader, xiorInstance } from "../fetcher";

const createSecureStorage = () => ({
  getItem: async (key: string) => SecureStore.getItemAsync(key),
  setItem: async (key: string, value: string) =>
    SecureStore.setItemAsync(key, value),
  removeItem: async (key: string) => SecureStore.deleteItemAsync(key),
});

interface AuthState {
  session: JWTPayload | null;
  login: (session: JWTPayload) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      login: (session) =>
        set(() => {
          addAuthHeader(session.accessToken);
          return { session };
        }),
      logout: () =>
        set(() => {
          xiorInstance.interceptors.request.clear();
          xiorInstance.interceptors.response.clear();
          return { session: null };
        }),
    }),
    {
      name: "user-session",
      storage: createJSONStorage(() => createSecureStorage()),
    },
  ),
);
