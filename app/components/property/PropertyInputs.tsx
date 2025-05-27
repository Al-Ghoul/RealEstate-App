import { useI18nContext } from "@/i18n/i18n-react";
import {
  Controller,
  useFormState,
  useWatch,
  type Control,
  type FieldValues,
} from "react-hook-form";
import { StyleSheet, View } from "react-native";
import ControlledInput from "../ControlledInput";
import { useTheme, Text, Checkbox, Button, Dialog } from "react-native-paper";
import { Dropdown } from "react-native-paper-dropdown";
import { useRef, useState, type ReactNode } from "react";
import * as ImagePicker from "expo-image-picker";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { SafeAreaView } from "react-native-safe-area-context";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import LocationPicker from "../LocationPicker";
import type { CreatePropertyDTO } from "@/lib/dtos";

interface PropertyInputsProps<T extends FieldValues> {
  control: Control<T>;
  submitButton: ReactNode;
}

export default function PropertyInputs({
  control,
  submitButton,
}: PropertyInputsProps<CreatePropertyDTO>) {
  const theme = useTheme();
  const { LL, locale } = useI18nContext();
  const forceRTL = locale === "ar";
  const [propertyTypes] = useState([
    { label: LL.APARTMENT_LABEL(), value: "APARTMENT" },
    { label: LL.HOUSE_LABEL(), value: "HOUSE" },
    { label: LL.LAND_LABEL(), value: "LAND" },
    { label: LL.COASTAL(), value: "COASTAL" },
    { label: LL.COMMERCIAL_LABEL(), value: "COMMERCIAL" },
  ]);

  const [propertyStatuses] = useState([
    { label: LL.AVAILABLE_LABEL(), value: "AVAILABLE" },
    { label: LL.RENTED_LABEL(), value: "RENTED" },
    { label: LL.SOLD_LABEL(), value: "SOLD" },
  ]);
  const sheet = useRef<TrueSheet>(null);
  const { errors } = useFormState<CreatePropertyDTO>({
    control,
  });
  const values = useWatch<CreatePropertyDTO>({
    control,
  });
  const [
    isLocationNotPickedDialogVisible,
    setIsLocationNotPickedDialogVisible,
  ] = useState(false);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
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
          multiline
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

        <ControlledInput
          control={control}
          name="rooms"
          id="rooms"
          placeholder={LL.ROOMS_COUNT()}
          keyboardType="numeric"
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
          name="area"
          id="area"
          placeholder={LL.AREA()}
          keyboardType="numeric"
          style={{
            width: "100%",
            borderWidth: 1,
            borderColor: theme.colors.primary,
            borderRadius: 8,
            padding: 8,
          }}
        />

        <Controller
          control={control}
          name="type"
          render={({ field: { onChange, value } }) => (
            <Dropdown
              label={LL.PROPERTY_TYPE()}
              options={propertyTypes}
              value={value}
              onSelect={onChange}
            />
          )}
        />
        {errors.type && (
          <Text style={{ color: theme.colors.error, alignSelf: "center" }}>
            {errors.type.message}
          </Text>
        )}

        <Controller
          control={control}
          name="status"
          render={({ field: { onChange, value } }) => (
            <Dropdown
              label={LL.PROPERTY_STATUS()}
              options={propertyStatuses}
              value={value}
              onSelect={onChange}
            />
          )}
        />
        {errors.status && (
          <Text style={{ color: theme.colors.error, alignSelf: "center" }}>
            {errors.status.message}
          </Text>
        )}

        <View
          style={{
            flexDirection: "row",
            gap: 8,
            justifyContent: "space-around",
          }}
        >
          <View style={{ gap: 8 }}>
            <Controller
              control={control}
              name="thumbnail"
              render={({ field: { onChange, value } }) => (
                <Button
                  buttonColor={theme.colors.secondary}
                  textColor={theme.colors.onSecondary}
                  onPress={async () => {
                    const result = await ImagePicker.launchImageLibraryAsync({
                      mediaTypes: ["images"],
                      allowsEditing: true,
                      quality: 1,
                    });

                    if (!result.canceled) {
                      onChange({
                        uri: result.assets[0].uri,
                        name: result.assets[0].fileName,
                        type: result.assets[0].mimeType,
                      });
                    }
                  }}
                  icon={() => (
                    <FontAwesome6
                      name="image"
                      size={16}
                      color={theme.colors.onSecondary}
                    />
                  )}
                >
                  {value ? LL.PICKED_A_THUMBNAIL() : LL.PICK_A_THUMBNAIL()}
                </Button>
              )}
            />
            {errors.thumbnail && (
              <Text style={{ color: theme.colors.error, alignSelf: "center" }}>
                {errors.thumbnail.message}
              </Text>
            )}
          </View>

          <View style={{ gap: 8 }}>
            <Button
              onPress={() => sheet.current?.present()}
              buttonColor={theme.colors.secondary}
              textColor={theme.colors.onSecondary}
              icon={() => (
                <FontAwesome6
                  name="map-location"
                  size={16}
                  color={theme.colors.onSecondary}
                />
              )}
            >
              {values.location ? LL.PICKED_A_LOCATION() : LL.PICK_A_LOCATION()}
            </Button>
            {errors.location && (
              <Text style={{ color: theme.colors.error, alignSelf: "center" }}>
                {errors.location.message}
              </Text>
            )}
          </View>
        </View>

        <View
          style={{
            flexDirection: forceRTL ? "row-reverse" : "row",
            alignItems: "center",
            alignSelf: "center",
          }}
        >
          <Text>{LL.SHOULD_PUBLISH()}</Text>
          <Controller
            control={control}
            name="isPublished"
            render={({ field: { onChange, value } }) => (
              <Checkbox
                status={value ? "checked" : "unchecked"}
                onPress={() => {
                  onChange(!value);
                }}
              />
            )}
          />
        </View>

        {submitButton}
      </View>

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
        <Controller
          control={control}
          name="location"
          render={({ field: { onChange, value } }) => (
            <LocationPicker markerPosition={value} setMarkerPosition={onChange}>
              <Dialog visible={isLocationNotPickedDialogVisible}>
                <Dialog.Title
                  style={{ textAlign: forceRTL ? "right" : "left" }}
                >
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
          )}
        />

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
              {
                if (!values.location) {
                  setIsLocationNotPickedDialogVisible(true);
                  return;
                }
              }
              sheet.current?.dismiss();
            }}
          >
            {LL.CONFIRM_LABEL()}
          </Button>
          <Button
            textColor={theme.colors.onTertiary}
            buttonColor={theme.colors.tertiary}
            onPress={() => setIsLocationNotPickedDialogVisible(true)}
          >
            {LL.CANCEL()}
          </Button>
        </View>
      </TrueSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
