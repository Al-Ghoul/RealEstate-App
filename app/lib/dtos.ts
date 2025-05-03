import { z } from "zod";

export const loginDTO = z.object({
  email: z
    .string({
      required_error: "Email is required",
      invalid_type_error: "Email must be a string",
    })
    .email(),
  password: z
    .string({
      required_error: "Password is required",
      invalid_type_error: "Password must be a string",
    })
    .min(8, "Password must be at least 8 characters"),
});

const baseDTO = loginDTO.extend({
  confirmPassword: z
    .string({
      required_error: "Confirm password is required",
      invalid_type_error: "Confirm password must be a string",
    })
    .min(8, "Password must be at least 8 characters"),
  firstName: z.string({
    required_error: "First name is required",
    invalid_type_error: "First name must be a string",
  }),
  lastName: z.string({
    required_error: "Last name is required",
    invalid_type_error: "Last name must be a string",
  }),
});

export const registerDTO = baseDTO.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  },
);

export const updateEmailDTO = loginDTO.pick({
  email: true,
});

export const updateProfileDTO = z.object({
  firstName: z.string(),
  lastName: z.string(),
  bio: z.string().optional(),
});

export const changePasswordDTO = baseDTO
  .pick({ password: true, confirmPassword: true })
  .extend({
    currentPassword: z
      .string()
      .min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const setPasswordDTO = baseDTO
  .pick({
    password: true,
    confirmPassword: true,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const verifyDTO = z.object({
  code: z
    .string()
    .regex(/^[a-zA-Z0-9]{3}-[a-zA-Z0-9]{3}$/)
    .transform((code) => code.toUpperCase()),
});

export const linkAccountDTO = z.discriminatedUnion("provider", [
  z.object({
    provider: z.literal("google"),
    idToken: z.string(),
  }),
  z.object({
    provider: z.literal("facebook"),
    accessToken: z.string(),
  }),
]);

export type LoginDTO = z.infer<typeof loginDTO>;
export type RegisterDTO = z.infer<typeof registerDTO>;
export type UpdateProfileDTO = z.infer<typeof updateProfileDTO>;
export type UpdateEmailDTO = z.infer<typeof updateEmailDTO>;
export type ChangePasswordDTO = z.infer<typeof changePasswordDTO>;
export type SetPasswordDTO = z.infer<typeof setPasswordDTO>;
export type VerifyDTO = z.infer<typeof verifyDTO>;
export type LinkAccountDTO = z.infer<typeof linkAccountDTO>;
