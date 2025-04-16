export {};

declare global {
  type JWTPayload = {
    accessToken: string;
    refreshToken: string;
  };
}
