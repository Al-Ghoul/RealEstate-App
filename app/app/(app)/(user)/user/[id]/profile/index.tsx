import ProfileImage from "@/components/profile/Image";
import { ProfileSkeleton } from "@/components/profile/Skeleton";
import PropertyCard from "@/components/property/PropertyCard";
import { PropertyCardSkeleton } from "@/components/property/Skeleton";
import { useI18nContext } from "@/i18n/i18n-react";
import { xiorInstance } from "@/lib/fetcher";
import { useGetUserProfile } from "@/lib/queries/user";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useIsFocused } from "@react-navigation/native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { router, Tabs, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { Banner, Divider, Text, useTheme } from "react-native-paper";

export default function UserProfileScreen() {
  const params = useLocalSearchParams<{
    id: string;
  }>();
  const { id } = params;
  const { LL, locale } = useI18nContext();
  const forceRTL = locale === "ar";
  const theme = useTheme();
  const isFocused = useIsFocused();
  const {
    data: userProfileData,
    isLoading: isLoadingUserProfile,
    isFetching: isFetchingUserProfile,
    isError: isErrorUserProfile,
    refetch: profileRefetch,
  } = useGetUserProfile(id);
  const [order, setOrder] = useState<string | undefined>();

  const {
    data: propertiesData,
    isError: isPropertiesError,
    fetchNextPage: fetchPropertiesNextPage,
    refetch: refetchProperties,
    hasNextPage: propertiesHasNextPage,
    isFetching: isFetchingProperties,
    isLoading: isLoadingProperties,
    isFetchingNextPage: isFetchingPropertiesNextPage,
  } = useInfiniteQuery({
    queryKey: [
      "properties",
      {
        order,
        userId: id,
      },
    ],

    queryFn: async (input) => {
      let params: {
        limit: number;
        order?: string;
        cursor?: number;
        userId?: string;
      } = {
        limit: 10,
        cursor: input.pageParam.cursor,
        userId: id,
      };

      if (order) params.order = order;

      const res = await xiorInstance.get("/properties", {
        params,
      });

      return res.data;
    },
    initialPageParam: {
      cursor: 0,
      cursorCreatedAt: undefined,
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta.has_next_page) return undefined;

      return {
        cursor: lastPage.meta.next_cursor,
        cursorCreatedAt: lastPage.meta.cursor_created_at,
      };
    },
    subscribed: isFocused,
  });

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Tabs.Screen
        options={{
          title: userProfileData
            ? `${userProfileData?.firstName}  ${userProfileData?.lastName}`
            : "User Profile",
          headerLeft: () => (
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={() => router.back()}
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
      <ScrollView
        style={{
          flexGrow: 0,
        }}
        refreshControl={
          <RefreshControl
            refreshing={
              isFetchingUserProfile ||
              isFetchingProperties ||
              isFetchingPropertiesNextPage
            }
            onRefresh={() => {
              profileRefetch();
              refetchProperties();
            }}
          />
        }
      >
        <Banner
          visible={isErrorUserProfile && !isFetchingUserProfile}
          style={{
            backgroundColor: theme.colors.errorContainer,
            marginBottom: 8,
          }}
          theme={{
            colors: {
              primary: theme.colors.onErrorContainer,
            },
          }}
          actions={[
            {
              label: LL.RETRY(),
              onPress: () => {
                profileRefetch();
              },
            },
          ]}
        >
          <Text
            style={{
              color: theme.colors.onErrorContainer,
              textAlign: forceRTL ? "right" : "left",
            }}
          >
            {LL.ERROR_FETCHING_USER_PROFILE_DATA()}
          </Text>
        </Banner>

        {isLoadingUserProfile ? (
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
              <View style={{ width: 96, height: 96, borderRadius: 50 }}>
                <ProfileImage
                  source={userProfileData?.image!}
                  blurHash={userProfileData?.imageBlurHash!}
                />
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
                {userProfileData?.firstName} {userProfileData?.lastName}
              </Text>
              <Text
                style={{
                  color: theme.colors.onBackground,
                  width: 300,
                }}
              >
                {userProfileData?.bio?.replace(/\\n/g, "\n")}
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
      </ScrollView>

      <Pressable
        style={{ alignSelf: "flex-end", marginHorizontal: 16, marginTop: 16 }}
        onPress={() => {
          if (order === "asc") {
            setOrder("desc");
          } else {
            setOrder("asc");
          }
        }}
      >
        {order === "asc" ? (
          <MaterialCommunityIcons
            name="sort-descending"
            size={24}
            color={theme.colors.primary}
          />
        ) : (
          <MaterialCommunityIcons
            name="sort-ascending"
            size={24}
            color={theme.colors.primary}
          />
        )}
      </Pressable>

      <Banner
        visible={isPropertiesError && !isFetchingProperties}
        style={{
          backgroundColor: theme.colors.errorContainer,
        }}
        theme={{
          colors: {
            primary: theme.colors.onErrorContainer,
          },
        }}
        actions={[
          {
            label: LL.RETRY(),
            onPress: () => refetchProperties(),
          },
        ]}
      >
        <Text
          style={{
            color: theme.colors.onErrorContainer,
            textAlign: forceRTL ? "right" : "left",
          }}
        >
          {LL.ERROR_FETCHING_PROPERTIES_DATA()}
        </Text>
      </Banner>

      {isLoadingProperties ? (
        <View style={{ flex: 1, marginHorizontal: 16 }}>
          <View style={{ flex: 1, marginBottom: 32 }}>
            <PropertyCardSkeleton />
          </View>
          <View style={{ flex: 1 }}>
            <PropertyCardSkeleton />
          </View>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          contentContainerStyle={{
            gap: 8,
          }}
          data={propertiesData?.pages.flatMap((page) => page.data)}
          keyExtractor={(item) => item.id}
          onEndReached={() => {
            if (propertiesHasNextPage) fetchPropertiesNextPage();
          }}
          renderItem={({ item }) => <PropertyCard property={item} withLink />}
        />
      )}
    </View>
  );
}
