import { Image } from "expo-image";
import { useCurrentUserProfile } from "@/lib/queries/user";

export default function ProfileImage() {
  const currentUserProfile = useCurrentUserProfile(true);

  if (currentUserProfile.isLoading || !currentUserProfile.data) return null;

  return (
    <Image
      placeholder={{ blurhash: currentUserProfile.data.imageBlurHash }}
      source={currentUserProfile.data.image}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 50,
      }}
      transition={500}
    />
  );
}
