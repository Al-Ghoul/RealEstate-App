import { xiorInstance } from "@/lib/fetcher";
import { useAuthStore } from "@/lib/stores/authStore";
import { useMutation } from "@tanstack/react-query";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Feather from "@expo/vector-icons/Feather";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { useColorScheme } from "nativewind";
import { useCurrentUser } from "@/lib/queries/useCurrentUser";
import { ProfileSkeleton } from "@/components/profile/Skeleton";
import { router } from "expo-router";
import GenericView from "@/components/GenericView";
import { LoginManager } from "react-native-fbsdk-next";

export default function Profile() {
  const logout = useAuthStore((state) => state.logout);
  const { colorScheme } = useColorScheme();
  const currentUser = useCurrentUser();

  const updateUserProfileImage = useMutation({
    mutationKey: ["profileImage"],
    mutationFn: async () => {
      const formData = new FormData();
      // @ts-expect-error
      formData.append("image", {
        uri: image?.uri,
        type: image?.mimeType,
        name: image?.fileName,
      });
      return await xiorInstance.put("/users/me/profile-image", formData);
    },
  });
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };
  const logoutMutation = useMutation({
    mutationFn: async () => await xiorInstance.post("/auth/logout"),
  });

  return (
    <GenericView>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={currentUser.isLoading}
            onRefresh={currentUser.refetch}
          />
        }
      >
        {currentUser.isLoading ? (
          <View className="h-36 mx-auto">
            <ProfileSkeleton />
          </View>
        ) : (
          <View className="items-center gap-2">
            <View>
              {image ? (
                <TouchableOpacity
                  onPress={() => setImage(null)}
                  className="z-10"
                >
                  <Feather
                    name="x"
                    size={24}
                    color={"white"}
                    className="absolute self-center top-10"
                  />
                </TouchableOpacity>
              ) : null}

              <Image
                source={image ? { uri: image.uri } : currentUser.data?.image}
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 50,
                  marginHorizontal: "auto",
                }}
                transition={500}
              />

              {image ? (
                <View className="absolute w-28 h-28 rounded-full bg-black/30" />
              ) : null}
              <View className="dark:bg-gray-900 bg-gray-300 absolute bottom-0 right-0 justify-center w-9 h-9 rounded-full">
                <TouchableOpacity onPress={pickImage}>
                  <MaterialCommunityIcons
                    name="camera-plus"
                    size={18}
                    color={colorScheme === "light" ? "black" : "white"}
                    className="mx-auto"
                  />
                </TouchableOpacity>
              </View>
            </View>
            <Text className="dark:text-white text-black">
              {currentUser.data?.firstName} {currentUser.data?.lastName}
            </Text>
          </View>
        )}
        <View className="flex-1 gap-8 mt-4">
          {image ? (
            <Pressable
              className="self-center dark:bg-white bg-black disabled:bg-gray-500 h-10 px-2 rounded-lg"
              disabled={!image}
              onPress={() => {
                updateUserProfileImage.mutateAsync().then(() => {
                  Image.clearDiskCache();
                  setImage(null);
                  currentUser.refetch();
                });
              }}
            >
              <Text className="text-center my-auto dark:text-black text-white">
                Save image
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            className="self-center dark:bg-white bg-black disabled:bg-gray-500 h-10 px-2 rounded-lg"
            onPress={() => {
              if (currentUser.data?.hasPassword)
                router.push("/change-password");
              else router.push("/set-password");
            }}
          >
            <Text className="text-center my-auto dark:text-black text-white">
              {currentUser.data?.hasPassword
                ? "Change Password"
                : "Set Password"}
            </Text>
          </Pressable>
          <Pressable
            className="self-center dark:bg-white bg-black disabled:bg-gray-500 h-10 px-2 rounded-lg"
            onPress={() => {
              logoutMutation.mutateAsync().finally(() => {
                logout();
                LoginManager.logOut();
                router.replace("/");
              });
            }}
          >
            <Text className="text-center my-auto dark:text-black text-white">
              Log Out
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </GenericView>
  );
}
