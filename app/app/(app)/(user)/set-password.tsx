import { useMutation } from "@tanstack/react-query";
import { xiorInstance } from "@/lib/fetcher";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { setPasswordDTO, type SetPasswordDTO } from "@/lib/dtos";
import { TouchableOpacity, Alert, BackHandler, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useCallback, useEffect, useState } from "react";
import { showMessage } from "react-native-flash-message";
import { XiorError } from "xior";
import { router, Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import GenericView from "@/components/WaveDecoratedView";
import { useCurrentUser } from "@/lib/queries/user";
import ControlledInput from "@/components/ControlledInput";
import { Button, useTheme } from "react-native-paper";

export default function SetPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const currentUser = useCurrentUser();
  const theme = useTheme();
  const {
    control,
    handleSubmit,
    formState: { isDirty },
    reset,
  } = useForm<SetPasswordDTO>({
    resolver: zodResolver(setPasswordDTO),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const setUserPassword = useMutation({
    mutationKey: ["setPassword"],
    mutationFn: (data: SetPasswordDTO) =>
      xiorInstance.post("/auth/me/set-password", data),
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
        showMessage({
          message: error.response?.data.message || "An error occurred",
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
              style={{
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={backAction}
            >
              <Ionicons
                name="arrow-back"
                size={18}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          ),
          href: null,
        }}
      />
      <View
        style={{
          flex: 1,
          gap: 8,
          margin: 40,
        }}
      >
        <ControlledInput
          control={control}
          id="password"
          name="password"
          placeholder="Password"
          keyboardType="default"
          secureTextEntry={!showPassword}
          style={{
            width: "100%",
            borderWidth: 1,
            borderColor: theme.colors.primary,
            borderRadius: 8,
            padding: 8,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              gap: 4,
              position: "absolute",
              right: 20,
            }}
          >
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Feather
                name={showPassword ? "eye" : "eye-off"}
                size={20}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>
        </ControlledInput>

        <ControlledInput
          control={control}
          id="confirmPassword"
          name="confirmPassword"
          placeholder="Confirm Password"
          keyboardType="default"
          secureTextEntry={!showPassword}
          style={{
            width: "100%",
            borderWidth: 1,
            borderColor: theme.colors.primary,
            borderRadius: 8,
            padding: 8,
          }}
        />

        <Button
          style={{
            marginHorizontal: 16,
          }}
          buttonColor={theme.colors.primaryContainer}
          onPress={handleSubmit((data) => setUserPassword.mutate(data))}
          disabled={!isDirty || setUserPassword.isPending}
          loading={setUserPassword.isPending}
        >
          Set Password
        </Button>
      </View>
    </GenericView>
  );
}
