"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowRight, Phone } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { phoneSchema, type PhoneFormData } from "@/lib/validations/auth";
import { authService } from "@/infrastructure/auth/AuthApiAdapter";
import { HttpError } from "@/infrastructure/http/ApiClient";
import { PhoneNumber } from "@/domain/auth/PhoneNumber";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [normalizedPhone, setNormalizedPhone] = useState("");

  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
  });

  function handlePhoneChange(normalized: string) {
    setNormalizedPhone(normalized);
    setValue("phoneNumber", normalized, { shouldValidate: false });
  }

  async function onSubmit(data: PhoneFormData) {
    const parsed = PhoneNumber.create(data.phoneNumber);
    if (!parsed.ok) {
      toast.error(parsed.error);
      return;
    }

    setLoading(true);
    try {
      const { userId } = await authService.sendOtp(parsed.value.value);
      sessionStorage.setItem("sk_otp_userId", userId);
      sessionStorage.setItem("sk_otp_phone", parsed.value.value);
      router.push("/verify-otp");
    } catch (err) {
      if (err instanceof HttpError) {
        if (err.statusCode === 404) {
          /* Account not found → redirect to register */
          sessionStorage.setItem("sk_reg_phone", parsed.value.value);
          router.push("/register");
          return;
        }
        toast.error(err.message);
      } else {
        toast.error("Impossible de se connecter. Vérifiez votre connexion.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-100 mb-2">
          <Phone className="w-6 h-6 text-brand" strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-bold text-text-primary">
          Connexion à Soukify
        </h1>
        <p className="text-text-secondary text-sm">
          Entrez votre numéro de téléphone pour recevoir un code de vérification.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <PhoneInput
          label="Numéro de téléphone"
          error={errors.phoneNumber?.message}
          onChange={handlePhoneChange}
          autoFocus
        />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={loading}
        >
          Recevoir le code
          {!loading && <ArrowRight className="w-4 h-4" />}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs text-text-disabled bg-background px-3">
          Première fois sur Soukify ?
        </div>
      </div>

      {/* Register link */}
      <div className="text-center">
        <Link
          href="/register"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-hover transition-colors"
        >
          Créer un compte gratuitement
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Info notice */}
      <div className="rounded-xl bg-primary-50 border border-primary-100 p-4 space-y-1">
        <p className="text-xs font-semibold text-brand">Comment ça fonctionne ?</p>
        <ol className="text-xs text-text-secondary space-y-1 list-decimal list-inside">
          <li>Entrez votre numéro de téléphone Tchadien</li>
          <li>Recevez un code SMS gratuit</li>
          <li>Entrez le code pour accéder à votre compte</li>
        </ol>
      </div>
    </div>
  );
}
