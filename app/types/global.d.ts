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

  declare module "*.svg" {
    const content: React.FC<SvgProps>;
    export default content;
  }
}
