import { View, Text, TouchableOpacity } from "react-native";
import { LoginManager, AccessToken } from "react-native-fbsdk-next";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useMutation } from "@tanstack/react-query";
import { xiorInstance } from "@/lib/fetcher";
import { showMessage } from "react-native-flash-message";
import { useAuthStore } from "@/lib/stores/authStore";
import { router } from "expo-router";
import { XiorError } from "xior";

export default function SocialAuth() {
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
      router.dismissAll();
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

  return (
    <>
      <View className="flex-row gap-2 items-center mx-4">
        <View className="flex-1 h-1 border-b-2 dark:border-b-white border-b-black" />
        <Text className="dark:text-white text-black text-center">OR</Text>
        <View className="flex-1 h-1 border-b-2 dark:border-b-white border-b-black" />
      </View>
      <View className="flex-row mx-14 gap-4 items-center justify-center">
        <TouchableOpacity
          className="bg-blue-600 items-center justify-center w-12 h-12 rounded-full"
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
              .catch((error) =>
                showMessage({
                  message: "An error occurred using facebook",
                  type: "danger",
                }),
              );
          }}
        >
          <FontAwesome5 name="facebook-f" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </>
  );
}
