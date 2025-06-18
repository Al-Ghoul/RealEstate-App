import { router, useFocusEffect } from "expo-router";
import { Image } from "react-native";
import Onboarding from "react-native-onboarding-swiper";
import * as SecureStore from "expo-secure-store";
import { useTheme } from "react-native-paper";
import { useI18nContext } from "@/i18n/i18n-react";

export default function GetStartedScreen() {
  const readIntro = SecureStore.getItem("readIntro") === "true";
  const theme = useTheme();
  const { LL, locale } = useI18nContext();

  useFocusEffect(() => {
    if (readIntro) router.replace("/login");
  });

  const done = () => {
    SecureStore.setItemAsync("readIntro", "true");
    router.replace("/login");
  };

  return (
    <Onboarding
      onSkip={done}
      onDone={done}
      skipLabel={LL.SKIP_LABEL()}
      allowFontScaling
      nextLabel={LL.NEXT_LABEL()}
      titleStyles={{
        fontFamily: locale === "ar" ? "LemonBrush" : "Knewave",
      }}
      imageContainerStyles={{
        paddingBottom: 0,
      }}
      pages={[
        {
          backgroundColor: theme.colors.background,
          image: <Image source={require("../assets/intro/step1.png")} />,
          title: LL.FIRST_BOARDING_PAGE_TITLE(),
          subtitle: LL.FIRST_BOARDING_PAGE_DESCRIPTION(),
        },
        {
          backgroundColor: theme.colors.background,
          image: <Image source={require("../assets/intro/step2.png")} />,
          title: LL.SECOND_BOARDING_PAGE_TITLE(),
          subtitle: LL.SECOND_BOARDING_PAGE_DESCRIPTION(),
        },
        {
          backgroundColor: theme.colors.background,
          image: <Image source={require("../assets/intro/step3.png")} />,
          title: LL.THIRD_BOARDING_PAGE_TITLE(),
          subtitle: LL.THIRD_BOARDING_PAGE_DESCRIPTION(),
        },
        {
          backgroundColor: theme.colors.background,
          image: <Image source={require("../assets/intro/step2.png")} />,
          title: LL.FOUTRTH_BOARDING_PAGE_TITLE(),
          subtitle: LL.FOUTRTH_BOARDING_PAGE_DESCRIPTION(),
        },
      ]}
    />
  );
}
