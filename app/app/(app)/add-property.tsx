import ControlledInput from "@/components/ControlledInput";
import { useI18nContext } from "@/i18n/i18n-react";
import { createPropertyDTO, type CreatePropertyDTO } from "@/lib/dtos";
import { xiorInstance } from "@/lib/fetcher";
import { useAuthStore } from "@/lib/stores/authStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Redirect, router, Tabs } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { StyleSheet, View, TouchableOpacity, BackHandler } from "react-native";
import { Button, Dialog, Portal, Text, useTheme } from "react-native-paper";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Ionicons from "@expo/vector-icons/Ionicons";
import LocationPicker from "@/components/LocationPicker";

type Location = {
  latitude: number;
  longitude: number;
};

export default function AddProperty() {
  const theme = useTheme();
  const { LL, locale } = useI18nContext();
  const forceRTL = locale === "ar";
  const roles = useAuthStore((state) => state.session?.roles);
  const sheet = useRef<TrueSheet>(null);

  const {
    control,
    handleSubmit,
    reset: resetPropertyInputs,
    formState: { isDirty: isPropertyInputDirty },
  } = useForm<CreatePropertyDTO>({
    resolver: zodResolver(createPropertyDTO),
  });
  const { mutateAsync: propertySubmit, isPending } = useMutation({
    mutationFn: (data: CreatePropertyDTO & Location) =>
      xiorInstance.post("/properties", data).then((res) => res.data),
  });
  const [markerPosition, setMarkerPosition] = useState({
    latitude: 0,
    longitude: 0,
  });

  const [isDiscardChangesDialogVisible, setIsDiscardChangesDialogVisible] =
    useState(false);
  const [
    isLocationNotPickedDialogVisible,
    setIsLocationNotPickedDialogVisible,
  ] = useState(false);

  const backAction = useCallback(() => {
    if (isPropertyInputDirty) {
      setIsDiscardChangesDialogVisible(true);
    } else {
      router.back();
    }
    return true;
  }, [isPropertyInputDirty]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );
    return () => backHandler.remove();
  }, [backAction]);

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
      <View style={styles.container}>
        <View
          style={{
            marginHorizontal: 16,
            gap: 8,
          }}
        >
          <ControlledInput
            control={control}
            name="title"
            id="title"
            placeholder={LL.TITLE()}
            keyboardType="default"
            style={{
              width: "100%",
              borderWidth: 1,
              borderColor: theme.colors.primary,
              borderRadius: 8,
              padding: 8,
            }}
          />

          <ControlledInput
            control={control}
            name="description"
            id="description"
            placeholder={LL.DESCRIPTION()}
            keyboardType="default"
            style={{
              width: "100%",
              borderWidth: 1,
              borderColor: theme.colors.primary,
              borderRadius: 8,
              padding: 8,
            }}
          />

          <ControlledInput
            control={control}
            name="price"
            id="price"
            placeholder={LL.PRICE()}
            keyboardType="numeric"
            style={{
              width: "100%",
              borderWidth: 1,
              borderColor: theme.colors.primary,
              borderRadius: 8,
              padding: 8,
            }}
          />

          <Button
            onPress={() => sheet.current?.present()}
            icon={() => (
              <FontAwesome6
                name="map-location"
                size={16}
                color={theme.colors.primary}
              />
            )}
          >
            {LL.PICK_A_LOCATION()}
          </Button>

          <Button
            style={{
              marginHorizontal: 24,
            }}
            buttonColor={theme.colors.primary}
            textColor={theme.colors.onPrimary}
            disabled={
              isPending || !markerPosition.latitude || !markerPosition.longitude
            }
            loading={isPending}
            onPress={handleSubmit((data) =>
              propertySubmit({ ...data, ...markerPosition }).then(() => {
                resetPropertyInputs();
                setMarkerPosition({ latitude: 0, longitude: 0 });
              }),
            )}
          >
            {LL.ADD_PROPERTY()}
          </Button>
        </View>
      </View>

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

      <TrueSheet
        ref={sheet}
        sizes={["large"]}
        backgroundColor={theme.colors.background}
        cornerRadius={25}
        style={{ borderTopEndRadius: 25, borderTopStartRadius: 25 }}
        contentContainerStyle={{
          flex: 1,
          borderRadius: 25,
        }}
      >
        <LocationPicker
          markerPosition={markerPosition}
          setMarkerPosition={setMarkerPosition}
        >
          <Dialog visible={isLocationNotPickedDialogVisible}>
            <Dialog.Title style={{ textAlign: forceRTL ? "right" : "left" }}>
              {LL.NO_LOCATION_WAS_PICKED()}
            </Dialog.Title>
            <Dialog.Content>
              <Text
                style={{ textAlign: forceRTL ? "right" : "left" }}
                variant="bodyMedium"
              >
                {LL.NO_LOCATION_WAS_PICKED_PROMPT()}
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                onPress={() => {
                  setIsLocationNotPickedDialogVisible(false);
                  sheet.current?.dismiss();
                }}
              >
                {LL.DISCARD()}
              </Button>
              <Button
                onPress={() => setIsLocationNotPickedDialogVisible(false)}
              >
                {LL.CANCEL()}
              </Button>
            </Dialog.Actions>
          </Dialog>
        </LocationPicker>
        <View
          style={{
            flexDirection: "row",
            alignSelf: "center",
            gap: 8,
            marginVertical: 8,
          }}
        >
          <Button
            buttonColor={theme.colors.primary}
            textColor={theme.colors.onPrimary}
            onPress={() => {
              if (markerPosition.latitude === 0) {
                setIsLocationNotPickedDialogVisible(true);
                return;
              }
              sheet.current?.dismiss();
            }}
          >
            Confirm
          </Button>
          <Button
            textColor={theme.colors.onTertiary}
            buttonColor={theme.colors.tertiary}
            onPress={() => {
              if (markerPosition.latitude === 0) {
                setIsLocationNotPickedDialogVisible(true);
                return;
              }
              sheet.current?.dismiss();
            }}
          >
            Cancel
          </Button>
        </View>
      </TrueSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
