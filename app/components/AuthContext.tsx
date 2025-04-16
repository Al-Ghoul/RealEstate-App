import {
  useContext,
  createContext,
  type PropsWithChildren,
  useEffect,
  useState,
} from "react";
import * as SecureStore from "expo-secure-store";
import { addAuthHeader, xiorInstance } from "@/lib/fetcher";
import setupTokenRefresh from "xior/plugins/token-refresh";
import { XiorResponse } from "xior";
import errorRetry from "xior/plugins/error-retry";

const AuthContext = createContext<{
  login: (payload: JWTPayload) => void;
  logout: () => void;
  session?: JWTPayload | null;
  isLoading: boolean;
}>({
  login: () => null,
  logout: () => null,
  session: null,
  isLoading: false,
});

export function useSession() {
  const value = useContext(AuthContext);
  if (process.env.NODE_ENV !== "production") {
    if (!value)
      throw new Error("useSession must be wrapped in a <SessionProvider />");
  }

  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true);
  const [JWT, setJWT] = useState<JWTPayload | null>(null);

  useEffect(() => {
    const currSession = JSON.parse(
      SecureStore.getItem("Session") as string,
    ) as JWTPayload | null;

    if (currSession) {
      setJWT(currSession);
      addAuthHeader(currSession.accessToken);
    }

    xiorInstance.interceptors.response.use(
      (result) => {
        return result;
      },
      async (error) => {
        if (
          error.request?.url?.endsWith("/refresh") &&
          error.request.method === "POST"
        ) {
          saveJWT("Session", null);
          setJWT(null);
          xiorInstance.interceptors.request.clear();
        }

        return Promise.reject(error);
      },
    );

    function shouldRefresh(response: XiorResponse) {
      const session = JSON.parse(
        SecureStore.getItem("Auth") as string,
      ) as JWTPayload | null;

      return Boolean(
        session?.accessToken &&
          response?.status &&
          [401, 403].includes(response.status),
      );
    }

    xiorInstance.plugins.use(
      errorRetry({
        enableRetry: (_, error) => {
          if (error?.response && shouldRefresh(error.response)) {
            return true;
          }
        },
      }),
    );

    setupTokenRefresh(xiorInstance, {
      shouldRefresh,
      async refreshToken(error) {
        try {
          const session = JSON.parse(
            SecureStore.getItem("Auth") as string,
          ) as JWTPayload | null;
          const { data, status } = await xiorInstance.post("/auth/refresh", {
            refresh_token: session?.accessToken,
          });
          if (status === 200 && data) {
            saveJWT("Session", data);
            setJWT(data);
            xiorInstance.interceptors.request.clear();
            addAuthHeader(data.access_token);
          } else {
            saveJWT("Session", null);
            setJWT(null);
            throw error;
          }
        } catch {
          saveJWT("Session", null);
          setJWT(null);
          return Promise.reject(error);
        }
      },
    });

    setIsLoading(false);

    return () => {
      xiorInstance.interceptors.request.clear();
      xiorInstance.interceptors.response.clear();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        login: (payload: JWTPayload) => {
          saveJWT("Session", payload);
          setJWT(payload);
          addAuthHeader(payload.accessToken);
        },
        logout: () => {
          saveJWT("Session", null);
          setJWT(null);
          xiorInstance.interceptors.request.clear();
        },
        session: JWT,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export async function saveJWT(key: string, value: JWTPayload | null) {
  if (value === null) return await SecureStore.deleteItemAsync(key);
  SecureStore.setItem(key, JSON.stringify(value));
}

export function getJWT() {
  return JSON.parse(
    SecureStore.getItem("Session") as string,
  ) as JWTPayload | null;
}
