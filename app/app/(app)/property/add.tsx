import { useI18nContext } from "@/i18n/i18n-react";
import { createPropertyDTO, type CreatePropertyDTO } from "@/lib/dtos";
import { xiorInstance } from "@/lib/fetcher";
import { useAuthStore } from "@/lib/stores/authStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Redirect, router, Tabs, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { StyleSheet, View, TouchableOpacity, BackHandler } from "react-native";
import { Button, Dialog, Portal, Text, useTheme } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";
import PropertyInputs from "@/components/property/PropertyInputs";
import { toast } from "sonner-native";
import { isXiorError } from "xior";
import { queryClient } from "@/lib/client";

export default function AddPropertyScreen() {
  const theme = useTheme();
  const { LL, locale } = useI18nContext();
  const forceRTL = locale === "ar";
  const roles = useAuthStore((state) => state.session?.roles);

  const {
    control,
    handleSubmit,
    reset: resetPropertyInputs,
    getValues,
    formState: { isDirty: isPropertyInputDirty },
  } = useForm<CreatePropertyDTO>({
    defaultValues: {
      title: "Home",
      description: "Description",
      price: "1500",
      area: "100",
      rooms: "3",
      type: undefined,
      status: undefined,
      location: undefined,
      thumbnail: undefined,
      isPublished: false,
    },
    resolver: zodResolver(createPropertyDTO),
  });

  const { mutateAsync: propertySubmit, isPending } = useMutation({
    mutationKey: [
      "property",
      {
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
        // @ts-expect-error
        formData.append("thumbnail", {
          uri: input.thumbnail?.uri,
          type: input.thumbnail?.type,
          name: input.thumbnail?.name,
        });
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

      const res = await xiorInstance.post("/properties", formData);
      return res.data as SuccessfulResponse<Property>;
    },
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      if (typeof error === "object" && "requestId" in error) {
        toast.error(error.message, {
          description: LL.REQUEST_ID({ requestId: error.requestId }),
        });
      } else if (isXiorError(error)) {
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

  if (!roles?.includes("admin") && !roles?.includes("agent"))
    return <Redirect href="/" />;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Tabs.Screen
        options={{
          title: LL.ADD_PROPERTY(),
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
            onPress={handleSubmit((input) =>
              propertySubmit(input).then((res) => {
                resetPropertyInputs();
                queryClient.invalidateQueries({ queryKey: ["properties"] });
                router.push(`/property/${res.data.id}/media/add`);
              }),
            )}
          >
            {LL.ADD_PROPERTY()}
          </Button>
        }
      />

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
