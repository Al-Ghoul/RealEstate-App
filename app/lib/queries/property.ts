import { useQuery } from "@tanstack/react-query";
import { xiorInstance } from "../fetcher";
import { useIsFocused } from "@react-navigation/native";
import { useAuthStore } from "../stores/authStore";

export const usePropertyMedia = (id: PropertyMedia["id"]) => {
  const isFocused = useIsFocused();
  const session = useAuthStore((state) => state.session);
  const query = useQuery<PropertyMedia[]>({
    queryKey: [
      "property-media",
      {
        id,
      },
    ],
    queryFn: () =>
      xiorInstance.get(`/properties/${id}/media`).then((res) => res.data.data),
    enabled: isFocused && !!session,
    subscribed: isFocused && !!session,
  });

  return query;
};
export const useProperty = (id: Property["id"]) => {
  const isFocused = useIsFocused();
  const session = useAuthStore((state) => state.session);
  const query = useQuery<Property>({
    queryKey: [
      "property",
      {
        id,
      },
    ],
    queryFn: () =>
      xiorInstance.get("/properties/" + id).then((res) => res.data.data),
    enabled: isFocused && !!session,
    subscribed: isFocused && !!session,
  });

  return query;
};
