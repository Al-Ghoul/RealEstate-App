import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import {
  Banner,
  Chip,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useI18nContext } from "@/i18n/i18n-react";
import { useMutation } from "@tanstack/react-query";
import { xiorInstance } from "@/lib/fetcher";
import PropertyCard from "@/components/property/PropertyCard";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useCurrentUser } from "@/lib/queries/user";
import PagerView from "react-native-pager-view";
import { useVideoPlayer, VideoView } from "expo-video";
import { Image } from "expo-image";
import Feather from "@expo/vector-icons/Feather";
import { toast } from "sonner-native";
import { useProperty, usePropertyMedia } from "@/lib/queries/property";
import { isXiorError } from "xior";
import { queryClient } from "@/lib/client";

export default function PropertyDetailsScreen() {
  const params = useLocalSearchParams<{
    id: string;
  }>();
  const { id } = params;
  const mapRef = useRef<MapView>(null);
  const theme = useTheme();
  const currentUser = useCurrentUser();
  const { LL, locale } = useI18nContext();
  const forceRTL = locale === "ar";
  const pagerRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const {
    data: propertyData,
    error: propertyError,
    isError: isPropertyError,
    refetch: propertyRefetch,
    isFetching: isFetchingProperty,
  } = useProperty(parseInt(id));

  const { data: propertyMediaData, refetch: propertyMediaRefetch } =
    usePropertyMedia(parseInt(id));

  const { mutateAsync: deleteMedia } = useMutation({
    mutationKey: ["delete-property-media", id],
    mutationFn: (item: PropertyMedia) =>
      xiorInstance
        .delete(`/properties/${id}/media/${item.id}`)
        .then((res) => res.data),
    onSuccess: (res) => {
      toast.success(res.message, {
        position: "bottom-center",
      });
      propertyRefetch();
    },
  });

  const { mutateAsync: deleteProperty } = useMutation({
    mutationKey: ["delete-property", id],
    mutationFn: () =>
      xiorInstance.delete(`/properties/${id}`).then((res) => res.data),
    onSuccess: (res) => {
      toast.success(res.message, {
        position: "bottom-center",
      });
      router.push("/");
    },
    onError: (error) => {
      if (isXiorError(error)) {
        toast.error(error.response?.data.message, {
          description: LL.REQUEST_ID({
            requestId: error.response?.data.requestId,
          }),
        });
      } else {
        toast.error(error.message);
      }
    },
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (mapRef.current && propertyData) {
        mapRef.current.animateToRegion(
          {
            latitude: propertyData?.location.y,
            longitude: propertyData?.location.x,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          },
          1000,
        );
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [propertyData]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isFetchingProperty}
            onRefresh={() => {
              propertyRefetch();
              propertyMediaRefetch();
            }}
          />
        }
        contentContainerStyle={{ flex: 1 }}
      >
        {propertyError ? (
          <Banner
            visible={isPropertyError && !isFetchingProperty}
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
                onPress: () => propertyRefetch(),
              },
            ]}
          >
            <Text
              style={{
                color: theme.colors.onErrorContainer,
                textAlign: forceRTL ? "right" : "left",
              }}
            >
              {isPropertyError ? LL.ERROR_FETCHING_PROPERTY_DATA() : null}
            </Text>
          </Banner>
        ) : (
          propertyData && (
            <>
              <PagerView
                ref={pagerRef}
                style={{ flex: 1 }}
                initialPage={
                  propertyMediaData && propertyMediaData.length ? 1 : 0
                }
                scrollEnabled={propertyMediaData && !!propertyMediaData.length}
                onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
              >
                <>
                  <TouchableRipple
                    onPress={() =>
                      deleteProperty().then(() =>
                        queryClient.invalidateQueries({
                          queryKey: ["properties"],
                        }),
                      )
                    }
                    style={{
                      backgroundColor: "rgba(0,0,0,0.5)",
                      padding: 8,
                      borderRadius: 50,
                      position: "absolute",
                      zIndex: 1,
                      right: 25,
                      top: 25,
                    }}
                    borderless
                  >
                    <Feather
                      name="trash-2"
                      size={24}
                      color={theme.colors.error}
                    />
                  </TouchableRipple>
                  <PropertyCard
                    property={propertyData}
                    {...(propertyData.userId === currentUser.data?.id && {
                      extra: (
                        <View style={{ flexDirection: "row", gap: 8 }}>
                          <Chip
                            style={{
                              flex: 1,
                              backgroundColor: theme.colors.secondary,
                            }}
                            textStyle={{ color: theme.colors.onSecondary }}
                            onPress={() =>
                              router.push(`/property/${id}/media/add`)
                            }
                          >
                            {LL.ADD_PROPERTY_MEDIA()}
                          </Chip>
                          <Chip
                            style={{
                              flex: 1,
                              backgroundColor: theme.colors.secondary,
                            }}
                            textStyle={{ color: theme.colors.onSecondary }}
                            onPress={() => router.push(`/property/${id}/edit/`)}
                          >
                            {LL.EDIT_PROPERTY()}
                          </Chip>
                        </View>
                      ),
                    })}
                  />
                </>
                {propertyMediaData && propertyMediaData.length > 0
                  ? propertyMediaData.map((item, index) => (
                      <View key={index} style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            position: "absolute",
                            width: "100%",
                            justifyContent: "space-between",
                            padding: 16,
                            zIndex: 1,
                          }}
                        >
                          <Text
                            style={{
                              backgroundColor: "rgba(0,0,0,0.5)",
                              color: "white",
                              textAlign: "center",
                              textAlignVertical: "center",
                              fontWeight: "bold",
                              padding: 8,
                              borderRadius: 50,
                            }}
                          >
                            {index + 1} / {propertyMediaData.length}
                          </Text>
                          {propertyData.userId === currentUser.data?.id && (
                            <TouchableRipple
                              onPress={() =>
                                deleteMedia(item).then(() => {
                                  const deletedIndex =
                                    propertyMediaData.findIndex(
                                      (m) => m.id === item.id,
                                    );
                                  if (deletedIndex <= currentPage) {
                                    const newPage = Math.max(
                                      0,
                                      currentPage - 1,
                                    );
                                    setCurrentPage(newPage);
                                    pagerRef.current?.setPage(newPage);
                                  }
                                  propertyMediaRefetch();
                                })
                              }
                              style={{
                                backgroundColor: "rgba(0,0,0,0.5)",
                                padding: 8,
                                borderRadius: 50,
                              }}
                              borderless
                            >
                              <Feather
                                name="trash-2"
                                size={24}
                                color={theme.colors.error}
                              />
                            </TouchableRipple>
                          )}
                        </View>

                        {item.type === "video" ? (
                          <VideoScreen videoSource={item.url} />
                        ) : (
                          <Image
                            source={{ uri: item.url }}
                            style={{ flex: 1 }}
                          />
                        )}
                      </View>
                    ))
                  : null}
              </PagerView>

              <MapView
                ref={mapRef}
                style={{ width: "100%", height: 250, borderRadius: 24 }}
                initialRegion={{
                  latitude: 31.1249,
                  longitude: 33.798,
                  latitudeDelta: 0.002,
                  longitudeDelta: 0.002,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: propertyData.location.y,
                    longitude: propertyData.location.x,
                  }}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <View style={{ alignItems: "center" }}>
                    <Text
                      style={{
                        color: theme.colors.primaryContainer,
                        fontWeight: "bold",
                      }}
                    >
                      {LL.PRICE_LABEL({ price: 1500 })}
                    </Text>
                    {(() => {
                      switch (propertyData.type) {
                        case "apartment":
                          return (
                            <MaterialIcons
                              name="apartment"
                              size={24}
                              color={theme.colors.onPrimary}
                            />
                          );
                        case "house":
                          return (
                            <FontAwesome6
                              name="house-chimney"
                              size={16}
                              color={theme.colors.onPrimary}
                            />
                          );
                        case "land":
                          return (
                            <MaterialIcons
                              name="terrain"
                              size={24}
                              color={theme.colors.onPrimary}
                            />
                          );
                        case "coastal":
                          return (
                            <MaterialCommunityIcons
                              name="island"
                              size={24}
                              color={theme.colors.onPrimary}
                            />
                          );
                        case "commercial":
                          return (
                            <FontAwesome6
                              name="warehouse"
                              size={24}
                              color={theme.colors.onPrimary}
                            />
                          );
                      }
                    })()}
                  </View>
                </Marker>
              </MapView>
            </>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function VideoScreen({ videoSource }: { videoSource: string }) {
  const player = useVideoPlayer(videoSource);

  return (
    <VideoView
      style={{ flex: 1 }}
      player={player}
      allowsFullscreen
      allowsPictureInPicture
    />
  );
}
