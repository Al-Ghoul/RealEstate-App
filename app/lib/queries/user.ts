import { useQuery } from "@tanstack/react-query";
import { xiorInstance } from "../fetcher";

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
