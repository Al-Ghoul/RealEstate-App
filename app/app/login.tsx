import { Text, TextInput, Pressable, View } from "react-native";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { xiorInstance } from "@/lib/fetcher";
import { useMutation } from "@tanstack/react-query";
import { XiorError } from "xior";
import { showMessage } from "react-native-flash-message";
import { SafeAreaView } from "react-native-safe-area-context";
import { loginInputDTO, type LoginInputDTO } from "@/lib/schemas";
import Svg, { Ellipse } from "react-native-svg";
import { useThemeContextValues } from "@/components/themes";
import { useAuthStore } from "@/lib/stores/authStore";

export default function Login() {
  const login = useAuthStore((state) => state.login);
  const { theme } = useThemeContextValues();

  const {
    control: loginControl,
    handleSubmit: loginHandleSubmit,
    formState: { errors: loginErrors },
    setError: setLoginError,
  } = useForm<LoginInputDTO>({
    values: {
      email: "Abdo.AlGhouul@gmail.com",
      password: "12345678",
    },
    resolver: zodResolver(loginInputDTO),
  });

  const { mutate: submitLogin, isPending: isLoginPending } = useMutation({
    mutationFn: (data: LoginInputDTO) =>
      xiorInstance
        .post("/auth/login", data)
        .then((res) => Promise.resolve(res))
        .catch((error) => Promise.reject(error)),
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
        if ("errors" in error.response?.data) {
          error.response?.data.errors.map(
            (error: { path: LoginInputDTO & "root"; message: string }) =>
              setLoginError(error.path, { message: error.message }),
          );
        } else {
          showMessage({
            message: error.response?.data.message,
            type: "warning",
          });
        }
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
    <SafeAreaView className="flex-1 bg-secondary">
      <View className="absolute z-10">
        <Svg width={252} height={241}>
          <Ellipse
            cx={71}
            cy={63}
            fill={theme === "light" ? "#7dd1fc" : "#0c496e"}
            opacity={0.6}
            rx={181}
            ry={178}
          />
        </Svg>
      </View>

      <View className="flex-1 justify-center bg-secondary gap-4">
        <View className="bg-secondary items-center justify-center px-24 gap-4">
          <Controller
            control={loginControl}
            rules={{
              required: true,
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                id="email"
                className="w-full text-primary border border-primary p-2 rounded-lg"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                keyboardType="email-address"
              />
            )}
            name="email"
          />
          {loginErrors.email ? (
            <Text className="text-red-500 text-center">
              {loginErrors.email.message}
            </Text>
          ) : null}

          <Controller
            control={loginControl}
            rules={{
              required: true,
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                id="password"
                className="w-full text-primary border border-primary p-2 rounded-lg"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                secureTextEntry
              />
            )}
            name="email"
          />
          {loginErrors.password ? (
            <Text className="text-red-500 text-center">
              {loginErrors.password.message}
            </Text>
          ) : null}

          <Pressable
            className="bg-outstand w-32 h-8 rounded-lg"
            onPress={loginHandleSubmit((data) => submitLogin(data))}
            disabled={isLoginPending}
          >
            <Text className="text-center my-auto text-primary ">Login</Text>
          </Pressable>
        </View>

        <View className="bg-secondary flex-row self-center gap-2">
          <Text className="text-center text-primary">
            Don't have an account?
          </Text>
          <Pressable onPress={() => router.push("/register")}>
            <Text className="text-center text-outstand font-bold">
              Register
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
