import { View, Text, Pressable } from "react-native";
import { LoginManager, AccessToken } from "react-native-fbsdk-next";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useMutation } from "@tanstack/react-query";
import { xiorInstance } from "@/lib/fetcher";
import { showMessage } from "react-native-flash-message";
import { useAuthStore } from "@/lib/stores/authStore";
import { router } from "expo-router";
import { XiorError } from "xior";
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import GoogleIcon from "../assets/icons/google-logo.svg";
import { useCallback } from "react";
import { Divider, useTheme } from "react-native-paper";

GoogleSignin.configure({
  webClientId:
    "475890293518-ou9s9e2akugm76jttb5mnl2ed7g8vo6v.apps.googleusercontent.com",
  offlineAccess: true,
  forceCodeForRefreshToken: false,
  profileImageSize: 120,
});

export default function SocialAuth() {
  const theme = useTheme();
  const login = useAuthStore((state) => state.login);
  const facebookLogin = useMutation({
    mutationFn: (data: { accessToken: string }) =>
      xiorInstance.post("/auth/facebook", data),
    onSuccess: (res) => {
      showMessage({
        message: "Logged in successfully",
        type: "success",
      });
      const tokens = res.data.data as JWTPayload;
      login(tokens);
      router.replace("/");
    },
    onError: (error) => {
      if (error instanceof XiorError) {
        showMessage({
          message: error.response?.data.message,
          description: error.response?.data.details,
          type: "warning",
        });
      } else {
        showMessage({
          message: "An error occurred",
          description: error.message,
          type: "danger",
        });
      }
    },
  });
  const googleLogin = useMutation({
    mutationFn: (data: { idToken: string }) =>
      xiorInstance.post("/auth/google", data),
    onSuccess: (res) => {
      showMessage({
        message: "Logged in successfully",
        type: "success",
      });
      const tokens = res.data.data as JWTPayload;
      login(tokens);
      router.replace("/");
    },
    onError: (error) => {
      GoogleSignin.signOut();
      if (error instanceof XiorError) {
        showMessage({
          message: error.response?.data.message,
          description: error.response?.data.details,
          type: "warning",
          style: {
            backgroundColor: theme.colors.secondaryContainer,
          },
        });
      } else {
        showMessage({
          message: "An error occurred",
          description: error.message,
          type: "danger",
          style: {
            backgroundColor: theme.colors.errorContainer,
          },
        });
      }
    },
  });

  const signInWithGoogle = useCallback(async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (isSuccessResponse(response)) {
        googleLogin.mutate({ idToken: response.data.idToken ?? "" });
      } else {
        showMessage({
          message: "Sign in cancelled",
          type: "warning",
          style: {
            backgroundColor: theme.colors.secondaryContainer,
          },
        });
      }
    } catch (error) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            showMessage({
              message: "Sign in in progress",
              type: "warning",
            });
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            showMessage({
              message: "Play services not available",
              type: "warning",
            });
            break;
          default:
            showMessage({
              message: "An error occurred",
              type: "danger",
            });
        }
      } else {
        showMessage({
          message: "An error occurred",
          type: "danger",
        });
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
          OR
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
          onPress={() => {
            LoginManager.logInWithPermissions(["public_profile", "email"])
              .then((result) => {
                if (!result.isCancelled) {
                  AccessToken.getCurrentAccessToken().then((data) => {
                    facebookLogin.mutate({
                      accessToken: data?.accessToken ?? "",
                    });
                  });
                }
              })
              .catch(() =>
                showMessage({
                  message: "An error occurred using facebook",
                  type: "danger",
                }),
              );
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
          onPress={signInWithGoogle}
        >
          <GoogleIcon width={20} height={20} />
        </Pressable>
      </View>
    </View>
  );
}
