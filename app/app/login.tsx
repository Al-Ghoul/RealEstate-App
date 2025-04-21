import {
  Text,
  TextInput,
  Pressable,
  View,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { xiorInstance } from "@/lib/fetcher";
import { useMutation } from "@tanstack/react-query";
import { XiorError } from "xior";
import { showMessage } from "react-native-flash-message";
import { SafeAreaView } from "react-native-safe-area-context";
import { loginInputDTO, type LoginInputDTO } from "@/lib/dtos";
import Svg, { Circle, Ellipse } from "react-native-svg";
import { useAuthStore } from "@/lib/stores/authStore";
import Animated, {
  Easing,
  interpolate,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function Login() {
  const login = useAuthStore((state) => state.login);
  const {
    control: loginControl,
    handleSubmit: loginHandleSubmit,
    formState: { errors: loginErrors },
    setError: setLoginError,
  } = useForm<LoginInputDTO>({
    defaultValues: {
      email: "Abdo.AlGhouul@gmail.com",
      password: "12345678",
    },
    resolver: zodResolver(loginInputDTO),
  });

  const { mutate: submitLogin, isPending: isLoginPending } = useMutation({
    mutationFn: async (data: LoginInputDTO) =>
      await xiorInstance.post("/auth/login", data),
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
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, {
        duration: 4000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
  }, [progress]);

  const floatingProps = useAnimatedProps(() => {
    const translateY = interpolate(progress.value, [0, 1], [-2, 2], "extend");

    return {
      transform: [{ translateY }],
    };
  });

  return (
    <SafeAreaView className="flex-1 dark:bg-black bg-white">
      <View className="absolute">
        <Svg width={252} height={241}>
          <Ellipse cx={71} cy={63} fill={"gray"} rx={181} ry={178} />
        </Svg>
      </View>
      <View className="flex-1 justify-center gap-4 mx-8">
        <View className="absolute -z-10 right-0">
          <Svg height="300" width="300" viewBox="0 0 100 100">
            <AnimatedCircle
              cx="20"
              cy="20"
              r="5"
              fill={"gray"}
              animatedProps={floatingProps}
            />
          </Svg>
        </View>

        <Controller
          control={loginControl}
          rules={{
            required: true,
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              id="email"
              className="w-full dark:text-white text-black placeholder:text-gray-500 border dark:border-white border-black p-2 rounded-lg"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              placeholder="Email"
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
              className="w-full dark:text-white text-black placeholder:text-gray-500 border dark:border-white border-black p-2 rounded-lg"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              placeholder="Password"
              secureTextEntry
            />
          )}
          name="password"
        />
        {loginErrors.password ? (
          <Text className="text-red-500 text-center">
            {loginErrors.password.message}
          </Text>
        ) : null}

        <TouchableOpacity
          className="dark:bg-white bg-black disabled:bg-gray-500 w-32 h-8 rounded-lg mx-auto"
          onPress={loginHandleSubmit((data) => submitLogin(data))}
          disabled={isLoginPending}
        >
          <Text className="text-center my-auto dark:text-black text-white">
            Login
          </Text>
        </TouchableOpacity>

        <View className="flex-row self-center gap-2">
          <Text className="text-center dark:text-white text-black">
            Don't have an account?
          </Text>
          <Pressable onPress={() => router.push("/register")}>
            <Text className="text-center font-bold dark:text-gray-200 text-black">
              Register
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
