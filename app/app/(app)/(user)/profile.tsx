import { xiorInstance } from "@/lib/fetcher";
import { useMutation } from "@tanstack/react-query";
import {
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
  Text,
} from "react-native";
import { Image } from "expo-image";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Feather from "@expo/vector-icons/Feather";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { useCurrentUser, useCurrentUserProfile } from "@/lib/queries/user";
import { ProfileSkeleton } from "@/components/profile/Skeleton";
import GenericView from "@/components/WaveDecoratedView";
import ProfileImage from "@/components/profile/Image";
import { Banner, Button, Divider, useTheme } from "react-native-paper";
import { useI18nContext } from "@/i18n/i18n-react";

export default function Profile() {
  const theme = useTheme();
  const { LL } = useI18nContext();
  const currentUser = useCurrentUser();
  const currentUserProfile = useCurrentUserProfile();
  const {
    mutateAsync: updateUserProfileImage,
    isPending: isUpdateUserProfileImagePending,
  } = useMutation({
    mutationKey: ["profileImage"],
    mutationFn: async () => {
      const formData = new FormData();

      if (!image || !image.uri || !image.mimeType || !image.fileName)
        throw new Error("Image is corrupted or not selected");

      // @ts-expect-error
      formData.append("image", {
        uri: image?.uri,
        type: image?.mimeType,
        name: image?.fileName,
      });

      const res = await xiorInstance.put("/users/me/profile/image", formData);
      return res.data;
    },
  });
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const onRefresh = () => {
    currentUser.refetch();
    currentUserProfile.refetch();
  };

  return (
    <GenericView>
      <ScrollView
        contentContainerStyle={{
          marginTop: 40,
        }}
        refreshControl={
          <RefreshControl
            refreshing={
              currentUser.isLoading ||
              currentUserProfile.isLoading ||
              currentUser.isFetching ||
              currentUserProfile.isFetching
            }
            onRefresh={onRefresh}
          />
        }
      >
        <Banner
          visible={
            (currentUser.isError || currentUserProfile.isError) &&
            (!currentUser.isFetching || !currentUserProfile.isFetching)
          }
          style={{
            backgroundColor: theme.colors.error,
            marginBottom: 8,
          }}
          theme={{
            colors: {
              primary: theme.colors.onError,
            },
          }}
          actions={[
            {
              label: "Retry",
              onPress: onRefresh,
            },
          ]}
        >
          <Text
            style={{
              color: theme.colors.onError,
            }}
          >
            {currentUser.isError
              ? "An error occurred while fetching user data"
              : currentUserProfile.isError
              ? "An error occurred while fetching user profile data"
              : null}
          </Text>
        </Banner>
        {currentUser.isLoading ? (
          <View style={{ alignItems: "center" }}>
            <ProfileSkeleton />
          </View>
        ) : (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 24,
            }}
          >
            <View
              style={{
                gap: 8,
              }}
            >
              {image ? (
                <TouchableOpacity
                  onPress={() => setImage(null)}
                  style={{
                    width: 96,
                    height: 96,
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    borderRadius: 50,
                    position: "absolute",
                    zIndex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="x" size={24} color="white" />
                </TouchableOpacity>
              ) : null}

              <View style={{ width: 96, height: 96, borderRadius: 50 }}>
                {image ? (
                  <Image
                    source={{ uri: image.uri }}
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: 50,
                    }}
                    transition={500}
                  />
                ) : (
                  <ProfileImage />
                )}
                {!image ? (
                  <TouchableOpacity
                    onPress={pickImage}
                    style={{
                      position: "absolute",
                      width: 32,
                      height: 32,
                      bottom: 0,
                      right: 0,
                      backgroundColor: theme.colors.onPrimary,
                      borderRadius: 50,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MaterialCommunityIcons
                      name="camera-plus"
                      size={18}
                      color={theme.colors.primary}
                    />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            <View
              style={{
                marginTop: 4,
              }}
            >
              <Text
                style={{
                  color: theme.colors.onBackground,
                  fontWeight: "bold",
                }}
              >
                {currentUserProfile.data?.firstName}{" "}
                {currentUserProfile.data?.lastName}
              </Text>
              <Text
                style={{
                  color: theme.colors.onBackground,
                  width: 300,
                }}
              >
                {currentUserProfile.data?.bio?.replace(/\\n/g, "\n")}
              </Text>
            </View>
          </View>
        )}

        <Divider
          style={{
            flex: 1,
            marginTop: 8,
          }}
        />

        <View
          style={{
            flex: 1,
            gap: 8,
            marginTop: 40,
          }}
        >
          {image ? (
            <Button
              style={{
                marginHorizontal: "auto",
                width: 150,
                borderRadius: 8,
              }}
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
              disabled={!image || isUpdateUserProfileImagePending}
              onPress={() => {
                updateUserProfileImage().then(async () => {
                  await currentUserProfile.refetch();
                  setImage(null);
                });
              }}
              loading={isUpdateUserProfileImagePending}
            >
              {LL.SAVE_IMAGE()}
            </Button>
          ) : null}
        </View>
      </ScrollView>
    </GenericView>
  );
}
