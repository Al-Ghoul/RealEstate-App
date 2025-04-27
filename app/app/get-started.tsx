import { Redirect, router } from "expo-router";
import { useColorScheme } from "nativewind";
import { Image } from "react-native";
import Onboarding from "react-native-onboarding-swiper";
import * as SecureStore from "expo-secure-store";

export default function GetStarted() {
  const { colorScheme } = useColorScheme();
  const readOnboarding = SecureStore.getItem("readOnboarding") === "true";

  if (readOnboarding) return <Redirect href="/login" />;

  const done = () => {
    SecureStore.setItemAsync("readOnboarding", "true");
    router.replace("/login");
  };

  return (
    <Onboarding
      onSkip={done}
      onDone={done}
      pages={[
        {
          backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
          image: <Image source={require("../assets/intro/step1.png")} />,
          title: "سئمت من الوسطاء و أسعارهم؟",
          subtitle: "مكانك الجديد في انتظارك. لا وسطاء، لا هراء.",
          titleStyles: {
            fontFamily: "LemonBrush",
          },
        },
        {
          backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
          image: <Image source={require("../assets/intro/step2.png")} />,
          title: "جد مكانك، المثالي.",
          subtitle:
            "استأجر، اشترِ، أو بع - اكتشف أماكن تناسب حياتك. لا ضغوط، فقط خيارات ذكية.",
          titleStyles: {
            fontFamily: "LemonBrush",
          },
        },
        {
          backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
          image: <Image source={require("../assets/intro/step3.png")} />,
          title: "بع بطريقة ذكية، و وفر جهود الدعاية.",
          subtitle:
            "احصل على أفضل سعر لمنزلك دون أي ضغوط. نحن نتولى المهمة - و أنت تحصل علي مالك.",
          titleStyles: {
            fontFamily: "LemonBrush",
          },
        },
        {
          backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
          image: <Image source={require("../assets/intro/step2.png")} />,
          title: "إنسي الوسطاء و حافظ علي ربحك بالكامل",
          subtitle: "لا يوجد وسطاء ولا سمسرة.",
          titleStyles: {
            fontFamily: "LemonBrush",
          },
        },
      ]}
    />
  );
}
