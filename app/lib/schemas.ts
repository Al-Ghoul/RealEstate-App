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
