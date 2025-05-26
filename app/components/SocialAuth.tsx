import { View, Text, Pressable } from "react-native";
import { LoginManager, AccessToken } from "react-native-fbsdk-next";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useMutation } from "@tanstack/react-query";
import { xiorInstance } from "@/lib/fetcher";
import { useAuthStore } from "@/lib/stores/authStore";
import { router } from "expo-router";
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import GoogleIcon from "../assets/icons/google-logo.svg";
import { useCallback } from "react";
import { Divider, useTheme } from "react-native-paper";
import { useI18nContext } from "@/i18n/i18n-react";
import { toast } from "sonner-native";
import { isXiorError } from "xior";

GoogleSignin.configure({
  webClientId:
    "475890293518-ou9s9e2akugm76jttb5mnl2ed7g8vo6v.apps.googleusercontent.com",
  offlineAccess: true,
  forceCodeForRefreshToken: false,
  profileImageSize: 120,
});

export default function SocialAuth() {
  const theme = useTheme();
  const { LL } = useI18nContext();
  const login = useAuthStore((state) => state.login);
  const { mutateAsync: facebookLogin, isPending: isFacebookLoginPending } =
    useMutation({
      mutationFn: (data: { accessToken: string }) =>
        xiorInstance.post("/auth/facebook", data).then((res) => res.data),
      onSuccess: (res) => toast.success(res.message),
      onError: (error) => {
        if (isXiorError(error)) {
          if (error.response?.data.requestId) {
            toast.warning(error.response?.data.message, {
              description: LL.REQUEST_ID({
                requestId: error.response?.data.requestId,
              }),
            });
          } else {
            toast.error(error.message);
          }
        } else {
          toast.error(error.message);
        }
      },
    });
  const { mutateAsync: googleLogin, isPending: isGoogleLoginPending } =
    useMutation({
      mutationFn: (data: { idToken: string }) =>
        xiorInstance.post("/auth/google", data).then((res) => res.data),
      onSuccess: (res) => toast.success(res.message),
      onError: (error) => {
        if (isXiorError(error)) {
          if (error.response?.data.requestId) {
            toast.warning(error.response?.data.message, {
              description: LL.REQUEST_ID({
                requestId: error.response?.data.requestId,
              }),
            });
          } else {
            toast.error(error.message);
          }
        } else {
          toast.error(error.message);
        }
      },
    });

  const signInWithGoogle = useCallback(async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (isSuccessResponse(response)) {
        googleLogin({ idToken: response.data.idToken ?? "" })
          .then((res) => {
            login(res.data as JWTPayload);
            router.replace("/");
          })
          .catch(() => GoogleSignin.signOut());
      } else {
        toast("Sign in cancelled");
      }
    } catch (error) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            toast.warning("Sign in in progress");
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            toast.warning("Play services not available");
            break;
          default:
            toast.warning("An error occurred");
        }
      } else {
        toast.error("An error occurred");
      }
    }
    // WARN: CAREFULL EDITING THIS
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleLogin]);

  return (
    <View style={{ gap: 4 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
        }}
      >
        <Divider style={{ flex: 1, height: 2 }} />
        <Text
          style={{
            color: theme.colors.secondary,
          }}
        >
          {LL.OR()}
        </Text>
        <Divider style={{ flex: 1, height: 2 }} />
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Pressable
          style={{
            backgroundColor: "#3b5998",
            width: 42,
            height: 42,
            borderRadius: 50,
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,

            elevation: 5,
          }}
          disabled={isFacebookLoginPending || isGoogleLoginPending}
          onPress={() => {
            LoginManager.logInWithPermissions(["public_profile", "email"])
              .then((result) => {
                if (!result.isCancelled) {
                  AccessToken.getCurrentAccessToken().then((data) => {
                    facebookLogin({
                      accessToken: data?.accessToken ?? "",
                    }).then((res) => {
                      login(res.data as JWTPayload);
                      router.replace("/");
                    });
                  });
                }
              })
              .catch(() => toast.error("An error occurred using facebook"));
          }}
        >
          <FontAwesome5 name="facebook-f" size={20} color="#FFF" />
        </Pressable>

        <Pressable
          style={{
            backgroundColor: "#FFF",
            width: 42,
            height: 42,
            borderRadius: 50,
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,

            elevation: 5,
          }}
          disabled={isFacebookLoginPending || isGoogleLoginPending}
          onPress={signInWithGoogle}
        >
          <GoogleIcon width={20} height={20} />
        </Pressable>
      </View>
    </View>
  );
}
