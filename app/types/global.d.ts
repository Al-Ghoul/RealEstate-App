export {};

declare global {
  type JWTPayload = {
    accessToken: string;
    refreshToken: string;
  };

  type User = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    image: string;
    emailVerified: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
}
