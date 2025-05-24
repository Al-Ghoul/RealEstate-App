import { useQuery } from "@tanstack/react-query";
import { xiorInstance } from "../fetcher";

export const usePropertyMedia = (id: PropertyMedia["id"]) =>
  useQuery<PropertyMedia[]>({
    queryKey: [
      "property-media",
      {
        id,
      },
    ],
    queryFn: () =>
      xiorInstance.get(`/properties/${id}/media`).then((res) => res.data.data),
  });

export const useProperty = (id: Property["id"]) =>
  useQuery<Property>({
    queryKey: [
      "property",
      {
        id,
      },
    ],
    queryFn: () =>
      xiorInstance.get("/properties/" + id).then((res) => res.data.data),
  });
