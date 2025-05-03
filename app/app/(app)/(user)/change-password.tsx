import { useMutation } from "@tanstack/react-query";
import { xiorInstance } from "@/lib/fetcher";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordDTO, type ChangePasswordDTO } from "@/lib/dtos";
import { TouchableOpacity, Alert, BackHandler, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useCallback, useEffect, useState } from "react";
import { showMessage } from "react-native-flash-message";
import { XiorError } from "xior";
import { router, Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import GenericView from "@/components/WaveDecoratedView";
import { Button, useTheme } from "react-native-paper";
import ControlledInput from "@/components/ControlledInput";

export default function ChangePassword() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const theme = useTheme();
  const updateUserPassword = useMutation({
    mutationKey: ["changePassword"],
    mutationFn: (data: ChangePasswordDTO) =>
      xiorInstance.post("/auth/change-password", data),
    onSuccess: () => {
      showMessage({
        message: "Changed password successfully",
        type: "success",
      });
      reset();
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
  const {
    control,
    handleSubmit,
    formState: { isDirty },
    reset,
  } = useForm<ChangePasswordDTO>({
    resolver: zodResolver(changePasswordDTO),
    defaultValues: {
      currentPassword: "",
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
    <GenericView style={{}}>
      <Tabs.Screen
        options={{
          title: "Change Password",
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
          margin: 8,
          marginTop: 16,
        }}
      >
        <ControlledInput
          control={control}
          id="currentPassword"
          name="currentPassword"
          placeholder="Password"
          keyboardType="default"
          secureTextEntry={!showCurrentPassword}
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
            <TouchableOpacity
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              {showCurrentPassword ? (
                <Feather
                  name="eye-off"
                  size={20}
                  color={theme.colors.primary}
                />
              ) : (
                <Feather name="eye" size={20} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        </ControlledInput>

        <ControlledInput
          control={control}
          id="password"
          name="password"
          placeholder="New Password"
          keyboardType="default"
          secureTextEntry={!showNewPassword}
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
            <TouchableOpacity
              onPress={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? (
                <Feather
                  name="eye-off"
                  size={20}
                  color={theme.colors.primary}
                />
              ) : (
                <Feather name="eye" size={20} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        </ControlledInput>

        <ControlledInput
          control={control}
          id="confirmPassword"
          name="confirmPassword"
          placeholder="Confirm Password"
          keyboardType="default"
          secureTextEntry={!showNewPassword}
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
          onPress={handleSubmit((data) => updateUserPassword.mutate(data))}
          disabled={!isDirty || updateUserPassword.isPending}
          loading={updateUserPassword.isPending}
        >
          Change Password
        </Button>
      </View>
    </GenericView>
  );
}
