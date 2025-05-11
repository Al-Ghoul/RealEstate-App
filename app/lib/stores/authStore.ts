import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { addAuthHeader, xiorInstance } from "../fetcher";
import { createSecureStorage } from "./storage";
import { queryClient } from "../client";

type Role = "agent" | "client" | "admin";

type Session = {
  tokens: JWTPayload;
  roles: Role[];
};

interface AuthState {
  session: Session | null;
  login: (tokens: JWTPayload) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      login: (tokens) =>
        set(() => {
          addAuthHeader(tokens.accessToken);
          const roles = parseJwt(tokens.accessToken).roles;
          return { session: { tokens: tokens, roles } };
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

const parseJwt = (token: string) => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("Invalid JWT structure");

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));

    return JSON.parse(decoded);
  } catch {
    throw new Error("Invalid token");
  }
};
