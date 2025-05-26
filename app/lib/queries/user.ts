import { useMutation, useQuery } from "@tanstack/react-query";
import { xiorInstance } from "../fetcher";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useRef } from "react";

export const useCurrentUser = () =>
  useQuery<User>({
    queryKey: ["currentUser"],
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: () => xiorInstance.get("/users/me").then((res) => res.data.data),
  });

export const useCurrentUserProfile = () =>
  useQuery<Profile>({
    queryKey: ["currentUserProfile"],
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: () =>
      xiorInstance.get("/users/me/profile").then((res) => res.data.data),
  });

export const useUserAccounts = () =>
  useQuery({
    queryKey: ["accounts"],
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async () =>
      xiorInstance.get("/auth/me/accounts").then((res) => res.data.data),
  });

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
