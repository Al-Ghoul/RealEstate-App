import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { addAuthHeader, xiorInstance } from "../fetcher";
import { createSecureStorage } from "./storage";
import { queryClient } from "../client";

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
          queryClient.invalidateQueries();
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
