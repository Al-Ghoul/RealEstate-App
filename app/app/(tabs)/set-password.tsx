import { useMutation } from "@tanstack/react-query";
import { xiorInstance } from "@/lib/fetcher";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { setPasswordInputDTO, type SetPasswordInputDTO } from "@/lib/dtos";
import {
  TextInput,
  Text,
  View,
  TouchableOpacity,
  Alert,
  BackHandler,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useColorScheme } from "nativewind";
import { useCallback, useEffect, useState } from "react";
import { showMessage } from "react-native-flash-message";
import { XiorError } from "xior";
import { router, Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import GenericView from "@/components/GenericView";
import { useCurrentUser } from "@/lib/queries/useCurrentUser";

export default function SetPassword() {
  const { colorScheme } = useColorScheme();
  const [showPassword, setShowPassword] = useState(false);
  const currentUser = useCurrentUser();
  const setUserPassword = useMutation({
    mutationKey: ["setPassword"],
    mutationFn: (data: SetPasswordInputDTO) =>
      xiorInstance.post("/auth/set-password", data),
    onSuccess: () => {
      showMessage({
        message: "Password set successfully",
        type: "success",
      });
      reset();
      currentUser.refetch();
      router.replace("/profile");
    },
    onError: (error) => {
      if (error instanceof XiorError) {
        if (
          typeof error.response?.data === "object" &&
          "errors" in error.response?.data
        ) {
          error.response?.data.errors.map((error: { message: string }) =>
            setError("root", { message: error.message }),
          );
        } else {
          showMessage({
            message: error.response?.data.message || "An error occurred",
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
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    setError,
    reset,
  } = useForm<SetPasswordInputDTO>({
    resolver: zodResolver(setPasswordInputDTO),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const backAction = useCallback(() => {
    if (isDirty) {
      Alert.alert(
        "Unsaved changes",
        "Are you sure you want to discard these changes?",
        [
          {
            text: "Cancel",
            onPress: () => null,
            style: "cancel",
          },
          {
            text: "Discard",
            onPress: () => {
              reset();
              router.replace("/profile");
            },
          },
        ],
      );
    } else {
      router.replace("/profile");
    }
    return true;
  }, [isDirty, , reset]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );
    return () => backHandler.remove();
  }, [backAction]);

  return (
    <GenericView>
      <Tabs.Screen
        options={{
          title: "Set Password",
          headerLeft: () => (
            <TouchableOpacity
              className="items-center justify-center w-10 h-10 rounded-full"
              onPress={backAction}
            >
              <Ionicons
                name="arrow-back"
                size={18}
                color={colorScheme === "light" ? "#000" : "#fff"}
              />
            </TouchableOpacity>
          ),
          href: null,
        }}
      />
      <View className="flex-1 mx-8 justify-center gap-4">
        <Controller
          control={control}
          rules={{
            required: true,
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="flex-row dark:bg-white bg-black px-4 items-center h-12 rounded-3xl">
              <TextInput
                id="password"
                className="dark:text-black text-white placeholder:text-gray-500 h-full w-full"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                placeholder="Password"
                secureTextEntry={!showPassword}
              />
              <Feather
                name={showPassword ? "eye-off" : "eye"}
                size={24}
                onPress={() => setShowPassword(!showPassword)}
                color={colorScheme === "light" ? "#fff" : "#000"}
                className="absolute right-2"
              />
            </View>
          )}
          name="password"
        />
        {errors.password ? (
          <Text className="text-red-500 text-center">
            {errors.password.message}
          </Text>
        ) : null}

        <Controller
          control={control}
          rules={{
            required: true,
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="flex-row dark:bg-white bg-black px-4 items-center h-12 rounded-3xl">
              <TextInput
                id="confirmPassword"
                className="dark:text-black text-white placeholder:text-gray-500 h-full w-full"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                placeholder="Confirm Password"
                secureTextEntry={!showPassword}
              />
              <Feather
                name={showPassword ? "eye-off" : "eye"}
                size={24}
                onPress={() => setShowPassword(!showPassword)}
                color={colorScheme === "light" ? "#fff" : "#000"}
                className="absolute right-2"
              />
            </View>
          )}
          name="confirmPassword"
        />
        {errors.confirmPassword ? (
          <Text className="text-red-500 text-center">
            {errors.confirmPassword.message}
          </Text>
        ) : null}

        <TouchableOpacity
          className="self-center dark:bg-white bg-black disabled:bg-gray-500 w-36 h-8 rounded-lg"
          onPress={handleSubmit((data) => setUserPassword.mutate(data))}
          disabled={!isDirty || setUserPassword.isPending}
        >
          <Text className="text-center my-auto dark:text-black text-white">
            Set Password
          </Text>
        </TouchableOpacity>
      </View>
    </GenericView>
  );
}
