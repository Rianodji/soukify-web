import { z } from "zod";
import { PhoneNumber } from "@/domain/auth/PhoneNumber";

export const loginSchema = z.object({
  email: z.string().min(1, "Veuillez entrer votre email").email("Email invalide"),
  password: z.string().min(1, "Veuillez entrer votre mot de passe"),
});

export const registerSchema = z.object({
  email: z.string().min(1, "Veuillez entrer votre email").email("Email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
  displayName: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Nom trop long"),
  phoneNumber: z
    .string()
    .optional()
    .refine((v) => !v || PhoneNumber.create(v).ok, "Numéro invalide. Entrez 8 chiffres (ex: 66 12 34 56)"),
  acceptTerms: z
    .boolean()
    .refine((v) => v === true, "Vous devez accepter les conditions d'utilisation"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Veuillez entrer votre email").email("Email invalide"),
});

export const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(8, "8 caractères minimum"),
    confirmPassword: z.string().min(1, "Veuillez confirmer le mot de passe"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

/* Narrow the acceptTerms type so the form knows it must be true */
export type RegisterFormValues = Omit<RegisterFormData, "acceptTerms"> & {
  acceptTerms: boolean;
};
