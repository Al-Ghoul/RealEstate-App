import type { TranslationFunctions } from "@/i18n/i18n-types";
import { z } from "zod";

export function configureZodI18n(L: TranslationFunctions) {
  const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
    switch (issue.code) {
      case z.ZodIssueCode.custom:
        if (issue.path[0] === "confirmPassword") {
          return { message: L.PASSWORDS_DO_NOT_MATCH() };
        } else if (issue.path[0] === "price") {
          return { message: L.PRICE_MUST_BE_A_VALID_DECIMAL() };
        } else if (issue.path[0] === "rooms") {
          return { message: L.ROOMS_MUST_BE_A_VALID_INTEGER() };
        } else if (issue.path[0] === "area") {
          return { message: L.AREA_MUST_BE_A_VALID_DECIMAL() };
        }
        break;

      case z.ZodIssueCode.invalid_type:
        if (issue.path[0] === "code") {
          return { message: L.CODE_IS_REQUIRED() };
        } else {
          return { message: L.FIELD_IS_REQUIED() };
        }

      case z.ZodIssueCode.invalid_string:
        if (issue.validation === "email") {
          return { message: L.INVALID_EMAIL() };
        } else if (issue.validation === "regex" && issue.path[0] === "code") {
          return { message: L.INVALID_CODE() };
        }
        break;

      case z.ZodIssueCode.too_big:
        if (issue.path[0] === "firstName") {
          return {
            message: L.FIRST_NAME_TOO_LONG({ max: Number(issue.maximum) }),
          };
        }

        if (issue.path[0] === "lastName") {
          return {
            message: L.LAST_NAME_TOO_LONG({ max: Number(issue.maximum) }),
          };
        }
        break;

      case z.ZodIssueCode.too_small:
        if (issue.path[0] === "firstName") {
          return {
            message: L.FIRST_NAME_TOO_SHORT({ min: Number(issue.minimum) }),
          };
        }

        if (issue.path[0] === "lastName") {
          return {
            message: L.LAST_NAME_TOO_SHORT({ min: Number(issue.minimum) }),
          };
        }

        if (
          issue.path[0] === "password" ||
          issue.path[0] === "confirmPassword" ||
          issue.path[0] === "currentPassword"
        ) {
          return {
            message: L.PASSWORD_TOO_SHORT({ min: Number(issue.minimum) }),
          };
        }
        break;

      default:
        return { message: ctx.defaultError };
    }

    return { message: ctx.defaultError };
  };

  z.setErrorMap(customErrorMap);
}

export const loginDTO = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
  })
  .strict();

const baseDTO = loginDTO
  .extend({
    confirmPassword: z.string().min(8),
    firstName: z.string().min(2).max(16),
    lastName: z.string().min(2).max(16),
  })
  .strict();

export const registerDTO = baseDTO.refine(
  (data) => data.password === data.confirmPassword,
  {
    path: ["confirmPassword"],
  },
);

export const updateEmailDTO = loginDTO
  .pick({
    email: true,
  })
  .strict();

export const updateProfileDTO = baseDTO
  .pick({
    firstName: true,
    lastName: true,
  })
  .extend({
    bio: z.string().max(255).optional(),
  })
  .strict();

export const changePasswordDTO = baseDTO
  .pick({ password: true, confirmPassword: true })
  .extend({
    currentPassword: z.string().min(8),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
  });

export const setPasswordDTO = baseDTO
  .pick({
    password: true,
    confirmPassword: true,
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
  });

export const verifyDTO = z
  .object({
    code: z
      .string()
      .regex(/^[a-zA-Z0-9]{3}-[a-zA-Z0-9]{3}$/)
      .transform((code) => code.toUpperCase()),
  })
  .strict();

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

export const requestPasswordResetDTO = baseDTO
  .pick({
    email: true,
  })
  .strict();

export const resetPasswordDTO = baseDTO
  .pick({
    password: true,
    confirmPassword: true,
  })
  .merge(verifyDTO)
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
  });

const imageSchema = z.object({
  uri: z.string().url(),
  type: z.string().regex(/^image\/(jpeg|png|jpg|gif)$/),
  name: z.string().min(1),
});

export const createPropertyDTO = z.object({
  title: z.string(),
  description: z.string(),
  price: z.string().refine((val) => /^-?\d+(\.\d+)?$/.test(val)),
  rooms: z.string().refine((val) => /^-?\d+$/.test(val)),
  area: z.string().refine((val) => /^-?\d+(\.\d+)?$/.test(val)),
  type: z.enum(["HOUSE", "APARTMENT", "LAND", "COASTAL", "COMMERCIAL"]),
  status: z.enum(["AVAILABLE", "RENTED", "SOLD"]),
  location: z.object({
    x: z.number(),
    y: z.number(),
  }),
  thumbnail: imageSchema.or(z.string().url()),
  isPublished: z.boolean(),
});

export type LoginDTO = z.infer<typeof loginDTO>;
export type RegisterDTO = z.infer<typeof registerDTO>;
export type UpdateProfileDTO = z.infer<typeof updateProfileDTO>;
export type UpdateEmailDTO = z.infer<typeof updateEmailDTO>;
export type ChangePasswordDTO = z.infer<typeof changePasswordDTO>;
export type SetPasswordDTO = z.infer<typeof setPasswordDTO>;
export type VerifyDTO = z.infer<typeof verifyDTO>;
export type LinkAccountDTO = z.infer<typeof linkAccountDTO>;
export type RequestPasswordResetDTO = z.infer<typeof requestPasswordResetDTO>;
export type ResetPasswordDTO = z.infer<typeof resetPasswordDTO>;
export type CreatePropertyDTO = z.infer<typeof createPropertyDTO>;
