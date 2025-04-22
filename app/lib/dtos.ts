import { z } from "zod";

export const loginInputDTO = z.object({
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

export type LoginInputDTO = z.infer<typeof loginInputDTO>;

export const registerInputDTO = loginInputDTO
  .extend({
    password: z.string({
      required_error: "Password is required",
      invalid_type_error: "Password must be a string",
    }),
    confirmPassword: z.string({
      required_error: "Confirm password is required",
      invalid_type_error: "Confirm password must be a string",
    }),
    firstName: z.string({
      required_error: "First name is required",
      invalid_type_error: "First name must be a string",
    }),
    lastName: z.string({
      required_error: "Last name is required",
      invalid_type_error: "Last name must be a string",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInputDTO = z.infer<typeof registerInputDTO>;

export const updateProfileInputDTO = z.object({
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
});

export type UpdateProfileInputDTO = z.infer<typeof updateProfileInputDTO>;

export const changePasswordInputDTO = z
  .object({
    currentPassword: z.string(),
    newPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" })
      .max(255, { message: "Password must be less than 255 characters long" })
      .regex(/^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/, {
        message:
          "Password must only contain letters, numbers, and special characters",
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordInputDTO = z.infer<typeof changePasswordInputDTO>;

export const setPasswordInputDTO = z
  .object({
    newPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" })
      .max(255, { message: "Password must be less than 255 characters long" })
      .regex(/^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/, {
        message:
          "Password must only contain letters, numbers, and special characters",
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SetPasswordInputDTO = z.infer<typeof setPasswordInputDTO>;

export const verifyInputDTO = z.object({
  code: z
    .string()
    .regex(/^[a-zA-Z0-9]{3}-[a-zA-Z0-9]{3}$/)
    .transform((code) => code.toUpperCase()),
});

export type VerifyInputDTO = z.infer<typeof verifyInputDTO>;
