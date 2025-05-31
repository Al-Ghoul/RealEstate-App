import {
  router,
  Tabs,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BackHandler,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import MapView from "react-native-maps";
import {
  Banner,
  Button,
  Dialog,
  Portal,
  Text,
  useTheme,
} from "react-native-paper";
import { useI18nContext } from "@/i18n/i18n-react";
import { useMutation } from "@tanstack/react-query";
import { xiorInstance } from "@/lib/fetcher";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm } from "react-hook-form";
import { createPropertyDTO, type CreatePropertyDTO } from "@/lib/dtos";
import { zodResolver } from "@hookform/resolvers/zod";
import PropertyInputs from "@/components/property/PropertyInputs";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useProperty } from "@/lib/queries/property";
import { toast } from "sonner-native";
import { XiorError } from "xior";

export default function EditPropertyScreen() {
  const params = useLocalSearchParams<{
    id: string;
  }>();
  const { id } = params;
  const mapRef = useRef<MapView>(null);
  const theme = useTheme();
  const { LL, locale } = useI18nContext();
  const forceRTL = locale === "ar";

  const {
    data: propertyData,
    error: propertyError,
    isError: isPropertyError,
    refetch: refetchProperty,
    isFetching: isFetchingProperty,
  } = useProperty(parseInt(id));

  const {
    control,
    handleSubmit,
    reset: resetPropertyInputs,
    getValues,
    formState: { isDirty: isPropertyInputDirty },
  } = useForm<CreatePropertyDTO>({
    defaultValues: {
      title: propertyData?.title,
      description: propertyData?.description,
      price: propertyData?.price.toString(),
      area: propertyData?.area.toString(),
      rooms: propertyData?.rooms.toString(),
      type: propertyData?.type,
      status: propertyData?.status,
      location: propertyData?.location,
      thumbnail: propertyData?.thumbnailURL,
      isPublished: propertyData?.isPublished,
    },
    resolver: zodResolver(createPropertyDTO),
  });

  useEffect(() => {
    resetPropertyInputs({
      title: propertyData?.title,
      description: propertyData?.description,
      price: propertyData?.price.toString(),
      area: propertyData?.area.toString(),
      rooms: propertyData?.rooms.toString(),
      type: propertyData?.type,
      status: propertyData?.status,
      location: propertyData?.location,
      thumbnail: propertyData?.thumbnailURL,
      isPublished: propertyData?.isPublished,
    });
  }, [propertyData, resetPropertyInputs]);

  const { mutateAsync: propertySubmit, isPending } = useMutation({
    mutationKey: [
      "property",
      {
        id,
        title: getValues("title"),
        description: getValues("description"),
        price: getValues("price"),
        area: getValues("area"),
        rooms: getValues("rooms"),
        type: getValues("type"),
        status: getValues("status"),
        location: getValues("location"),
        thumbnail: getValues("thumbnail"),
        isPublished: getValues("isPublished"),
      },
    ],
    mutationFn: async (input: CreatePropertyDTO) => {
      const formData = new FormData();

      if (typeof input.thumbnail !== "string") {
        formData.append("thumbnail", {
          uri: input.thumbnail?.uri,
          type: input.thumbnail?.type,
          name: input.thumbnail?.name,
        } as unknown as Blob);
      }

      formData.append("title", input.title);
      formData.append("description", input.description);
      formData.append("price", input.price);
      formData.append("area", input.area);
      formData.append("rooms", input.rooms);
      formData.append("type", input.type);
      formData.append("status", input.status);
      formData.append(
        "location",
        JSON.stringify({
          // NOTE: (X=longitude, Y=latitude) for PostGIS
          x: input.location?.y,
          y: input.location?.x,
        }),
      );
      formData.append("isPublished", input.isPublished.toString());

      const res = await xiorInstance.patch(`/properties/${id}`, formData);
      return res.data;
    },
    onSuccess: (res) => toast.success(res.message),
    onError: (error) => {
      if (error instanceof XiorError) {
        if (error.response?.data.requestId) {
          toast.warning(error.response?.data.message, {
            description: LL.REQUEST_ID({
              requestId: error.response?.data.requestId,
            }),
          });
        } else {
          toast.error(error.message);
        }
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

  const [isDiscardChangesDialogVisible, setIsDiscardChangesDialogVisible] =
    useState(false);

  const backAction = useCallback(() => {
    if (isPropertyInputDirty) setIsDiscardChangesDialogVisible(true);
    else router.back();
    return true;
  }, [isPropertyInputDirty]);

  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction,
      );

      return () => {
        backHandler.remove();
      };
    }, [backAction]),
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isFetchingProperty}
            onRefresh={refetchProperty}
          />
        }
        contentContainerStyle={{ flex: 1 }}
      >
        <Tabs.Screen
          options={{
            title: LL.EDIT_PROPERTY(),
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
                onPress: () => refetchProperty(),
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
              <PropertyInputs
                control={control}
                submitButton={
                  <Button
                    style={{
                      marginHorizontal: 24,
                    }}
                    buttonColor={theme.colors.primary}
                    textColor={theme.colors.onPrimary}
                    disabled={isPending || !isPropertyInputDirty}
                    loading={isPending}
                    onPress={handleSubmit((data) =>
                      propertySubmit(data).then(() => {
                        resetPropertyInputs();
                        refetchProperty();
                        router.push(`/property/${id}`);
                      }),
                    )}
                  >
                    {LL.EDIT_PROPERTY()}
                  </Button>
                }
              />
            </>
          )
        )}

        <Portal>
          <Dialog
            dismissableBackButton={false}
            visible={isDiscardChangesDialogVisible}
          >
            <Dialog.Title style={{ textAlign: forceRTL ? "right" : "left" }}>
              {LL.UNSAVED_CHANGES()}
            </Dialog.Title>
            <Dialog.Content>
              <Text
                style={{ textAlign: forceRTL ? "right" : "left" }}
                variant="bodyMedium"
              >
                {LL.UNSAVED_CHANGES_PROMPT()}
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                onPress={() => {
                  setIsDiscardChangesDialogVisible(false);
                  resetPropertyInputs();
                  router.back();
                }}
              >
                {LL.DISCARD()}
              </Button>
              <Button onPress={() => setIsDiscardChangesDialogVisible(false)}>
                {LL.CANCEL()}
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </ScrollView>
    </SafeAreaView>
  );
}
