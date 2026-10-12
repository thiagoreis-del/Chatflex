import { z } from "zod";

// Mensagens são chaves de tradução do namespace `auth`.
const email = z
  .string()
  .trim()
  .min(1, "validation.emailRequired")
  .max(255)
  .email("validation.emailInvalid");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "validation.passwordRequired").max(128),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const forgotSchema = z.object({ email });
export type ForgotValues = z.infer<typeof forgotSchema>;

export const resetSchema = z
  .object({
    password: z.string().min(8, "validation.passwordMin").max(128),
    confirm: z.string().min(1, "validation.passwordRequired"),
  })
  .refine((v) => v.password === v.confirm, {
    message: "validation.passwordMismatch",
    path: ["confirm"],
  });
export type ResetValues = z.infer<typeof resetSchema>;
