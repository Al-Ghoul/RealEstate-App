import { useColorScheme } from "nativewind";
import ContentLoader, {
  Rect,
  IContentLoaderProps,
} from "react-content-loader/native";

export const ProfileSkeleton = (props: IContentLoaderProps) => {
  const { colorScheme } = useColorScheme();
  return (
    <ContentLoader
      speed={1}
      backgroundColor={colorScheme === "light" ? "#000" : "#fff"}
      foregroundColor={"#999"}
      {...props}
    >
      <Rect width={96} height={96} fill="#fff" rx={48} />
      <Rect width={96} height={9} y={105} fill="#D9D9D9" rx={4.5} />
    </ContentLoader>
  );
};
