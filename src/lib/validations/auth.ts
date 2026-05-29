import { z } from "zod";

const CHAD_PHONE = /^\+235[0-9]{8}$|^[0-9]{8}$/;

export const phoneSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, "Veuillez entrer votre numéro")
    .regex(CHAD_PHONE, "Numéro invalide. Entrez 8 chiffres (ex: 66 12 34 56)"),
});

export const otpSchema = z.object({
  otpCode: z
    .string()
    .length(6, "Le code doit contenir 6 chiffres")
    .regex(/^\d{6}$/, "Chiffres uniquement"),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(80, "Nom trop long")
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, "Caractères invalides"),
  phoneNumber: z
    .string()
    .min(1, "Veuillez entrer votre numéro")
    .regex(CHAD_PHONE, "Numéro invalide"),
  acceptTerms: z
    .boolean()
    .refine((v) => v === true, "Vous devez accepter les conditions d'utilisation"),
});

export type PhoneFormData = z.infer<typeof phoneSchema>;
export type OtpFormData = z.infer<typeof otpSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

/* Narrow the acceptTerms type so the form knows it must be true */
export type RegisterFormValues = Omit<RegisterFormData, "acceptTerms"> & {
  acceptTerms: boolean;
};
