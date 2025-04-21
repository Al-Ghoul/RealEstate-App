import { useQuery } from "@tanstack/react-query";
import { xiorInstance } from "../fetcher";

export const useCurrentUser = () => {
  return useQuery<User>({
    queryKey: ["currentUser"],
    queryFn: () => xiorInstance.get("/auth/me").then((res) => res.data.data),
  });
};
