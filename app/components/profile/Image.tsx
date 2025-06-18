import { Image, type ImageStyle } from "expo-image";
import type { StyleProp } from "react-native";

export default function ProfileImage({
  source,
  blurHash,
  style,
}: {
  source: string | { uri: string };
  blurHash?: string;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      placeholder={{ blurhash: blurHash }}
      source={source}
      style={[
        {
          width: "100%",
          height: "100%",
          borderRadius: 50,
        },
        style,
      ]}
      transition={500}
    />
  );
}
