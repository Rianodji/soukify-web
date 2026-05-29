"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowRight, UserPlus, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { registerSchema, type RegisterFormValues } from "@/lib/validations/auth";
import { authService } from "@/infrastructure/auth/AuthApiAdapter";
import { HttpError } from "@/infrastructure/http/ApiClient";
import { PhoneNumber } from "@/domain/auth/PhoneNumber";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [phoneNormalized, setPhoneNormalized] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { acceptTerms: false },
  });

  const acceptTerms = watch("acceptTerms");

  /* Pre-fill phone if coming from login */
  useEffect(() => {
    const stored = sessionStorage.getItem("sk_reg_phone");
    if (stored) {
      setPhoneNormalized(stored);
      setValue("phoneNumber", stored);
    }
  }, [setValue]);

  function handlePhoneChange(normalized: string) {
    setPhoneNormalized(normalized);
    setValue("phoneNumber", normalized, { shouldValidate: false });
  }

  async function onSubmit(data: RegisterFormValues) {
    const parsed = PhoneNumber.create(data.phoneNumber);
    if (!parsed.ok) {
      toast.error(parsed.error);
      return;
    }

    setLoading(true);
    try {
      await authService.register({
        name: data.name.trim(),
        phoneNumber: parsed.value.value,
      });

      const { userId } = await authService.sendOtp(parsed.value.value);
      sessionStorage.setItem("sk_otp_userId", userId);
      sessionStorage.setItem("sk_otp_phone", parsed.value.value);
      sessionStorage.removeItem("sk_reg_phone");

      toast.success("Compte créé ! Un code SMS vous a été envoyé.");
      router.push("/verify-otp");
    } catch (err) {
      if (err instanceof HttpError) {
        if (err.statusCode === 409) {
          toast.error("Ce numéro est déjà associé à un compte. Connectez-vous.");
          router.push("/login");
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error("Impossible de créer le compte. Vérifiez votre connexion.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gold-light mb-2">
          <UserPlus className="w-6 h-6 text-gold" strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-bold text-text-primary">
          Créer un compte
        </h1>
        <p className="text-text-secondary text-sm">
          Rejoignez des milliers d&apos;acheteurs et vendeurs au Tchad.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          label="Nom complet"
          placeholder="Ex : Mahamat Oumar"
          error={errors.name?.message}
          autoComplete="name"
          autoFocus
          {...register("name")}
        />

        <PhoneInput
          label="Numéro de téléphone"
          error={errors.phoneNumber?.message}
          onChange={handlePhoneChange}
          defaultValue={phoneNormalized.replace(/^\+235/, "")}
        />

        {/* Terms checkbox */}
        <div className="space-y-1">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5 shrink-0">
              <input
                type="checkbox"
                className="sr-only"
                {...register("acceptTerms")}
                onChange={(e) =>
                  setValue("acceptTerms", e.target.checked as true, {
                    shouldValidate: true,
                  })
                }
              />
              <div
                className={cn(
                  "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150",
                  acceptTerms
                    ? "bg-brand border-brand"
                    : "border-border group-hover:border-brand",
                )}
              >
                {acceptTerms && (
                  <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                    <path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-sm text-text-secondary leading-relaxed">
              J&apos;accepte les{" "}
              <Link href="/legal/cgu" className="text-brand hover:underline font-medium">
                Conditions d&apos;utilisation
              </Link>{" "}
              et la{" "}
              <Link href="/legal/privacy" className="text-brand hover:underline font-medium">
                Politique de confidentialité
              </Link>{" "}
              de Soukify (RGPD).
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="text-xs text-error pl-8">{errors.acceptTerms.message}</p>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full mt-2"
          loading={loading}
        >
          Créer mon compte
          {!loading && <ArrowRight className="w-4 h-4" />}
        </Button>
      </form>

      {/* Login link */}
      <div className="text-center border-t border-border pt-5">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          J&apos;ai déjà un compte — me connecter
        </Link>
      </div>

      {/* GDPR notice */}
      <div className="rounded-xl bg-primary-50 border border-primary-100 p-3">
        <p className="text-xs text-text-secondary">
          🔒 Vos données sont protégées. Votre numéro de téléphone ne sera jamais partagé avec des tiers sans votre consentement explicite.
        </p>
      </div>
    </div>
  );
}
