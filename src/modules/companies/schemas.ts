import { z } from "zod";
import { isValidCpfOrCnpj, normalizeDocument } from "@/shared/validation/document";
import { companyStatuses } from "./types";

// Mensagens são chaves de tradução do namespace `validation` em common.
const req = (max = 200) =>
  z.string().trim().min(1, "validation.required").max(max, "validation.tooLong");
const int = (min = 0) =>
  z.coerce
    .number({ message: "validation.number" })
    .int("validation.integer")
    .min(min, "validation.min");
const phone = z
  .string()
  .trim()
  .max(20, "validation.tooLong")
  .regex(/^[+\d\s()-]*$/, "validation.phone");

export const companyBaseSchema = z.object({
  legalName: req(),
  tradeName: req(),
  document: z
    .string()
    .trim()
    .refine(isValidCpfOrCnpj, "validation.document")
    .transform(normalizeDocument),
  email: z.string().trim().min(1, "validation.required").max(255).email("validation.email"),
  phone: phone.min(8, "validation.phone"),
  responsibleName: req(),
  planId: z.string().min(1, "validation.required"),
  trialDays: int(0).max(365, "validation.max"),
  userLimit: int(1),
  connectionLimit: int(0),
  storageLimitMb: int(0),
  status: z.enum(companyStatuses as [string, ...string[]]),
  internalNotes: z.string().trim().max(2000, "validation.tooLong"),
});

export const createCompanySchema = companyBaseSchema.extend({
  firstAdmin: z.object({
    name: req(),
    email: z.string().trim().min(1, "validation.required").max(255).email("validation.email"),
    phone: phone.optional(),
    password: z.string().min(8, "validation.passwordMin").max(128, "validation.tooLong"),
    confirmPassword: z.string(),
  }).refine((v) => v.password === v.confirmPassword, {
    message: "validation.passwordMismatch",
    path: ["confirmPassword"],
  }).transform(({ confirmPassword: _confirmation, ...admin }) => admin),
});

export type CompanyFormValues = z.input<typeof createCompanySchema>;
export type CompanyFormOutput = z.output<typeof createCompanySchema>;
