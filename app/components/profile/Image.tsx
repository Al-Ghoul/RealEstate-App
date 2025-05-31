import { Image } from "expo-image";

export default function ProfileImage({
  source,
  blurHash,
}: {
  source: string;
  blurHash?: string;
}) {
  return (
    <Image
      placeholder={{ blurhash: blurHash }}
      source={source}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 50,
      }}
      transition={500}
    />
  );
}
