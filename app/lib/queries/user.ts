import { useMutation, useQuery } from "@tanstack/react-query";
import { xiorInstance } from "../fetcher";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useRef } from "react";
import { useIsFocused } from "@react-navigation/native";
import { useAuthStore } from "../stores/authStore";

export const useCurrentUser = () => {
  const isFocused = useIsFocused();
  const session = useAuthStore((state) => state.session);
  const query = useQuery<User>({
    queryKey: ["currentUser"],
    gcTime: Infinity,
    queryFn: () => xiorInstance.get("/users/me").then((res) => res.data.data),
    subscribed: isFocused && !!session,
    enabled: isFocused && !!session,
  });

  return query;
};

export const useCurrentUserProfile = (enable: boolean = false) => {
  const isFocused = useIsFocused();
  const session = useAuthStore((state) => state.session);
  const query = useQuery<Profile>({
    queryKey: ["currentUserProfile"],
    gcTime: Infinity,
    queryFn: () =>
      xiorInstance.get("/users/me/profile").then((res) => res.data.data),
    subscribed: (isFocused && !!session) || enable,
    enabled: (isFocused && !!session) || enable,
  });

  return query;
};

export const useUserAccounts = () => {
  const isFocused = useIsFocused();
  const session = useAuthStore((state) => state.session);
  const query = useQuery({
    queryKey: ["accounts"],
    gcTime: Infinity,
    queryFn: async () =>
      xiorInstance.get("/auth/me/accounts").then((res) => res.data.data),
    subscribed: isFocused && !!session,
    enabled: isFocused && !!session,
  });

  return query;
};

export const useUploadUserProfileImage = () => {
  const abortControllerRef = useRef<AbortController | null>(null);

  const mutation = useMutation({
    mutationKey: ["profileImage"],
    mutationFn: async (image: ImagePicker.ImagePickerAsset | null) => {
      if (abortControllerRef.current) abortControllerRef.current.abort();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        await new Promise<void>((_, reject) => {
          controller.signal.addEventListener("abort", () => {
            reject(new Error("UPLOAD_CANCELLED"));
          });
        });

        if (!image || !image.uri || !image.mimeType || !image.fileName)
          throw new Error("Invalid image");

        const formData = new FormData();
        formData.append("image", {
          uri: image.uri,
          type: image.mimeType,
          name: image.fileName,
        } as unknown as Blob);

        const res = await xiorInstance.put(
          "/users/me/profile/image",
          formData,
          { signal: controller.signal },
        );

        return res.data;
      } catch (error) {
        throw error;
      }
    },
    onSettled: () => {
      abortControllerRef.current = null;
    },
  });

  const cancel = useCallback(() => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
  }, []);

  return {
    ...mutation,
    cancel,
    isCancelled: mutation.error?.message === "UPLOAD_CANCELLED",
  };
};
