import type { Themes } from "@/lib/stores/themeStore";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable } from "react-native";
import { useTheme } from "react-native-paper";
import * as d3 from "d3-interpolate";
import Svg, { Path } from "react-native-svg";

interface ThemeToggleProps {
  currentTheme: Themes;
  setTheme: (theme: Themes) => void;
}

// Just the main shapes for morphing
const sunCirclePath =
  "M 12 7 C 10.674 7 9.402 7.527 8.464 8.464 C 7.527 9.402 7 10.674 7 12 C 7 13.326 7.527 14.598 8.464 15.536 C 9.402 16.473 10.674 17 12 17 C 13.326 17 14.598 16.473 15.536 15.536 C 16.473 14.598 17 13.326 17 12 C 17 10.674 16.473 9.402 15.536 8.464 C 14.598 7.527 13.326 7 12 7 Z";

const moonPath =
  "M21 12.79C20.151 13.142 19.2312 13.3333 18.25 13.3333C14.3918 13.3333 11.25 10.1915 11.25 6.33333C11.25 5.35113 11.4413 4.43127 11.7933 3.58228C8.57286 4.58842 6.25 7.568 6.25 11C6.25 15.0041 9.49594 18.25 13.5 18.25C16.932 18.25 19.9116 15.9271 20.9177 12.7067C21.0875 12.8082 21.0875 12.8082 21 12.79Z";

// Individual ray paths for separate morphing
const sunRays = [
  "M 12 1 L 12 3", // top
  "M 12 21 L 12 23", // bottom
  "M 4.22 4.22 L 5.64 5.64", // top-left
  "M 18.36 18.36 L 19.78 19.78", // bottom-right
  "M 1 12 L 3 12", // left
  "M 21 12 L 23 12", // right
  "M 4.22 19.78 L 5.64 18.36", // bottom-left
  "M 18.36 5.64 L 19.78 4.22", // top-right
];

// Collapsed ray positions (all converge to moon center)
const moonRayCollapsed = [
  "M 13.5 13.5 L 13.5 13.5", // collapsed to moon center
  "M 13.5 13.5 L 13.5 13.5",
  "M 13.5 13.5 L 13.5 13.5",
  "M 13.5 13.5 L 13.5 13.5",
  "M 13.5 13.5 L 13.5 13.5",
  "M 13.5 13.5 L 13.5 13.5",
  "M 13.5 13.5 L 13.5 13.5",
  "M 13.5 13.5 L 13.5 13.5",
];

export default function ThemeToggle({
  currentTheme,
  setTheme,
}: ThemeToggleProps) {
  const theme = useTheme();

  const mainInterpolator = useRef(
    d3.interpolateString(sunCirclePath, moonPath),
  ).current;

  const rayInterpolators = useRef(
    sunRays.map((sunRay, i) =>
      d3.interpolateString(sunRay, moonRayCollapsed[i]),
    ),
  ).current;

  const [progress, setProgress] = useState(currentTheme === "light" ? 0 : 1);
  const [mainPath, setMainPath] = useState(mainInterpolator(progress));
  const [rayPaths, setRayPaths] = useState(
    rayInterpolators.map((interpolator) => interpolator(progress)),
  );

  const animationRef = useRef<number | null>(null);

  const animateTo = useCallback(
    (target: number) => {
      const duration = 300;
      const frameRate = 1000 / 60;
      const steps = duration / frameRate;
      const delta = (target - progress) / steps;
      let current = progress;

      function stepFn() {
        current += delta;
        const done =
          (delta > 0 && current >= target) || (delta < 0 && current <= target);
        if (done) {
          current = target;
        }

        try {
          const interpolatedMain = mainInterpolator(current);
          setMainPath(interpolatedMain);

          const interpolatedRays = rayInterpolators.map((interpolator) =>
            interpolator(current),
          );
          setRayPaths(interpolatedRays);

          setProgress(current);
        } catch (e) {
          console.warn("Interpolation error", e);
        }

        if (!done) {
          animationRef.current = requestAnimationFrame(stepFn);
        }
      }

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      animationRef.current = requestAnimationFrame(stepFn);
    },
    [mainInterpolator, rayInterpolators, progress],
  );

  useEffect(() => {
    animateTo(currentTheme === "light" ? 0 : 1);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [currentTheme, animateTo]);

  return (
    <Pressable
      onPress={() => setTheme(currentTheme === "light" ? "dark" : "light")}
    >
      <Svg width={24} height={24} viewBox="0 0 24 24">
        {rayPaths.map((rayPath, index) => (
          <Path
            key={index}
            d={rayPath}
            stroke={theme.colors.primary}
            strokeWidth={1.5}
            strokeLinecap="round"
            fill="none"
          />
        ))}

        <Path d={mainPath} fill={theme.colors.primary} />
      </Svg>
    </Pressable>
  );
}
