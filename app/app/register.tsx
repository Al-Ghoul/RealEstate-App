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
import { registerInputDTO, type RegisterInputDTO } from "@/lib/dtos";
import Svg, { Ellipse } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";
import SocialAuth from "@/components/SocialAuth";

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
export default function Register() {
  const {
    control: registerControl,
    handleSubmit: registerHandleSubmit,
    formState: { errors: registerErrors },
    setError: setRegisterError,
  } = useForm<RegisterInputDTO>({
    defaultValues: {
      email: "Abdo.AlGhouul@gmail.com",
      password: "12345678",
      confirmPassword: "12345678",
      firstName: "Abdo",
      lastName: "AlGhouul",
    },
    resolver: zodResolver(registerInputDTO),
  });

  const { mutate: submitRegister, isPending: isRegisterPending } = useMutation({
    mutationFn: async (data: RegisterInputDTO) =>
      await xiorInstance.post("/auth/register", data),
    onSuccess: () => {
      showMessage({
        message: "Registered successfully",
        type: "success",
      });
      router.replace("/login");
    },
    onError: (error) => {
      if (error instanceof XiorError) {
        if ("errors" in error.response?.data) {
          error.response?.data.errors.map(
            (error: { path: RegisterInputDTO & "root"; message: string }) =>
              setRegisterError(error.path, { message: error.message }),
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

  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.2, {
        duration: 5000,
        easing: Easing.out(Easing.ease),
      }),
      -1,
      true,
    );
  }, [scale]);

  const animatedProps = useAnimatedProps(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <SafeAreaView className="flex-1 dark:bg-black bg-white">
      <View className="absolute right-0">
        <Svg width={252} height={241}>
          <AnimatedEllipse
            animatedProps={animatedProps}
            cx={181}
            cy={22}
            fill={"gray"}
            rx={181}
            ry={178}
          />
        </Svg>
      </View>

      <View className="flex-1 justify-center gap-4">
        <View className="items-center justify-center px-24 gap-4">
          <Controller
            control={registerControl}
            rules={{
              required: true,
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                id="email"
                className="w-full dark:text-white text-black border dark:border-white border-black p-2 rounded-lg"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                keyboardType="email-address"
              />
            )}
            name="email"
          />
          {registerErrors.email ? (
            <Text className="text-red-500 text-center">
              {registerErrors.email.message}
            </Text>
          ) : null}

          <Controller
            control={registerControl}
            rules={{
              required: true,
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                id="password"
                className="w-full dark:text-white text-black border dark:border-white border-black p-2 rounded-lg"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                secureTextEntry
              />
            )}
            name="password"
          />
          {registerErrors.password ? (
            <Text className="text-red-500 text-center">
              {registerErrors.password.message}
            </Text>
          ) : null}
          <Controller
            control={registerControl}
            rules={{
              required: true,
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                id="confirmPassword"
                className="w-full dark:text-white text-black border dark:border-white border-black p-2 rounded-lg"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                secureTextEntry
              />
            )}
            name="confirmPassword"
          />
          {registerErrors.confirmPassword ? (
            <Text className="text-red-500 text-center">
              {registerErrors.confirmPassword.message}
            </Text>
          ) : null}
          <Controller
            control={registerControl}
            rules={{
              required: true,
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                id="firstName"
                className="w-full dark:text-white text-black border dark:border-white border-black p-2 rounded-lg"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
              />
            )}
            name="firstName"
          />
          {registerErrors.firstName ? (
            <Text className="text-red-500 text-center">
              {registerErrors.firstName.message}
            </Text>
          ) : null}
          <Controller
            control={registerControl}
            rules={{
              required: true,
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                id="lastName"
                className="w-full dark:text-white text-black border dark:border-white border-black p-2 rounded-lg"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
              />
            )}
            name="lastName"
          />
          {registerErrors.lastName ? (
            <Text className="text-red-500 text-center">
              {registerErrors.lastName.message}
            </Text>
          ) : null}

          <TouchableOpacity
            className="dark:bg-white bg-black disabled:bg-gray-500 w-32 h-8 rounded-lg"
            onPress={registerHandleSubmit((data) => submitRegister(data))}
            disabled={isRegisterPending}
          >
            <Text className="text-center my-auto dark:text-black text-white">
              Register
            </Text>
          </TouchableOpacity>
        </View>

        <View className="bg-secondary flex-row self-center gap-2">
          <Text className="text-center dark:text-white text-black">
            Already have an account?
          </Text>
          <Pressable onPress={() => router.back()}>
            <Text className="text-center font-bold dark:text-gray-200 text-black">
              Login
            </Text>
          </Pressable>
        </View>
        <SocialAuth className="mx-20 gap-4" />
      </View>
    </SafeAreaView>
  );
}
