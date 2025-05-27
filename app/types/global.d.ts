import { SvgProps } from "react-native-svg";
export {};

declare global {
  type JWTPayload = {
    accessToken: string;
    refreshToken: string;
  };

  type User = {
    id: string;
    email: string;
    emailVerified: Date | null;
    createdAt: Date;
    updatedAt: Date;
    hasPassword: boolean;
  };

  type Profile = {
    firstName: string;
    lastName: string;
    bio: string | null;
    image: string;
    imageBlurHash: string | null;
    createdAt: Date;
    updatedAt: Date;
  };

  type Role = "AGENT" | "CLIENT" | "ADMIN";

  type LocationType = {
    x: number;
    y: number;
  };

  type SuccessfulResponse<T> = {
    message: string;
    data: T;
  };

  type ErrorResponse = {
    requestId: string;
    message: string;
  };

  type Property = {
    id: number;
    title: string;
    description: string;
    price: number;
    type: "HOUSE" | "APARTMENT" | "LAND" | "HOUSE" | "COASTAL" | "COMMERCIAL";
    status: "AVAILABLE" | "RENTED" | "SOLD";
    area: number;
    rooms: number;
    isPublished: boolean;
    isFeatured: boolean;
    thumbnailURL: string;
    location: LocationType;
    userId: string;
  };

  type PropertyMedia = {
    id: number;
    propertyId: Property["id"];
    url: string;
    type: "IMAGE" | "VIDEO";
    mimeType: string;
  };

  declare module "*.svg" {
    const content: React.FC<SvgProps>;
    export default content;
  }
}
