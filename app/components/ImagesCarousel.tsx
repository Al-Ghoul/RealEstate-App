import { useRef } from "react";
import {
  Dimensions,
  ImageStyle,
  StyleProp,
  ImageSourcePropType,
} from "react-native";
import Animated from "react-native-reanimated";
import type {
  CarouselRenderItem,
  ICarouselInstance,
} from "react-native-reanimated-carousel";
import Carousel from "react-native-reanimated-carousel";

export default function ImagesCarousel() {
  const ref = useRef<ICarouselInstance>(null);
  const { width, height } = Dimensions.get("screen");

  return (
    <Carousel
      ref={ref}
      data={images}
      autoPlay
      loop={true}
      height={height / 3}
      pagingEnabled={true}
      snapEnabled={true}
      width={width - 64}
      style={{
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
      }}
      mode={"horizontal-stack"}
      modeConfig={{
        snapDirection: "left",
        stackInterval: 18,
      }}
      customConfig={() => ({ type: "positive", viewCount: 4 })}
      renderItem={renderItem()}
    />
  );
}

interface Options {
  style?: StyleProp<ImageStyle>;
}

const renderItem =
  ({ style }: Options = {}): CarouselRenderItem<any> =>
  ({ item }: { item: { source: ImageSourcePropType | undefined } }) => {
    return (
      <Animated.View className="flex-1">
        <Animated.Image
          style={[style]}
          className="w-full h-full rounded-md"
          source={item.source}
          resizeMode="cover"
        />
      </Animated.View>
    );
  };

const images = [
  {
    source: require("../assets/images/intro/ronnie-george-9gGvNWBeOq4-unsplash.jpg"),
  },
  {
    source: require("../assets/images/intro/sean-pollock-PhYq704ffdA-unsplash.jpg"),
  },
  {
    source: require("../assets/images/intro/webaliser-_TPTXZd9mOo-unsplash.jpg"),
  },
  {
    source: require("../assets/images/intro/zac-gudakov-wwqZ8CM21gg-unsplash.jpg"),
  },
];
